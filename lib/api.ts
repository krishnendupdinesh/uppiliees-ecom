const RAW_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
// Normalize base origin so whether NEXT_PUBLIC_API_URL is "http://localhost:5000" or "http://localhost:5000/api",
// we never duplicate "/api/api"
const API_ORIGIN = RAW_BASE_URL.replace(/\/api$/i, "");

export async function api<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const apiPath =
    cleanEndpoint.startsWith("/api/") || cleanEndpoint === "/api"
      ? cleanEndpoint
      : `/api${cleanEndpoint}`;

  const primaryUrl =
    endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : API_ORIGIN
      ? `${API_ORIGIN}${apiPath}`
      : apiPath;

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

  let res: Response;
  try {
    res = await fetch(primaryUrl, fetchConfig);
  } catch (networkErr) {
    // If external backend server is not reachable in local/preview mode, fall back to internal Next.js route
    if (primaryUrl !== apiPath && typeof window !== "undefined") {
      res = await fetch(apiPath, fetchConfig);
    } else {
      throw networkErr;
    }
  }

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
