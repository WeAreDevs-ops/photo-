const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Create necessary directories
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync('output')) {
  fs.mkdirSync('output');
}

app.use(express.static('public'));
app.use('/output', express.static('output'));

app.post('/upload', upload.fields([
  { name: 'inPhoto', maxCount: 1 },
  { name: 'outPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const inPhotoPath = req.files['inPhoto'][0].path;
    const outPhotoPath = req.files['outPhoto'][0].path;
    const template = req.body.template || 'forest';
    const templateMode = req.body.templateMode || 'overlay';
    const inTime = req.body.inTime || '9:00 AM';
    const outTime = req.body.outTime || '5:00 PM';

    // Template configurations with nature-friendly themes
    const templates = {
      forest: {
        background: '#2d5016',
        secondaryBg: '#4a7c59',
        textColor: '#ffffff',
        borderColor: '#7fb069',
        accent: '#a3b18a'
      },
      ocean: {
        background: '#0077be',
        secondaryBg: '#264653',
        textColor: '#ffffff',
        borderColor: '#2a9d8f',
        accent: '#e9c46a'
      },
      sunset: {
        background: '#8b5a2b',
        secondaryBg: '#cb997e',
        textColor: '#ffffff',
        borderColor: '#f2cc8f',
        accent: '#f07167'
      },
      meadow: {
        background: '#606c38',
        secondaryBg: '#283618',
        textColor: '#ffffff',
        borderColor: '#dda15e',
        accent: '#bc6c25'
      }
    };

    const config = templates[template] || templates.forest;

    // Create stylized time overlays based on template mode
    const overlayPosition = templateMode === 'overlay' ? 400 : 10; // Top for head positioning
    
    const inOverlaySvg = `
      <svg width="500" height="500">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${config.background};stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:${config.secondaryBg};stop-opacity:0.9" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.6)"/>
          </filter>
        </defs>
        <rect x="10" y="${overlayPosition}" width="480" height="80" rx="20" fill="url(#bgGrad)" filter="url(#shadow)"/>
        <text x="250" y="${overlayPosition + 28}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" 
              fill="${config.accent}" text-anchor="middle">TIME IN</text>
        <text x="250" y="${overlayPosition + 58}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" 
              fill="${config.accent}" text-anchor="middle">${inTime}</text>
      </svg>`;

    const outOverlaySvg = `
      <svg width="500" height="500">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${config.background};stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:${config.secondaryBg};stop-opacity:0.9" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.6)"/>
          </filter>
        </defs>
        <rect x="10" y="${overlayPosition}" width="480" height="80" rx="20" fill="url(#bgGrad)" filter="url(#shadow)"/>
        <text x="250" y="${overlayPosition + 28}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" 
              fill="${config.accent}" text-anchor="middle">TIME OUT</text>
        <text x="250" y="${overlayPosition + 58}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" 
              fill="${config.accent}" text-anchor="middle">${outTime}</text>
      </svg>`;

    const inImage = await sharp(inPhotoPath)
      .rotate() // Auto-rotate based on EXIF data
      .resize(500, 500, { fit: 'cover' })
      .composite([{
        input: Buffer.from(inOverlaySvg),
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();

    const outImage = await sharp(outPhotoPath)
      .rotate() // Auto-rotate based on EXIF data
      .resize(500, 500, { fit: 'cover' })
      .composite([{
        input: Buffer.from(outOverlaySvg),
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();

    // Create collage based on template mode
    let collage;
    
    if (templateMode === 'background') {
      // Background template with text outside photos
      const backgroundSvg = `
        <svg width="1000" height="600">
          <defs>
            <linearGradient id="mainBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${config.background};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${config.secondaryBg};stop-opacity:0.9" />
              <stop offset="100%" style="stop-color:${config.borderColor};stop-opacity:0.8" />
            </linearGradient>
            <filter id="textShadow">
              <feDropShadow dx="3" dy="3" stdDeviation="6" flood-color="rgba(0,0,0,0.8)"/>
            </filter>
            <linearGradient id="textBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${config.background};stop-opacity:0.9" />
              <stop offset="100%" style="stop-color:${config.secondaryBg};stop-opacity:0.9" />
            </linearGradient>
          </defs>
          <rect width="1000" height="600" fill="url(#mainBg)"/>
          
          <!-- TIME IN Background Box -->
          <rect x="50" y="20" width="400" height="70" rx="15" fill="url(#textBg)" opacity="0.9"/>
          <!-- TIME IN Text -->
          <text x="250" y="45" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" 
                fill="white" text-anchor="middle" filter="url(#textShadow)">TIME IN</text>
          <text x="250" y="75" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="bold" 
                fill="${config.accent}" text-anchor="middle" filter="url(#textShadow)">${inTime}</text>
          
          <!-- TIME OUT Background Box -->
          <rect x="550" y="20" width="400" height="70" rx="15" fill="url(#textBg)" opacity="0.9"/>
          <!-- TIME OUT Text -->
          <text x="750" y="45" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" 
                fill="white" text-anchor="middle" filter="url(#textShadow)">TIME OUT</text>
          <text x="750" y="75" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="bold" 
                fill="${config.accent}" text-anchor="middle" filter="url(#textShadow)">${outTime}</text>
          
          <!-- Decorative separator -->
          <rect x="495" y="100" width="10" height="490" fill="${config.accent}" opacity="0.5" rx="5"/>
          
          <!-- Photo frames -->
          <rect x="10" y="100" width="480" height="480" rx="10" fill="none" stroke="${config.accent}" stroke-width="3" opacity="0.7"/>
          <rect x="510" y="100" width="480" height="480" rx="10" fill="none" stroke="${config.accent}" stroke-width="3" opacity="0.7"/>
        </svg>`;
      
      // Process images without text overlay for background mode
      const inImageClean = await sharp(inPhotoPath)
        .rotate()
        .resize(480, 480, { fit: 'cover' })
        .png()
        .toBuffer();

      const outImageClean = await sharp(outPhotoPath)
        .rotate()
        .resize(480, 480, { fit: 'cover' })
        .png()
        .toBuffer();

      collage = await sharp({
        create: {
          width: 1000,
          height: 600,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([
        { input: Buffer.from(backgroundSvg), top: 0, left: 0 },
        { input: inImageClean, left: 10, top: 100 },
        { input: outImageClean, left: 510, top: 100 }
      ])
      .png()
      .toBuffer();
    } else {
      // Original overlay mode
      const backgroundSvg = `
        <svg width="1000" height="500">
          <defs>
            <linearGradient id="mainBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${config.background};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${config.secondaryBg};stop-opacity:0.9" />
              <stop offset="100%" style="stop-color:${config.borderColor};stop-opacity:0.8" />
            </linearGradient>
          </defs>
          <rect width="1000" height="500" fill="url(#mainBg)"/>
          <rect x="495" y="0" width="10" height="500" fill="${config.accent}" opacity="0.3"/>
        </svg>`;

      collage = await sharp({
        create: {
          width: 1000,
          height: 500,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([
        { input: Buffer.from(backgroundSvg), top: 0, left: 0 },
        { input: inImage, left: 0, top: 0 },
        { input: outImage, left: 500, top: 0 }
      ])
      .png()
      .toBuffer();
    }

    const filename = `collage-${Date.now()}.png`;
    const outputPath = path.join(__dirname, 'output', filename);
    fs.writeFileSync(outputPath, collage);
    
    // Clean up uploaded files
    fs.unlinkSync(inPhotoPath);
    fs.unlinkSync(outPhotoPath);
    
    res.json({ imageUrl: `/output/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating collage.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
