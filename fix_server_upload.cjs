const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Change limit to 50MB
content = content.replace(
  "limits: { fileSize: 1 * 1024 * 1024 } // 1MB limit",
  "limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit"
);

// 2. Wrap multer to catch errors and return JSON
content = content.replace(
  "app.post('/api/upload', upload.single('media'), (req, res) => {",
  `app.post('/api/upload', (req, res) => {
    upload.single('media')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
           return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Unknown upload error' });
      }
      `
);

// Add the closing bracket for the callback
content = content.replace(
  `    res.json({ url: fileUrl, type: fileType });
  });`,
  `    res.json({ url: fileUrl, type: fileType });
    });
  });`
);

fs.writeFileSync('server.ts', content);
