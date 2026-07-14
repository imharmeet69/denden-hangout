const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "mediaUrl: data.url,",
  "mediaUrl: data.url.startsWith('http') ? data.url : `${backendUrl}${data.url}`,"
);

fs.writeFileSync('src/App.tsx', content);
