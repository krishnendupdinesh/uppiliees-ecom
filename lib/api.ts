export async function api<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const apiPath =
    cleanEndpoint.startsWith("/api/") || cleanEndpoint === "/api"
      ? cleanEndpoint
      : `/api${cleanEndpoint}`;

  const baseOrigin =
    typeof window === "undefined"
      ? (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")
      : "";

  const url =
    endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : `${baseOrigin}${apiPath}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const fetchConfig: RequestInit = {
    ...options,
    headers,
    credentials: "include",
    ...(options.cache ? { cache: options.cache } : {}),
  };

  const res = await fetch(url, fetchConfig);

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg =
      isJson && (data?.message || data?.error)
        ? data.message || data.error
        : res.statusText || "Request failed";
    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}
