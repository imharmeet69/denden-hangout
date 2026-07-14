const express = require('express');
const multer = require('multer');
const app = express();
const upload = multer({ limits: { fileSize: 10 } });
app.post('/test', upload.single('media'), (req, res) => res.json({ok: true}));
app.listen(3001, () => console.log('started'));
