# lumos-client

## 프로젝트 소개

루모스는 시각장애인을 위한 쇼핑몰 상세 이미지 대체 텍스트 생성 Chrome Extension입니다.

## 설치 방법

### 1) 배포된 빌드 결과물 다운로드 (권장)

1. 아래 링크에서 최신 빌드 결과물(`lumos-client-dist.zip`)을 다운로드합니다.
   - https://github.com/pnu-lumos/lumos-client/releases/latest/download/lumos-client-dist.zip
2. 디버그 버전을 다운로드하려면 아래 링크에서 `lumos-clidnt-dist-debug.zip`을 받으면 됩니다.
   - https://github.com/pnu-lumos/lumos-client/releases/latest/download/lumos-clidnt-dist-debug.zip
   - 디버그 버전은 일반 버전과 달리 API 요청 디버그 시각화(요청/성공/실패 아웃라인, 우하단 패널)가 활성화됩니다.
3. 압축을 해제해 `dist` 폴더를 준비합니다.

### 2) Chrome에 확장 로드

1. `chrome://extensions` 접속
2. 우측 상단 `개발자 모드` 활성화
3. `압축해제된 확장 프로그램을 로드합니다` 클릭
4. 압축 해제한 `dist` 폴더 선택

### 3) (선택) 로컬에서 직접 빌드하기

```bash
npm install
npm run build
```

빌드와 동시에 배포용 압축파일(`lumos-client-dist.zip`)까지 만들려면:

```bash
npm run build:artifact
```

위 명령을 실행하면 아래 파일이 함께 생성됩니다.
- `lumos-client-v<version>.zip` (버전 고정 배포용)
- `lumos-client-dist.zip` (README 고정 링크용 최신 파일)

디버그 시각화(요청 이미지 보더/패널)가 필요한 경우:

```bash
npm run build:debug
```

디버그 빌드와 동시에 디버그 배포용 압축파일까지 만들려면:

```bash
npm run build:debugartifact
```

위 명령을 실행하면 아래 파일이 함께 생성됩니다.
- `lumos-client-debug-v<version>.zip` (버전 고정 디버그 배포용)
- `lumos-clidnt-dist-debug.zip` (최신 디버그 결과물 고정 파일명)

디버그 시각화 색상 정책:
- 요청 시도: 초록색 아웃라인
- 분석 성공: 파란색 아웃라인
- 분석 실패: 빨간색 아웃라인

코드 수정 후에는 빌드를 다시 실행하고 확장 프로그램을 새로고침하세요.

## 기술 스택

| 영역              | 기술                              |
| ----------------- | --------------------------------- |
| Language          | TypeScript                        |
| Build Tool        | Vite                              |
| Chrome Extension  | Manifest V3 + CRXJS               |
| Storage           | `chrome.storage.sync`             |
| Runtime Messaging | `chrome.runtime.sendMessage`      |
| API               | Fetch 기반 클라이언트 + Mock 응답 |
