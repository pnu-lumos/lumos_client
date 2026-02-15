import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Lumos",
  description:
    "시각장애인을 위한 쇼핑몰 상세 이미지 대체텍스트 생성 확장 프로그램",
  version: "0.1.0",
  icons: {
    "128": "icons/icon128.png",
  },
  action: {
    default_icon: "icons/icon128.png",
  },
  permissions: ["storage"],
  host_permissions: ["*://smartstore.naver.com/*", "*://brand.naver.com/*"],
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  options_page: "src/options/index.html",
  content_scripts: [
    {
      matches: ["*://smartstore.naver.com/*", "*://brand.naver.com/*"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
});
