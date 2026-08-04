const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

// Fix SpatialGridOverlay props (remove onCenterView)
content = content.replace(
  'showCoordinates = true,\n  onCenterView }) => {',
  'showCoordinates = true\n}) => {'
);

// Add onCenterView to Canvas props
content = content.replace(
  'showCoordinates = true\n}) => {',
  'showCoordinates = true,\n  onCenterView\n}) => {'
);

fs.writeFileSync('src/components/Canvas.tsx', content);
