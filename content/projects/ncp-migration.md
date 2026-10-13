<!--
  NCP Multi Zone 전환 상세 본문
  출처: 포트폴리오 PDF(2026) PROJECT 01, 클라우드스퀘어 8월 현장실습 결과보고(260831), 현대오토에버 지원서
  요약·기간·팀·역할·스택은 lib/profile.ts 에서 관리
-->

## 프로젝트 정보

| 항목 | 내용 |
| --- | --- |
| 어디서 | 클라우드스퀘어 클라우드 2팀 현장실습 |
| 기간 | 2026.08 (약 1개월) |
| 형태 | 가상 고객사 시나리오 과제 (중소 제조기업 그린텍 인사관리시스템) |
| 역할 | Cloud Engineer, 1인 전 과정 수행 |
| 범위 | 요구사항 분석 → 아키텍처 설계·구축 → 운영 자동화 → 이전·롤백 검증 → 비용 산정 |

## 배경

임직원 약 80명이 쓰는 사내 인사관리시스템(HRMS)이 온프레미스 서버 한 대에서 WEB·WAS·DB를 함께 돌리고 있었습니다.

| 구분 | 현황 |
| --- | --- |
| 서버 | 물리 서버 1대 (4 Core · 16GB · SSD 150GB, Ubuntu 22.04, Docker) |
| 데이터 | DB 약 25GB + 첨부파일 약 40GB, 총 65GB |
| 사용량 | 동시 사용자 평시 15명 → 월말 40명 (2.7배) |
| 트랜잭션 | 일평균 500건 → 월말 3,000건 (6배) |

이 구조에서 생기는 문제는 세 가지였습니다.

- 서버 한 대가 멈추면 OS·애플리케이션 재기동까지 30분 이상 전체 서비스 중단
- WEB·WAS·DB가 섞여 있어 월말 부하에 계층별 확장 불가
- 증설·복구·로그 수집 등 주요 운영 작업이 수동에 의존

고객사 요구사항 19개를 분석해 인프라 설계 조건으로 정리했습니다.

| 영역 | 주요 요구사항 |
| --- | --- |
| 구조 | WEB/WAS/DB 분리, 가용 영역 이중화, 관리형 DB, 월말 트랜잭션 6배 대응 |
| 이전 | 최대 중단 4시간, 전후 데이터 정합성 검증, 장애 시 온프레미스 롤백 |
| 보안 | DB 외부 접근 차단, 최소 권한(ACG·NACL), root SSH 차단, 관리자 접근 경로 단일화, well-known port 지양 |
| 운영 | 자원·장애 모니터링, ALB·WEB·WAS·DB·관리자 로그 1년 보관 |
| 비용 | 월 운영비 VAT 포함 80만 원 이하 |

과제의 목표는 단순한 서버 이전이 아니라, 단일 장애점이 있는 시스템을 **분리·이중화·통제·관제할 수 있는 클라우드 운영 구조**로 바꾸는 것이었습니다.

## 결과

| 항목 | 온프레미스 | NCP 전환 후 |
| --- | --- | --- |
| 장애 복구 | 30분 이상, 전체 서비스 중단 | **10분 이내**, ASG가 비정상 서버 자동 교체, 교체 중에는 다른 존이 처리 |
| 월말 부하 | 서버 1대 고정, 수동 증설 | WAS 2대 → 최대 4대 자동 확장 |
| 신규 서버 기동 | 수동 설정 | 권한 연결부터 서비스 기동까지 자동, 수동 작업 0건 |
| 데이터 이전 | - | 65GB **3시간** 전환 (제한 4시간), 불일치 **0건** |
| 롤백 | - | 온프레미스 원복 **60분** 계획 (RTO 4시간 이내) |
| 월 운영비 | - | **798,110원** (VAT 포함, 예산 80만 원 이내) |

## 아키텍처

WEB·WAS·DB를 독립 계층으로 분리하고 KR-1·KR-2 두 존에 이중 배치했습니다. 한쪽 존이 멈추면 ALB가 비정상 Target으로 요청을 보내지 않고, 다른 존의 WEB·WAS가 처리합니다.

