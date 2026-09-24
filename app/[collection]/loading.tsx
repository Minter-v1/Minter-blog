import { Bone, HeaderSkeleton } from "../components/loaders";

// 컬렉션 목록 이동 중
export default function Loading() {
  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24" aria-busy>
      <HeaderSkeleton />
      <div className="mt-4 mb-6 px-1">
        <Bone className="h-8 w-48" />
        <Bone className="mt-3 h-4 w-40" />
      </div>
      <div className="rounded-[24px] bg-surface p-7">
        <Bone className="h-12 w-full rounded-2xl" />
        <div className="mt-4 flex gap-2">
          {[64, 88, 76, 96].map((w, i) => (
            <Bone key={i} className="h-9 rounded-full" width={w} />
          ))}
        </div>
        <div className="mt-8 space-y-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="px-3">
              <Bone className="h-5" width={`${55 - i * 5}%`} />
              <Bone className="mt-2 h-4" width={`${80 - i * 6}%`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
