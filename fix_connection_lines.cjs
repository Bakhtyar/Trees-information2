const fs = require('fs');
let code = fs.readFileSync('src/components/ConnectionLines.tsx', 'utf8');

// Replace markerEnd rendering to support markerStart
code = code.replace(
  "markerEnd={arrowMarker}",
  "markerEnd={arrowMarker}\n                markerStart={conn.bidirectional ? arrowMarkerStart : undefined}"
);

// We need to define arrowMarkerStart
const arrowDef = `          const isMainToMain = !isSourceChild && !isTargetChild;`;
const newArrowDef = `          const arrowMarkerStart = \`url(#arrow-start-\${(conn.color || '#64748b').replace('#', '')})\`;\n          const isMainToMain = !isSourceChild && !isTargetChild;`;

code = code.replace(arrowDef, newArrowDef);

// Also we need to add the start marker in defs
const defs = `<defs>
          {/* ألوان رؤوس الأسهم */}
          {['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#dc2626', '#0ea5e9', '#f97316', '#eab308', '#be123c', '#06b6d4', '#059669'].map((col) => (
            <marker`;

const newDefs = `<defs>
          {/* ألوان رؤوس الأسهم */}
          {['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#dc2626', '#0ea5e9', '#f97316', '#eab308', '#be123c', '#06b6d4', '#059669'].map((col) => (
            <React.Fragment key={col}>
            <marker
              id={\`arrow-\${col.replace('#', '')}\`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={col} />
            </marker>
            <marker
              id={\`arrow-start-\${col.replace('#', '')}\`}
              viewBox="0 0 10 10"
              refX="1"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={col} />
            </marker>
            </React.Fragment>
          ))}
        </defs>`;

// The exact string to replace might be different. Let's just use regex or split.
// A simpler way:
code = code.replace(/<defs>[\s\S]*?<\/defs>/, newDefs);

// Also need to get edge intersection for both start and end if it's bidirectional?
// Right now `const pathData = getConnectionPath(p1.x, p1.y, p2Edge.x, p2Edge.y);`
// If we want the start marker to not be covered, we should get edge intersection for p1 too.
const pathDataOld = `const pathData = getConnectionPath(p1.x, p1.y, p2Edge.x, p2Edge.y);`;
const pathDataNew = `
          const p1Edge = conn.bidirectional ? getEdgeIntersection(p2, sourceNode) : p1;
          const pathData = getConnectionPath(p1Edge.x, p1Edge.y, p2Edge.x, p2Edge.y);
`;

code = code.replace(pathDataOld, pathDataNew);

fs.writeFileSync('src/components/ConnectionLines.tsx', code);
console.log("Done");
