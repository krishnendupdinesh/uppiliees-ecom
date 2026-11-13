const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export async function api<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let url: string;
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    url = endpoint;
  } else if (cleanEndpoint.startsWith("/api/")) {
    // Next.js internal routes like /api/auth/login should always use the same app origin
    url = cleanEndpoint;
  } else if (BASE_URL) {
    url = `${BASE_URL}${cleanEndpoint}`;
  } else {
    url = cleanEndpoint;
  }
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
    ...(options.cache ? { cache: options.cache } : {}),
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = isJson && data?.error ? data.error : res.statusText || "Request failed";
    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}

