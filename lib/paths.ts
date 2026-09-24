// 서버/클라이언트 공용 경로 헬퍼 (server-only 금지)

export const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

export function rawBaseUrl(owner: string, repo: string, ref: string, dir: string) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${encodePath(dir)}/`;
}

const RELATIVE_IMAGE = /(!\[[^\]]*\]\()(?!https?:|blob:|data:)(?:\.\/)?([^)\s]+)(\))/g;

// md 안의 상대 경로 이미지(images/폴백함수/1.jpg)를 브라우저가 열 수 있는 raw URL로
export function absolutizeImages(markdown: string, rawBase: string) {
  return markdown.replace(RELATIVE_IMAGE, (_, open: string, path: string, close: string) => {
    let decoded = path;
    try {
      decoded = decodeURIComponent(path);
    } catch {}
    return `${open}${rawBase}${encodePath(decoded)}${close}`;
  });
}

export function resolveImageSrc(src: string, rawBase: string) {
  if (/^(https?:|blob:|data:)/.test(src)) return src;
  let decoded = src.replace(/^\.\//, "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}
  return rawBase + encodePath(decoded);
}
