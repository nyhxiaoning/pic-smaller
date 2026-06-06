import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { url } = req.body || {};
    if (!url || !/^https?:\/\/.+/.test(url)) {
      res.status(400).json({ error: "Invalid URL" });
      return;
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      res.status(502).json({ error: `Fetch failed: ${response.status}` });
      return;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      res.status(400).json({ error: "URL does not point to an image" });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString("base64");
    const urlObj = new URL(url);
    const name = urlObj.pathname.split("/").filter(Boolean).pop() || "image";

    res.status(200).json({ base64, mime: contentType, name });
  } catch (e: any) {
    res.status(502).json({ error: e?.message || "fetch error" });
  }
}
