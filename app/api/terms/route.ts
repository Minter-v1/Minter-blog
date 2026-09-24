import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { isAuthed } from "@/lib/auth";
import { createTerm, parseTermInput } from "@/lib/term-store";

export async function POST(request: Request) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  try {
    const input = parseTermInput(await request.json().catch(() => null));
    return NextResponse.json(await createTerm(input));
  } catch (e) {
    return handleError(e);
  }
}
