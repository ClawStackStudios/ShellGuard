import { EventEmitter } from 'events';

export type RiverDomain =
  | 'vault_pearls'
  | 'vault_secure_notes'
  | 'vault_ssh_keys'
  | 'vault_attachments';

export type RiverAction = 'upsert' | 'delete';

export interface RiverEvent {
  id: string; // e.g. "ev_1", "ev_2"
  seq: number;
  domain: RiverDomain;
  itemId: string;
  rev: number;
  action: RiverAction;
  timestamp: string;
}

export interface RiverPayload {
  domain: RiverDomain;
  id: string;
  rev: number;
  action: RiverAction;
  timestamp: string;
}

/**
 * 🌊 Reactive River Event Bus
 *
 * In-process event bus partitioned by owner_uuid.
 * Emits SSE frames within <50ms of SQLite commit.
 * Maintains a bounded ring buffer (100 events per owner) for cursor replay on reconnection.
 */
class ReactiveRiverManager {
  private bus = new EventEmitter();
  private ringBuffers = new Map<string, RiverEvent[]>();
  private ownerSeq = new Map<string, number>();
  private itemRevisions = new Map<string, number>();
  private activeListeners = new Map<string, Set<(event: RiverEvent) => void>>();
  private readonly maxBufferSize: number;

  constructor(maxBufferSize = 100) {
    this.maxBufferSize = maxBufferSize;
    // Allow high connection concurrency without MaxListenersExceededWarning
    this.bus.setMaxListeners(1000);
  }

  /**
   * Publish a mutation event to the owner's reactive river.
   */
  public publishMutation(
    ownerUuid: string,
    domain: RiverDomain,
    itemId: string,
    action: RiverAction
  ): RiverEvent {
    const seq = (this.ownerSeq.get(ownerUuid) || 0) + 1;
    this.ownerSeq.set(ownerUuid, seq);

    const revKey = `${ownerUuid}:${itemId}`;
    const rev = (this.itemRevisions.get(revKey) || 0) + 1;
    if (action === 'delete') {
      this.itemRevisions.delete(revKey);
    } else {
      this.itemRevisions.set(revKey, rev);
    }

    const event: RiverEvent = {
      id: `ev_${seq}`,
      seq,
      domain,
      itemId,
      rev,
      action,
      timestamp: new Date().toISOString(),
    };

    // Buffer in ring
    let buffer = this.ringBuffers.get(ownerUuid);
    if (!buffer) {
      buffer = [];
      this.ringBuffers.set(ownerUuid, buffer);
    }
    buffer.push(event);
    if (buffer.length > this.maxBufferSize) {
      buffer.shift();
    }

    // Direct listener dispatch
    const listeners = this.activeListeners.get(ownerUuid);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (err) {
          console.error('[ReactiveRiver] ⚠️ Error dispatching to listener:', err);
        }
      }
    }

    this.bus.emit(`mutation:${ownerUuid}`, event);
    return event;
  }

  /**
   * Subscribe an active listener for a specific owner.
   * Returns an unsubscribe function.
   */
  public registerListener(
    ownerUuid: string,
    listener: (event: RiverEvent) => void
  ): () => void {
    let listeners = this.activeListeners.get(ownerUuid);
    if (!listeners) {
      listeners = new Set();
      this.activeListeners.set(ownerUuid, listeners);
    }
    listeners.add(listener);

    return () => {
      this.unregisterListener(ownerUuid, listener);
    };
  }

  /**
   * Unsubscribe a listener.
   */
  public unregisterListener(
    ownerUuid: string,
    listener: (event: RiverEvent) => void
  ): void {
    const listeners = this.activeListeners.get(ownerUuid);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.activeListeners.delete(ownerUuid);
      }
    }
  }

  /**
   * Retrieve missed events for cursor replay after `lastEventId`.
   */
  public getEventsSince(ownerUuid: string, lastEventId?: string | null): RiverEvent[] {
    const buffer = this.ringBuffers.get(ownerUuid) || [];
    if (!lastEventId) return [];
    if (lastEventId === 'ev_0' || lastEventId === '0') return [...buffer];
    const match = String(lastEventId).match(/^ev_(\d+)$/);
    if (!match) return [];
    const lastSeq = parseInt(match[1], 10);
    if (Number.isNaN(lastSeq)) return [];

    return buffer.filter(e => e.seq > lastSeq);
  }

  /**
   * Format an event into standard SSE wire representation.
   */
  public formatSseEvent(event: RiverEvent): string {
    const payload: RiverPayload = {
      domain: event.domain,
      id: event.itemId,
      rev: event.rev,
      action: event.action,
      timestamp: event.timestamp,
    };
    return `id: ${event.id}\nevent: vault_mutation\ndata: ${JSON.stringify(payload)}\n\n`;
  }

  /**
   * Active connections count for an owner or total.
   */
  public getActiveConnectionCount(ownerUuid?: string): number {
    if (ownerUuid) {
      return this.activeListeners.get(ownerUuid)?.size || 0;
    }
    let total = 0;
    for (const set of this.activeListeners.values()) {
      total += set.size;
    }
    return total;
  }

  /**
   * Inspect current ring buffer size for an owner (test helper).
   */
  public getRingBufferSize(ownerUuid: string): number {
    return this.ringBuffers.get(ownerUuid)?.length || 0;
  }

  /**
   * Reset all in-memory buffers and sequence numbers (test helper).
   */
  public reset(): void {
    this.ringBuffers.clear();
    this.ownerSeq.clear();
    this.itemRevisions.clear();
    this.activeListeners.clear();
    this.bus.removeAllListeners();
  }
}

export const reactiveRiver = new ReactiveRiverManager();

export const publishMutation = reactiveRiver.publishMutation.bind(reactiveRiver);
export const registerListener = reactiveRiver.registerListener.bind(reactiveRiver);
export const unregisterListener = reactiveRiver.unregisterListener.bind(reactiveRiver);
export const getEventsSince = reactiveRiver.getEventsSince.bind(reactiveRiver);
export const formatSseEvent = reactiveRiver.formatSseEvent.bind(reactiveRiver);
