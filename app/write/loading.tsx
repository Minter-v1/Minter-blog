import { Bone, HeaderSkeleton } from "../components/loaders";

// 작성·수정 화면 이동 중
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-16" aria-busy>
      <HeaderSkeleton />
      <div className="grid grid-cols-[340px_minmax(0,1fr)] items-start gap-6">
        <div className="space-y-6 rounded-[24px] bg-surface p-7">
          <Bone className="h-10 w-full rounded-2xl" />
          {[52, 88, 44].map((h, i) => (
            <div key={i}>
              <Bone className="h-4 w-16" />
              <span className="skeleton mt-2 block w-full rounded-2xl" style={{ height: h }} />
            </div>
          ))}
          <Bone className="h-14 w-full rounded-2xl" />
        </div>
        <div className="min-h-[calc(100vh-140px)] rounded-[24px] bg-surface px-[54px] pt-7">
          <Bone className="h-4 w-20" />
          <div className="mt-8 space-y-3">
            {[70, 100, 92, 60].map((w, i) => (
              <Bone key={i} className="h-4" width={`${w}%`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
