import type { VercelRequest, VercelResponse } from "@vercel/node";
import sharp from "sharp";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body || {};
    const {
      contentBase64,
      mimeTarget,
      quality,
      width,
      height,
      cropX = 0,
      cropY = 0,
    } = body;

    const input = Buffer.from(contentBase64, "base64");
    let instance = sharp(input, { unlimited: true });

    if (width && height) {
      instance = instance.extract({
        left: Math.max(0, cropX || 0),
        top: Math.max(0, cropY || 0),
        width: Math.max(1, width),
        height: Math.max(1, height),
      });
      instance = instance.resize({ width, height, fit: "fill" });
    }

    const target = String(mimeTarget || "").toLowerCase();
    let output: Buffer;
    let outMime = "image/jpeg";

    if (target.includes("png")) {
      output = await instance
        .png({
          quality: Math.round((quality ?? 0.8) * 100),
          compressionLevel: 9,
        })
        .toBuffer();
      outMime = "image/png";
    } else if (target.includes("webp")) {
      output = await instance
        .webp({ quality: Math.round((quality ?? 0.8) * 100) })
        .toBuffer();
      outMime = "image/webp";
    } else if (target.includes("avif")) {
      output = await instance
        .avif({ quality: Math.round((quality ?? 0.5) * 100) })
        .toBuffer();
      outMime = "image/avif";
    } else {
      output = await instance
        .jpeg({ quality: Math.round((quality ?? 0.8) * 100) })
        .toBuffer();
      outMime = "image/jpeg";
    }

    const base64 = output.toString("base64");
    res.status(200).json({ base64: base64, mime: outMime });
  } catch (e) {
    res
      .status(500)
      .json({ error: (e as any)?.message || "sharp error" });
  }
}
