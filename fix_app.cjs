const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("export default \nconst getFullUrl", "const getFullUrl");
content = content.replace("};", "};\n\nexport default");
fs.writeFileSync('src/App.tsx', content);
