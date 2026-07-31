function getConnectionPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (Math.abs(dx) < 2 || Math.abs(dy) < 2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  
  // Start by moving out along the primary axis
  const cp1x = x1 + (isHorizontal ? dx * 0.5 : 0);
  const cp1y = y1 + (!isHorizontal ? dy * 0.5 : 0);
  
  // End by moving along the direct line between source and target, 
  // so the arrowhead points exactly at the target.
  const cp2x = x2 - dx * 0.25;
  const cp2y = y2 - dy * 0.25;
  
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}
console.log(getConnectionPath(0, 0, 100, 10));
console.log(getConnectionPath(0, 0, 100, 100));
console.log(getConnectionPath(0, 0, 10, 100));
