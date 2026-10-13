import { NextResponse } from "next/server";
import { decodeSlug, fail, handleError } from "@/lib/api";
import { invalidateArchive, loadArchive } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, isCollectionId, toRef } from "@/lib/collections";
import { deleteEntry, moveEntry, parseEntryInput, updateEntry } from "@/lib/entry-store";
import { invalidateReview } from "@/lib/review-store";

type Ctx = RouteContext<"/api/entries/[collection]/[slug]">;

export async function PUT(request: Request, ctx: Ctx) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  const { collection, slug } = await ctx.params;
  if (!isCollectionId(collection)) return fail("알 수 없는 컬렉션이에요.", 404);
  try {
    const body = (await request.json().catch(() => null)) as { collection?: unknown } | null;
    // 본문의 collection이 주소와 다르면 그 컬렉션으로 옮기면서 저장한다 (#42)
    const target = isCollectionId(body?.collection) ? body.collection : collection;
    const input = parseEntryInput(COLLECTIONS[target], body);
    const name = decodeSlug(slug);
    if (target === collection) {
      const result = await updateEntry(collection, name, input);
      invalidateArchive();
      return NextResponse.json(result);
    }
    const ref = toRef(collection, name);
    const { entries, drafts } = await loadArchive();
    const linked = [...entries, ...drafts].filter((e) => e.related.includes(ref)).map((e) => e.ref);
    const result = await moveEntry(collection, target, name, input, linked);
    invalidateArchive();
    invalidateReview();
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
