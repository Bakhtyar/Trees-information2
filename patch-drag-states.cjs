const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

// 1. Replace states with refs
content = content.replace(
  /const \[isPanning, setIsPanning\] = useState\(false\);/,
  'const isPanningRef = useRef(false);'
);
content = content.replace(
  /const \[panStart, setPanStart\] = useState\(\{ x: 0, y: 0 \}\);/,
  'const panStartRef = useRef({ x: 0, y: 0 });'
);
content = content.replace(
  /const \[draggingNodeId, setDraggingNodeId\] = useState<string \| null>\(null\);/,
  'const draggingNodeIdRef = useRef<string | null>(null);'
);
content = content.replace(
  /const \[dragOffset, setDragOffset\] = useState\(\{ x: 0, y: 0 \}\);/,
  'const dragOffsetRef = useRef({ x: 0, y: 0 });'
);

// 2. Replace setters with ref updates
content = content.replace(/setIsPanning\(true\);/g, 'isPanningRef.current = true;');
content = content.replace(/setIsPanning\(false\);/g, 'isPanningRef.current = false;');

content = content.replace(/setPanStart\(\{\n\s*x: clientX - canvasView\.x,\n\s*y: clientY - canvasView\.y\n\s*\}\);/g, 
  'panStartRef.current = { x: clientX - canvasView.x, y: clientY - canvasView.y };'
);

content = content.replace(/setDraggingNodeId\(node\.id\);/g, 'draggingNodeIdRef.current = node.id;');
content = content.replace(/setDraggingNodeId\(null\);/g, 'draggingNodeIdRef.current = null;');

content = content.replace(/setDragOffset\(\{\n\s*x: canvasPos\.x - node\.x,\n\s*y: canvasPos\.y - node\.y\n\s*\}\);/g,
  'dragOffsetRef.current = { x: canvasPos.x - node.x, y: canvasPos.y - node.y };'
);

// 3. Replace getters with ref accesses
content = content.replace(/if \(isPanning\)/g, 'if (isPanningRef.current)');
content = content.replace(/} else if \(draggingNodeId\)/g, '} else if (draggingNodeIdRef.current)');
content = content.replace(/onMoveNode\(draggingNodeId,/g, 'onMoveNode(draggingNodeIdRef.current,');
content = content.replace(/panStart\.x/g, 'panStartRef.current.x');
content = content.replace(/panStart\.y/g, 'panStartRef.current.y');
content = content.replace(/dragOffset\.x/g, 'dragOffsetRef.current.x');
content = content.replace(/dragOffset\.y/g, 'dragOffsetRef.current.y');

fs.writeFileSync('src/components/Canvas.tsx', content);
