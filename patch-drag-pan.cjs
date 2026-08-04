const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

content = content.replace(
  /draggingNodeIdRef\.current = node\.id;/,
  'draggingNodeIdRef.current = node.id;\n    isPanningRef.current = false;'
);

fs.writeFileSync('src/components/Canvas.tsx', content);
