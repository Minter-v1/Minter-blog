# IT 용어 사전

공부하다 메모해 둔 용어를 주 1회 옮겨 적으면, 마크다운으로 변환해 GitHub repo에 커밋하는 개인용 사전.

- 목록: 누구나 볼 수 있음 (`/`)
- 등록 · 태그 추가: `/login`에서 비밀번호로 로그인한 뒤 가능 (30일 유지)

## 준비

1. 용어를 저장할 **public repo**를 만든다. 빈 repo는 커밋을 쌓을 수 없으니 README 하나라도 넣어 초기화할 것.
2. Fine-grained Personal Access Token 발급
   - Repository access: 위 repo 하나만
   - Permissions → Repository → **Contents: Read and write**
3. `.env.example`을 `.env.local`로 복사해서 채운다.

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Vercel 배포

Project Settings → Environment Variables에 `.env.example`의 값을 그대로 넣는다.
`ADMIN_PASSWORD`는 길게 (쓰기 권한 전부가 이 비밀번호 하나에 걸려 있음).

## 저장 구조

```
terms/
├── tags.json                 # 태그 목록 (첫 태그 추가 시 기본 7개로 생성)
├── 폴백함수.md
├── load-balancer.md
└── images/
    └── 폴백함수/
        └── 1.jpg
```

- 파일명: 용어명 그대로. 공백은 `-`, 영문은 소문자 (`Load Balancer` → `load-balancer.md`)
- 등록일: 한국 시간 기준
- md 파일과 이미지는 커밋 하나로 올라감 (`add term: {용어명}`)
- 이미지는 브라우저에서 긴 변 2000px JPEG로 줄인 뒤 업로드 (합계 4MB 제한 — Vercel 요청 본문 한도)
