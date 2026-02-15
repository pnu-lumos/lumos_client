import type { AnalyzeImageRequest, AnalyzeImageResponse } from './types';

const MOCK_DELAY_MS = 600;

export async function analyzeImageMock(
  request: AnalyzeImageRequest
): Promise<AnalyzeImageResponse> {
  const filename = request.imageUrl.split('/').pop() ?? '이미지';
  const summary = filename.replace(/[-_]/g, ' ').replace(/\.[a-z0-9]+$/i, '');

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  return {
    altText: `상품 상세 이미지입니다. 주요 정보가 포함되어 있으며 파일 식별명은 ${summary}입니다.`
  };
}
