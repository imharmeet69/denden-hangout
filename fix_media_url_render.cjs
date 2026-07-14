const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const helperCode = `
const getFullUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  return \`\${backendUrl}\${url}\`;
};
`;

content = content.replace("function App() {", helperCode + "\nfunction App() {");

content = content.replace(
  /msg\.mediaUrl/g,
  "getFullUrl(msg.mediaUrl)"
);

content = content.replace(
  /replyingTo\.mediaUrl/g,
  "getFullUrl(replyingTo.mediaUrl)"
);

content = content.replace(
  /getFullUrl\(msg\.mediaUrl\)\!/g,
  "getFullUrl(msg.mediaUrl)"
);


fs.writeFileSync('src/App.tsx', content);
