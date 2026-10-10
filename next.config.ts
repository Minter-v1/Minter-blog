import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 프로젝트 상세 본문(md)을 런타임에 fs로 읽으므로 배포 결과물에 포함시킨다
  outputFileTracingIncludes: {
    "/about/projects/*": ["./content/projects/**/*"],
  },
  // 망각곡선 학습법 페이지를 공개 경로로 옮겼다 (#32). 예전 링크는 영구 리다이렉트
  redirects() {
    return [{ source: "/review/guide", destination: "/learning", permanent: true }];
  },
};

export default nextConfig;
