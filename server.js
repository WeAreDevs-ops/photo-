const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.fields([
  { name: 'inPhoto', maxCount: 1 },
  { name: 'outPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const inPhotoPath = req.files['inPhoto'][0].path;
    const outPhotoPath = req.files['outPhoto'][0].path;

    const inImage = await sharp(inPhotoPath).resize(500, 500).composite([{
      input: Buffer.from(
        `<svg width="500" height="500">
          <text x="20" y="50" font-size="40" fill="white">IN</text>
        </svg>`
      ),
      top: 0,
      left: 0
    }]).png().toBuffer();

    const outImage = await sharp(outPhotoPath).resize(500, 500).composite([{
      input: Buffer.from(
        `<svg width="500" height="500">
          <text x="20" y="50" font-size="40" fill="white">OUT</text>
        </svg>`
      ),
      top: 0,
      left: 0
    }]).png().toBuffer();

    const collage = await sharp({
      create: {
        width: 1000,
        height: 500,
        channels: 3,
        background: '#000'
      }
    })
    .composite([
      { input: inImage, left: 0, top: 0 },
      { input: outImage, left: 500, top: 0 }
    ])
    .png()
    .toBuffer();

    const outputPath = path.join(__dirname, 'output', `collage-${Date.now()}.png`);
    fs.writeFileSync(outputPath, collage);
    res.sendFile(outputPath);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating collage.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
