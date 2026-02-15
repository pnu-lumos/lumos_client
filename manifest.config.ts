import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Lumos Client',
  description: '네이버 스토어 상세 이미지를 분석해 접근 가능한 대체 텍스트를 주입합니다.',
  version: '0.1.0',
  permissions: ['storage'],
  host_permissions: ['*://smartstore.naver.com/*', '*://brand.naver.com/*'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  options_page: 'src/options/index.html',
  content_scripts: [
    {
      matches: ['*://smartstore.naver.com/*', '*://brand.naver.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle'
    }
  ]
});
