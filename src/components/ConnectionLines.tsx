import React, { useState, useMemo } from 'react';
import { Trash2, Type, Check, X, Palette, ArrowRightLeft } from 'lucide-react';
import { StoryNode, StoryConnection } from '../types/story';

interface ConnectionLinesProps {
  nodes: StoryNode[];
  connections: StoryConnection[];
  selectedConnectionId: string | null;
  onSelectConnection: (connection: StoryConnection | null) => void;
  onUpdateConnection?: (connection: StoryConnection) => void;
  onDeleteConnection?: (connectionId: string) => void;
  connectingFromNodeId: string | null;
  mouseCanvasPos: { x: number; y: number } | null;
  zoom: number;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  nodes,
  connections,
  selectedConnectionId,
  onSelectConnection,
  onUpdateConnection,
  onDeleteConnection,
  connectingFromNodeId,
  mouseCanvasPos,
  zoom
}) => {
  const [editingTextConnId, setEditingTextConnId] = useState<string | null>(null);
  const [lineText, setLineText] = useState('');

  // Set of child node IDs (nodes that have parentId explicitly set)
  const childNodeSet = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach((n) => {
      if (n.parentId) set.add(n.id);
    });
    return set;
  }, [nodes]);

  // Helper to get center of a node card
  const getNodeCenter = (node: StoryNode) => {
    const w = node.width || 310; // default node width
    const h = node.height || 160;
    return {
      x: node.x + w / 2,
      y: node.y + h / 2
    };
  };

  const getEdgeIntersection = (sourceCenter: {x: number, y: number}, targetNode: StoryNode) => {
    const w = targetNode.width || 310;
    const h = targetNode.height || 160;
    const cx = targetNode.x + w / 2;
    const cy = targetNode.y + h / 2;
    
    const rayDx = sourceCenter.x - cx;
    const rayDy = sourceCenter.y - cy;
    
    if (rayDx === 0 && rayDy === 0) return { x: cx, y: cy };
    
    // Add 12px padding for arrow head room
    const rx = w / 2 + 12; 
    const ry = h / 2 + 12;
    
    let tMin = Infinity;
    if (Math.abs(rayDx) > 0.0001) tMin = Math.min(tMin, rx / Math.abs(rayDx));
    if (Math.abs(rayDy) > 0.0001) tMin = Math.min(tMin, ry / Math.abs(rayDy));
    
    if (tMin > 1) tMin = 1; // if source is inside the target node bounds
    
    return {
      x: cx + rayDx * tMin,
      y: cy + rayDy * tMin
    };
  };

  // Calculate organic bezier path that dynamically curves but ends pointing straight at the target
  const getConnectionPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Perfectly aligned (straight line)
    if (Math.abs(dx) < 2 || Math.abs(dy) < 2) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    
    // Smooth Bézier Curve for diagonal/offset positions
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    
    // Control point 1: Fan out organically from the source along the primary axis
    const cp1x = x1 + (isHorizontal ? dx * 0.5 : 0);
    const cp1y = y1 + (!isHorizontal ? dy * 0.5 : 0);
    
    // Control point 2: Align strictly with the target center to ensure the arrowhead 
    // rotates smoothly and points directly into the target.
    const cp2x = x2 - dx * 0.25;
    const cp2y = y2 - dy * 0.25;
    
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  };

  // Calculate midpoint for the relationship label badge & toolbar
  const getMidPoint = (x1: number, y1: number, x2: number, y2: number) => {
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2
    };
  };

  const handleSaveLineText = (conn: StoryConnection) => {
    if (onUpdateConnection) {
      onUpdateConnection({
        ...conn,
        label: lineText.trim()
      });
    }
    setEditingTextConnId(null);
  };

  return (
    <>
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
        style={{ transformOrigin: '0 0' }}
      >
        <defs>
          {/* ألوان رؤوس الأسهم */}
          {['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#dc2626', '#0ea5e9', '#f97316', '#eab308', '#be123c', '#06b6d4', '#059669'].map((col) => (
            <React.Fragment key={col}>
            <marker
              id={`arrow-${col.replace('#', '')}`}
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
              id={`arrow-start-${col.replace('#', '')}`}
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
        </defs>

        {/* روابط المشاهد المحفوظة */}
        {connections.map((conn) => {
          const sourceNode = nodes.find((n) => n.id === conn.fromNodeId);
          const targetNode = nodes.find((n) => n.id === conn.toNodeId);
          if (!sourceNode || !targetNode) return null;

          const p1 = getNodeCenter(sourceNode);
          const p2 = getNodeCenter(targetNode);
          const p2Edge = getEdgeIntersection(p1, targetNode);
          const mid = getMidPoint(p1.x, p1.y, p2.x, p2.y);
          
          const p1Edge = conn.bidirectional ? getEdgeIntersection(p2, sourceNode) : p1;
          const pathData = getConnectionPath(p1Edge.x, p1Edge.y, p2Edge.x, p2Edge.y);

          const isSelected = selectedConnectionId === conn.id;

          const strokeDasharray = 
            conn.style === 'dashed' ? '8,6' :
            conn.style === 'dotted' ? '3,4' : undefined;

          const arrowMarker = `url(#arrow-${(conn.color || '#64748b').replace('#', '')})`;

          const isSourceChild = childNodeSet.has(sourceNode.id);
          const isTargetChild = childNodeSet.has(targetNode.id);
          const arrowMarkerStart = `url(#arrow-start-${(conn.color || '#64748b').replace('#', '')})`;
          const isMainToMain = !isSourceChild && !isTargetChild;

          // Main-to-Main lines use a thicker stroke width (6px / 8px), Main-to-Branch lines use thinner (3px / 4px)
          const strokeWidth = isMainToMain
            ? (isSelected ? '8' : '6')
            : (isSelected ? '4' : '3');

          return (
            <g key={conn.id} className="group pointer-events-auto cursor-pointer">
              {/* خط خلفي عريض لاكتشاف النقر بسهولة */}
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth="22"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectConnection(conn);
                }}
              />

              {/* خط السهم الأساسي */}
              <path
                d={pathData}
                fill="none"
                stroke={conn.color || '#64748b'}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                markerEnd={arrowMarker}
                markerStart={conn.bidirectional ? arrowMarkerStart : undefined}
                className="transition-all duration-200 group-hover:stroke-amber-400"
                style={{
                  filter: isSelected ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' : undefined
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectConnection(conn);
                }}
              />

              {/* بطاقة تسمية العلاقة على الخط */}
              {conn.label && editingTextConnId !== conn.id && (
                <g 
                  transform={`translate(${mid.x}, ${mid.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectConnection(conn);
                  }}
                >
                  <rect
                    x="-50"
                    y="-14"
                    width="100"
                    height="28"
                    rx="14"
                    fill="#0f172a"
                    stroke={isSelected ? '#f59e0b' : (conn.color || '#64748b')}
                    strokeWidth={isSelected ? '2' : '1.5'}
                    className="shadow-md transition group-hover:stroke-amber-400"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="12"
                    fontWeight="bold"
                    className="select-none font-['Cairo',sans-serif]"
                  >
                    {conn.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* خط الربط المؤقت أثناء وضع الربط */}
        {connectingFromNodeId && mouseCanvasPos && (() => {
          const sourceNode = nodes.find((n) => n.id === connectingFromNodeId);
          if (!sourceNode) return null;
          const p1 = getNodeCenter(sourceNode);
          const pathData = getConnectionPath(p1.x, p1.y, mouseCanvasPos.x, mouseCanvasPos.y);

          return (
            <g>
              <path
                d={pathData}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="6,4"
                className="animate-pulse"
              />
              <circle cx={mouseCanvasPos.x} cy={mouseCanvasPos.y} r="6" fill="#06b6d4" />
            </g>
          );
        })()}
      </svg>

      {/* شريط الأدوات العائم للخط عند تحديده (Line Floating Toolbar) */}
      <div className="pointer-events-auto">
        {connections.map((conn) => {
          if (selectedConnectionId !== conn.id) return null;
          const sourceNode = nodes.find((n) => n.id === conn.fromNodeId);
          const targetNode = nodes.find((n) => n.id === conn.toNodeId);
          if (!sourceNode || !targetNode) return null;

          const p1 = getNodeCenter(sourceNode);
          const p2 = getNodeCenter(targetNode);
          const mid = getMidPoint(p1.x, p1.y, p2.x, p2.y);

          const isEditingThis = editingTextConnId === conn.id;

          return (
            <div
              key={`toolbar-${conn.id}`}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border-2 border-amber-500 text-slate-100 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1.5 backdrop-blur-md animate-in fade-in zoom-in duration-150"
              style={{
                left: `${mid.x}px`,
                top: `${mid.y}px`
              }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {isEditingThis ? (
                <div className="flex items-center gap-1 px-1">
                  <input
                    type="text"
                    value={lineText}
                    onChange={(e) => setLineText(e.target.value)}
                    placeholder="اكتب النص على الخط..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveLineText(conn);
                      if (e.key === 'Escape') setEditingTextConnId(null);
                    }}
                    className="bg-slate-800 text-xs text-white px-2 py-1 rounded-lg border border-slate-600 focus:outline-none focus:border-amber-400 w-36"
                  />
                  <button
                    onClick={() => handleSaveLineText(conn)}
                    className="p-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold"
                    title="حفظ النص"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingTextConnId(null)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                    title="إلغاء"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  {/* زر إضافة/تعديل النص على الخط */}
                  <button
                    onClick={() => {
                      setLineText(conn.label || '');
                      setEditingTextConnId(conn.id);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 transition text-xs font-semibold"
                    title="إضافة أو تعديل الكتابة على الخط (T)"
                  >
                    <Type className="w-4 h-4 text-amber-400" />
                    <span>{conn.label ? 'تعديل النص' : 'إضافة نص'}</span>
                  </button>

                  <div className="h-4 w-px bg-slate-700" />

                  {/* زر تبديل سهم عادي / سهم مزدوج */}
                  <button
                    onClick={() => {
                      if (onUpdateConnection) {
                        onUpdateConnection({ ...conn, bidirectional: !conn.bidirectional });
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition text-xs font-semibold ${
                      conn.bidirectional
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={conn.bidirectional ? 'سهم مزدوج (⬌) - اضغط للتحويل لسهم عادي' : 'سهم عادي (➔) - اضغط للتحويل لسهم مزدوج'}
                  >
                    <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                    <span>{conn.bidirectional ? 'سهم مزدوج ⬌' : 'سهم عادي ➔'}</span>
                  </button>

                  <div className="h-4 w-px bg-slate-700" />

                  {/* تغيير لون الخط */}
                  <div className="flex items-center gap-1 px-1">
                    {['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#64748b'].map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          if (onUpdateConnection) {
                            onUpdateConnection({ ...conn, color: col });
                          }
                        }}
                        className={`w-4 h-4 rounded-full border transition hover:scale-125 ${
                          conn.color === col ? 'ring-2 ring-amber-400 border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                        title="تغيير لون الخط"
                      />
                    ))}
                  </div>

                  <div className="h-4 w-px bg-slate-700" />

                  {/* زر حذف الخط */}
                  <button
                    onClick={() => {
                      if (onDeleteConnection) {
                        onDeleteConnection(conn.id);
                      }
                    }}
                    className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition"
                    title="حذف هذا الخط والرابط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
