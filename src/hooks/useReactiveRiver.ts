import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiBaseUrl } from '../config/apiConfig.ts';
import { SESSION_KEYS } from '../services/api/restAdapter.ts';

export type RiverStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface RiverMutationEvent {
  domain: 'vault_pearls' | 'vault_secure_notes' | 'vault_ssh_keys' | 'vault_attachments';
  id: string;
  rev: number;
  action: 'upsert' | 'delete';
  timestamp: string;
}

export interface UseReactiveRiverOptions {
  enabled?: boolean;
  token?: string | null;
  onMutation?: (event: RiverMutationEvent) => void;
}

/**
 * 🌊 useReactiveRiver
 *
 * Client-side React hook managing the Server-Sent Events stream from ShellGuard's
 * Reactive River (/api/sync/events).
 *
 * Provides:
 * - Native EventSource stream with token authentication via query parameter.
 * - Monotonic event cursor tracking via Last-Event-ID for zero-data-loss reconnects.
 * - Jittered exponential backoff auto-reconnect (1s -> 16s).
 * - Real-time mutation notifications dispatched to the onMutation callback.
 * - Bioluminescent connection status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'.
 */
export function useReactiveRiver({
  enabled = true,
  token: customToken,
  onMutation,
}: UseReactiveRiverOptions = {}) {
  const [status, setStatus] = useState<RiverStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<RiverMutationEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef<number>(1000);
  const onMutationRef = useRef(onMutation);
  onMutationRef.current = onMutation;

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      disconnect();
      return;
    }

    const activeToken =
      customToken !== undefined
        ? customToken
        : sessionStorage.getItem(SESSION_KEYS.TOKEN);

    if (!activeToken) {
      disconnect();
      return;
    }

    let isSubscribed = true;

    function connect() {
      if (!isSubscribed) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setStatus((prev) => (prev === 'connected' ? 'reconnecting' : 'connecting'));

      const baseUrl = getApiBaseUrl();
      let url = `${baseUrl}/api/sync/events?token=${encodeURIComponent(activeToken)}`;
      if (lastEventIdRef.current) {
        url += `&lastEventId=${encodeURIComponent(lastEventIdRef.current)}`;
      }

      try {
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (!isSubscribed) return;
          setStatus('connected');
          backoffRef.current = 1000;
        };

        es.addEventListener('vault_mutation', (e: MessageEvent) => {
          if (!isSubscribed) return;
          if (e.lastEventId) {
            lastEventIdRef.current = e.lastEventId;
          }
          try {
            const payload: RiverMutationEvent = JSON.parse(e.data);
            setLastEvent(payload);
            onMutationRef.current?.(payload);
          } catch (parseErr) {
            console.error('[ReactiveRiver] Failed to parse event payload:', parseErr);
          }
        });

        es.onerror = () => {
          if (!isSubscribed) return;
          setStatus('reconnecting');
          es.close();
          eventSourceRef.current = null;

          const jitter = Math.floor(Math.random() * 500);
          const nextBackoff = Math.min(16000, backoffRef.current * 1.5) + jitter;
          backoffRef.current = nextBackoff;

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isSubscribed) {
              connect();
            }
          }, nextBackoff);
        };
      } catch (err) {
        console.error('[ReactiveRiver] Failed to instantiate EventSource:', err);
        setStatus('disconnected');
      }
    }

    connect();

    return () => {
      isSubscribed = false;
      disconnect();
    };
  }, [enabled, customToken, disconnect]);

  return {
    status,
    lastEvent,
    disconnect,
  };
}
