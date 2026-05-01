// server/src/config/env.js
import path from "node:path";
import dotenv from "dotenv";
import { resolveFromRoot } from "./paths.js";

// Мы запускаемся из server/, значит .env лежит на уровень выше:
const PROJECT_ROOT = path.resolve(process.cwd(), ".."); // <-- корень проекта
const ENV_PATH = path.join(PROJECT_ROOT, ".env");

// Грузим .env с override и логируем, что нашли
const loaded = dotenv.config({ path: ENV_PATH, override: true });
console.log("[ENV] loaded:", ENV_PATH, "keys:", loaded.parsed ? Object.keys(loaded.parsed) : [], "error:", loaded.error);

// helper: относительные пути делаем абсолютными от корня проекта
const toAbs = (p) => (p && !path.isAbsolute(p) ? path.resolve(PROJECT_ROOT, p) : p);

// ============== ЭКСПОРТЫ ==============
export const PORT = process.env.PORT || 3000;

export const REAL_ESRGAN_BIN = toAbs(process.env.REAL_ESRGAN_BIN) || "";
export const WAIFU2X_BIN     = toAbs(process.env.WAIFU2X_BIN)     || "";

// если переменная пустая — НЕ подсовываем PROJECT_ROOT
function fromEnvPath(name, fallback = "") {
    const raw = process.env[name];
    if (!raw) return fallback;
    return path.isAbsolute(raw) ? raw : path.resolve(PROJECT_ROOT, raw);
}

export const PYTHON_BIN = fromEnvPath("PYTHON_BIN", "");
export const REMBG_SCRIPT = fromEnvPath(
    "REMBG_SCRIPT",
    path.resolve(PROJECT_ROOT, "server/python/rembg_bridge.py")
);
export const REMBG_BIN  = fromEnvPath("REMBG_BIN", "rembg");
export const REMBG_SESSION = process.env.REMBG_SESSION || "";


export const TRANSLATOR_SCRIPT =
    process.env.TRANSLATOR_SCRIPT || path.resolve(PROJECT_ROOT, "python/translate_json.py");

export const FRONT_DIST = process.env.FRONT_DIST || path.resolve(PROJECT_ROOT, "client", "dist");

export const ZIP_NAME = {
    removeBg: "bg_removed.zip",
    convert: "converted_images.zip",
    pipeline: "pipeline_1080_webp.zip",
    enhance: "enhanced.zip"
};
