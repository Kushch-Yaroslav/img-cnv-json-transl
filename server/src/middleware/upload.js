import multer from "multer";

export const uploadAny = multer({
    storage: multer.memoryStorage()
});

export const uploadJson = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 }
});
