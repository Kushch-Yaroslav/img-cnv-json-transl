import express from "express";
import { uploadJson } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { runTranslateJson } from "../services/translate.service.js";

export const translateRouter = express.Router();

// router
translateRouter.post("/json", uploadJson.single("file"), asyncHandler(async (req, res) => {
    console.log("[/translate/json] body:", req.body);
    if (!req.file) return res.status(400).send("no file");

    let { src = "", tgt = "", size = "3.3B", batch, mode, max_len } = req.body;


    if (!tgt) return res.status(400).send("tgt required");

     if (!src) {
           const head = req.file.buffer.toString("utf8", 0, Math.min(20000, req.file.buffer.length));
           if (/\p{Script=Cyrillic}/u.test(head)) src = "ru";
         }


             src = String(src).trim().toLowerCase();
     tgt = String(tgt).trim().toLowerCase();
     size = "3.3B";

    const outBuf = await runTranslateJson(req.file.buffer, {
        src, tgt, size, batch, mode, max_len
    });

    const base = (req.file.originalname || "translated").replace(/\.[^.]+$/, "");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${base}_${tgt}.json"`);
    res.send(outBuf);
}));

