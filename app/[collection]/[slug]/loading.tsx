import { Bone, HeaderSkeleton } from "../../components/loaders";

// 글 상세 이동 중
export default function Loading() {
  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24 xl:max-w-[1036px]" aria-busy>
      <HeaderSkeleton />
      <div className="xl:grid xl:grid-cols-[760px_220px] xl:gap-8">
        <div className="rounded-[28px] bg-surface px-12 pt-12 pb-16">
          <div className="flex gap-2">
            <Bone className="h-6 w-20 rounded-full" />
            <Bone className="h-6 w-16 rounded-full" />
          </div>
          <Bone className="mt-6 h-10 w-2/3" />
          <Bone className="mt-5 h-5 w-full" />
          <Bone className="mt-2 h-5 w-4/5" />
          <div className="my-10 h-px bg-line" />
          <div className="space-y-3">
            {[100, 96, 88, 100, 70, 92, 60].map((w, i) => (
              <Bone key={i} className="h-4" width={`${w}%`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
