import "server-only";
import { NextResponse } from "next/server";
import { ConflictError } from "./github";
import { ValidationError } from "./entry-store";

export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export function handleError(e: unknown) {
  if (e instanceof ValidationError) return fail(e.message, 400);
  if (e instanceof ConflictError) return fail(e.message, 409);
  console.error(e);
  return fail(e instanceof Error ? e.message : "커밋하지 못했어요.", 502);
}

// URL의 한글 slug는 인코딩된 채로 들어올 수 있다
export function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw).normalize("NFC");
  } catch {
    return raw.normalize("NFC");
  }
}
