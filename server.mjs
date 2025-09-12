import express from "express";
import multer from "multer";
import sharp from "sharp";
import archiver from "archiver";
import path from "node:path";
import { Readable } from "node:stream";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static("public"));

app.post("/convert", upload.array("files"), async (req, res) => {
    try {
        const {
            lossless,
            quality,
            maxWidth,
            maxHeight,
            stripMetadata,
            targetKb,
            minSize,
            smartSubsample
        } = req.body;

        const isLossless = String(lossless) === "true";
        const q = Number(quality) || 90;
        const maxW = maxWidth ? Number(maxWidth) : undefined;
        const maxH = maxHeight ? Number(maxHeight) : undefined;
        const strip = String(stripMetadata) !== "false";
        const goalKb = targetKb ? Number(targetKb) : undefined;
        const useMinSize = String(minSize) !== "false";
        const useSmartSubsample = String(smartSubsample) !== "false";

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", 'attachment; filename="converted_webp.zip"');

        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.on("error", err => { throw err; });
        archive.pipe(res);

        for (const f of req.files ?? []) {
            const base = path.parse(f.originalname).name;
            const img0 = sharp(f.buffer, { failOn: "none" });

            let img = img0.clone();
            if (maxW || maxH) {
                img = img.resize({
                    width: maxW || null,
                    height: maxH || null,
                    fit: "inside",
                    withoutEnlargement: true
                });
            }
            if (strip) {
                img = img.withMetadata({ exif: undefined, icc: undefined, orientation: undefined });
            } else {
                img = img.withMetadata();
            }

            const lossyOptions = {
                quality: Math.min(Math.max(q, 1), 100),
                alphaQuality: 100,
                nearLossless: false,
                effort: 6,
                ...(useMinSize ? { minSize: true } : {}),
                ...(useSmartSubsample ? { smartSubsample: true } : {})
            };

            let outBuf;

            if (!isLossless && goalKb) {
                const targetBytes = goalKb * 1024;

                async function toBuf(quality) {
                    return await img.clone().webp({ ...lossyOptions, quality }).toBuffer();
                }

                let lo = 30, hi = Math.min(q, 92);
                outBuf = await toBuf(hi);
                if (outBuf.length > targetBytes) {
                    let best = { q: hi, buf: outBuf };
                    while (lo <= hi) {
                        const mid = Math.floor((lo + hi) / 2);
                        const buf = await toBuf(mid);
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
                if (isLossless) {
                    outBuf = await img.webp({ lossless: true, quality: 100, effort: 6 }).toBuffer();
                } else {
                    outBuf = await img.webp(lossyOptions).toBuffer();
                }
            }

            archive.append(Readable.from(outBuf), { name: `${base}.webp` });
        }

        await archive.finalize();
    } catch (e) {
        console.error(e);
        res.status(500).send("Server error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Open http://localhost:${PORT}`);
});
