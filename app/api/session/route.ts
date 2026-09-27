import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

// 브라우저가 로그인 여부를 묻는 곳. 공개 페이지는 쿠키를 읽지 않아야 CDN에 캐시되므로,
// 로그인에 따라 달라지는 버튼(작성·수정·로그아웃)은 페이지가 뜬 뒤 여기로 확인한다.
export async function GET() {
  return NextResponse.json({ authed: await isAuthed() }, { headers: { "Cache-Control": "private, no-store" } });
}
