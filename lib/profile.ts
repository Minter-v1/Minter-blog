// About 페이지 내용. 레쥬메(RESUME_v260922.pdf)에서 옮겼다.
// 공개 페이지라 전화번호·생년월일·주소·사진은 넣지 않는다.
//
// 문장 안 강조: [[파란 강조]], **굵게**
// related: 이 프로젝트와 관련된 블로그 기록 ("log/finq-배포-자동화"처럼 컬렉션/파일명)
// 프로젝트 상세 본문: content/projects/{slug}.md

import type { Ref } from "./collections";

export type TimelineItem = {
  period: string;
  title: string;
  subtitle?: string; // 팀·역할 등
  org?: string;
  bullets: string[];
};

export type Project = {
  slug: string; // 상세 페이지 주소 /about/projects/{slug}, 본문은 content/projects/{slug}.md
  period: string;
  name: string;
  tagline?: string;
  team: string;
  role: string;
  bullets: string[];
  stack: string[];
  related?: Ref[];
};

export const PROFILE = {
  name: "이민지",
  nameEn: "Minji Lee",
  role: "Cloud Engineer",
  intro: [
    "트래픽이 몰려도, 장애가 나도 [[멈추지 않는 인프라]]를 만드는 클라우드 엔지니어입니다.",
    "월말 6배로 몰리는 요청에는 **서버가 자동으로 늘어나도록**,",
    "NCP 장애에는 **GCP로 넘어가도록** 설계하고 전환까지 직접 검증했습니다.",
    "고객의 서비스도 같은 기준으로 옮기고, 멈추지 않게 지키겠습니다.",
  ],
  contacts: [
    { label: "GitHub", text: "github.com/Minter-v1", href: "https://github.com/Minter-v1" },
    { label: "Email", text: "adf5858@naver.com", href: "mailto:adf5858@naver.com" },
  ],

  education: [
    {
      period: "2023.02 – 2027.02",
      title: "국립한밭대학교 컴퓨터공학과 학사 (졸업예정)",
      bullets: ["GPA 3.85 / 4.5 · 성적우수장학금 2회 수혜"],
    },
    { period: "2017.03 – 2020.02", title: "대전둔산여자고등학교 인문계", bullets: ["졸업"] },
  ] as TimelineItem[],

  experience: [
    {
      period: "2026.08",
      title: "클라우드스퀘어",
      subtitle: "클라우드 2팀 · 현장실습생",
      bullets: ["온프레미스 인사관리 시스템의 [[NCP 마이그레이션]] 과제 수행", "요구사항 분석 · 비용 산정 · 인프라 구축 · 이관 검증 전 과정 담당"],
    },
    {
      period: "2025.08 – 2025.12",
      title: "스마트뉴비",
      subtitle: "SW팀 · 프론트엔드 인턴",
      bullets: ["Next.js · TypeScript로 자사 백오피스 개발", "외주 SI 웹사이트 구축 및 AWS DynamoDB · S3 연동"],
    },
  ] as TimelineItem[],

  projects: [
    {
      period: "2026.08 – 현재",
      slug: "finq",
      name: "FinQ",
      tagline: "금융 학습 애플리케이션",
      team: "9인 팀(개발 4인)",
      role: "Infra / Backend Lead",
      bullets: [
        "AWS 3-Tier 인프라 설계 · 구축하고, CloudWatch · Grafana 기반 메트릭 · 로그 모니터링 체계 구성",
        "Spring Boot API 서버 배포 환경을 직접 운영하며 GitHub Actions 배포 자동화, iOS App Store 출시 심사 중",
      ],
      stack: ["AWS", "Spring Boot", "MySQL", "Docker", "GitHub Actions", "Ansible", "CloudWatch", "Grafana"],
      // 예시 연결 — 이 프로젝트를 하며 쓴 실제 학습 기록·트러블슈팅으로 바꿔 주세요
      related: ["git/git-rebase"],
    },
    {
      period: "2026.08",
      slug: "ncp-migration",
      name: "제조기업 인사관리 시스템 NCP 마이그레이션",
      team: "1인 과제",
      role: "Cloud Engineer",
      bullets: [
        "온프레미스 단일 서버 기반 인사관리 시스템을 NCP Multi Zone 3-Tier 고가용성 아키텍처로 설계 · 마이그레이션",
        "Auto Scaling 신규 서버의 권한 연결부터 Secret 조회 · 서비스 기동까지 이벤트 기반 자동화",
      ],
      stack: ["NCP"],
    },
    {
      period: "2026.05",
      slug: "waymore",
      name: "WAYMORE",
      tagline: "진로상담 로드맵 서비스",
      team: "3인 팀",
      role: "Infra / Full-stack",
      bullets: [
        "AWS 3-Tier 서비스 인프라 설계 · 구축 및 Spring Boot · React 기반 웹 서비스 개발",
        "ALB 기반 Blue-Green 배포로 [[배포 중 다운타임 0초]], 장애 시 N초 내 롤백",
      ],
      stack: ["AWS", "Spring Boot", "React", "Docker", "GitHub Actions"],
    },
    {
      period: "2026.01",
      slug: "multicloud-dr",
      name: "Global DNS 기반 멀티클라우드 DR 시스템 구축",
      team: "5인 팀",
      role: "PM / Cloud Engineer",
      bullets: [
        "NCP Primary - GCP Standby(Warm) 기반 멀티클라우드 DR 아키텍처 설계 · 구축",
        "Global DNS Health Check 기반 Failover 및 Argo Rollouts 카나리 배포 기반 GCP Kubernetes 환경 구축",
      ],
      stack: ["NCP", "GCP", "Global DNS", "Terraform", "Kubernetes", "Argo Rollouts", "Prometheus", "Grafana"],
    },
    {
      period: "2025.08 – 2025.12",
      slug: "3d-printing-lab",
      name: "스마트 3D 프린팅 연구소 웹사이트 구축",
      team: "4인 팀",
      role: "Full-stack",
      bullets: [
        "국립한밭대학교 연구소 외주 SI 프로젝트로, 기획 · 디자인 요구사항 기반 웹 화면 및 기능 구현",
        "Next.js 서버 사이드에서 AWS DynamoDB · S3를 연동해 데이터 조회 · 관리 및 파일 업로드 기능 구현",
      ],
      stack: ["Next.js", "AWS DynamoDB", "AWS S3"],
    },
    {
      period: "2025.05 – 2025.12",
      slug: "yuseong-automation",
      name: "대전광역시 유성구청 이미지 인식 기반 행정업무 자동화",
      team: "4인 팀",
      role: "PM / Developer",
      bullets: [
        "외부 연동이 제한된 인트라넷 환경에서 이미지 인식 기반 주민 검색 · 세대원 수 추출 자동화 설계",
        "ROI 및 다중 스케일 템플릿 매칭으로 화면 변화에 대응해 UI 인식 정확도 [[40% → 100%]] 개선",
      ],
      stack: ["Python", "OpenCV", "PyAutoGUI"],
    },
    {
      period: "2025.06 – 2025.11",
      slug: "moa",
      name: "MOA",
      tagline: "인지증 인식 개선 웹앱",
      team: "10인 팀(개발 3인)",
      role: "Development Lead / Infra / Full-stack",
      bullets: ["NCP 3-Tier 서비스 인프라 구축 및 Docker 기반 컨테이너 배포", "QR 인식 · 카드덱 연동 웹앱 풀스택 개발"],
      stack: ["NCP", "Docker", "Next.js", "FastAPI", "PostgreSQL"],
    },
  ] as Project[],

  activities: [
    {
      period: "2026.08 – 현재",
      title: "SWYP 앱 6기",
      subtitle: "백엔드 개발자 (팀장)",
      org: "SWYP",
      bullets: ["9인 팀 백엔드 팀장으로 금융 학습 애플리케이션 FinQ의 인프라 · 백엔드 개발 총괄"],
    },
    {
      period: "2024.12 – 2026.05",
      title: "MOBICOM 연구실 학부연구생 (랩장)",
      org: "국립한밭대학교",
      bullets: [
        "랩장으로 Notion 기반 프로젝트 관리 체계 구축과 Git · 문서화 · 협업 도구 교육을 주도하며, 약 10건의 SW 개발 프로젝트 수행 및 제1저자 논문 1편 작성",
      ],
    },
    {
      period: "2026.01",
      title: "네이버 클라우드 실무 특강 Advanced 과정",
      subtitle: "PM · 클라우드 엔지니어",
      org: "네이버클라우드(주)",
      bullets: ["5인 팀 PM으로 NCP-GCP 멀티클라우드 DR 시스템 구축 프로젝트를 수행하고, GCP Standby 환경 설계 및 구축 담당"],
    },
    {
      period: "2025.05 – 2025.12",
      title: "2025년 유성 데이터기반 실증 리빙랩 프로젝트",
      subtitle: "PM · 개발",
      org: "대전광역시 유성구청",
      bullets: [
        "4인 팀 PM 및 개발자로 대전광역시 유성구청 행정업무 자동화 프로젝트를 주도하고, 운영환경 분석 및 이미지 인식 기반 자동화 시스템 설계",
      ],
    },
    {
      period: "2025.06 – 2025.11",
      title: "2025 대전시소 퍼블릭이즈 치매문화팀",
      subtitle: "개발 총괄",
      org: "대전광역시",
      bullets: ["3인 개발팀 총괄로 인지증 인식 개선 웹앱 'MOA'를 개발 및 배포하고, NCP 3-Tier 서비스 인프라 구축"],
    },
    {
      period: "2025.06 – 2025.07",
      title: "네이버 클라우드 실무 특강 Associate 과정",
      subtitle: "연수생",
      org: "네이버클라우드(주)",
      bullets: ["NCP 주요 서비스를 활용한 클라우드 인프라 설계 · 구축 및 네트워크 · 보안 구성 실습 수행"],
    },
    {
      period: "2024.05 – 2024.11",
      title: "과학기술정보 특화 LLM 평가 데이터 구축 및 지표 개발",
      subtitle: "PM · 연구원",
      org: "한국과학기술정보연구원(KISTI)",
      bullets: ["PM 및 연구원으로 5인의 검수자를 운영하며 과학기술 8개 분야 LLM 평가 데이터 2,096건 구축 · 검수 총괄"],
    },
    {
      period: "2024.05 – 2024.11",
      title: "KI LAB 연구실 학부연구생 (랩장)",
      org: "국립한밭대학교",
      bullets: ["랩장으로 NLP · LLM 연구 및 프로젝트 진행을 총괄하고, 제1저자 논문 2편 작성"],
    },
  ] as TimelineItem[],

  awards: [
    {
      period: "2026.02",
      title: "네이버 클라우드 실무 특강 Advanced 과정",
      subtitle: "최우수 수료생 및 프로젝트 1위",
      org: "네이버클라우드(주)",
      bullets: ["NCP-GCP 멀티클라우드 DR 프로젝트 수행으로 프로젝트 1위 및 최우수 수료생 선정"],
    },
    {
      period: "2025.12",
      title: "2025년 유성 데이터기반 실증 리빙랩 프로젝트",
      subtitle: "최우수상",
      org: "대전광역시 유성구청",
      bullets: ["행정업무 효율화를 위한 이미지 인식 기반 자동화 시스템 개발"],
    },
    {
      period: "2025.11",
      title: "2025년 추계종합학술발표회",
      subtitle: "학부 부문 장려상",
      org: "한국통신학회 · 제1저자",
      bullets: ["「대규모 언어 모델을 활용한 어휘력 맞춤형 뉴스 요약 플랫폼 개발」"],
    },
    {
      period: "2024.10",
      title: "제36회 한글 및 한국어 정보처리 학술대회",
      subtitle: "우수논문상",
      org: "한국정보과학회 · 제1저자",
      bullets: ["「과학기술정보 전문분야 한국어 벤치마크」"],
    },
  ] as TimelineItem[],

  certifications: [
    { name: "AWS Certified Solutions Architect - Associate", issuer: "Amazon Web Services (AWS)", date: "2026.09.21" },
    { name: "정보처리기사", issuer: "한국산업인력공단", date: "2026.09.11" },
    { name: "SQLD (SQL 개발자)", issuer: "한국데이터산업진흥원", date: "2026.03.27" },
    { name: "NCP (Naver Cloud Platform Professional)", issuer: "네이버클라우드", date: "2026.02.06" },
    { name: "NCA (Naver Cloud Platform Associate)", issuer: "네이버클라우드", date: "2025.07.17" },
  ],

  skills: [
    { group: "Cloud", items: ["AWS", "NCP", "GCP"] },
    { group: "DevOps", items: ["Terraform", "Ansible", "Docker", "Kubernetes", "Argo Rollouts", "GitHub Actions"] },
    { group: "Monitoring", items: ["CloudWatch", "Prometheus", "Grafana"] },
    { group: "Language", items: ["Java", "Python", "TypeScript", "Swift"] },
    { group: "Backend", items: ["Spring Boot", "FastAPI", "MySQL", "PostgreSQL"] },
    { group: "Frontend", items: ["Next.js", "React"] },
    { group: "Collaboration", items: ["Git", "GitHub", "Jira", "Confluence", "Notion"] },
  ],

  papers: [
    { date: "2025.11", title: "대규모 언어 모델을 활용한 어휘력 맞춤형 뉴스 요약 플랫폼 개발", venue: "한국통신학회 2025년 추계종합학술발표회 · 제1저자" },
    { date: "2024.11", title: "Korean News Summarization with Contrasts by Augmenting Counterfactual Data", venue: "ICCE-Asia 2024 · 제1저자" },
    { date: "2024.10", title: "과학기술정보 전문분야 한국어 벤치마크", venue: "제36회 한글 및 한국어 정보처리 학술대회 · 제1저자" },
  ],
};
