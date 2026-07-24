import { describe, expect, it } from "vitest";
import { sanitizeFormAnswers } from "./form-answers";

describe("sanitizeFormAnswers", () => {
  it("accepts a flat string→string object", () => {
    expect(
      sanitizeFormAnswers({ gender: "male", age: "25-34", interests: "casual" }),
    ).toEqual({ gender: "male", age: "25-34", interests: "casual" });
  });

  it("accepts an empty object", () => {
    expect(sanitizeFormAnswers({})).toEqual({});
  });

  it("rejects non-objects", () => {
    expect(sanitizeFormAnswers("gender=male")).toBeNull();
    expect(sanitizeFormAnswers(null)).toBeNull();
    expect(sanitizeFormAnswers(undefined)).toBeNull();
    expect(sanitizeFormAnswers(42)).toBeNull();
    expect(sanitizeFormAnswers(["male"])).toBeNull();
  });

  it("rejects non-string values (including nested objects)", () => {
    expect(sanitizeFormAnswers({ gender: 1 })).toBeNull();
    expect(sanitizeFormAnswers({ gender: { nested: "x" } })).toBeNull();
  });

  it("rejects more than 20 keys", () => {
    const big: Record<string, string> = {};
    for (let i = 0; i < 21; i++) big[`k${i}`] = "v";
    expect(sanitizeFormAnswers(big)).toBeNull();
    const ok: Record<string, string> = {};
    for (let i = 0; i < 20; i++) ok[`k${i}`] = "v";
    expect(sanitizeFormAnswers(ok)).not.toBeNull();
  });

  it("rejects values longer than 200 chars and keys longer than 64", () => {
    expect(sanitizeFormAnswers({ gender: "x".repeat(201) })).toBeNull();
    expect(sanitizeFormAnswers({ gender: "x".repeat(200) })).not.toBeNull();
    expect(sanitizeFormAnswers({ ["k".repeat(65)]: "v" })).toBeNull();
    expect(sanitizeFormAnswers({ "": "v" })).toBeNull();
  });
});
