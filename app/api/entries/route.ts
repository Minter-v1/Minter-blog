import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { invalidateArchive } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, isCollectionId } from "@/lib/collections";
import { createEntry, parseEntryInput } from "@/lib/entry-store";

export async function POST(request: Request) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  try {
    const body = (await request.json().catch(() => null)) as { collection?: unknown } | null;
    if (!isCollectionId(body?.collection)) return fail("알 수 없는 컬렉션이에요.");
    const input = parseEntryInput(COLLECTIONS[body.collection], body);
    const result = await createEntry(body.collection, input);
    invalidateArchive();
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
