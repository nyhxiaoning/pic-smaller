/// <reference types="vitest" />

import type { Plugin } from "vite";
import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/

function sharpMiddleware(): Plugin {
  return {
    name: "sharp-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === "POST" && req.url === "/api/fetch-image") {
          try {
            const chunks: Buffer[] = [];
            req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            await new Promise<void>((resolve) => req.on("end", () => resolve()));
            const body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
            const { url } = body || {};
            if (!url || !/^https?:\/\/.+/.test(url)) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Invalid URL" }));
              return;
            }
            const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
            if (!response.ok) {
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: `Fetch failed: ${response.status}` }));
              return;
            }
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.startsWith("image/")) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "URL does not point to an image" }));
              return;
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const base64 = buffer.toString("base64");
            const urlObj = new URL(url);
            const name = urlObj.pathname.split("/").filter(Boolean).pop() || "image";
            const json = JSON.stringify({ base64, mime: contentType, name });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(json);
          } catch (e: any) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: e?.message || "fetch error" }));
          }
          return;
        }
        if (req.method === "POST" && req.url === "/api/sharp-compress") {
          try {
            const chunks: Buffer[] = [];
            req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            await new Promise<void>((resolve) => req.on("end", () => resolve()));
            const body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
            const { contentBase64, mimeTarget, quality, width, height, cropX = 0, cropY = 0 } = body || {};
            const input = Buffer.from(contentBase64, "base64");
            const sharp = (await import("sharp")).default;
            let instance = sharp(input, { unlimited: true });
            if (width && height) {
              instance = instance.extract({ left: Math.max(0, cropX || 0), top: Math.max(0, cropY || 0), width: Math.max(1, width), height: Math.max(1, height) });
              instance = instance.resize({ width, height, fit: "fill" });
            }
            const target = String(mimeTarget || "").toLowerCase();
            let output: Buffer;
            let outMime = "image/jpeg";
            if (target.includes("png")) {
              output = await instance.png({ quality: Math.round((quality ?? 0.8) * 100), compressionLevel: 9 }).toBuffer();
              outMime = "image/png";
            } else if (target.includes("webp")) {
              output = await instance.webp({ quality: Math.round((quality ?? 0.8) * 100) }).toBuffer();
              outMime = "image/webp";
            } else if (target.includes("avif")) {
              output = await instance.avif({ quality: Math.round((quality ?? 0.5) * 100) }).toBuffer();
              outMime = "image/avif";
            } else {
              output = await instance.jpeg({ quality: Math.round((quality ?? 0.8) * 100) }).toBuffer();
              outMime = "image/jpeg";
            }
            const base64 = output.toString("base64");
            const json = JSON.stringify({ base64, mime: outMime });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(json);
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: (e as any)?.message || "sharp error" }));
          }
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      // Same middleware for preview
      server.middlewares.use(async (req, res, next) => {
        if (req.method === "POST" && req.url === "/api/fetch-image") {
          try {
            const chunks: Buffer[] = [];
            req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            await new Promise<void>((resolve) => req.on("end", () => resolve()));
            const body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
            const { url } = body || {};
            if (!url || !/^https?:\/\/.+/.test(url)) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Invalid URL" }));
              return;
            }
            const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
            if (!response.ok) {
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: `Fetch failed: ${response.status}` }));
              return;
            }
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.startsWith("image/")) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "URL does not point to an image" }));
              return;
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const base64 = buffer.toString("base64");
            const urlObj = new URL(url);
            const name = urlObj.pathname.split("/").filter(Boolean).pop() || "image";
            const json = JSON.stringify({ base64, mime: contentType, name });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(json);
          } catch (e: any) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: e?.message || "fetch error" }));
          }
          return;
        }
        if (req.method === "POST" && req.url === "/api/sharp-compress") {
          try {
            const chunks: Buffer[] = [];
            req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            await new Promise<void>((resolve) => req.on("end", () => resolve()));
            const body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
            const { contentBase64, mimeTarget, quality, width, height, cropX = 0, cropY = 0 } = body || {};
            const input = Buffer.from(contentBase64, "base64");
            const sharp = (await import("sharp")).default;
            let instance = sharp(input, { unlimited: true });
            if (width && height) {
              instance = instance.extract({ left: Math.max(0, cropX || 0), top: Math.max(0, cropY || 0), width: Math.max(1, width), height: Math.max(1, height) });
              instance = instance.resize({ width, height, fit: "fill" });
            }
            const target = String(mimeTarget || "").toLowerCase();
            let output: Buffer;
            let outMime = "image/jpeg";
            if (target.includes("png")) {
              output = await instance.png({ quality: Math.round((quality ?? 0.8) * 100), compressionLevel: 9 }).toBuffer();
              outMime = "image/png";
            } else if (target.includes("webp")) {
              output = await instance.webp({ quality: Math.round((quality ?? 0.8) * 100) }).toBuffer();
              outMime = "image/webp";
            } else if (target.includes("avif")) {
              output = await instance.avif({ quality: Math.round((quality ?? 0.5) * 100) }).toBuffer();
              outMime = "image/avif";
            } else {
              output = await instance.jpeg({ quality: Math.round((quality ?? 0.8) * 100) }).toBuffer();
              outMime = "image/jpeg";
            }
            const base64 = output.toString("base64");
            const json = JSON.stringify({ base64, mime: outMime });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(json);
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: (e as any)?.message || "sharp error" }));
          }
          return;
        }
        next();
      });
    },
  };
}

// Append plugin
export default defineConfig({
  plugins: [react(), sharpMiddleware()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: { port: 3000, host: "0.0.0.0" },
  preview: { port: 3001, host: "0.0.0.0" },
  test: { include: ["tests/**/*.{test,spec}.?(c|m)[jt]s?(x)"] },
});
