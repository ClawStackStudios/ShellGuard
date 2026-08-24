import { getGlobalGeneratorConfig } from "./generator.ts";

export interface ClipboardClearState {
  isActive: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  lastCopiedLabel?: string;
  isCleared: boolean;
}

type ClipboardListener = (state: ClipboardClearState) => void;

let autoClearTimeoutId: any = null;
let countdownIntervalId: any = null;
let lastCopiedSecret: string = "";
const listeners: Set<ClipboardListener> = new Set();

let currentState: ClipboardClearState = {
  isActive: false,
  secondsRemaining: 0,
  totalSeconds: 0,
  isCleared: false,
};

function emitState(newState: Partial<ClipboardClearState>) {
  currentState = { ...currentState, ...newState };
  listeners.forEach((listener) => {
    try {
      listener(currentState);
    } catch (e) {
      console.error("Clipboard state listener error:", e);
    }
  });
}

export function subscribeClipboardState(listener: ClipboardListener): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

export function getClipboardState(): ClipboardClearState {
  return currentState;
}

/**
 * Cancels any active auto-clear countdown without clearing the clipboard.
 */
export function cancelClipboardAutoClear(): void {
  if (autoClearTimeoutId) {
    clearTimeout(autoClearTimeoutId);
    autoClearTimeoutId = null;
  }
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
  emitState({
    isActive: false,
    secondsRemaining: 0,
    isCleared: false,
  });
}

/**
 * Immediately clears the system clipboard and resets state.
 */
export async function forceClearClipboardNow(): Promise<boolean> {
  cancelClipboardAutoClear();
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText("");
    }
    lastCopiedSecret = "";
    emitState({
      isActive: false,
      secondsRemaining: 0,
      isCleared: true,
    });
    // Reset isCleared message after 3 seconds
    setTimeout(() => {
      emitState({ isCleared: false });
    }, 3000);
    return true;
  } catch (err) {
    console.warn("Failed to clear clipboard:", err);
    return false;
  }
}

/**
 * Copies a secret to the clipboard and starts an auto-clear countdown if enabled.
 */
export async function copyWithAutoClear(
  text: string,
  options?: {
    clearSeconds?: number;
    label?: string;
    overrideAutoClear?: boolean;
  }
): Promise<boolean> {
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older environments
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    return false;
  }

  lastCopiedSecret = text;
  cancelClipboardAutoClear();

  // Check global or passed options for auto-clear
  const config = getGlobalGeneratorConfig();
  const isEnabled = options?.overrideAutoClear !== undefined 
    ? options.overrideAutoClear 
    : (config.autoClearClipboard ?? true);

  const seconds = options?.clearSeconds !== undefined 
    ? options.clearSeconds 
    : (config.clipboardClearSeconds ?? 30);

  if (!isEnabled || seconds <= 0) {
    emitState({
      isActive: false,
      secondsRemaining: 0,
      totalSeconds: 0,
      lastCopiedLabel: options?.label || "Secret",
      isCleared: false,
    });
    return true;
  }

  let remaining = seconds;
  emitState({
    isActive: true,
    secondsRemaining: remaining,
    totalSeconds: seconds,
    lastCopiedLabel: options?.label || "Secret",
    isCleared: false,
  });

  countdownIntervalId = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      emitState({ secondsRemaining: remaining });
    } else {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }
  }, 1000);

  autoClearTimeoutId = setTimeout(async () => {
    try {
      // If clipboard API allows reading, check if it's still the secret we copied
      if (navigator?.clipboard?.readText) {
        try {
          const currentClip = await navigator.clipboard.readText();
          if (currentClip === lastCopiedSecret) {
            await navigator.clipboard.writeText("");
          }
        } catch {
          // If readText permission is blocked, clear it directly
          await navigator.clipboard.writeText("");
        }
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText("");
      }
    } catch (e) {
      console.warn("Auto-clear clipboard execution note:", e);
    }

    lastCopiedSecret = "";
    emitState({
      isActive: false,
      secondsRemaining: 0,
      isCleared: true,
    });

    setTimeout(() => {
      emitState({ isCleared: false });
    }, 3500);
  }, seconds * 1000);

  return true;
}
