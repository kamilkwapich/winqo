const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

function isLocalHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1";
}

function isLocalUrl(url: string): boolean {
  try {
    return isLocalHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const host = window.location.hostname;
    const isLocal = isLocalHost(host);
    if (isLocal) {
      // Local development should default to local backend port from docker-compose.override.yml
      // and only use env override when it also points to localhost.
      if (ENV_API_BASE && isLocalUrl(ENV_API_BASE)) {
        return ENV_API_BASE;
      }
      return "http://localhost:8100";
    }
    if (ENV_API_BASE && !isLocalUrl(ENV_API_BASE)) {
      return ENV_API_BASE;
    }
    return origin;
  }
  return ENV_API_BASE || "http://localhost:8100";
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiAuth<T>(path: string, token: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(opts.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/pdf")) {
    // @ts-ignore
    return (await res.arrayBuffer()) as T;
  }
  return res.json() as Promise<T>;
}
