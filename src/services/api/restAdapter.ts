/**
 * 🐚 restAdapter: The standard scuttle tool for ShellGuard©™
 *
 * Speaks the server's {success, data} envelope dialect: every response body
 * of that shape is unwrapped so callers keep receiving bare domain payloads.
 * Raw (non-envelope) responses pass through untouched — the fallback keeps
 * the adapter tolerant during incremental route migration.
 */

import { getApiBaseUrl } from "../../config/apiConfig";

/** sessionStorage keys used by the client shell. */
export const SESSION_KEYS = {
  TOKEN: "sg_api_token",
} as const;

/** Structured API failure carrying the HTTP status and validation details. */
export class ApiError extends Error {
  status: number;
  details?: Array<{ path: string; message: string }>;

  constructor(status: number, message: string, details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const restAdapter = {
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = sessionStorage.getItem(SESSION_KEYS.TOKEN);
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers,
    });

    let pearl: any = null;
    try {
      pearl = await response.json();
    } catch {
      // Non-JSON body (e.g. empty 204) — fall through with null payload.
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        pearl?.error || "Bedrock failure scuttling pearl.",
        pearl?.details
      );
    }

    // Tolerant envelope unwrap: {success,data} → data; raw payloads unchanged.
    if (pearl && typeof pearl === "object" && "success" in pearl && "data" in pearl) {
      return pearl.data as T;
    }
    return pearl as T;
  },

  GET(endpoint: string) {
    return this.request(endpoint, { method: "GET" });
  },

  POST(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  PUT(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  DELETE(endpoint: string) {
    return this.request(endpoint, { method: "DELETE" });
  },
};
