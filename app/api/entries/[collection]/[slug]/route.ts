import { NextResponse } from "next/server";
import { decodeSlug, fail, handleError } from "@/lib/api";
import { invalidateArchive } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, isCollectionId } from "@/lib/collections";
import { deleteEntry, parseEntryInput, updateEntry } from "@/lib/entry-store";

type Ctx = RouteContext<"/api/entries/[collection]/[slug]">;

export async function PUT(request: Request, ctx: Ctx) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  const { collection, slug } = await ctx.params;
  if (!isCollectionId(collection)) return fail("알 수 없는 컬렉션이에요.", 404);
  try {
    const input = parseEntryInput(COLLECTIONS[collection], await request.json().catch(() => null));
    const result = await updateEntry(collection, decodeSlug(slug), input);
    invalidateArchive();
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  const { collection, slug } = await ctx.params;
  if (!isCollectionId(collection)) return fail("알 수 없는 컬렉션이에요.", 404);
  try {
    const result = { sha: await deleteEntry(collection, decodeSlug(slug)) };
    invalidateArchive();
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
