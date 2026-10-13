<!--
  NCP-GCP 멀티클라우드 DR 상세 본문
  출처: 포트폴리오 PDF(2026) PROJECT 02, 네이버클라우드 팀9 최종 발표자료, 현대오토에버 지원서
  요약·기간·팀·역할·스택은 lib/profile.ts 에서 관리
-->

## 프로젝트 정보

| 항목 | 내용 |
| --- | --- |
| 어디서 | 네이버 클라우드 아카데미 Advanced 과정 (네이버클라우드) |
| 기간 | 2026.01 (약 5일) |
| 형태 | 5인 팀 프로젝트 (NCP 인프라 3명, GCP 인프라 2명) |
| 역할 | PM · GCP 인프라 담당 |
| 담당 범위 | GCP Warm Standby 환경, Cloudflare GSLB 전환 구성, 배포 자동화, 전환 측정 |
| 성과 | 과정 프로젝트 1위, 최우수 수료생 선정 |

## 배경

2025년 9월 국가정보자원관리원 화재, 10월 AWS us-east-1 장애로 하나의 인프라에 묶인 서비스가 연쇄적으로 중단됐습니다.

- **리전 장애**: 같은 리전 안에서 이중화를 해도 리전 전체가 무너지면 그 안의 서비스는 함께 중단
- **복구 대기**: 예비 환경이 없으면 원래 클라우드가 복구될 때까지 기다릴 수밖에 없음
- **수동 전환**: DNS를 손으로 바꾸는 방식은 전환 시간을 예측할 수 없음

그래서 특정 CSP에 종속되지 않도록 두 클라우드를 조합해, 한쪽이 무너져도 다른 쪽이 이어받는 **NCP Active · GCP Warm Standby** 구조를 목표로 잡았습니다.

## 설계 목표

| 목표 | 내용 |
| --- | --- |
| 장애 조치 (Failover) | NCP 장애 시 GCP로 자동 전환, 팀 목표 **RTO 1분** |
| 무중단 배포 | 새 버전을 단계적으로 반영해 서비스 연속성 보장 |
| 관측 데이터 보존 | Prometheus Remote Write로 메트릭 손실 최소화 (RPO Near-zero, 메트릭 기준) |
| 재현 가능성 | 대기 환경은 장애 시 같은 구성을 다시 만들 수 있도록 Terraform으로 코드화 |

## 결과

| 항목 | 결과 |
| --- | --- |
| 자동 전환 | NCP 장애 후 **20.7초** 만에 GCP 첫 정상 응답, 팀 목표 RTO 1분 충족 |
| 전환 속도 | 기존 환경 재시작(43.7초)보다 **23초** 먼저 서비스 정상화 |
| 전환 후 응답 | 평균 **0.46초** (장애 전 NCP 0.60초) |
| 전환 경로 | 수동 풀 비활성화 스모크 테스트 HTTP 요청 140건 **전부 정상 응답** |
| 배포 | Argo Rollouts 3단계 카나리, 서비스 계정 키 파일 없이 GKE 배포 |

## 아키텍처

Cloudflare GSLB가 평시에는 NCP로 요청을 보내고, 헬스체크가 실패하면 GCP Warm Standby로 전환합니다.

[![Cloudflare GSLB 기반 NCP-GCP 멀티클라우드 DR 아키텍처 (클릭하면 원본)](/projects/multicloud-dr/architecture.png)](/projects/multicloud-dr/architecture.png)

| 영역 | 구성 |
| --- | --- |
| 트래픽 | User → Cloudflare Load Balancing(헬스체크·Failover) → NCP Load Balancer, 장애 시 GCP External Application LB |
| GCP Standby | `asia-northeast3` VPC, GKE Regional Cluster의 Warm Standby 노드 풀에 WEB(Next.js) · WAS(Spring Boot) · Prometheus · Argo Rollouts, egress는 Cloud NAT |
| CI/CD · IaC | GitHub Actions → Docker → Artifact Registry, Terraform state는 Cloud Storage |
| 보안 | Secret Manager, IAM, Workload Identity Federation |

### NCP Active

NKS 클러스터에 Frontend(Rollout), Argo Rollouts Controller, 모니터링(Prometheus · Grafana)을 올렸고, 관리 접속은 Public Subnet의 Bastion으로만 열었습니다. GCP의 Prometheus는 mTLS와 IP 제한을 건 Remote Write로 NCP Prometheus에 메트릭을 보내, 어느 쪽이 서비스하든 한 곳에서 관측할 수 있게 했습니다.

