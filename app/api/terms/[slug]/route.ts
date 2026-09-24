import { NextResponse } from "next/server";
import { decodeSlug, fail, handleError } from "@/lib/api";
import { isAuthed } from "@/lib/auth";
import { deleteTerm, parseTermInput, updateTerm } from "@/lib/term-store";

export async function PUT(request: Request, ctx: RouteContext<"/api/terms/[slug]">) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  const slug = decodeSlug((await ctx.params).slug);
  try {
    const input = parseTermInput(await request.json().catch(() => null));
    return NextResponse.json(await updateTerm(slug, input));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/terms/[slug]">) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  const slug = decodeSlug((await ctx.params).slug);
  try {
    return NextResponse.json({ sha: await deleteTerm(slug) });
  } catch (e) {
    return handleError(e);
  }
}
