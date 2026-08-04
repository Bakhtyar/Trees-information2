const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

// Remove mouse handlers from Canvas container
content = content.replace(/\s*onMouseDown=\{handleStartPan\}/, '');
content = content.replace(/\s*onMouseMove=\{handleMove\}/, '');
content = content.replace(/\s*onMouseUp=\{handleEnd\}/, '');

fs.writeFileSync('src/components/Canvas.tsx', content);
