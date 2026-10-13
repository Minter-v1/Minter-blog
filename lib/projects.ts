import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// content/projects/{slug}.md 를 읽는다. 파일 맨 위의 안내용 HTML 주석은 떼고 돌려준다
// 아직 "더미" 안내가 남은 본문은 공개하지 않는다 (빈 문자열 = 상세 페이지 없음)
export async function readProjectBody(slug: string): Promise<string> {
  if (!/^[a-z0-9-]+$/.test(slug)) return "";
  try {
    const md = await readFile(path.join(process.cwd(), "content/projects", `${slug}.md`), "utf8");
    const body = md.replace(/<!--[\s\S]*?-->/g, "").trim();
    return /^>\s*더미/m.test(body) ? "" : body;
  } catch {
    return "";
  }
}

/** 상세 본문이 있는 프로젝트 slug 목록 */
export async function projectsWithDetail(slugs: string[]): Promise<Set<string>> {
  const bodies = await Promise.all(slugs.map(readProjectBody));
  return new Set(slugs.filter((_, i) => bodies[i]));
}
