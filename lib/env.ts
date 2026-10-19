function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수 ${name}이(가) 설정되지 않았습니다.`);
  return value;
}

export function githubEnv() {
  return {
    token: required("GITHUB_TOKEN"),
    owner: required("GITHUB_OWNER"),
    repo: required("GITHUB_REPO"),
    branch: process.env.GITHUB_BRANCH || "main",
  };
}

// 관리자 로그인 (#118): ADMIN_PASSWORD_HASH(권장)가 있으면 해시로 확인, 없으면 예전 ADMIN_PASSWORD 원문
export function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}
export function adminPasswordHash(): string | null {
  return process.env.ADMIN_PASSWORD_HASH || null;
}
/** 세션 쿠키 서명 키. 해시를 쓰면 원문이 없으니 SESSION_SECRET을 따로 둔다 */
export function sessionSecret(): string | null {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}
