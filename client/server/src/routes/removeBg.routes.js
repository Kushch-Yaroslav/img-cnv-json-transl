import express from "express";
import sharp from "sharp";
import { uploadAny } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { zipStreamResponse } from "../utils/zip.js";
import { REMBG_SESSION, ZIP_NAME } from "../config/env.js";
import { rembgRemoveBg } from "../services/rembg.service.js";
import { safeBaseName, flattenIfNeeded } from "../utils/imageUtils.js";

export const removeBgRouter = express.Router();

// 1) Предпросмотр (одна картинка -> PNG)
removeBgRouter.post("/preview", uploadAny.single("file"), asyncHandler(async (req, res) => {
    const { bgColor, rembgModel, rembgSession } = req.body;
    if (!req.file) return res.status(400).send("no file");

    const cut = await rembgRemoveBg(req.file.buffer, {
        model: rembgModel || undefined,
        session: rembgSession || undefined
    });

    const result = await flattenIfNeeded(cut, { bgColor });
    res.setHeader("Content-Type", "image/png");
    res.send(result);
}));

// 2) Пакетно -> ZIP
removeBgRouter.post("/", uploadAny.array("files"), asyncHandler(async (req, res) => {
    const { bgColor, outputFormat = "png", rembgModel, rembgSession } = req.body;

    const zip = zipStreamResponse(res, ZIP_NAME.removeBg);

    for (const f of req.files ?? []) {
        const base = safeBaseName(f.originalname);

        const cut = await rembgRemoveBg(f.buffer, {
            model: rembgModel || undefined,
            session: rembgSession || REMBG_SESSION || undefined
        });

        let img = sharp(await flattenIfNeeded(cut, { bgColor }));

        let buf, ext = ".png";
        if (outputFormat === "jpeg") { buf = await img.jpeg({ quality: 90 }).toBuffer(); ext = ".jpg"; }
        else if (outputFormat === "webp") { buf = await img.webp({ quality: 90 }).toBuffer(); ext = ".webp"; }
        else if (outputFormat === "avif") { buf = await img.avif({ quality: 80 }).toBuffer(); ext = ".avif"; }
        else { buf = await img.png({ compressionLevel: 9 }).toBuffer(); ext = ".png"; }

        zip.append(`${base}${ext}`, buf);
    }

    await zip.finalize();
}));
