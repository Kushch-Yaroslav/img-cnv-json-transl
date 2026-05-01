import path from "node:path";
import sharp from "sharp";

export function safeBaseName(originalName) {
    const base = path.parse(originalName).name.normalize("NFC");
    return base.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").trim() || "file";
}

export function pickOutputFormat(requested, sourceName) {
    if (requested && requested !== "same") return requested; // webp|jpeg|png|avif
    const ext = path.parse(sourceName).ext.toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") return "jpeg";
    if (ext === ".png") return "png";
    if (ext === ".webp") return "webp";
    if (ext === ".avif") return "avif";
    return "webp";
}

// если bgColor задан — «сплющим» альфу на этот цвет; иначе сохраняем прозрачность
export function flattenIfNeeded(buf, { bgColor } = {}) {
    if (!bgColor) return sharp(buf).toBuffer();
    return sharp(buf).flatten({ background: bgColor }).toBuffer();
}

export async function encodeToFormat(img, { format, lossless, quality, minSize, smartSubsample }) {
    const q = Math.min(Math.max(quality ?? 85, 1), 100);

    if (format === "webp") {
        if (lossless) return img.webp({ lossless: true, quality: 100, effort: 6 }).toBuffer();
        return img.webp({
            quality: q,
            alphaQuality: 100,
            nearLossless: false,
            effort: 6,
            ...(minSize ? { minSize: true } : {}),
            ...(smartSubsample ? { smartSubsample: true } : {})
        }).toBuffer();
    }
    if (format === "jpeg") {
        return img.jpeg({
            quality: q,
            mozjpeg: true,
            chromaSubsampling: "4:2:0",
            trellisQuantisation: true,
            overshootDeringing: true
        }).toBuffer();
    }
    if (format === "png") {
        return img.png({ compressionLevel: 9 }).toBuffer();
    }
    if (format === "avif") {
        return img.avif({ quality: q, effort: 6, chromaSubsampling: "4:2:0" }).toBuffer();
    }
    return img.webp({ quality: q, effort: 6 }).toBuffer();
}