[![NCP Multi Zone 3-Tier 아키텍처 (클릭하면 원본)](/projects/ncp-migration/architecture.png)](/projects/ncp-migration/architecture.png)

| 설계 | 판단 근거 |
| --- | --- |
| Public ALB · Private ALB 분리 | 외부 요청은 Public ALB에서만 받고, WEB→WAS 통신은 Private ALB로 처리해 WAS·DB를 외부에 노출하지 않음 |
| WEB: 존별 1대, Auto Healing 중심 | 정적 자원 제공과 API 전달만 담당해 부하 확장보다 장애 교체가 중요 |
| WAS: 기본 2대, 최대 4대 확장 | 월말 업무 부하가 WAS에 집중 |
| Cloud DB for MySQL HA (Primary·Standby) | 현재 업무량에 고사양 DB를 선할당할 근거가 없어 2vCPU·8GB로 시작하고, 성능 증설보다 장애 대응을 우선 |
| Read Replica 월 최대 30시간 | 월말 정산은 조회·조인·집계 중심 작업. 정산 기간(업무 8시간 × 3.5일)에만 운영해 상시 비용 방지 |
| Bastion 월 30시간 | 관리 작업 시간에만 기동, HA 대상에서 제외 |
| Object Storage 용도별 버킷 | 첨부파일·로그·배포 아티팩트를 접근 권한과 보관 정책 기준으로 분리, 로그는 31일 후 Archive 전환·365일 후 삭제 |

### 처리 용량 산정

월말 3,000건이 30분에 몰린다고 가정해 목표 처리량을 잡았습니다.

- 3,000건 ÷ 1,800초 ≒ 1.67 TPS
- 1.67 TPS × 요청당 API 11회 × 안전계수 3 ≒ **50 RPS**
- WEB 2대(존별 1대)는 서버당 약 25 RPS, WAS는 기본 2대 기준 서버당 25 RPS, 4대로 확장하면 12.5 RPS
- 서버 사양은 컨테이너 기반 WEB·WAS에 맞춰 High CPU `c2-g3a`(2vCPU · 4GB)

## 네트워크와 보안

| 설계 | 내용 |
| --- | --- |
| 주소 체계 | VPC `10.0.0.0/16`을 /24 서브넷 13개로 나누고, 세 번째 옥텟 1~13으로 자원을 바로 식별 |
| 라우팅 | Public ALB와 Bastion만 Internet Gateway 경로. Private 영역은 상시 인터넷 경로 없음, Object Storage는 Private Endpoint |
| 한시적 외부 통신 | DMS 작업 기간에만 NAT Gateway 경로 추가, 이전 완료 후 제거 |
| 접근 제어 | NACL(서브넷, Stateless)과 ACG(서버)로 계층별 허용 포트만 개방 |
| 포트 | well-known port 대신 SSH 52147, WAS 41783, DB 19737 |
| 관리자 접근 | 허용된 공인 IP → Bastion 단일 진입점, root 직접 로그인 차단, 개인 계정 + sudo |
| Secret | Secret Manager를 원본으로 두고, 서버는 Server Role 임시 자격 증명으로 조회. 이미지·스크립트에 Secret 미포함, 환경 파일은 권한 600 |

관리자 접근 방식은 Bastion, SSL VPN, IPsec VPN을 관리자 규모, 접속 목적, 온프레미스 연결 필요성 기준으로 비교했습니다. 소수 관리자의 제한적인 작업이라 사용자 수에 따라 과금되는 SSL VPN이나 사이트 간 연결용 IPsec VPN보다 Bastion이 맞다고 판단했습니다.

## 운영 자동화

검증된 WEB·WAS 서버를 이미지로 만들고, Launch Configuration과 Init Script로 Auto Scaling 서버가 항상 같은 구성으로 뜨게 했습니다. 이 과정에서 세 가지 문제를 해결했습니다.

### CASE 1. DB 장애 시 정상 WAS까지 반복 교체

