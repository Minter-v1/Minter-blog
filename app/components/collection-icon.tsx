import { COLLECTIONS, type CollectionId } from "@/lib/collections";

// Git 로고 (git-scm.com, Jason Long, CC BY 3.0)
export const GIT_LOGO_PATH =
  "M90.156 41.965 50.036 1.848a5.918 5.918 0 0 0-8.372 0l-8.328 8.332 10.566 10.566a7.03 7.03 0 0 1 7.23 1.684 7.034 7.034 0 0 1 1.669 7.277l10.187 10.184a7.028 7.028 0 0 1 7.278 1.672 7.04 7.04 0 0 1 0 9.957 7.05 7.05 0 0 1-9.965 0 7.044 7.044 0 0 1-1.528-7.66l-9.5-9.497V59.36a7.04 7.04 0 0 1 1.86 11.29 7.04 7.04 0 0 1-9.957 0 7.04 7.04 0 0 1 0-9.958 7.06 7.06 0 0 1 2.304-1.539V33.926a7.049 7.049 0 0 1-3.82-9.234L29.242 14.272 1.73 41.777a5.925 5.925 0 0 0 0 8.371L41.852 90.27a5.925 5.925 0 0 0 8.37 0l39.934-39.934a5.925 5.925 0 0 0 0-8.371";
export const GIT_ORANGE = "#F05032";

/** 컬렉션 아이콘: Tossface 이모지, Git 명령어만 Git 로고. 크기는 글자 크기(1em)를 따른다 */
export function CollectionIcon({
  id,
  className = "",
  ...rest
}: { id: CollectionId; className?: string } & React.HTMLAttributes<HTMLSpanElement> & { "data-emoji"?: boolean }) {
  return (
    <span className={`tossface ${className}`} {...rest}>
      {id === "git" ? (
        <svg viewBox="0 0 92 92" className="inline-block size-[0.9em] align-[-0.1em]" aria-hidden>
          <path fill={GIT_ORANGE} d={GIT_LOGO_PATH} />
        </svg>
      ) : (
        COLLECTIONS[id].emoji
      )}
    </span>
  );
}
