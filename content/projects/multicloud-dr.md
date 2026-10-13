<!--
  NCP-GCP 멀티클라우드 DR 상세 본문. 출처: 포트폴리오 PDF(2026) PROJECT 02
  요약·기간·팀·역할·스택은 lib/profile.ts 에서 관리
-->

## 개요

NCP Active · GCP Warm Standby의 Active-Warm DR을 구성하고, 실제 장애 주입으로 **GCP 자동 전환 20.7초**를 측정했습니다. 5인 팀에서 GCP 인프라를 담당했습니다.

- **계기**: 2025.09 국가정보자원관리원 화재, 2025.10 AWS us-east-1 장애로 서비스 연쇄 중단
- **문제**: 예비 환경 없이는 원 CSP 복구만 기다려야 하고, 수동 DNS 전환은 전환 시간을 예측할 수 없음
- **범위**: WEB·WAS를 NCP Active · GCP Warm Standby로 구성

| 실패 구간 | 서비스 정상화 |
| --- | --- |
| **약 18초** · NCP 장애 후 GCP로 전환되기까지 (503 8회) | **20.7초** · NCP 장애부터 GCP 첫 정상 응답 |

## 아키텍처

Cloudflare GSLB가 평시엔 NCP로 연결하고, 헬스체크 실패 시 GCP Warm Standby로 자동 전환합니다.

[![Cloudflare GSLB 기반 NCP-GCP 멀티클라우드 DR 아키텍처 (클릭하면 원본)](/projects/multicloud-dr/architecture.png)](/projects/multicloud-dr/architecture.png)

- **트래픽**: User → Cloudflare Load Balancing → NCP(Active), 장애 시 GCP External Application LB
- **GCP**: `asia-northeast3` VPC, GKE Regional Cluster의 Warm Standby 노드 풀에 WEB(Next.js)·WAS(Spring Boot)·Prometheus·Argo Rollouts, egress는 Cloud NAT
- **CI/CD · IaC**: GitHub Actions → Docker → Artifact Registry, Terraform state는 Cloud Storage에 저장
- **보안**: Secret Manager, IAM

### 수행 범위

1. **GCP 예비 환경**: Terraform(IaC)으로 Regional GKE 구성
2. **배포 자동화**: 카나리 배포, WIF로 키 없는 GKE 배포
3. **전환 정책·설정**: Active-Warm GSLB, 환경 설정 분리
4. **전환 측정**: 장애 주입과 요청 자동 기록으로 RTO 20.7초 측정

## 문제 해결

평시 트래픽은 NCP Active가 전담하고 장애 시에만 GCP Warm Standby로 전환하며, GCP 설정은 **NCP 의존성 없이 환경별로 주입**했습니다.

### 전환 정책: 가중치 분산은 평시에도 예비 환경으로 요청을 보냄

- **원인**: 90:10 가중치 분산 시 평시에도 요청 10%가 GCP로 전달돼 Warm Standby가 상시 운영 환경이 됨
- **해결**: Cloudflare 풀 순서를 NCP 우선으로 두고 헬스체크 실패 시에만 GCP로 전환. 수동 풀 비활성화는 라우팅 스모크 테스트로만 쓰고, RTO는 실제 장애로 측정
- **결과**: 평시 트래픽은 NCP Active만 처리, 수동 전환 스모크 테스트 140건 중 실패 0건

### 예비 환경 설정: GCP로 전환돼도 사용자가 NCP 도메인으로 되돌아감

- **원인**: Web 기본 Public Origin이 NCP 도메인으로 고정돼, 로그인 시 NCP로 리다이렉트
- **해결**: Public Origin을 ConfigMap으로 분리해 환경별로 주입
- **결과**: 전환 후에도 같은 도메인에서 GCP가 서비스 유지

### 카나리 배포: 새 버전이 한 번에 전체로 바뀌어 장애가 곧바로 전체로 번짐

- **원인**: 전체 일괄 교체는 문제 버전이 모든 요청에 즉시 노출
- **해결**: Argo Rollouts로 레플리카 10개 기준 10·50·100% 반영, 단계마다 1분 대기. GitHub Actions에서 Workload Identity Federation으로 키 없이 GKE 인증
- **결과**: 3단계 카나리 반영, 서비스 계정 키 파일 없이 GKE 배포

### 구축 흐름

코드로 양쪽 환경을 만들고 전환 경로를 붙인 뒤, 장애를 주입해 검증했습니다.

1. **NCP 구축**: Terraform으로 WEB·WAS·ALB
2. **GCP 구축**: Terraform으로 Regional GKE
3. **GSLB 연결**: Cloudflare 풀·헬스 모니터
4. **장애 주입**: NCP WEB 종료 후 자동 전환 측정

## 전환 측정

NCP WEB 컨테이너를 **강제 종료**하고 **모든 요청을 자동 기록**해 사용자 관점의 RTO를 측정했습니다.

| GCP 정상화 | 전환 후 평균 응답 |
| --- | --- |
| **20.7초** · NCP 재기동(43.7초)보다 먼저 | **0.46초** · 장애 전 NCP 0.60초 |

### 전환 타임라인

NCP가 재시작되기 전에 GCP 전환으로 서비스가 먼저 정상화됐습니다.

| 시점 | 단계 | 내용 |
| --- | --- | --- |
| T+0초 | 장애 발생 | NCP WEB 컨테이너 종료 |
| T+0~18초 | 전환 대기 | 사용자 요청 503 응답 8회 |
| **T+20.7초** | **GCP 정상화** | 첫 GCP 200 응답, 서비스 복구 |
| T+43.7초 | NCP 재기동 | GCP 정상화 이후에 재기동 |

### 측정 방법

| 항목 | 내용 |
| --- | --- |
| 요청 기록 | 2초 간격 외부 요청, Via 헤더로 응답 원본(NCP·GCP)을 로그에서 자동 판별 |
| RTO 기준 | NCP 종료 완료부터 GCP 첫 HTTP 200 수신까지 |
| 측정 보완 | 첫 측정은 장애 시각 미기록으로 RTO 산출 불가, Docker `FinishedAt`으로 보완 |

## 배운 점

DR의 핵심은 인프라 구성보다 **측정과 설정 분리**였습니다.

### RTO는 장애 시점과 복구 시점이 정의되어야 측정 가능

수동 전환은 실패 없이 완료했지만, 장애 발생 시각을 기록하지 않아 RTO를 산정할 수 없었습니다.

- **다음 적용**: 장애 시각(`FinishedAt`)과 응답 원본(Via)을 자동으로 남기는 측정부터 설계

### 트래픽 전환과 서비스 정상화는 별도로 검증

GCP로 트래픽을 전환한 뒤에도 Public Origin이 NCP를 참조해 요청이 기존 환경으로 재유입됐습니다.

- **다음 적용**: DR 환경의 외부 의존성과 기존 Active 환경 참조 설정을 전환 전 검증

### 헬스체크 주기가 장애 감지 및 전환 시간에 직접 영향

60초 모니터링 주기로 인해 장애 발생 시점에 따라 감지·전환 시간에 편차가 생겼습니다.

- **다음 적용**: 목표 RTO를 기준으로 모니터링 주기와 실패 임계치 역산
