import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// server/src/config -> подняться на корень проекта
export const ROOT = path.resolve(here, "..", "..", "..");

export function resolveFromRoot(...p) {
    return path.resolve(ROOT, ...p);
}
