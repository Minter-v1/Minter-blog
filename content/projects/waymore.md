<!--
  WAYMORE(티미유) 상세 본문
  출처: 제8회 교육 공공데이터 AI 활용대회 티미유 홍보자료, teameeu-backend / frontend / ai 저장소
  요약·기간·팀·역할·스택은 lib/profile.ts 에서 관리
-->

## 프로젝트 정보

| 항목 | 내용 |
| --- | --- |
| 어디서 | 제8회 교육 공공데이터 AI 활용대회 (Team 티미유) |
| 기간 | 2026.03 ~ 2026.05 |
| 형태 | 3인 팀 |
| 역할 | Infra / Full-stack |
| 담당 범위 | AWS 인프라 구성, Blue-Green 배포 자동화, Spring Boot 백엔드, React 프론트엔드 |
| 기여 | 백엔드 커밋 124건 중 123건, 프론트엔드 커밋 166건 중 120건 |

## 서비스 소개

- 교육 공공데이터와 생성형 AI를 연결한 초개인화 진로 로드맵 웹 서비스
- 대상: 고교학점제 전환기에 진로를 처음 스스로 설계하는 중학생, 비교과 활동 계획이 막막한 고1~2
- 핵심 기능
  - 진로검사: 커리어넷 공식 API 연동, 카드 선택형 응답
  - 로드맵: 학기 단위 타임라인, 항목별 상태(완료·진행 중·예정), AI 추천 활동 바로 추가
  - 대시보드: 오늘 할 일·달성도·진로·성적을 한 화면에서 관리
  - AI 어드바이저: 커리어넷 학과 정보 기반 하이브리드 RAG 상담, 대화 기록 저장

[![WAYMORE 주요 기능](/projects/waymore/features.jpg)](/projects/waymore/features.jpg)

## 배경

- 진로 정보와 학생 개인 상황 사이의 단절
  - 커리어넷·학교알리미 등 공공데이터는 있으나 성적·적성과 통합되어 전달되지 않음
  - 진로검사 결과가 "그래서 오늘 무엇을 해야 하는가"로 이어지지 않음
  - 개인화된 진로 설계는 고비용 컨설팅(50분 최대 100만 원)에 의존
- 중학생 51%, 고등학생 43%가 희망 직업이 없는 이유로 "무엇을 좋아하는지 몰라서"를 꼽음 (2024 초·중등 진로교육 현황조사)
- 인프라 관점의 목표
  - Blue-Green 배포를 실제 서비스에 직접 설계·적용해 검증
  - 배포 중에도 요청이 끊기지 않고, 문제 버전은 바로 이전 버전으로 되돌릴 수 있는 배포 경로

## 결과

| 항목 | 결과 |
| --- | --- |
| 배포 방식 | ALB 대상 그룹 전환 기반 Blue-Green 배포 자동화 |
| 다운타임 | 헬스체크 통과 후 트래픽 전환으로 **배포 중 다운타임 0초** |
| 롤백 | 직전 버전이 대기 슬롯에 그대로 남아, 리스너 전환만으로 복귀 |
| 서비스 | AWS 배포 후 실제 서비스 형태로 시연, 커리어넷 진로검사·로드맵·AI 상담 제공 |

## 아키텍처

- **트래픽**: 사용자 → 프론트엔드(React) → ALB → WAS(Spring Boot)
- **WAS 슬롯**: Blue · Green 두 VM, ALB 대상 그룹 2개로 분리
- **데이터**: PostgreSQL 16, Redis 7.4 (AOF) 를 별도 DB VM에서 Docker Compose로 운영
- **AI 서버**: FastAPI 기반 추천·채팅 API, WAS가 서비스 토큰으로 호출 (SSE 스트리밍)
- **관리 접근**: Bastion 경유 SSH만 허용, App VM은 외부에 직접 노출하지 않음
- **이미지**: GitHub Actions에서 빌드해 Docker Hub에 커밋 SHA 태그로 푸시

## Blue-Green 배포

### 흐름

