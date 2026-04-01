import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { spawn } from "node:child_process";
import { withTmp } from "../utils/tmp.js";
import { REAL_ESRGAN_BIN, WAIFU2X_BIN } from "../config/env.js";

export async function aiUpscaleRealEsrgan(inputBuf, { scale = 4, model = "realesrgan-x4plus" } = {}) {
    if (!REAL_ESRGAN_BIN) throw new Error("REAL_ESRGAN_BIN is not set");
    return withTmp(async (dir) => {
        const inPath = path.join(dir, "in.png");
        const outPath = path.join(dir, "out.png");
        await fs.writeFile(inPath, inputBuf);
        const args = ["-i", inPath, "-o", outPath, "-s", String(scale), "-n", model];

        await new Promise((resolve, reject) => {
            const p = spawn(REAL_ESRGAN_BIN, args);
            const err = [];
            p.stderr.on("data", d => err.push(d));
            p.on("error", reject);
            p.on("close", code => code === 0 ? resolve(null)
                : reject(new Error(Buffer.concat(err).toString() || `realesrgan exit ${code}`)));
        });

        return fs.readFile(outPath);
    });
}

export async function aiUpscaleWaifu2x(inputBuf, {
    scale = 4,
    noise = 1,
    modelDir = "models-upconv_7_photo"
} = {}) {
    if (!WAIFU2X_BIN) throw new Error("WAIFU2X_BIN is not set");

    const bin = WAIFU2X_BIN;
    const binDir = path.dirname(bin);
    const modelPath = path.join(binDir, modelDir);

    return withTmp(async (dir) => {
        const inPath = path.join(dir, "in.png");
        const outPath = path.join(dir, "out.png");
        await fs.writeFile(inPath, inputBuf);

        const args = ["-i", inPath, "-o", outPath, "-s", String(scale), "-n", String(noise), "-m", modelPath];
        await new Promise((resolve, reject) => {
            const p = spawn(bin, args, { cwd: binDir });
            const err = [];
            p.stderr.on("data", d => err.push(d));
            p.on("error", reject);
            p.on("close", code => code === 0 ? resolve(null)
                : reject(new Error(Buffer.concat(err).toString() || `waifu2x exit ${code}`)));
        });

        return fs.readFile(outPath);
    });
}

export async function nonAiUpscale(inputBuf, { targetW = 1000, targetH = 1000 } = {}) {
    return sharp(inputBuf, { failOn: "none" })
        .resize({
            width: targetW,
            height: targetH,
            fit: "inside",
            withoutEnlargement: false,
            kernel: "lanczos3"
        })
        .sharpen(1.2)
        .gamma(1.0)
        .withMetadata({ exif: undefined, icc: undefined, orientation: undefined })
        .png({ compressionLevel: 9 })
        .toBuffer();
}
