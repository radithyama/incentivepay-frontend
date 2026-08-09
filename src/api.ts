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

// Backend errors come back as either a GlobalExceptionHandler JSON body
// ({ message: "..." }) or, for validation failures Spring's default error
// controller handles, a plain-text/HTML page. Only trust the parsed message
// when it's short and doesn't look like markup or a stack trace.
function extractMessage(status: number, raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // Not JSON - fall through to the raw text/statusText.
  }
  return raw || `Request failed with status ${status}`;
}

function looksUserFriendly(message: string): boolean {
  return message.length > 0 && message.length < 160 && !/[{}<>]/.test(message);
}

/** Maps an ApiError (or unknown thrown value) to a message safe to show a non-technical user. */
export function friendlyErrorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!(e instanceof ApiError)) return fallback;

  switch (e.status) {
    case 400:
    case 422:
      return looksUserFriendly(e.message) ? e.message : "Please check the form and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return looksUserFriendly(e.message) ? e.message : "We couldn't find what you were looking for.";
    case 409:
      return looksUserFriendly(e.message) ? e.message : "That conflicts with existing data.";
    case 502:
    case 503:
    case 504:
      return "One of our services is temporarily unavailable. Please try again shortly.";
    default:
      return e.status >= 500 ? "Something went wrong on our end. Please try again shortly." : fallback;
  }
}

async function request<T>(
  baseUrl: string,
  path: string,
  method: string,
  body: unknown,
  requiresAuth: boolean,
): Promise<T> {
  const headers: Record<string, string> = {};

  if (requiresAuth) {
    await keycloak.updateToken(30).catch(() => keycloak.login());
    headers.Authorization = `Bearer ${keycloak.token}`;
  }

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
    throw new ApiError(response.status, extractMessage(response.status, text || response.statusText));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(API_BASE_URL, path, "GET", undefined, true),
  post: <T>(path: string, body?: unknown) => request<T>(API_BASE_URL, path, "POST", body, true),
  delete: <T>(path: string) => request<T>(API_BASE_URL, path, "DELETE", undefined, true),
};

// Unauthenticated - only for the pre-login registration form.
export const publicApi = {
  post: <T>(path: string, body?: unknown) => request<T>(API_BASE_URL, path, "POST", body, false),
};

export const ledgerApi = {
  get: <T>(path: string) => request<T>(LEDGER_BASE_URL, path, "GET", undefined, true),
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
    throw new ApiError(response.status, extractMessage(response.status, text || response.statusText));
  }
  return (await response.json()) as T;
}
