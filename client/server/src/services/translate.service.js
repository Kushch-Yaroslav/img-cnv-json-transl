import path from "node:path";
import fs from "node:fs/promises";
import {spawn} from "node:child_process";
import {withTmp} from "../utils/tmp.js";
import {TRANSLATOR_SCRIPT, PYTHON_BIN} from "../config/env.js";

/**
 * Запускает Python-скрипт для перевода JSON через NLLB.
 *
 * @param {Buffer} fileBuffer — исходный JSON
 * @param {{
 *   src?: string,
 *   tgt: string,
 *   size?: string,
 *   batch?: number|string,
 *   mode?: string,
 *   max_len?: number|string
 * }} opts
 * @returns {Promise<Buffer>} — переведённый JSON
 */
export async function runTranslateJson(
    fileBuffer, { src = "", tgt, size = "3.3B", batch, mode, max_len } = {}
) {
    if (!tgt) throw new Error("tgt required");

    if (typeof size === "string") {
        size = size.replace(/,/g, " ").split(/\s+/)[0].trim();
          size = "3.3B";
    }

    return withTmp(async (dir) => {
        const inPath = path.join(dir, "in.json");
        const outPath = path.join(dir, "out.json");

        await fs.writeFile(inPath, fileBuffer);

        const args = [
            TRANSLATOR_SCRIPT,
            "--in",
            inPath,
            "--out",
            outPath,
            ...(src ? ["--src", String(src)] : []),
            "--tgt",
            String(tgt),
            "--size",
            String(size),
            ...(batch ? ["--batch", String(batch)] : []),
            ...(max_len ? ["--max-len", String(max_len)] : []),
            // не передаём `mode`, чтобы не появлялось [warn] unknown args ignored
        ];

        await new Promise((resolve, reject) => {
            // ✅ Чистое окружение
            const env = {
                ...process.env,
                PYTHONUNBUFFERED: "1",
                NLLB_33B_DIR: process.env.NLLB_33B_DIR || "/media/yaroslav/nvme/nllb-3.3B",
            };

            // очищаем мешающие переменные от HuggingFace Hub
            delete env.HF_HUB_HEADERS;
            delete env.HUGGINGFACE_HEADERS;
            delete env.HUGGINGFACEHUB_HEADERS;

            const child = spawn(PYTHON_BIN, args, {
                cwd: path.dirname(TRANSLATOR_SCRIPT),
                env,
            });

            // дреним stdout (иначе может зависнуть процесс)
            child.stdout.on("data", () => {
            });
            const errBufs = [];
            let errBytes = 0;
            const ERR_CAP = 512 * 1024;

            child.stderr.on("data", (d) => {
                if (errBytes < ERR_CAP) {
                    errBufs.push(d);
                    errBytes += d.length;
                }
            });

            child.on("error", reject);
            child.on("close", (code) => {
                if (code === 0) return resolve();
                const msg =
                    Buffer.concat(errBufs).toString() || `translator exit ${code}`;
                reject(new Error(msg));
            });
        });

        return fs.readFile(outPath);
    });
}
