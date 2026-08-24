/**
 * 🦞 restAdapter: The standard scuttle tool for ShellGuard©™
 */

const API_URL = ""; // Relative to origin

export const restAdapter = {
  async scuttle(endpoint: string, options: RequestInit = {}) {
    const token = sessionStorage.getItem("sg_api_token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const pearl = await response.json();

    if (!response.ok) {
      throw new Error(pearl.error || "Bedrock failure scuttling pearl.");
    }

    return pearl;
  },

  GET(endpoint: string) {
    return this.scuttle(endpoint, { method: "GET" });
  },

  POST(endpoint: string, body: any) {
    return this.scuttle(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  PUT(endpoint: string, body: any) {
    return this.scuttle(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  DELETE(endpoint: string) {
    return this.scuttle(endpoint, { method: "DELETE" });
  },
};
