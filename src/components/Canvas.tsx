import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { StoryNode, StoryConnection, NodeCategory } from '../types/story';
import { NodeCard } from './NodeCard';
import { ConnectionLines } from './ConnectionLines';
import { CanvasMode } from './Toolbar';

interface CanvasProps {
  nodes: StoryNode[];
  connections: StoryConnection[];
  selectedNodeId: string | null;
  onSelectNode: (node: StoryNode | null) => void;
  onExpandNode: (node: StoryNode) => void;
  onEditNode: (node: StoryNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateNode?: (node: StoryNode) => void;
  selectedConnectionId: string | null;
  onSelectConnection: (conn: StoryConnection | null) => void;
  onUpdateConnection?: (conn: StoryConnection) => void;
  onDeleteConnection?: (connId: string) => void;
  onMoveNode: (nodeId: string, newX: number, newY: number) => void;
  canvasView: { x: number; y: number; zoom: number };
  onUpdateCanvasView: (newView: { x: number; y: number; zoom: number }) => void;
  canvasMode: CanvasMode;
  onStartConnectionBetween: (fromNodeId: string, toNodeId: string) => void;
  onAddNodeAtPosition?: (type: NodeCategory, x: number, y: number, connectFromNodeId?: string) => void;
  isDark: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  onExpandNode,
  onEditNode,
  onDeleteNode,
  onUpdateNode,
  selectedConnectionId,
  onSelectConnection,
  onUpdateConnection,
  onDeleteConnection,
  onMoveNode,
  canvasView,
  onUpdateCanvasView,
  canvasMode,
  onStartConnectionBetween,
  onAddNodeAtPosition,
  isDark
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connect Mode temporary line state
  const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number } | null>(null);

  // Anchor Drag-to-Connect and Quick Node Spawning (Ghost Box) state
  const [anchorDrag, setAnchorDrag] = useState<{
    sourceNodeId: string;
    sourceAnchorPos: 'top' | 'right' | 'bottom' | 'left';
    startWorldPos: { x: number; y: number };
  } | null>(null);

