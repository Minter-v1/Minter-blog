import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 프로젝트 상세 본문(md)을 런타임에 fs로 읽으므로 배포 결과물에 포함시킨다
  outputFileTracingIncludes: {
    "/about/projects/*": ["./content/projects/**/*"],
  },
};

export default nextConfig;
