import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  apiClient,
  configureApiClient,
  resetApiClientConfig,
} from "./api-client";

describe("apiClient", () => {
  beforeEach(() => {
    resetApiClientConfig();
  });

  it("returns mock response when mocks are enabled", async () => {
    configureApiClient({ useMocks: true });

    const result = await apiClient.get<{ value: string }>("/observations", {
      mockResponse: () => ({ value: "mocked" }),
    });

    expect(result).toEqual({ value: "mocked" });
  });

  it("performs network request when mocks are disabled", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ value: "live" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    configureApiClient({
      useMocks: false,
      fetchImpl: fetchMock,
      baseUrl: "https://api.example.com",
    });

    const result = await apiClient.get<{ value: string }>("/data");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/data",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual({ value: "live" });
  });

  it("adds authorization header when token is available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
      }),
    );

    configureApiClient({
      useMocks: false,
      fetchImpl: fetchMock,
      getToken: () => "abc123",
      baseUrl: "https://api.example.com",
    });

    await apiClient.get("/secure");

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers?.get("Authorization")).toBe("Bearer abc123");
  });

  it("throws descriptive error on non-OK responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Bad Request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    configureApiClient({
      useMocks: false,
      fetchImpl: fetchMock,
      baseUrl: "https://api.example.com",
    });

    await expect(apiClient.get("/broken")).rejects.toThrow("Bad Request");
  });
});