  // Convert mouse client coordinates to canvas world coordinates
  const clientToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    return {
      x: (relX - canvasView.x) / canvasView.zoom,
      y: (relY - canvasView.y) / canvasView.zoom
    };
  }, [canvasView]);

  // Handle zooming with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = Math.min(Math.max(canvasView.zoom * zoomFactor, 0.25), 2.5);

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - canvasView.x) / canvasView.zoom;
    const worldY = (mouseY - canvasView.y) / canvasView.zoom;

    const newX = mouseX - worldX * nextZoom;
    const newY = mouseY - worldY * nextZoom;

    onUpdateCanvasView({
      x: newX,
      y: newY,
      zoom: nextZoom
    });
  };

  // Ref for multi-touch (two fingers) zoom and pan
  const touchZoomRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialMidX: number;
    initialMidY: number;
    initialCanvasX: number;
    initialCanvasY: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    return () => {
      container.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, []);

  const getClientCoords = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    return {
      clientX: (e as React.MouseEvent).clientX,
      clientY: (e as React.MouseEvent).clientY
    };
  };

  // Start panning when clicking background
  const handleStartPan = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0 && e.button !== 1 && e.button !== undefined) return;
    if ('touches' in e && e.touches.length > 1) return;

    onSelectNode(null);
    onSelectConnection(null);
    setIsPanning(true);
    const { clientX, clientY } = getClientCoords(e);
    setPanStart({
      x: clientX - canvasView.x,
      y: clientY - canvasView.y
    });
    if (connectingFromNodeId) {
      setConnectingFromNodeId(null);
    }
    try {
      if ('pointerId' in e && e.currentTarget) {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    } catch (err) {}
  };

  // Start dragging a node
  const handleNodeDragStart = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent, node: StoryNode) => {
    e.stopPropagation();

    const { clientX, clientY } = getClientCoords(e);

    if (canvasMode === 'connect') {
      if (!connectingFromNodeId) {
        setConnectingFromNodeId(node.id);
        setMouseCanvasPos(clientToCanvas(clientX, clientY));
      } else if (connectingFromNodeId !== node.id) {
        onStartConnectionBetween(connectingFromNodeId, node.id);
        setConnectingFromNodeId(null);
      }
      return;
    }

    onSelectNode(node);
    onSelectConnection(null);
    setDraggingNodeId(node.id);

    const canvasPos = clientToCanvas(clientX, clientY);
    setDragOffset({
      x: canvasPos.x - node.x,
      y: canvasPos.y - node.y
    });

    try {
      if ('pointerId' in e && e.currentTarget) {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    } catch (err) {}
  };

  // Start Anchor Dragging (from anchor point)
  const handleAnchorPointerDown = (
    e: React.PointerEvent,
    anchorPos: 'top' | 'right' | 'bottom' | 'left',
    nodeId: string
  ) => {
    e.stopPropagation();
    const sourceNode = nodes.find((n) => n.id === nodeId);
    if (!sourceNode) return;

    const w = sourceNode.width || 310;
    const h = sourceNode.height || 160;
    let ax = sourceNode.x + w / 2;
    let ay = sourceNode.y + h / 2;
    if (anchorPos === 'top') ay = sourceNode.y;
    else if (anchorPos === 'bottom') ay = sourceNode.y + h;
    else if (anchorPos === 'left') ax = sourceNode.x;
    else if (anchorPos === 'right') ax = sourceNode.x + w;

    setAnchorDrag({
      sourceNodeId: nodeId,
      sourceAnchorPos: anchorPos,
      startWorldPos: { x: ax, y: ay }
    });

    const canvasPos = clientToCanvas(e.clientX, e.clientY);
    setMouseCanvasPos(canvasPos);
  };

  // Helper to check if a world point is inside a node
  const getHoveredTargetNode = useCallback(
    (pos: { x: number; y: number } | null, excludeNodeId?: string) => {
      if (!pos) return null;
      return (
        nodes.find((n) => {
          if (excludeNodeId && n.id === excludeNodeId) return false;
          const w = n.width || 310;
          const h = n.height || 160;
          return pos.x >= n.x && pos.x <= n.x + w && pos.y >= n.y && pos.y <= n.y + h;
        }) || null
      );
    },
    [nodes]
  );

  // Handle global move (pointer / mouse / touch)
  const handleMove = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    const { clientX, clientY } = getClientCoords(e);
    const canvasPos = clientToCanvas(clientX, clientY);
    setMouseCanvasPos(canvasPos);

    if (isPanning) {
      onUpdateCanvasView({
        ...canvasView,
        x: clientX - panStart.x,
        y: clientY - panStart.y
      });
    } else if (draggingNodeId) {
      const newX = Math.round((canvasPos.x - dragOffset.x) / 10) * 10;
      const newY = Math.round((canvasPos.y - dragOffset.y) / 10) * 10;
      onMoveNode(draggingNodeId, newX, newY);
    }
  };

  // End drag/pan/anchor connection
  const handleEnd = () => {
    setIsPanning(false);
    setDraggingNodeId(null);

    if (anchorDrag && mouseCanvasPos) {
      const targetNode = getHoveredTargetNode(mouseCanvasPos, anchorDrag.sourceNodeId);
      if (targetNode) {
        onStartConnectionBetween(anchorDrag.sourceNodeId, targetNode.id);
      } else if (onAddNodeAtPosition) {
        // Quick Node Spawning (Drag-to-Create)
        onAddNodeAtPosition('box', mouseCanvasPos.x - 155, mouseCanvasPos.y - 80, anchorDrag.sourceNodeId);
      }
      setAnchorDrag(null);
    }
  };

  // Handle 2-finger pinch to zoom & pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;

      touchZoomRef.current = {
        initialDist: dist,
        initialZoom: canvasView.zoom,
        initialMidX: midX,
        initialMidY: midY,
        initialCanvasX: canvasView.x,
        initialCanvasY: canvasView.y
      };
      setIsPanning(false);
      setDraggingNodeId(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchZoomRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;

      const scale = dist / (touchZoomRef.current.initialDist || 1);
      const nextZoom = Math.min(Math.max(touchZoomRef.current.initialZoom * scale, 0.25), 2.5);

      const deltaX = midX - touchZoomRef.current.initialMidX;
      const deltaY = midY - touchZoomRef.current.initialMidY;

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const relMidX = touchZoomRef.current.initialMidX - rect.left;
        const relMidY = touchZoomRef.current.initialMidY - rect.top;

        const worldX = (relMidX - touchZoomRef.current.initialCanvasX) / touchZoomRef.current.initialZoom;
        const worldY = (relMidY - touchZoomRef.current.initialCanvasY) / touchZoomRef.current.initialZoom;

        const newX = relMidX - worldX * nextZoom + deltaX;
        const newY = relMidY - worldY * nextZoom + deltaY;

        onUpdateCanvasView({
          x: newX,
          y: newY,
          zoom: nextZoom
        });
      }
    } else if (e.touches.length === 1) {
      handleMove(e);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchZoomRef.current = null;
    }
    if (e.touches.length === 0) {
      handleEnd();
    }
  };

  const handleStartConnectFromNode = (e: React.MouseEvent, node: StoryNode) => {
    e.stopPropagation();
    if (!connectingFromNodeId) {
      setConnectingFromNodeId(node.id);
      setMouseCanvasPos(clientToCanvas(e.clientX, e.clientY));
    } else if (connectingFromNodeId !== node.id) {
      onStartConnectionBetween(connectingFromNodeId, node.id);
      setConnectingFromNodeId(null);
    } else {
      setConnectingFromNodeId(null);
    }
  };

  // HTML5 Drag-and-Drop Insertion from Toolbox
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('application/node-type') as NodeCategory;
    if (nodeType && onAddNodeAtPosition) {
      const dropPos = clientToCanvas(e.clientX, e.clientY);
      onAddNodeAtPosition(nodeType, dropPos.x - 155, dropPos.y - 80);
    }
  };

  useEffect(() => {
    if (canvasMode !== 'connect') {
      setConnectingFromNodeId(null);
    }
  }, [canvasMode]);

  // Compute story tree sequence mapping and vertical bottom-to-top numbers
  const sequenceMap = useMemo(() => {
    const map = new Map<string, { sequenceNumber: number; isChildNode: boolean }>();

    const childrenByParent = new Map<string, StoryNode[]>();
    const rootNodes: StoryNode[] = [];

    nodes.forEach((n) => {
      const parentId = n.parentId;
      if (parentId) {
        if (!childrenByParent.has(parentId)) {
          childrenByParent.set(parentId, []);
        }
        childrenByParent.get(parentId)!.push(n);
      } else {
        rootNodes.push(n);
      }
    });

    // Vertical Order Sorting (Bottom-to-Top): lowest on screen (highest Y) receives 1
    rootNodes.sort((a, b) => b.y - a.y);
    rootNodes.forEach((n, index) => {
      map.set(n.id, { sequenceNumber: index + 1, isChildNode: false });
    });

    childrenByParent.forEach((children) => {
      children.sort((a, b) => b.y - a.y);
      children.forEach((n, index) => {
        map.set(n.id, { sequenceNumber: index + 1, isChildNode: true });
      });
    });

    return map;
  }, [nodes, connections]);

  const hoveredTargetNode = anchorDrag ? getHoveredTargetNode(mouseCanvasPos, anchorDrag.sourceNodeId) : null;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handleStartPan}
      onPointerMove={handleMove}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      onMouseDown={handleStartPan}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`canvas-touch-container relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none ${
        isDark ? 'story-grid-bg bg-slate-950' : 'story-grid-bg-light bg-slate-50'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Infinite Canvas Space */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate(${canvasView.x}px, ${canvasView.y}px) scale(${canvasView.zoom})`
        }}
      >
        {/* SVG Connection Lines */}
        <ConnectionLines
          nodes={nodes}
          connections={connections}
          selectedConnectionId={selectedConnectionId}
          onSelectConnection={(conn) => {
            onSelectConnection(conn);
            onSelectNode(null);
          }}
          onUpdateConnection={onUpdateConnection}
          onDeleteConnection={onDeleteConnection}
          connectingFromNodeId={connectingFromNodeId}
          mouseCanvasPos={mouseCanvasPos}
          zoom={canvasView.zoom}
        />

        {/* Live Drag-from-Anchor Connecting Line */}
        {anchorDrag && mouseCanvasPos && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-30">
            <defs>
              <marker
                id="live-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
              </marker>
            </defs>
            <path
              d={(() => {
                const x1 = anchorDrag.startWorldPos.x;
                const y1 = anchorDrag.startWorldPos.y;
                const x2 = mouseCanvasPos.x;
                const y2 = mouseCanvasPos.y;
                const dx = x2 - x1;
                const dy = y2 - y1;
                
                if (Math.abs(dx) < 2 || Math.abs(dy) < 2) {
                  return `M ${x1} ${y1} L ${x2} ${y2}`;
                }
                
                const isHorizontal = Math.abs(dx) > Math.abs(dy);
                
                const cp1x = x1 + (isHorizontal ? dx * 0.5 : 0);
                const cp1y = y1 + (!isHorizontal ? dy * 0.5 : 0);
                
                const cp2x = x2 - dx * 0.25;
                const cp2y = y2 - dy * 0.25;
                
                return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
              })()}
              fill="none"
              stroke="#06b6d4"
              strokeWidth={3.5}
              strokeDasharray="6 4"
              markerEnd="url(#live-arrow)"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* Ghost Preview Box for Drag-to-Create */}
        {anchorDrag && mouseCanvasPos && !hoveredTargetNode && (
          <div
            className="absolute pointer-events-none rounded-2xl border-2 border-dashed border-cyan-400 bg-cyan-950/70 p-4 shadow-2xl backdrop-blur-md animate-pulse z-40 flex flex-col justify-between"
            style={{
              left: `${mouseCanvasPos.x - 155}px`,
              top: `${mouseCanvasPos.y - 80}px`,
              width: '310px',
              height: '160px'
            }}
          >
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>إنشاء مربع فرعي جديد تلقائياً</span>
            </div>
            <p className="text-[11px] text-cyan-200/90 leading-relaxed">
              افلت الماوس هنا لإنشاء فرع جديد وربطه تلقائياً!
            </p>
          </div>
        )}

        {/* Story Nodes Layer */}
        <div className="pointer-events-auto">
          {nodes.map((node) => {
            const seqInfo = sequenceMap.get(node.id) || { sequenceNumber: 1, isChildNode: false };
            const isHoveredTarget = hoveredTargetNode?.id === node.id;

            return (
              <NodeCard
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                sequenceNumber={seqInfo.sequenceNumber}
                isChildNode={seqInfo.isChildNode}
                isHoveredTarget={isHoveredTarget}
                onSelect={(e) => {
                  e.stopPropagation();
                  if (canvasMode === 'connect') {
                    if (!connectingFromNodeId) {
                      setConnectingFromNodeId(node.id);
                    } else if (connectingFromNodeId !== node.id) {
                      onStartConnectionBetween(connectingFromNodeId, node.id);
                      setConnectingFromNodeId(null);
                    }
                    return;
                  }
                  onSelectNode(node);
                  onSelectConnection(null);
                }}
                onExpand={(e) => {
                  e.stopPropagation();
                  onExpandNode(node);
                }}
                onEdit={(e) => {
                  e.stopPropagation();
                  onEditNode(node);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                onStartConnect={(e) => handleStartConnectFromNode(e, node)}
                onAnchorPointerDown={handleAnchorPointerDown}
                onDragStart={handleNodeDragStart}
                onUpdateNode={onUpdateNode}
                isConnectingSource={connectingFromNodeId === node.id}
              />
            );
          })}
        </div>
      </div>

      {/* Connection Indicator banner */}
      {connectingFromNodeId && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 bg-cyan-950/90 border-2 border-cyan-500 text-cyan-200 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="font-bold text-sm">
            🔗 اختر المربع الثاني لإنشاء الرابط والعلاقة، أو اضغط في الخلفية للإلغاء
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConnectingFromNodeId(null);
            }}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded-lg"
          >
            إلغاء
          </button>
        </div>
      )}
    </div>
  );
};
