import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildVisitorCookie,
  resolveVisitor,
  VISITOR_COOKIE,
} from "./visitor-cookie";

const VID = "123e4567-e89b-42d3-a456-426614174000";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("resolveVisitor", () => {
  it("recognizes a valid existing cookie as returning", () => {
    const v = resolveVisitor(VID);
    assert.equal(v.isReturning, true);
    assert.equal(v.visitorId, VID);
  });

  it("mints a fresh UUID when the cookie is absent", () => {
    const v = resolveVisitor(undefined);
    assert.equal(v.isReturning, false);
    assert.match(v.visitorId, UUID_RE);
  });

  it("treats a malformed cookie as a new visitor", () => {
    const v = resolveVisitor("<script>alert(1)</script>");
    assert.equal(v.isReturning, false);
    assert.match(v.visitorId, UUID_RE);
    assert.notEqual(v.visitorId, "<script>alert(1)</script>");
  });
});

describe("buildVisitorCookie", () => {
  it("builds a 1-year Lax HttpOnly cookie", () => {
    const c = buildVisitorCookie(VID, false);
    assert.equal(
      c,
      `${VISITOR_COOKIE}=${VID}; Max-Age=31536000; Path=/; SameSite=Lax; HttpOnly`,
    );
  });

  it("appends Secure when requested", () => {
    assert.match(buildVisitorCookie(VID, true), /; Secure$/);
  });
});
