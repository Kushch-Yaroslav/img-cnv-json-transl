import { spawn } from "node:child_process";
import { REMBG_BIN, REMBG_SCRIPT } from "../config/env.js";

export function rembgRemoveBg(inputBuffer, { model, session } = {}) {
    return new Promise((resolve, reject) => {
        if (!REMBG_BIN || !REMBG_SCRIPT) {
            return reject(new Error("REMBG_BIN or REMBG_SCRIPT is not configured"));
        }

        /** @type {string[]} */
        const args = [];

        // сначала наш скрипт (bridge)
        args.push(REMBG_SCRIPT);

        // дальше уже аргументы для bridge
        if (model) {
            args.push("-m", model);
        }

        // как и раньше: "i - -"
        args.push("i", "-", "-");

        console.log("[rembg] spawn:", REMBG_BIN, args.join(" "));

        const child = spawn(REMBG_BIN, args, {
            stdio: ["pipe", "pipe", "pipe"],
            env: {
                ...process.env,
                ...(session ? { REMBG_SESSION: session } : {}),
            },
        });

        /** @type {Buffer[]} */
        const out = [];
        /** @type {Buffer[]} */
        const err = [];
        /** @type {Error | null} */
        let stdinErr = null;

        child.stdout.on("data", (d) => out.push(d));
        child.stderr.on("data", (d) => {
            err.push(d);
            console.error("[rembg stderr]", d.toString());
        });

        child.stdin.on("error", (e) => {
            stdinErr = e;
        });

        child.on("error", (procErr) => {
            console.error("[rembg error]", procErr);
            reject(procErr);
        });

        child.once("spawn", () => {
            try {
                child.stdin.write(inputBuffer);
                child.stdin.end();
            } catch (e) {
                stdinErr = /** @type {Error} */ (e);
            }
        });

        child.on("close", (code, signal) => {
            if (code === 0 && !stdinErr) {
                return resolve(Buffer.concat(out));
            }

            const stderrText = Buffer.concat(err).toString().trim();
            const why = [
                stdinErr ? `stdin: ${stdinErr.message}` : "",
                code != null ? `code: ${code}` : "",
                signal ? `signal: ${signal}` : "",
                stderrText ? `stderr: ${stderrText}` : "",
            ]
                .filter(Boolean)
                .join(" | ");

            console.error("[rembg close error]", why);
            reject(new Error(why || "rembg failed"));
        });
    });
}
