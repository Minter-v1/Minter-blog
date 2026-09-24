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
    dir: (process.env.TERMS_DIR || "terms").replace(/^\/+|\/+$/g, ""),
  };
}

export function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}
