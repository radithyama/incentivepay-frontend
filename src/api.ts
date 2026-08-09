import { keycloak } from "./keycloak";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const LEDGER_BASE_URL = import.meta.env.VITE_LEDGER_BASE_URL ?? "http://localhost:8082";

// DEV ONLY - see .env.example. A real deployment would sign server-side (BFF),
// not ship this secret to the browser.
const HMAC_SECRET = import.meta.env.VITE_HMAC_SECRET ?? "dev-only-shared-secret-change-me";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function hmacSignatureHex(method: string, path: string, timestamp: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const canonical = `${method}\n${path}\n${timestamp}\n${body}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(canonical));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(baseUrl: string, path: string, method: string, body?: unknown): Promise<T> {
  await keycloak.updateToken(30).catch(() => keycloak.login());

  const headers: Record<string, string> = {
    Authorization: `Bearer ${keycloak.token}`,
  };
  const bodyString = body !== undefined ? JSON.stringify(body) : "";
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (MUTATING_METHODS.has(method)) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    headers["X-Timestamp"] = timestamp;
    headers["X-Signature"] = await hmacSignatureHex(method, path, timestamp, bodyString);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? bodyString : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(response.status, text || response.statusText);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(API_BASE_URL, path, "GET"),
  post: <T>(path: string, body?: unknown) => request<T>(API_BASE_URL, path, "POST", body),
};

export const ledgerApi = {
  get: <T>(path: string) => request<T>(LEDGER_BASE_URL, path, "GET"),
};

export async function uploadCsv<T>(path: string, file: File): Promise<T> {
  await keycloak.updateToken(30).catch(() => keycloak.login());
  const form = new FormData();
  form.append("file", file);

  // Multipart bodies aren't signed - the HMAC canonical form assumes a
  // single deterministic body string, which a multipart boundary isn't.
  // Documented as a known gap; see README "Known simplifications".
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${keycloak.token}` },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(response.status, text || response.statusText);
  }
  return (await response.json()) as T;
}
