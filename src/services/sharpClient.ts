import { type ImageItem } from "@/states/home";
import { type CompressOption, type ProcessOutput } from "@/engines/ImageBase";

function computeOutputDimension(info: { width: number; height: number }, option: CompressOption) {
    const { method, width, height, short, long, cropWidthRatio, cropHeightRatio, cropWidthSize, cropHeightSize } = option.resize;
    const origin = { x: 0, y: 0, width: info.width, height: info.height };
    if (method === "fitWidth" && width) {
        const rate = width / info.width;
        return { x: 0, y: 0, width: Math.ceil(width), height: Math.ceil(rate * info.height) };
    }
    if (method === "fitHeight" && height) {
        const rate = height / info.height;
        return { x: 0, y: 0, width: Math.ceil(rate * info.width), height: Math.ceil(height) };
    }
    if (method === "setShort" && short) {
        if (info.width <= info.height) {
            const rate = short / info.width;
            return { x: 0, y: 0, width: Math.ceil(short), height: Math.ceil(rate * info.height) };
        }
        const rate = short / info.height;
        return { x: 0, y: 0, width: Math.ceil(rate * info.width), height: Math.ceil(short) };
    }
    if (method === "setLong" && long) {
        if (info.width >= info.height) {
            const rate = long / info.width;
            return { x: 0, y: 0, width: Math.ceil(long), height: Math.ceil(rate * info.height) };
        }
        const rate = long / info.height;
        return { x: 0, y: 0, width: Math.ceil(rate * info.width), height: Math.ceil(long) };
    }
    if (method === "setCropRatio" && cropWidthRatio && cropHeightRatio) {
        let x = 0, y = 0, w = 0, h = 0;
        if (cropWidthRatio / cropHeightRatio >= info.width / info.height) {
            x = 0;
            w = info.width;
            h = (info.width * cropHeightRatio) / cropWidthRatio;
            y = (info.height - h) / 2;
        } else {
            y = 0;
            h = info.height;
            w = (info.height * cropWidthRatio) / cropHeightRatio;
            x = (info.width - w) / 2;
        }
        return { x: Math.ceil(x), y: Math.ceil(y), width: Math.ceil(w), height: Math.ceil(h) };
    }
    if (method === "setCropSize" && cropWidthSize && cropHeightSize) {
        let w = cropWidthSize, h = cropHeightSize;
        if (cropWidthSize >= info.width) w = info.width;
        if (cropHeightSize >= info.height) h = info.height;
        const x = (info.width - w) / 2;
        const y = (info.height - h) / 2;
        return { x: Math.ceil(x), y: Math.ceil(y), width: Math.ceil(w), height: Math.ceil(h) };
    }
    return origin;
}

export async function sharpCompress(item: ImageItem, option: CompressOption): Promise<ProcessOutput> {
    const bmp = await createImageBitmap(item.blob);
    const info = { width: bmp.width, height: bmp.height };
    bmp.close();
    const target = option.format.target || item.blob.type;
    const dimension = computeOutputDimension(info, option);
    const contentBase64 = await blobToBase64(item.blob);
    const res = await fetch("/api/sharp-compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentBase64, mimeTarget: target, quality: option.jpeg.quality, width: dimension.width, height: dimension.height, cropX: dimension.x, cropY: dimension.y }),
    });
    if (!res.ok) {
        throw new Error(`sharp compress failed: ${res.status}`);
    }
    const json = await res.json();
    const outputBlob = base64ToBlob(json.base64, json.mime);
    return { width: dimension.width, height: dimension.height, blob: outputBlob, src: URL.createObjectURL(outputBlob) };
}

export async function blobToBase64(blob: Blob): Promise<string> {
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + step)));
    }
    return btoa(binary);
}

function base64ToBlob(base64: string, mime: string) {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: mime });
}

