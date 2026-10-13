<!--
  NCP-GCP 멀티클라우드 DR 상세 본문. 출처: 포트폴리오 PDF(2026) PROJECT 02
  요약·기간·팀·역할·스택은 lib/profile.ts 에서 관리
-->

## 개요

네이버 클라우드 아카데미 Advanced 과정에서 5명이 진행한 팀 프로젝트입니다. NCP를 Active, GCP를 Warm Standby로 두고 Cloudflare GSLB로 전환되는 DR을 만들었고, NCP 풀을 차단해 장애를 재현하는 방식으로 전환 시간을 측정했습니다. 저는 PM을 맡으면서 GCP 인프라 담당 2명 중 한 명으로 예비 환경과 전환 구성을 맡았고, NCP 쪽은 팀원 3명이 담당했습니다. 이 프로젝트로 과정 프로젝트 1위와 최우수 수료생에 선정됐습니다.

## 배경

2025년 9월 국가정보자원관리원 화재, 10월 AWS us-east-1 장애로 하나의 인프라에 묶인 서비스가 연쇄적으로 멈추는 것을 봤습니다. 같은 리전 안에서 이중화를 해도 리전 전체가 무너지면 그 안의 서비스는 함께 중단되고, 예비 환경이 없으면 원래 클라우드가 복구될 때까지 기다릴 수밖에 없습니다. DNS를 손으로 바꾸는 방식은 언제 전환될지 예측할 수도 없었습니다.

그래서 클라우드 하나가 무너져도 다른 클라우드가 이어받는 구조를 목표로 잡았습니다. 팀이 정한 목표 RTO는 1분이었고, 전환 방식과 복구 시간 측정 두 가지를 기준으로 삼았습니다. 대기 환경은 장애 시 같은 구성을 다시 만들 수 있도록 Terraform으로 직접 코드화했습니다.

## 아키텍처

Cloudflare Load Balancing이 평소에는 NCP로 요청을 보내고, NCP 헬스체크가 실패하면 GCP로 보냅니다. GCP는 서울 리전(`asia-northeast3`)의 GKE Regional Cluster에 WEB(Next.js)과 WAS(Spring Boot)를 미리 띄워 둔 Warm Standby입니다.

[![Cloudflare GSLB 기반 NCP-GCP 멀티클라우드 DR 아키텍처 (클릭하면 원본)](/projects/multicloud-dr/architecture.png)](/projects/multicloud-dr/architecture.png)

GCP 환경은 Terraform으로 만들고 state는 Cloud Storage에 두었습니다. 배포는 GitHub Actions에서 이미지를 Artifact Registry로 올린 뒤 Argo Rollouts로 반영합니다.

평소 트래픽을 받는 NCP 쪽 구성은 아래와 같습니다. NKS 클러스터에 Frontend와 Argo Rollouts, 모니터링(Prometheus, Grafana)을 올렸고, GCP의 Prometheus가 remote_write로 메트릭을 NCP 쪽에 보내도록 연결했습니다. (팀 최종 발표자료)

[![NCP Active 구성 (클릭하면 원본)](/projects/multicloud-dr/ncp-architecture.png)](/projects/multicloud-dr/ncp-architecture.png)

## 예비 환경은 평소에 쉬어야 한다

처음에는 Cloudflare에서 NCP와 GCP를 90:10 가중치로 나눴습니다. 그런데 이렇게 하면 평소에도 요청의 10%가 GCP로 가서, 예비 환경이 사실상 두 번째 운영 환경이 됩니다. 아직 DB 복제와 승격 검증 전이라 양쪽에 동시에 요청을 나누면 데이터 정합성도 보장하기 어려웠습니다.

풀 순서를 NCP 우선으로 바꾸고 헬스체크가 실패할 때만 GCP로 넘어가게 했습니다. 이후 Cloudflare에서 NCP 풀을 수동으로 차단해 전환 경로를 반복 확인했고, 스모크 테스트 140번이 모두 성공했습니다.

## 넘어갔는데 다시 NCP로 돌아가던 문제

전환 테스트 중에 GCP로 넘어간 사용자가 로그인만 하면 NCP 도메인으로 리다이렉트되는 현상이 있었습니다. Web의 Public Origin 기본값이 NCP 도메인으로 박혀 있었기 때문입니다. 트래픽은 GCP로 왔는데 애플리케이션이 다시 죽은 NCP를 가리키고 있던 셈입니다.

Public Origin을 ConfigMap으로 빼서 환경마다 주입하도록 바꿨고, 이후에는 전환 후에도 같은 도메인에서 GCP가 계속 서비스했습니다. 이 일 이후로 "트래픽이 넘어갔다"와 "서비스가 정상이다"는 따로 확인해야 한다고 생각하게 됐습니다.

## 배포도 한 번에 바꾸지 않기

GKE 배포는 새 버전을 한 번에 전체 교체하면 문제가 있는 버전이 곧바로 모든 요청에 노출됩니다. Argo Rollouts로 레플리카 10개 기준 10%, 50%, 100% 순서로 반영하고 단계마다 1분씩 기다리게 했습니다. GitHub Actions의 GKE 인증은 Workload Identity Federation으로 처리해서 서비스 계정 키 파일을 저장소나 Secret에 두지 않았습니다.

## 20.7초

Cloudflare에서 NCP 풀을 수동으로 차단해 장애를 재현하고, 2초 간격으로 외부에서 요청을 보내면서 응답마다 Via 헤더로 NCP와 GCP 중 어디서 왔는지 기록했습니다.

| 시점 | 상태 |
| --- | --- |
| T+0초 | NCP 풀 차단 |
| T+0~18초 | 503 응답 8회 |
| T+20.7초 | GCP에서 첫 200 응답 |

팀 목표였던 RTO 1분 안에 GCP가 서비스를 이어받았고, 전환 후 평균 응답 시간은 0.46초로 장애 전 NCP(0.60초)보다 짧았습니다.

사실 첫 번째 측정은 실패했습니다. 전환 자체는 잘 됐는데 장애를 낸 시각을 기록하지 않아서 RTO를 계산할 수 없었습니다. 두 번째에는 차단 시각을 함께 남기고, 차단 시점부터 GCP의 첫 HTTP 200까지를 RTO로 정의한 뒤 다시 측정했습니다.

## 다음에 다르게 할 것

헬스체크 주기를 60초로 두었더니 장애가 주기의 어느 시점에 나느냐에 따라 감지 시간이 크게 달라졌습니다. 다음에는 목표 RTO를 먼저 정하고, 거기서 모니터링 주기와 실패 임계치를 거꾸로 계산할 생각입니다. 그리고 측정 방법은 인프라를 다 만든 뒤가 아니라 처음부터 같이 설계하려고 합니다.
