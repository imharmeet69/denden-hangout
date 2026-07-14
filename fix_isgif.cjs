const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "const isGif = !!msg.gifUrl;",
  "const isGif = !!msg.gifUrl || !!msg.mediaUrl;"
);

fs.writeFileSync('src/App.tsx', content);
