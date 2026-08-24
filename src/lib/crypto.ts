export function generateUUID(): string {
  return crypto.randomUUID();
}

function generateBase62(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % 62];
  }
  return result;
}

export function generateHumanKey(): string {
  return `hu-${generateBase62(64)}`;
}

export function generateLobsterKey(): string {
  return `lb-${generateBase62(64)}`;
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function downloadIdentityFile(username: string, uuid: string, token: string, displayName?: string) {
  const identity = {
    username,
    displayName: displayName || username,
    uuid,
    token,
    createdAt: new Date().toISOString()
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(identity, null, 2));
  const anchor = document.createElement('a');
  anchor.setAttribute("href", dataStr);
  anchor.setAttribute("download", `shellguard_identity_${username}.json`);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
