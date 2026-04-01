import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { FRONT_DIST } from "./config/env.js";
import { removeBgRouter } from "./routes/removeBg.routes.js";
import { convertRouter } from "./routes/convert.routes.js";
import { pipelineRouter } from "./routes/pipeline.routes.js";
import { enhanceRouter } from "./routes/enhance.routes.js";
import { translateRouter } from "./routes/translate.routes.js";

export const app = express();

// роути
app.use("/remove-bg", removeBgRouter);
app.use("/convert", convertRouter);
app.use("/pipeline", pipelineRouter);
app.use("/enhance", enhanceRouter);
app.use("/translate", translateRouter);

// SPA статика (если нужно)
app.use(express.static(FRONT_DIST));
app.get("*", async (_req, res, next) => {
    try {
        const indexPath = path.join(FRONT_DIST, "index.html");
        await fs.access(indexPath);
        res.sendFile(indexPath);
    } catch {
        next(); // если фронта нет — просто пропускаем
    }
});

// централизованный error handler
// (если где-то бросили Error — придёт сюда)
app.use((err, _req, res, _next) => {
    console.error("[ERROR]", err);
    const msg = err?.message || "Server error";
    res.status(500).json({ error: msg });
});
