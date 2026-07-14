const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "if (!res.ok) throw new Error('Upload failed');",
  `if (!res.ok) {
        let errMsg = 'Upload failed';
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }`
);

fs.writeFileSync('src/App.tsx', content);
