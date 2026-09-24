import { Bone, HeaderSkeleton } from "./components/loaders";

// 홈 이동 중
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-24" aria-busy>
      <HeaderSkeleton />
      <div className="pt-10">
        <Bone className="h-[52px] w-56" />
        <div className="mt-7 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-11 w-36 rounded-full" />
          ))}
        </div>
        <div className="mt-12 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-[150px] w-[296px] shrink-0 rounded-[24px]" />
          ))}
        </div>
      </div>
      <Bone className="mt-16 h-[520px] w-full rounded-[28px]" />
    </div>
  );
}
