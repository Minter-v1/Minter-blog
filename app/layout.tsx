import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT 용어 사전",
  description: "공부하다 마주친 IT 용어를 정리하는 개인 사전",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
