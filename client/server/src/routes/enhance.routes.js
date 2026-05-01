import express from "express";
import sharp from "sharp";
import { Readable } from "node:stream";
import { uploadAny } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { zipStreamResponse } from "../utils/zip.js";
import { safeBaseName } from "../utils/imageUtils.js";
import { aiUpscaleRealEsrgan, aiUpscaleWaifu2x, nonAiUpscale } from "../services/ai-upscale.service.js";
import { ZIP_NAME } from "../config/env.js";

export const enhanceRouter = express.Router();

// Предпросмотр одной картинки
enhanceRouter.post("/preview", uploadAny.single("file"), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).send("no file");
    const { method, targetSize, aiModel, waifuNoise } = req.body;
    const target = Number(targetSize) || 1000;

    let out;
    if (method === "realesrgan") {
        const scale = target <= 512 ? 2 : target <= 1024 ? 3 : 4;
        out = await aiUpscaleRealEsrgan(req.file.buffer, { scale, model: aiModel || "realesrgan-x4plus" });
        out = await sharp(out).resize({ width: target, height: target, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" }).sharpen(0.6).png().toBuffer();
    } else if (method === "waifu2x") {
        const scale = target <= 512 ? 2 : target <= 1024 ? 2 : 4;
        const noise = waifuNoise ? Number(waifuNoise) : 0;
        out = await aiUpscaleWaifu2x(req.file.buffer, { scale, noise, modelDir: "models-cunet" });
        out = await sharp(out).resize({ width: target, height: target, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" }).sharpen(0.6).png().toBuffer();
    } else {
        out = await nonAiUpscale(req.file.buffer, { targetW: target, targetH: target });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(out);
}));

// Пакетная обработка → ZIP
enhanceRouter.post("/", uploadAny.array("files"), asyncHandler(async (req, res) => {
    const { method, targetSize, aiModel, waifuNoise, finalQuality } = req.body;
    const target = Number(targetSize) || 1000;
    const q = Math.min(Math.max(Number(finalQuality) || 85, 1), 100);

    const zip = zipStreamResponse(res, ZIP_NAME.enhance);

    for (const f of req.files ?? []) {
        const base = safeBaseName(f.originalname);
        let out;

        if (method === "realesrgan") {
            const scale = target <= 512 ? 2 : target <= 1024 ? 3 : 4;
            out = await aiUpscaleRealEsrgan(f.buffer, { scale, model: aiModel || "realesrgan-x4plus" });
        } else if (method === "waifu2x") {
            const scale = target <= 512 ? 2 : target <= 1024 ? 2 : 4;
            const noise = waifuNoise ? Number(waifuNoise) : 0;
            out = await aiUpscaleWaifu2x(f.buffer, { scale, noise, modelDir: "models-cunet" });
        } else {
            out = await nonAiUpscale(f.buffer, { targetW: target, targetH: target });
        }

        const finalBuf = await sharp(out)
            .resize({ width: target, height: target, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
            .blur(0.3)
            .sharpen(0.4)
            .withMetadata({ exif: undefined, icc: undefined, orientation: undefined })
            .webp({ quality: q, alphaQuality: 100, effort: 6, minSize: true, smartSubsample: true })
            .toBuffer();

        zip.append(`${base}_enh.webp`, Readable.from(finalBuf));
    }

    await zip.finalize();
}));
