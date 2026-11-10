// Backend base URL. Set NEXT_PUBLIC_API_URL in .env.local for prod.
// Default points at the local express server used by the backend repo.
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export const SOCKET_URL = BACKEND_URL;