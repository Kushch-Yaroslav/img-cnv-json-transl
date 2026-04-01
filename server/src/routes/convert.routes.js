import express from "express";
import sharp from "sharp";
import { Readable } from "node:stream";
import { uploadAny } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { zipStreamResponse } from "../utils/zip.js";
import { safeBaseName, pickOutputFormat, encodeToFormat } from "../utils/imageUtils.js";
import { ZIP_NAME } from "../config/env.js";

export const convertRouter = express.Router();

// парсер массива размеров из body.resizeVariants (JSON-строка)
function parseVariants(body) {
    const raw = body.resizeVariants;
    if (!raw) return [];
    try {
        const arr = JSON.parse(raw);
        // ожидаем [{w:number,h?:number}] или [number,...] (как ширины)
        return (Array.isArray(arr) ? arr : [])
            .map(v => (typeof v === "number" ? { w: v } : v))
            .filter(v => v && (Number(v.w) > 0 || Number(v.h) > 0))
            .map(v => ({ w: v.w ? Number(v.w) : undefined, h: v.h ? Number(v.h) : undefined }));
    } catch {
        return [];
    }
}

convertRouter.post(
    "/",
    uploadAny.array("files"),
    asyncHandler(async (req, res) => {
        const {
            outputFormat,
            lossless,
            quality,
            maxWidth,
            maxHeight,
            stripMetadata,
            targetKb,
            minSize,
            smartSubsample,
            inFolders,          // c фронта
        } = req.body;

        const fmtFromClient = outputFormat || "same";
        const isLossless = String(lossless) === "true";
        const q = Number(quality) || 90;
        const singleW = maxWidth ? Number(maxWidth) : undefined;
        const singleH = maxHeight ? Number(maxHeight) : undefined;
        const strip = String(stripMetadata) !== "false";
        const goalKb = targetKb ? Number(targetKb) : undefined;
        const useMinSize = String(minSize) !== "false";
        const useSmartSubsample = String(smartSubsample) !== "false";
        const groupInFolders = String(inFolders) === "true";

        const variantsFromBody = parseVariants(req.body);
        const useSingleResize = (singleW || singleH) && !variantsFromBody.length;

        const zip = zipStreamResponse(res, ZIP_NAME.convert);
        const files = req.files ?? [];

        // --- обработка одного файла ---
        async function processFile(f, index) {
            const base = safeBaseName(f.originalname);
            const fmt = pickOutputFormat(fmtFromClient, f.originalname);

            const baseImg = sharp(f.buffer, { failOn: "none" }).withMetadata(
                strip ? { exif: undefined, icc: undefined, orientation: undefined } : undefined
            );

            const variants = variantsFromBody.length
                ? variantsFromBody
                : useSingleResize
                    ? [{ w: singleW, h: singleH }]
                    : [{}]; // просто перекодировать без ресайза

            // папки зависят ТОЛЬКО от галочки "Сохранять в папках"
            const useFolders = groupInFolders;

            // если без папок и файлов несколько — добавим индекс в имя
            const uniquePrefix = base;

            const folder = useFolders ? `${base}/` : "";

            for (const v of variants) {
                const w = v.w ? Number(v.w) : undefined;
                const h = v.h ? Number(v.h) : undefined;

                let img =
                    w || h
                        ? baseImg.clone().resize({
                            width: w || null,
                            height: h || null,
                            fit: "inside",
                            withoutEnlargement: true,
                        })
                        : baseImg.clone();

                const once = async (qual) =>
                    encodeToFormat(img.clone(), {
                        format: fmt,
                        lossless: isLossless,
                        quality: qual ?? q,
                        minSize: useMinSize,
                        smartSubsample: useSmartSubsample,
                    });

                let outBuf;
                const isLossyFamily = ["webp", "jpeg", "avif"].includes(fmt);
                if (goalKb && isLossyFamily && !isLossless) {
                    const targetBytes = goalKb * 1024;
                    let lo = 30,
                        hi = Math.min(q, 92);
                    outBuf = await once(hi);
                    if (outBuf.length > targetBytes) {
                        let best = { q: hi, buf: outBuf };
                        while (lo <= hi) {
                            const mid = Math.floor((lo + hi) / 2);
                            const buf = await once(mid);
                            if (buf.length <= targetBytes) {
                                best = { q: mid, buf };
                                hi = mid - 1;
                            } else {
                                lo = mid + 1;
                            }
                        }
                        outBuf = best.buf;
                    }
                } else {
                    outBuf = await once();
                }

                const ext =
                    fmt === "jpeg"
                        ? ".jpg"
                        : fmt === "png"
                            ? ".png"
                            : fmt === "avif"
                                ? ".avif"
                                : ".webp";

                const suffix = w ? `-${w}` : h ? `-h${h}` : "";
                const baseNameForFile = useFolders ? base : uniquePrefix;
                const name = `${folder}${baseNameForFile}${suffix}${ext}`;

                zip.append(name, Readable.from(outBuf));
            }
        }

        // --- параллельный раннер с лимитом по параллелизму ---
        async function runWithLimit(limit) {
            const concurrency = Math.min(limit, files.length);
            let index = 0;

            async function worker() {
                while (true) {
                    const i = index++;
                    if (i >= files.length) break;
                    await processFile(files[i], i);
                }
            }

            const workers = Array.from({ length: concurrency }, () => worker());
            await Promise.all(workers);
        }

        // до 7 файлов одновременно
        await runWithLimit(7);

        await zip.finalize();
    })
);
