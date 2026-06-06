export interface UrlFetchResult {
  file: File;
  originalUrl: string;
}

export interface UrlFetchError {
  url: string;
  error: string;
}

export function isValidImageUrl(url: string): boolean {
  return /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp|avif|bmp|svg|ico)(\?.*)?$/i.test(url) ||
    /^https?:\/\/.+/.test(url);
}

async function base64ToFile(base64: string, mime: string, name: string): Promise<File> {
  const response = await fetch(`data:${mime};base64,${base64}`);
  const blob = await response.blob();
  return new File([blob], name, { type: mime });
}

function getHumanReadableError(status: number): string {
  const map: Record<number, string> = {
    400: "Bad request",
    403: "Access denied (forbidden)",
    404: "Image not found (404)",
    413: "Image too large",
    415: "Unsupported media type",
    500: "Remote server error",
    502: "Remote server unavailable",
    504: "Remote server timeout",
  };
  return map[status] || `HTTP error ${status}`;
}

export async function fetchUrlAsFile(url: string): Promise<{ file: File; originalUrl: string }> {
  const res = await fetch("/api/fetch-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    throw new Error(getHumanReadableError(res.status));
  }
  const json = await res.json();
  const { base64, mime, name } = json;
  const file = await base64ToFile(base64, mime, name || "image");
  return { file, originalUrl: url };
}

export async function fetchUrlsAsFiles(
  urls: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ results: UrlFetchResult[]; errors: UrlFetchError[] }> {
  const results: UrlFetchResult[] = [];
  const errors: UrlFetchError[] = [];
  const concurrency = 5;
  let completed = 0;
  const total = urls.length;

  const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
    while (true) {
      const idx = completed;
      if (idx >= total) break;
      completed++;
      const url = urls[idx];
      try {
        const result = await fetchUrlAsFile(url);
        results.push(result);
      } catch (e: any) {
        errors.push({ url, error: e?.message || "Unknown error" });
      }
      onProgress?.(completed, total);
    }
  });

  await Promise.all(workers);
  return { results, errors };
}