[![NCP Active 아키텍처 (클릭하면 원본)](/projects/multicloud-dr/ncp-architecture.png)](/projects/multicloud-dr/ncp-architecture.png)

## 문제 해결

평시 트래픽은 NCP Active가 전담하고 장애 시에만 GCP로 전환하며, GCP 설정은 **NCP에 의존하지 않고 환경별로 주입**했습니다.

### CASE 1. 전환 정책: 가중치 분산은 평시에도 예비 환경으로 요청을 보냄

| 구분 | 내용 |
| --- | --- |
| 원인 | 90:10 가중치 분산 시 평시에도 요청 10%가 GCP로 전달돼 Warm Standby가 상시 운영 환경이 됨 |
| 판단 근거 | DB 복제·승격 검증 전이라 양쪽에 요청을 나누면 데이터 정합성을 보장하기 어려움 |
| 해결 | GSLB에 NCP 1순위, GCP 2순위를 둔 Failover 정책. 헬스체크 실패 시에만 GCP로 전환 |
| 결과 | 평시 트래픽은 NCP Active만 처리, 수동 전환 스모크 테스트 140건 중 실패 0건 |

### CASE 2. 예비 환경 설정: GCP로 전환돼도 사용자가 NCP 도메인으로 되돌아감

| 구분 | 내용 |
| --- | --- |
| 원인 | Web의 기본 Public Origin이 NCP 도메인으로 고정돼, 로그인 시 NCP로 리다이렉트 |
| 해결 | Public Origin을 ConfigMap으로 분리해 환경별로 주입 |
| 결과 | 전환 후에도 같은 도메인에서 GCP가 서비스 유지 |

### CASE 3. 카나리 배포: 새 버전이 한 번에 바뀌어 장애가 곧바로 전체로 번짐

| 구분 | 내용 |
| --- | --- |
| 원인 | 전체 일괄 교체는 문제 버전이 모든 요청에 즉시 노출 |
| 해결 | Argo Rollouts로 레플리카 10개 기준 10% → 50% → 100% 반영, 단계마다 1분 대기. GitHub Actions는 Workload Identity Federation으로 키 없이 GKE 인증 |
| 결과 | 3단계 카나리 반영, 서비스 계정 키 파일 없이 GKE 배포 |

### 구축 흐름

코드로 양쪽 환경을 만들고 전환 경로를 붙인 뒤, 장애를 주입해 검증했습니다.

1. **NCP 구축**: Terraform으로 WEB · WAS · ALB
2. **GCP 구축**: Terraform으로 Regional GKE
3. **GSLB 연결**: Cloudflare 풀 · 헬스 모니터
4. **장애 주입**: 서비스 컨테이너 종료 후 자동 전환 측정

## 전환 측정

복구 시간은 체감이 아니라 비교할 수 있는 수치로 확인했습니다.

| 항목 | 기준 |
| --- | --- |
| 측정 구간 | NCP 서비스 컨테이너 종료부터 GCP의 첫 HTTP 200 수신까지 |
| 요청 기록 | 2초 간격 외부 요청, 응답마다 Via 헤더로 응답 원본(NCP · GCP)을 자동 판별 |
| 시각 기록 | 컨테이너 종료 시각과 응답 시각을 함께 기록해 RTO 산출 |

### 전환 타임라인

| 시점 | 단계 | 상태 |
| --- | --- | --- |
| T+0초 | 장애 발생 | NCP 서비스 컨테이너 종료 |
| T+0~18초 | 전환 대기 | 사용자 요청 503 응답 8회 |
| **T+20.7초** | **GCP 정상화** | 첫 GCP 200 응답, 서비스 복구 |
| T+43.7초 | NCP 재시작 | GCP 정상화 이후 재시작 |

NCP가 다시 뜨기 23초 전에 GCP가 서비스를 이어받았고, 전환 후 평균 응답 시간은 0.46초로 장애 전 NCP(0.60초)보다 짧았습니다.

## 배운 점

| 주제 | 내용 |
| --- | --- |
| RTO는 정의부터 | 장애 시점과 복구 시점을 먼저 정의하고, 장애 시각과 응답 원본을 자동으로 남기는 측정부터 설계 |
| 전환과 정상화는 별개 | 트래픽이 넘어간 뒤에도 기존 환경을 참조하는 설정이 없는지 전환 전에 검증 |
| 헬스체크 주기 역산 | 감지 주기가 전환 시간을 좌우하므로, 목표 RTO를 기준으로 모니터링 주기와 실패 임계치를 역산 |
