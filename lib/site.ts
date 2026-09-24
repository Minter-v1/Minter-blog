// 블로그 기본 정보. 홈 자기소개와 헤더에 쓰인다. 자유롭게 고쳐 쓰면 된다.
export const SITE = {
  name: "Minter.log",
  author: "Minter",
  // 홈 이름 아래 한 줄 소개. 직접 쓰면 표시되고, 비워 두면 표시하지 않는다
  bio: "",
  // 홈 "이번 주" 목표 개수 (컬렉션별 합이 주간 목표). 일요일 정리 루틴에 맞게 조정
  weeklyGoal: { log: 1, terms: 5, git: 3, troubleshooting: 1 },
  links: [
    { label: "GitHub", href: "https://github.com/Minter-v1" },
    // { label: "Email", href: "mailto:you@example.com" },
  ],
};