| 구분 | 내용 |
| --- | --- |
| 원인 | DB 상태를 포함하는 `/actuator/health` 때문에 DB 장애 시 정상 WAS도 HTTP 503으로 판정. 새 WAS도 같은 DB에 붙어 다시 Down |
| 해결 | 애플리케이션 생존만 확인하는 Liveness(`/actuator/health/liveness`)로 바꿔 DB 장애와 WAS 장애를 분리. DB 장애는 Cloud Insight 알림으로 |
| 결과 | DB 장애 시 WAS 교체 없음, WAS 자체 장애에만 교체 |

### CASE 2. Next.js가 멈춰도 서버는 정상 판정

| 구분 | 내용 |
| --- | --- |
| 원인 | Nginx가 `/health`에 고정 200을 반환해 Next.js가 중단돼도 Target은 UP, 사용자는 502 |
| 해결 | `/health`를 Next.js 컨테이너(`127.0.0.1:3000/health`)로 프록시해 사용자 요청과 같은 경로로 판정 |
| 결과 | Next.js 중단 시 Target DOWN, ASG가 WEB 서버 자동 교체 |

### CASE 3. Auto Scaling으로 만든 서버가 기동하지 못함

| 구분 | 내용 |
| --- | --- |
| 원인 | NCP Auto Scaling은 신규 서버에 Server Role을 자동 연결하지 않음. 서버는 정상인데 Secret Manager 조회 권한이 없어 컨테이너가 DB 접속 정보를 받지 못하고 교체 반복 |
| 판단 | 1분 주기 조회는 변화가 없어도 하루 1,440회 호출. 상태가 바뀔 때만 실행하는 이벤트 방식 선택 |
| 해결 | 서버가 RUN이 되면 Observer가 감지 → Cloud Function이 서버명 Prefix로 WEB·WAS를 판별해 Role 연결 → Init Script가 Secret 조회·환경 파일 생성·컨테이너 실행·헬스체크까지 진행 |
| 결과 | 증설·교체 서버 수동 작업 0건, 서버에 Access Key 미저장 |

### 장애 복구 흐름

컨테이너 재시작으로 복구되면 VM을 유지하고, 복구되지 않을 때만 VM을 교체합니다.

1. **재시작**: Docker Restart Policy로 컨테이너 재시작
2. **판정**: 재시작 후에도 헬스체크 실패 시 UNHEALTHY Target으로 전환, 요청은 다른 존으로
3. **교체**: ASG가 LB 상태 기준으로 VM 교체
4. **기동**: Observer가 Role을 연결해 신규 서버 자동 기동

### Auto Scaling 정책

| 구분 | 조건 | 동작 |
| --- | --- | --- |
| Scale-out | WAS 평균 CPU 70% 초과 5분 | 해당 존 WAS 1대 추가, Cooldown 300초 |
| Scale-in | WAS 평균 CPU 10% 미만 10분 | 해당 존 WAS 1대 반납, Cooldown 600초 (일시적인 부하 감소로 바로 반납되는 현상 방지) |

## 모니터링과 로그

- **로그 통합**: ALB Access Log, Cloud DB Error·Slow Query, WEB·WAS·Bastion 애플리케이션·인증 로그를 Cloud Log Analytics로 수집
- **장기 보관**: 최근 30일은 Cloud Log Analytics에서 검색, 원본은 로그 전용 Object Storage → 31일차 Archive Storage → 365일차 삭제
- **감사 로그**: Cloud Activity Tracer로 콘솔·API 변경 이력, Cloud DB Audit Log는 매일 01:30 Cloud Function이 로그 버킷으로 반출
- **백업**: Cloud DB 일 1회 자동 백업(22:00~02:00), 최근 7일 복구본 보관
- **알림**: 서버 CPU·메모리·파일시스템·Swap, Cloud DB CPU·I/O Wait·접속 가능 여부·복제 지연을 WARNING·CRITICAL 2단계로 감시

## 마이그레이션

DB·첨부파일·애플리케이션 특성에 따라 이전 방식을 나눴습니다.

| 대상 | 방식 |
| --- | --- |
| WEB·WAS 이미지 | `docker save` + SHA-256 무결성 검증 후 `docker load`, 실행 환경 차이 최소화 |
| DB 25GB | NCP DMS Full Load + CDC |
| 첨부파일 40GB | s3cmd Full Sync + Delta Sync |

