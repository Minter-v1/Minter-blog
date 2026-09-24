// "폴백함수" → "폴백함수", "Load Balancer" → "load-balancer", "C#" → "csharp"
export function toSlug(title: string): string {
  return title
    .normalize("NFC") // macOS에서 넘어온 자모 분리(NFD) 한글 방지
    .trim()
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/#/g, "sharp")
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}.-]/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
}
