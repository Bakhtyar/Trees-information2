const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

content = content.replace(
  /showCoordinates = true\n\}\) => \{/,
  'showCoordinates = true,\n  onCenterView\n}) => {'
);

fs.writeFileSync('src/components/Canvas.tsx', content);
