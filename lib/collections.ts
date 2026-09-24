// 블로그의 컬렉션 정의 (서버/클라이언트 공용).
// 데이터 repo에서 컬렉션마다 폴더 하나: log/, terms/, git/, troubleshooting/

import type { Tag } from "./tags";

export const COLLECTION_IDS = ["log", "terms", "git", "troubleshooting"] as const;
export type CollectionId = (typeof COLLECTION_IDS)[number];

export type ExtraField = {
  key: string; // 프론트매터 키
  label: string;
  placeholder: string;
  mono?: boolean; // 명령어·에러 메시지처럼 고정폭으로
};

export type Collection = {
  id: CollectionId;
  dir: string; // 데이터 repo 안의 폴더
  label: string; // "IT 용어 사전"
  shortLabel: string; // 좁은 곳(작성 화면 탭 등)에서 쓰는 이름
  itemLabel: string; // "용어" — "새 용어", "이미 등록된 용어예요"
  intro: string; // 목록 상단·홈 카드 설명
  color: string; // 홈 그래프·활동 차트에서 컬렉션을 구분하는 색
  listStyle: "date" | "cheatsheet"; // 목록을 날짜별로 묶을지, 분류별 치트시트로 볼지
  titleLabel: string;
  titlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  tagLabel: string; // 트러블슈팅은 "분야"
  maxTags: number;
  defaultTags: Tag[];
  extraFields: ExtraField[];
  bodyTemplate: string; // 새로 쓸 때 에디터에 미리 깔아 둘 뼈대
};

export const COLLECTIONS: Record<CollectionId, Collection> = {
  log: {
    id: "log",
    dir: "log",
    label: "학습 기록",
    shortLabel: "학습 기록",
    itemLabel: "글",
    intro: "작업하고 공부한 과정을 글로 남겨요. 용어·명령어·트러블슈팅을 엮는 큰 이야기.",
    color: "#3182f6",
    listStyle: "date",
    titleLabel: "제목",
    titlePlaceholder: "예) 블로그를 GitHub 저장소 기반으로 만든 이유",
    descriptionLabel: "한 줄 요약",
    descriptionPlaceholder: "이 글에서 무엇을 이야기하는지",
    tagLabel: "분류",
    maxTags: 3,
    defaultTags: [{ name: "프로젝트" }, { name: "공부" }, { name: "회고" }, { name: "스터디" }],
    extraFields: [],
    bodyTemplate: "",
  },
  terms: {
    id: "terms",
    dir: "terms",
    label: "IT 용어 사전",
    shortLabel: "용어",
    itemLabel: "용어",
    intro: "공부하다 마주친 용어를 내 말로 다시 정리해요.",
    color: "#00b8a3",
    listStyle: "date",
    titleLabel: "용어명",
    titlePlaceholder: "예) 폴백함수",
    descriptionLabel: "한 줄 정의",
    descriptionPlaceholder: "목록에 보이는 짧은 정의",
    tagLabel: "태그",
    maxTags: 3,
    defaultTags: [
      { name: "네트워크통신", hint: "CDN, DNS, 프로토콜, 로드밸런싱" },
      { name: "데이터저장", hint: "Redis, cache, DB, 스트림" },
      { name: "아키텍처패턴", hint: "폴백함수, 메시지큐, 이벤트, MSA" },
      { name: "운영모니터링", hint: "로그, 알림, 트레이싱" },
      { name: "도구실습", hint: "CLI, 프레임워크 사용법, k8s, terraform" },
      { name: "CS기초", hint: "알고리즘, OS, 자료구조" },
      { name: "채용", hint: "레쥬메, 면접, 인적성" },
    ],
    extraFields: [],
    bodyTemplate: "",
  },
  git: {
    id: "git",
    dir: "git",
    label: "Git 명령어",
    shortLabel: "Git",
    itemLabel: "명령어",
    intro: "직접 써 본 Git 명령어를 옵션·예시와 함께 모아 둬요.",
    color: "#ff8a3d",
    listStyle: "cheatsheet",
    titleLabel: "명령어",
    titlePlaceholder: "예) git rebase",
    descriptionLabel: "한 줄 설명",
    descriptionPlaceholder: "이 명령어가 하는 일",
    tagLabel: "분류",
    maxTags: 2,
    defaultTags: [
      { name: "시작·설정", hint: "init, clone, config" },
      { name: "기록", hint: "add, commit, status, diff" },
      { name: "브랜치", hint: "branch, switch, checkout" },
      { name: "병합·리베이스", hint: "merge, rebase, cherry-pick" },
      { name: "되돌리기", hint: "reset, revert, restore, reflog" },
      { name: "원격", hint: "remote, fetch, pull, push" },
      { name: "임시저장", hint: "stash" },
      { name: "조회", hint: "log, show, blame" },
    ],
    extraFields: [{ key: "usage", label: "사용법", placeholder: "git rebase -i <기준 커밋>", mono: true }],
    bodyTemplate: "## 자주 쓰는 옵션\n\n## 예시\n\n## 주의할 점\n",
  },
  troubleshooting: {
    id: "troubleshooting",
    dir: "troubleshooting",
    label: "트러블슈팅",
    shortLabel: "트러블슈팅",
    itemLabel: "트러블슈팅",
    intro: "막혔던 문제와 해결 과정을 남겨요. 같은 실수를 두 번 하지 않도록.",
    color: "#8b5cf6",
    listStyle: "date",
    titleLabel: "제목",
    titlePlaceholder: "예) rebase 중 충돌이 끝없이 반복됨",
    descriptionLabel: "한 줄 요약",
    descriptionPlaceholder: "무엇이 문제였고 어떻게 풀었는지",
    tagLabel: "분야",
    maxTags: 3,
    defaultTags: [
      { name: "Git" },
      { name: "Spring" },
      { name: "Infra" },
      { name: "Docker" },
      { name: "DB" },
      { name: "Frontend" },
      { name: "배포" },
    ],
    extraFields: [
      { key: "error", label: "에러 메시지", placeholder: "CONFLICT (content): Merge conflict in ...", mono: true },
    ],
    bodyTemplate: "## 상황\n\n## 원인\n\n## 해결\n\n## 배운 점\n",
  },
};

export const COLLECTION_LIST = COLLECTION_IDS.map((id) => COLLECTIONS[id]);

export function isCollectionId(v: unknown): v is CollectionId {
  return typeof v === "string" && (COLLECTION_IDS as readonly string[]).includes(v);
}

// 연관 연결은 "git/rebase"처럼 컬렉션을 포함해 저장한다. 컬렉션이 없으면 자기 컬렉션.
export type Ref = `${CollectionId}/${string}`;

export function toRef(collection: CollectionId, slug: string): Ref {
  return `${collection}/${slug}`;
}

export function parseRef(raw: string, fallback: CollectionId): Ref {
  const i = raw.indexOf("/");
  if (i > 0 && isCollectionId(raw.slice(0, i))) return raw as Ref;
  return toRef(fallback, raw);
}

export function entryHref(collection: CollectionId, slug: string) {
  return `/${collection}/${encodeURIComponent(slug)}`;
}
