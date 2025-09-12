import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {globby} from "globby";
import pLimit from "p-limit";
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
    .usage("Usage: $0 --input ./src_images --output ./out_webp [options]")
    .options({
        input: {type: "string", demandOption: true, describe: "Папка с исходными картинками"},
        output: {type: "string", demandOption: true, describe: "Папка для .webp"},
        recursive: {type: "boolean", default: true, describe: "Искать файлы рекурсивно"},
        quality: {type: "number", default: 90, describe: "Качество WebP (0-100), для визуально без потерь"},
        lossless: {type: "boolean", default: false, describe: "Без потерь (true lossless). Игнорирует --quality"},
        overwrite: {type: "boolean", default: false, describe: "Перезаписывать существующие .webp"},
        "strip-metadata": {type: "boolean", default: true, describe: "Удалять EXIF/метаданные"},
        "max-width": {type: "number", describe: "Максимальная ширина (опционально)"},
        "max-height": {type: "number", describe: "Максимальная высота (опционально)"},
        "target-kb": { type: "number", describe: "Желаемый размер файла в килобайтах (подбор качества)" },
        "min-size": { type: "boolean", default: true, describe: "Включить оптимизацию minSize у WebP" },
        "smart-subsample": { type: "boolean", default: true, describe: "Умное субсэмплирование" },
        concurrency: {type: "number", default: 8, describe: "Сколько файлов обрабатывать параллельно"}
    })
    .example([
        ['$0 --input ./photos --output ./webp --lossless', 'Конвертация без потерь'],
        ['$0 --input ./photos --output ./webp --quality 85', 'Визуально без потерь, размер меньше'],
        ['$0 --input ./photos --output ./webp --max-width 2560 --quality 90', 'Ограничить ширину и сжать'],
    ])
    .help()
    .argv;

const exts = ["jpg", "jpeg", "png", "gif", "tiff", "bmp", "webp", "avif"];

async function ensureDir(dir) {
    await fs.mkdir(dir, {recursive: true});
}

function destPathOf(srcFile, inDir, outDir) {
    const rel = path.relative(inDir, srcFile);
    const relNoExt = rel.replace(/\.[^.]+$/i, "");
    return path.join(outDir, relNoExt + ".webp");
}

async function fileExists(fp) {
    try {
        await fs.access(fp);
        return true;
    } catch {
        return false;
    }
}

async function convertOne(file, inDir, outDir, opts) {
    const outPath = destPathOf(file, inDir, outDir);

    if (!opts.overwrite && await fileExists(outPath)) {
        return {file, outPath, skipped: true, reason: "exists"};
    }

    await ensureDir(path.dirname(outPath));

    let img = sharp(file, {failOn: "none"});

    // Опциональное ограничение размеров (без upscaling)
    if (opts.maxWidth || opts.maxHeight) {
        img = img.resize({
            width: opts.maxWidth || null,
            height: opts.maxHeight || null,
            fit: "inside",
            withoutEnlargement: true
        });
    }

    // Метаданные
    if (opts.stripMetadata) {
        img = img.withMetadata({exif: undefined, icc: undefined, orientation: undefined});
    } else {
        img = img.withMetadata(); // оставить как есть
    }

    async function toBufferAtQuality(q) {
        const buf = await img
            .clone()
            .webp({ ...webpOptions, quality: q })
            .toBuffer();
        return buf;
    }

    if (opts.targetKb && !opts.lossless) {
        // двоичный поиск качества в диапазоне 40..90
        let lo = 40, hi = 90, best = { q: hi, buf: await toBufferAtQuality(hi) };
        const targetBytes = opts.targetKb * 1024;

        // если уже меньше — оставим как есть
        if (best.buf.length > targetBytes) {
            while (lo <= hi) {
                const mid = Math.floor((lo + hi) / 2);
                const buf = await toBufferAtQuality(mid);

                if (buf.length <= targetBytes) {
                    best = { q: mid, buf };
                    hi = mid - 1; // пробуем ещё ниже качество
                } else {
                    lo = mid + 1;
                }
            }
        }
        await fs.writeFile(outPath, best.buf);
        return { file, outPath, skipped: false };
    }


    // Настройка WebP
    const webpOptions = {
        quality: Math.min(Math.max(opts.quality ?? 90, 1), 100),
        alphaQuality: 100,
        nearLossless: false,        // важно: выключаем, иначе файл крупнее
        smartSubsample: true,       // лучше детализация при низком качестве
        effort: 6,                  // максимум сжатия
        minSize: true               // стремиться к минимальному размеру
    };


    await img.webp(webpOptions).toFile(outPath);

    return {file, outPath, skipped: false};
}

async function main() {
    const inDir = path.resolve(argv.input);
    const outDir = path.resolve(argv.output);

    const patterns = exts.map(e => argv.recursive
        ? path.join(inDir, `**/*.${e}`)
        : path.join(inDir, `*.${e}`)
    );

    const files = await globby(patterns, {onlyFiles: true, caseSensitiveMatch: false});
    if (files.length === 0) {
        console.log("Файлы не найдены. Проверь путь и расширения.");
        return;
    }

    console.log(`Найдено файлов: ${files.length}`);
    await ensureDir(outDir);

    const limit = pLimit(argv.concurrency);
    const results = await Promise.allSettled(files.map(f => limit(() => convertOne(f, inDir, outDir, {
        lossless: argv.lossless,
        quality: argv.quality,
        stripMetadata: argv["strip-metadata"],
        maxWidth: argv["max-width"],
        maxHeight: argv["max-height"],
        overwrite: argv.overwrite
    }))));

    let ok = 0, skipped = 0, failed = 0;
    for (const r of results) {
        if (r.status === "fulfilled") {
            if (r.value.skipped) skipped++;
            else ok++;
        } else failed++;
    }

    console.log(`Готово: конвертировано ${ok}, пропущено ${skipped}, ошибок ${failed}. Выходная папка: ${outDir}`);
}

main().catch(e => {
    console.error("Ошибка:", e);
    process.exit(1);
});
