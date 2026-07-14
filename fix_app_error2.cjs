const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "const data = await res.json();",
  `const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Invalid JSON response:', text.substring(0, 200));
        throw new Error('Server returned invalid response');
      }`
);

fs.writeFileSync('src/App.tsx', content);