1. `main` · `dev` push 또는 PR 머지 시 GitHub Actions 실행
2. Docker 이미지 빌드 → 커밋 SHA(7자리) 태그로 푸시
3. ALB 리스너의 기본 동작에서 가중치 100인 대상 그룹을 조회해 현재 Active 슬롯(Blue/Green) 판별
4. 반대쪽 슬롯을 배포 대상으로 선택
5. Bastion을 ProxyCommand로 경유해 대상 VM에 SSH 접속
6. `.env.was`의 이미지 태그 교체 → `docker compose pull` → `up -d`
7. `/actuator/health`가 UP이 될 때까지 5초 간격 최대 10회 확인, 실패 시 배포 중단
8. 헬스체크 통과 후 ALB 리스너 기본 동작을 새 대상 그룹으로 전환

### 판단 근거

| 결정 | 근거 |
| --- | --- |
| 서버 교체 대신 슬롯 전환 | 같은 VM에서 컨테이너를 재시작하면 기동 시간만큼 요청 실패. 대기 슬롯에 먼저 띄우고 트래픽만 옮김 |
| 리스너에서 Active 슬롯 조회 | 배포 상태를 별도로 저장하지 않고 ALB를 단일 기준으로 삼아 상태 불일치 방지 |
| 헬스체크 통과 후 전환 | 뜨지 않은 버전으로 트래픽이 넘어가는 것을 차단, 실패 시 기존 슬롯이 계속 서비스 |
| 커밋 SHA 태그 | 운영 중인 버전을 커밋 단위로 추적, `latest`만 쓸 때의 버전 혼동 방지 |
| `concurrency` 그룹 | 연속 push 시 배포가 겹쳐 두 슬롯이 동시에 바뀌는 상황 방지 (이전 실행 취소) |
| Bastion 경유 배포 | App VM의 SSH를 외부에 열지 않고 CI도 관리자와 같은 접근 경로 사용 |

## 운영 이슈 해결

### CASE 1. 회원가입 시 CORS 에러와 간헐적 504

| 구분 | 내용 |
| --- | --- |
| 증상 | 프론트에서 회원가입 요청 시 CORS 에러, 같은 시점에 ALB `504 Gateway Time-out` 간헐 발생 |
| 원인 분석 | Preflight는 정상, 실패 시 응답 헤더가 `awselb/2.0` → CORS가 아니라 업스트림 지연. 504 응답에는 CORS 헤더가 없어 브라우저가 CORS 에러로 함께 표시 |
| 해결 | `allowed-origins`와 `allowed-origin-patterns`를 함께 반영하도록 CORS 설정 정리, HikariCP·Redis 커넥션 풀과 타임아웃 명시 |
| 결과 | 지연 시 요청이 무한정 대기하지 않고 빠르게 실패, 대기 누적으로 인한 504 완화 |

### CASE 2. 커넥션 풀 고갈로 인한 대기 전파

| 구분 | 내용 |
| --- | --- |
| 원인 | 회원가입 트랜잭션이 이메일 확인 → 사용자 저장 → 로드맵 저장 → Redis 저장으로 길고, DB·Redis 순간 지연 시 요청 스레드가 대기로 묶임 |
| 해결 | HikariCP `maximum-pool-size`·`connection-timeout`·`max-lifetime`, Redis `connect-timeout`·`timeout`·Lettuce 풀 설정 |
| 점검 기준 | ALB `TargetResponseTime`·`HTTPCode_Target_5XX_Count`·`UnHealthyHostCount`, 요청별 처리 시간, 커넥션 풀 고갈 여부 |

## 개발 담당

| 영역 | 내용 |
| --- | --- |
| 백엔드 | Spring Boot, JWT(Access·Refresh 쿠키) 인증, 사용자·로드맵·채팅 API, 커리어넷 Open API 클라이언트와 외부 API 오류 처리 |
| AI 연동 | AI 서버 추천·채팅 API 호출, SSE 스트리밍 응답 전달 |
| 프론트엔드 | React, 진로검사·로드맵·대시보드 화면, Canvas 기반 렌더링 애니메이션 |
| 데이터 | PostgreSQL 스키마 초기화(`init.sql`), Redis 연동 |
