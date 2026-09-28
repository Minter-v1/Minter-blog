// 서버/클라이언트 공용 경로 헬퍼 (server-only 금지)

export const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

// 이미지는 우리 서버(/api/files)를 거쳐 불러온다 — 데이터 repo가 비공개면 raw.githubusercontent는 404
export function rawBaseUrl(ref: string, dir: string) {
  return `/api/files/${encodeURIComponent(ref)}/${encodePath(dir)}/`;
}

const RELATIVE_IMAGE = /(!\[[^\]]*\]\()(?!https?:|blob:|data:|\/)(?:\.\/)?([^)\s]+)(\))/g;

// md 안의 상대 경로 이미지(images/폴백함수/1.jpg)를 브라우저가 열 수 있는 주소(/api/files/…)로
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
  // 외부 URL, 미리보기, 사이트 절대 경로(/projects/...)는 그대로
  if (/^(https?:|blob:|data:|\/)/.test(src)) return src;
  let decoded = src.replace(/^\.\//, "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}
  return rawBase + encodePath(decoded);
}
