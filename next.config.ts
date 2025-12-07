import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ★ Next.js 16 で Turbopack を無効化する正式な方法
  turbopack: {},

  // webpack の設定をいじりたい場合はここで可能（なくてもOK）
  webpack(config) {
    return config;
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);
