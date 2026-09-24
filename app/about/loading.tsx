import { Bone, HeaderSkeleton } from "../components/loaders";

// About·프로젝트 상세 이동 중
export default function Loading() {
  return (
    <div className="mx-auto max-w-[960px] px-6 pb-28" aria-busy>
      <HeaderSkeleton />
      <div className="flex items-start justify-between gap-10 pt-10">
        <div className="flex-1">
          <Bone className="h-5 w-28" />
          <Bone className="mt-4 h-[52px] w-48" />
          <div className="mt-6 space-y-2.5">
            {[90, 70, 85, 60].map((w, i) => (
              <Bone key={i} className="h-5" width={`${w}%`} />
            ))}
          </div>
        </div>
        <Bone className="aspect-[3/4] w-[210px] shrink-0 rounded-[28px]" />
      </div>
      <div className="mt-10 grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-[118px] rounded-[22px]" />
        ))}
      </div>
    </div>
  );
}
