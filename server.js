// server.js
const express = require("express");
const fileUpload = require("express-fileupload");
const sharp = require("sharp");
const cors = require("cors");

const app = express();

// Enable CORS for frontend requests
app.use(cors());

// Enable file upload
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    abortOnLimit: true,
  })
);

// Root route
app.get("/", (req, res) => {
  res.send("AVIF → PNG Converter API is running!");
});

// Conversion route
app.post("/convert", async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).send("No image uploaded");
    }

    const file = req.files.image;

    // Convert AVIF to PNG in memory
    const pngBuffer = await sharp(file.data).png().toBuffer();

    res.set("Content-Type", "image/png");
    res.send(pngBuffer);
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).send("Conversion failed");
  }
});

// Start server (only used locally; Vercel handles ports automatically)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
