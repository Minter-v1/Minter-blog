<!--
  NCP Multi Zone 전환 상세 본문. 출처: 포트폴리오 PDF(2026) PROJECT 01
  요약·기간·팀·역할·스택은 lib/profile.ts 에서 관리
-->

## 개요

현장실습에서 제공된 **가상 고객사 시나리오**로, 온프레미스 단일 서버에서 운영하던 인사관리시스템을 NCP Multi Zone 3-Tier로 설계·구축하고 이전·롤백을 모의 환경에서 검증했습니다. 요구사항 분석부터 설계, 운영 자동화, 이전 검증까지 1인으로 전 과정을 수행했습니다.

| 구분 | 온프레미스 단일 서버 | NCP Multi Zone 3-Tier |
| --- | --- | --- |
| 장애 복구 | **30분 이상** · OS·애플리케이션 재기동까지 전체 서비스 중단 | **10분 이내** · ASG가 비정상 서버를 자동 교체, 교체 중에는 다른 존이 요청 처리 |
| 월말 부하 | 서버 1대 고정, 수동 증설 | WAS 2대에서 최대 4대 자동 확장 |

## 아키텍처

WEB·WAS·DB를 3-Tier로 분리하고 KR-1·KR-2 두 존에 이중화했습니다. WAS만 부하에 따라 2~4대로 자동 확장합니다.

[![NCP Multi Zone 3-Tier 아키텍처 (클릭하면 원본)](/projects/ncp-migration/architecture.png)](/projects/ncp-migration/architecture.png)

- **네트워크**: VPC `10.0.0.0/16`, 서브넷·NACL·ACG로 계층별 접근 통제, 관리 접속은 Bastion Host 경유
- **WEB / WAS**: 계층마다 Load Balancer + Auto Scaling Group, 존 2개에 분산
- **DB**: MySQL HA(Primary·Standby) + 조회용 Read Replica
- **운영**: Secret Manager, Cloud Insight·Cloud Log Analytics, Cloud Activity Tracer, Cloud Function

### 수행 범위

1. **요구사항 분석**: 19개 요구사항을 인프라 설계 조건으로 구체화
2. **설계·구축**: 서브넷·NACL·ACG로 계층별 접근통제 설계
3. **운영 자동화**: 헬스체크 판정 재설계, 서버 권한 자동 연결
4. **이전·롤백**: DMS·s3cmd 이전 검증, 역방향 복제 롤백 설계

## 문제 해결

헬스체크 기준을 **실제 서비스 가능 여부**로 바꾸고, 신규 서버 권한 연결을 이벤트로 자동화했습니다.

### WAS 헬스체크: DB 장애 시 정상 WAS까지 반복 교체

- **원인**: DB 상태를 포함하는 `/actuator/health` 때문에 DB 장애 시 정상 WAS도 서비스 불가(HTTP 503)로 판정
- **해결**: 애플리케이션 자체 생존만 확인하는 Liveness 헬스체크(`/actuator/health/liveness`)를 적용해 DB 장애와 WAS 장애를 분리. DB 장애는 교체 조건에서 빼고 Cloud Insight 알림으로 분리
- **결과**: DB 장애 시 WAS 교체 없음, WAS 자체 장애에만 교체

### WEB 헬스체크: Next.js가 멈춰도 서버는 정상 판정

- **원인**: Nginx가 `/health`에 고정 200을 반환해 Next.js 상태가 반영되지 않음
- **해결**: `/health`를 Next.js로 프록시해 사용자 요청과 같은 경로로 판정
- **결과**: Next.js 중단 시 Target DOWN, ASG가 WEB 서버 자동 교체

### Server Role: ASG가 새로 만든 서버가 기동하지 못함

- **원인**: 신규 서버에 Server Role이 연결되지 않아 Secret Manager 조회 실패
- **해결**: 서버가 RUN 상태가 되면 Observer가 감지하고 Cloud Function이 Role 연결. 1분 주기 조회(하루 1,440회) 대신 상태가 바뀔 때만 실행
- **결과**: 증설·교체 서버 수동 작업 0건, 서버에 Access Key 미저장

### 복구 흐름

컨테이너 재시작으로 복구되면 VM을 유지하고, 복구되지 않을 때만 VM을 교체합니다.

1. **재시작**: Docker Restart Policy로 컨테이너 재시작
2. **판정**: 재시작 후에도 헬스체크 실패
3. **교체**: ASG가 LB 상태 기준으로 VM 교체
4. **기동**: Observer가 Role을 연결해 신규 서버 자동 기동

## 이전·롤백 검증

65GB 이전의 정합성과 **온프레미스로 되돌리는 롤백 경로**까지 모의 환경에서 검증했습니다.

| 전환 완료 | 불일치 | 롤백 완료 |
| --- | --- | --- |
| **3시간** (제한 4시간) | **0건** (DB 행 수·용량, 파일 52개 SHA-256) | **60분** (RTO 4시간 이내) |

| 대상 | 방법 | 결과 |
| --- | --- | --- |
| DB 25GB | DMS 초기 적재 후 Replication, Marker로 변경분 확인. mysqldump 등 5가지 방식 비교 후 선택 | 49분, 12,800행·25GB 일치 |
| 첨부파일 40GB | s3cmd Full Sync 후 같은 sync 재실행으로 변경분만 Delta Sync | Full Sync 7분, 52개 SHA-256 일치 |
| 롤백 | NCP 쓰기 차단 후 Binlog Checkpoint 기준 역방향 복제, 첨부파일 Reverse Sync | DB CRC32·행 수 일치, 파일 5개 SHA-256 일치 |

### 전환 절차

사용자가 없는 주말 야간(토 22시~일 01시)에 3시간 작업 창을 잡아 허용 중단 4시간 안에 전환합니다.

1. **DB 이전 · 70분**: 쓰기 차단 후 DMS 이전, DB 정합성 검증
2. **파일 이전 · 60분**: Replication 종료, 첨부파일 Full·Delta Sync
3. **Cutover · 20분**: NCP로 트래픽 전환, DB·파일 연결 확인
4. **Go-Live**: DNS·응답 확인 후 쓰기 차단 해제

## 추후 보완

과제 기간 안에 검증하지 못한 항목은 운영 수준으로 보완할 계획입니다.

| 항목 | 이번 과제 범위 | 보완 계획 |
| --- | --- | --- |
| 부하 검증 | 월말 트래픽 기준 Auto Scaling 확장 테스트 미수행 | 월말 트래픽을 재현해 WAS 4대 확장까지 걸리는 시간·응답 시간 측정 |
| 롤백 시간 | DB 역복제·파일 역동기화는 검증, 전체 소요는 60분 계획 | 쓰기 차단부터 DNS 원복까지 한 번에 실측해 RTO 확보 |
| 알림 검증 | Event Rule 중 실제 수신 확인은 CPU 경보뿐 | 메모리·디스크·DB 복제 지연 경보 실발송 검증 |
