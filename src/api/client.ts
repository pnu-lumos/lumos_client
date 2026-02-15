import { analyzeImageMock } from './mock';
import type { AnalyzeImageRequest, AnalyzeImageResponse } from './types';

const USE_MOCK = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_LUMOS_API_BASE_URL;

export async function analyzeImage(
  request: AnalyzeImageRequest
): Promise<AnalyzeImageResponse> {
  if (USE_MOCK || !API_BASE_URL) {
    return analyzeImageMock(request);
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image_url: request.imageUrl, page_url: request.pageUrl })
  });

  if (!response.ok) {
    throw new Error(`Analyze API failed: ${response.status}`);
  }

  const payload = (await response.json()) as { alt?: string };

  if (!payload.alt) {
    throw new Error('Analyze API returned empty alt text');
  }

  return { altText: payload.alt };
}
