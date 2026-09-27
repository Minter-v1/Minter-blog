import { Bone, HeaderSkeleton } from "./components/loaders";

// 홈 이동 중
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6 pb-24" aria-busy>
      <HeaderSkeleton />
      <div className="pt-6 sm:pt-10">
        <Bone className="h-10 w-44 sm:h-[52px] sm:w-56" />
        <div className="mt-7 flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-11 w-36 rounded-full" />
          ))}
        </div>
        <div className="mt-12 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-[150px] w-[264px] shrink-0 sm:w-[296px] rounded-[24px]" />
          ))}
        </div>
      </div>
      <Bone className="mt-16 h-[420px] w-full rounded-[28px] sm:h-[520px]" />
    </div>
  );
}
