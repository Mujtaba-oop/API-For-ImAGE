import express from "express";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const app = express();
const port = 3000;

const uploadDir = "./uploads";
const outputDir = "./converted";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post("/convert", upload.single("image"), async (req, res) => {
  const inputPath = req.file.path;
  const outputFilename = req.file.filename.replace(".avif", ".png");
  const outputPath = path.join(outputDir, outputFilename);

  try {
    console.log("🔹 Converting via Sharp...");
    await sharp(inputPath).toFormat("png").toFile(outputPath);
    fs.unlinkSync(inputPath);
    return res.download(outputPath);
  } catch (err) {
    console.warn("⚠️ Sharp failed:", err.message);
    console.log("Falling back to FFmpeg...");

    // fallback using ffmpeg
    try {
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${inputPath}" "${outputPath}"`,
          (error, stdout, stderr) => {
            if (error) return reject(error);
            resolve();
          }
        );
      });

      fs.unlinkSync(inputPath);
      return res.download(outputPath);
    } catch (ffmpegErr) {
      console.error("❌ FFmpeg fallback failed:", ffmpegErr.message);
      return res
        .status(500)
        .send("Conversion failed: " + ffmpegErr.message);
    }
  }
});

app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
