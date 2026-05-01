import fs from "node:fs/promises";
import os from "node:os";

export async function withTmp(fn, prefix = "tmp-") {
    const dir = await fs.mkdtemp(`${os.tmpdir()}/${prefix}`);
    try {
        return await fn(dir);
    } finally {
        try { await fs.rm(dir, { recursive: true, force: true }); } catch {}
    }
}
