const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

content = content.replace(
  /const handleNodeDragStart = \(e: React\.PointerEvent \| React\.MouseEvent \| React\.TouchEvent, node: StoryNode\) => {\n\s*e\.stopPropagation\(\);/,
  `const handleNodeDragStart = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent, node: StoryNode) => {
    e.stopPropagation();
    if (draggingNodeIdRef.current) return; // Prevent double-fire or multi-touch glitches`
);

fs.writeFileSync('src/components/Canvas.tsx', content);
