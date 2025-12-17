import type {
  ApiClientConfig,
  ApiRequestOptions,
} from "@/shared/types/data";

const defaultConfig: ApiClientConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  useMocks:
    (import.meta.env.VITE_USE_MOCKS ?? "false").toLowerCase() === "true",
  fetchImpl: (...args) => fetch(...args),
  getToken: () => {
    try {
      // Try to get token from session first
      const session = localStorage.getItem("pest-i-session");
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.token || null;
      }
      // Fallback to direct token storage
      return localStorage.getItem("pest-i-token");
    } catch {
      return null;
    }
  },
};

let activeConfig: ApiClientConfig = { ...defaultConfig };

const safeParseError = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  } catch {
    // ignore
  }
  return `Request failed with status ${response.status}`;
};

export const configureApiClient = (
  overrides: Partial<ApiClientConfig>,
): void => {
  activeConfig = { ...activeConfig, ...overrides };
};

export const resetApiClientConfig = (): void => {
  activeConfig = { ...defaultConfig };
};

async function request<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (activeConfig.useMocks) {
    if (options.mockResponse) {
      return options.mockResponse();
    }
    throw new Error(
      `Mock mode enabled but no mockResponse provided for request to ${path}`,
    );
  }

  const url = path.startsWith("http")
    ? path
    : `${activeConfig.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = activeConfig.getToken?.();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await activeConfig.fetchImpl(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await safeParseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

const withBody = (body?: unknown) =>
  body !== undefined ? JSON.stringify(body) : undefined;

export const apiClient = {
  get<T>(path: string, options?: ApiRequestOptions) {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return request<T>(path, {
      ...options,
      method: "POST",
      body: withBody(body),
    });
  },
  put<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return request<T>(path, {
      ...options,
      method: "PUT",
      body: withBody(body),
    });
  },
  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return request<T>(path, {
      ...options,
      method: "PATCH",
      body: withBody(body),
    });
  },
  delete<T>(path: string, options?: ApiRequestOptions) {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};

