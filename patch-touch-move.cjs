const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

content = content.replace(
  /\} else if \(e\.touches\.length === 1\) \{\n\s*handleMove\(e\);\n\s*\}/g,
  '} // Removed 1-finger fallback to avoid PointerEvent/TouchEvent coordinate mismatch'
);

fs.writeFileSync('src/components/Canvas.tsx', content);
