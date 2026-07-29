// Thin fetch wrapper for the standalone FastAPI backend.
// Configure the base URL with VITE_API_BASE_URL (e.g. http://localhost:8000).

const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:8000";

const TOKEN_KEY = "aic_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Options = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || (body ? "POST" : "GET"),
    headers,
    body,
    signal: opts.signal,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "detail" in (data as any)
        ? String((data as any).detail)
        : res.statusText) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const API_BASE_URL = BASE_URL;