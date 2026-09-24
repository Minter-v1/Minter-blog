import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// content/projects/{slug}.md 를 읽는다. 파일 맨 위의 안내용 HTML 주석은 떼고 돌려준다
export async function readProjectBody(slug: string): Promise<string> {
  if (!/^[a-z0-9-]+$/.test(slug)) return "";
  try {
    const md = await readFile(path.join(process.cwd(), "content/projects", `${slug}.md`), "utf8");
    return md.replace(/<!--[\s\S]*?-->/g, "").trim();
  } catch {
    return "";
  }
}