### DB 이전 방식 선정

| 방식 | 판단 |
| --- | --- |
| mysqldump | 단순하지만 Import·변경분 반영을 따로 해야 함 → 장애 시 보조 방식 |
| mydumper | 병렬 처리 이점이 25GB에는 과도 |
| XtraBackup | 물리 백업 기반이라 관리형 DB 이전에 부적합 |
| Native Replication | 초기 적재·복제·장애 대응을 직접 관리해야 하는 운영 부담 |
| **NCP DMS** | Export·Import·Replication 통합 관리 → **최종 선정** |

### 이전 검증

별도 VPC에 모의 온프레미스(Docker MySQL 25GB, Binary Log ROW·FULL, GTID)를 만들어 실제 절차대로 검증했습니다.

| 대상 | 결과 |
| --- | --- |
| DB | DMS 49분, 12,800행 · 논리 Payload 25.00GB 일치, 28개 테이블 통계 이상 없음, Marker로 Replication 변경분 반영 확인 |
| 첨부파일 | Full Sync 7분(47개 객체), Delta Sync로 신규·변경분만 전송 |
| 무결성 | 이전 전 SHA-256 기준값과 비교, Full Sync 47개 · Delta Sync 5개 전체 일치, 오류 0개 |

### 전환 절차

사용자가 없는 토요일 22시 ~ 일요일 01시에 3시간 작업 창을 잡았습니다. (제한 4시간)

| 단계 | 시각 | 내용 |
| --- | --- | --- |
| DB 이전 · 70분 | 토 22:00 | 업무 쓰기 중단(사전 고지), DMS 이전, 정합성 검증 |
| 파일 이전 · 60분 | 토 23:10 | Replication 종료, 첨부파일 Full·Delta Sync |
| Cutover · 20분 | 일 00:10 | 온프레미스 점검 모드 유지, NCP Public ALB로 요청 전달 |
| Go-Live · 30분 | 일 00:30 | NCP WEB·WAS 활성화, 쓰기 차단 해제 |

## 롤백

전환 후에도 온프레미스를 **Cold Standby**로 보존하고, NCP의 최신 데이터를 역반영해 원복할 수 있게 했습니다. 양쪽에서 동시에 쓰기를 처리하지 않도록 NCP를 단일 Writer로 둡니다.

| 단계 | 내용 |
| --- | --- |
| DB 역방향 복제 | Cutover 이후 Cloud DB Binary Log의 최초 변경 위치를 Rollback Checkpoint로 기록, Bastion 경유 SSH Tunnel로 온프레미스 MySQL에 복제 채널 생성 |
| 첨부파일 Reverse Sync | 경로·크기·MD5 기준으로 신규·변경 파일만 내려받기, 증분 5개 SHA-256 전체 일치 |
| DNS 사전 준비 | TTL 60초로 하향, Let's Encrypt DNS-01로 온프레미스 인증서를 미리 발급 (A 레코드는 NCP 유지) |
| 최종 전환 | 쓰기 차단 → 파일·DB 최종 동기화 → 온프레미스 Writer 전환 → DNS 원복 |

| T+00~05 | T+05~15 | T+15~30 | T+30~40 | T+40~60 |
| --- | --- | --- | --- | --- |
| 롤백 시작 | 파일 최종 동기화 | DB 최종 동기화 | 온프레미스 서비스 전환 | DNS 전환·서비스 검증 |

## 비용

백업·로그 보관과 월말 증설 비용까지 포함해 월 **798,110원**(VAT 포함)으로 산정했습니다.

| 항목 | 기준 | 월 비용 |
| --- | --- | --- |
| Cloud DB for MySQL HA | 2대, 데이터 30GB, 백업 7일 | 384,456원 |
| WEB / WAS 서버 | 각 2대 상시 | 139,380원 / 139,380원 |
| Public / Private ALB | 각 small 1대 | 18,720원 / 18,720원 |
| Read Replica | 1대, 월 최대 30시간 | 4,608원 |
| WAS 확장분 | 추가 2대, 각 24시간 | 869원 |
| 기타 | Bastion, Storage, NAT, 이미지, Secret Manager, KMS 등 | 나머지 |
