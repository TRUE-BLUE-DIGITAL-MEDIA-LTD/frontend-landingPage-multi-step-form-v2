import { afterEach, describe, expect, it, vi } from "vitest";
import { countryFromIp } from "./geo";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function okJson(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  };
}

describe("countryFromIp", () => {
  it("returns the country name on success", async () => {
    const fetchMock = vi.fn(async () =>
      okJson({ status: "success", country: "Thailand" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(countryFromIp("1.2.3.4")).resolves.toBe("Thailand");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://ip-api.com/json/1.2.3.4",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("returns undefined without fetching when the ip is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(countryFromIp(null)).resolves.toBeUndefined();
    await expect(countryFromIp(undefined)).resolves.toBeUndefined();
    await expect(countryFromIp("")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns undefined on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    );
    await expect(countryFromIp("1.2.3.4")).resolves.toBeUndefined();
  });

  it("returns undefined on an ip-api 'fail' payload (private/reserved IP)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okJson({ status: "fail", message: "private range" })),
    );
    await expect(countryFromIp("192.168.1.10")).resolves.toBeUndefined();
  });

  it("returns undefined when country is missing from a success payload", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okJson({ status: "success" })));
    await expect(countryFromIp("1.2.3.4")).resolves.toBeUndefined();
  });

  it("returns undefined when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await expect(countryFromIp("1.2.3.4")).resolves.toBeUndefined();
  });

  it("aborts and returns undefined after the 2s timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, opts: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener("abort", () =>
              reject(new Error("aborted")),
            );
          }),
      ),
    );
    const pending = countryFromIp("1.2.3.4");
    await vi.advanceTimersByTimeAsync(2001);
    await expect(pending).resolves.toBeUndefined();
  });
});
