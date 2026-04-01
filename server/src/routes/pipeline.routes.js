import express from "express";
import sharp from "sharp";
import { Readable } from "node:stream";
import { uploadAny } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { zipStreamResponse } from "../utils/zip.js";
import { safeBaseName } from "../utils/imageUtils.js";
import { rembgRemoveBg } from "../services/rembg.service.js";
import { REMBG_SESSION, ZIP_NAME } from "../config/env.js";

export const pipelineRouter = express.Router();

// === HARD PIPELINE: resize(1080) -> rembg -> webp(85, minSize, smartSubsample) ===
pipelineRouter.post("/hard", uploadAny.array("files"), asyncHandler(async (req, res) => {
    const zip = zipStreamResponse(res, ZIP_NAME.pipeline);

    const TARGET_W = 1080;
    const TARGET_H = 1080;
    const WEBP_Q   = 85;

    for (const f of req.files ?? []) {
        const base = safeBaseName(f.originalname);

        // 1) resize
        let imgResized = await sharp(f.buffer, { failOn: "none" })
            .resize({ width: TARGET_W, height: TARGET_H, fit: "inside", withoutEnlargement: true })
            .withMetadata({ exif: undefined, icc: undefined, orientation: undefined })
            .toBuffer();

        // 2) remove bg
        const cut = await rembgRemoveBg(imgResized, {
            model: undefined,
            session: REMBG_SESSION || undefined
        });

        // 3) webp
        const buf = await sharp(cut)
            .webp({ quality: WEBP_Q, alphaQuality: 100, effort: 6, minSize: true, smartSubsample: true })
            .toBuffer();

        zip.append(`${base}_1080.webp`, Readable.from(buf));
    }

    await zip.finalize();
}));
