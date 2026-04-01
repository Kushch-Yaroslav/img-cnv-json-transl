import { app } from "./app.js";
import { PORT } from "./config/env.js";
import { REMBG_BIN, REAL_ESRGAN_BIN, WAIFU2X_BIN } from "./config/env.js";
import sharp from 'sharp';

sharp.concurrency(14);
console.log({ REMBG_BIN, REAL_ESRGAN_BIN, WAIFU2X_BIN });
app.listen(PORT, () => {
    console.log(`Open http://localhost:${PORT}`);
});
