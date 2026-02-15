export interface AnalyzeImageRequest {
  imageUrl: string;
  pageUrl?: string;
}

export interface AnalyzeImageResponse {
  altText: string;
}
