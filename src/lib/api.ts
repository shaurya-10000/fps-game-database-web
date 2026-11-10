"use client";

import { BACKEND_URL } from "./backend";
import { clearToken, getToken } from "./auth";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function api<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };
  if (opts.body !== undefined && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body:
      opts.body === undefined
        ? undefined
        : opts.body instanceof FormData
          ? opts.body
          : JSON.stringify(opts.body),
    ...(opts.signal ? { signal: opts.signal } : {}),
  });

  if (res.status === 401) {
    clearToken();
    throw new ApiError(401, "UNAUTHORIZED", "Session expired");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const code =
      (payload as { error?: string } | null)?.error ?? `HTTP_${res.status}`;
    const msg =
      typeof payload === "string" ? payload : JSON.stringify(payload ?? {});
    throw new ApiError(res.status, code, msg);
  }

  return payload as T;
}