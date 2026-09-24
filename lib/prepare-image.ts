// 폰으로 찍은 메모 사진(3~6MB)을 그대로 올리면 느리고 Vercel 본문 한도(4.5MB)에 걸린다.
// 긴 변 2000px, JPEG 85%로 줄이면 보통 300~600KB.
const MAX_SIDE = 2000;
const KEEP_AS_IS_BYTES = 700 * 1024;

export async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file; // 애니메이션 보존
  if (file.size <= KEEP_AS_IS_BYTES && ["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name || "이미지"}: 읽을 수 없는 형식입니다. (HEIC라면 JPG로 바꿔서 올려 주세요)`);
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // 투명 PNG가 검게 변하지 않도록
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error(`${file.name}: 변환에 실패했습니다.`);
  const base = (file.name || "image").replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
