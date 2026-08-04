const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

// 1. Add localDragPos state
content = content.replace(
  /const \[connectingFromNodeId, setConnectingFromNodeId\] = useState<string \| null>\(null\);/,
  'const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);\n  const [localDragPos, setLocalDragPos] = useState<{ id: string; x: number; y: number } | null>(null);'
);

// 2. Update handleNodeDragStart
content = content.replace(
  /dragOffsetRef\.current = \{ x: canvasPos\.x - node\.x, y: canvasPos\.y - node\.y \};/,
  'dragOffsetRef.current = { x: canvasPos.x - node.x, y: canvasPos.y - node.y };\n    setLocalDragPos({ id: node.id, x: node.x, y: node.y });'
);

// 3. Update handleMove
content = content.replace(
  /const newX = Math\.round\(\(canvasPos\.x - dragOffsetRef\.current\.x\) \/ 10\) \* 10;\n\s*const newY = Math\.round\(\(canvasPos\.y - dragOffsetRef\.current\.y\) \/ 10\) \* 10;\n\s*onMoveNode\(draggingNodeIdRef\.current, newX, newY\);/,
  'const newX = Math.round((canvasPos.x - dragOffsetRef.current.x) / 10) * 10;\n      const newY = Math.round((canvasPos.y - dragOffsetRef.current.y) / 10) * 10;\n      setLocalDragPos({ id: draggingNodeIdRef.current, x: newX, y: newY });'
);

// 4. Update handleEnd
content = content.replace(
  /const handleEnd = \(\) => \{\n\s*isPanningRef\.current = false;\n\s*draggingNodeIdRef\.current = null;/,
  `const handleEnd = () => {
    if (draggingNodeIdRef.current && localDragPos && localDragPos.id === draggingNodeIdRef.current) {
      onMoveNode(draggingNodeIdRef.current, localDragPos.x, localDragPos.y);
    }
    setLocalDragPos(null);
    isPanningRef.current = false;
    draggingNodeIdRef.current = null;`
);

// 5. Update NodeCard rendering
content = content.replace(
  /return \(\n\s*<NodeCard\n\s*key=\{node\.id\}\n\s*node=\{node\}/,
  `const isLocalDragging = localDragPos?.id === node.id;
            const displayNode = isLocalDragging ? { ...node, x: localDragPos.x, y: localDragPos.y } : node;
            return (
              <NodeCard
                key={node.id}
                node={displayNode}`
);

// 6. Update connection lines
content = content.replace(
  /const fromNode = nodes\.find\(\(n\) => n\.id === c\.fromNodeId\);\n\s*const toNode = nodes\.find\(\(n\) => n\.id === c\.toNodeId\);\n\s*if \(\!fromNode \|\| \!toNode\) return null;/g,
  `const fromNode = nodes.find((n) => n.id === c.fromNodeId);
            const toNode = nodes.find((n) => n.id === c.toNodeId);
            if (!fromNode || !toNode) return null;
            const displayFromNode = localDragPos?.id === fromNode.id ? { ...fromNode, x: localDragPos.x, y: localDragPos.y } : fromNode;
            const displayToNode = localDragPos?.id === toNode.id ? { ...toNode, x: localDragPos.x, y: localDragPos.y } : toNode;`
);

content = content.replace(
  /const startX = fromNode\.x \+ \(fromNode\.width \|\| 310\) \/ 2;\n\s*const startY = fromNode\.y \+ \(fromNode\.height \|\| 160\) \/ 2;\n\s*const endX = toNode\.x \+ \(toNode\.width \|\| 310\) \/ 2;\n\s*const endY = toNode\.y \+ \(toNode\.height \|\| 160\) \/ 2;/g,
  `const startX = displayFromNode.x + (displayFromNode.width || 310) / 2;
            const startY = displayFromNode.y + (displayFromNode.height || 160) / 2;
            const endX = displayToNode.x + (displayToNode.width || 310) / 2;
            const endY = displayToNode.y + (displayToNode.height || 160) / 2;`
);

// Modify zoom panel UI
content = content.replace(
  /absolute top-4 left-1\/2 -translate-x-1\/2 z-30 flex items-center gap-1\.5 bg-slate-900\/90 border border-slate-700\/80 p-1\.5 rounded-full shadow-lg backdrop-blur-md select-none/,
  'absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1 rounded-full shadow-lg backdrop-blur-md select-none'
);
content = content.replace(
  /className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-full transition shadow flex items-center gap-2"/,
  'className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-full transition shadow-md flex items-center gap-2"'
);
content = content.replace(
  /className="p-1\.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition"/g,
  'className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition scale-90"'
);


fs.writeFileSync('src/components/Canvas.tsx', content);
