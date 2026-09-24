# Minter.log

학습 기록 · IT 용어 사전 · Git 명령어 · 트러블슈팅을 GitHub 저장소에 쌓는 개인 블로그.

- 읽기: 누구나. 쓰기(등록·수정·삭제·태그 추가): `/login`에서 비밀번호 로그인 후
- 기록(md)은 **데이터 전용 repo**에 저장된다. 이 앱은 실행 중에 GitHub API로 읽고 커밋한다 (서브모듈·재배포 불필요)

## 구조

| 경로 | 내용 |
|---|---|
| `/` | 최근 기록 카드, 연결 지도(연관 기록 그래프), 컬렉션, 주간 활동 |
| `/log` `/terms` `/git` `/troubleshooting` | 컬렉션 목록 (검색 `/` 키, 태그 필터) |
| `/{컬렉션}/{파일명}` | 상세 (목차, 연관 기록) |
| `/write?c=git` | 작성·수정 (BlockNote 에디터) |
| `/about` · `/about/projects/{slug}` | 소개 · 프로젝트 상세 |

데이터 repo 구조:

```
log/  terms/  git/  troubleshooting/
└── {파일명}.md, tags.json, images/{파일명}/1.jpg
```

코드에서 직접 고치는 곳:

- `lib/site.ts` — 블로그 이름, 링크, 주간 목표
- `lib/profile.ts` — About 내용 (레쥬메)
- `content/projects/{slug}.md` — 프로젝트 상세 본문, 이미지는 `public/projects/{slug}/`
- `lib/collections.ts` — 컬렉션별 입력 칸·기본 태그·본문 템플릿

## 환경변수

`.env.example` 참고. 로컬은 `.env.local`, Vercel은 Project Settings → Environment Variables.

| 이름 | 설명 |
|---|---|
| `GITHUB_TOKEN` | Fine-grained PAT. 데이터 repo 하나만, Contents: Read and write |
| `GITHUB_OWNER` | 데이터 repo 소유자 (예: `Minter-v1`) |
| `GITHUB_REPO` | 데이터 repo 이름 (예: `Minter-archive`) |
| `GITHUB_BRANCH` | 기본 `main` |
| `ADMIN_PASSWORD` | 쓰기 로그인 비밀번호. 바꾸면 기존 로그인 모두 해제 |

> 터미널에 같은 이름의 환경변수가 export돼 있으면 `.env.local`보다 우선한다(Next.js 로드 순서).
> `.env` 값을 셸로 불러올 땐 `( set -a; source .env.local; set +a; ... )`처럼 서브셸로.

## 로컬 실행

```bash
npm install
npm run dev
```

## 배포 (Vercel)

1. 이 repo를 Vercel에 Import (Framework: Next.js 자동 인식)
2. 위 환경변수 5개 입력 후 Deploy
3. Settings → Domains에서 구입한 도메인 연결
4. 토큰 만료일이 지나면 새 토큰으로 `GITHUB_TOKEN` 교체 후 Redeploy
