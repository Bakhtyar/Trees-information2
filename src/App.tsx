import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StoryProject, 
  StoryNode, 
  StoryConnection, 
  NodeCategory, 
  NODE_CATEGORIES 
} from './types/story';
import { 
  loadProject, 
  saveProject 
} from './utils/storage';
import { SAMPLE_DETECTIVE_PROJECT, BLANK_PROJECT_TEMPLATE } from './utils/sampleProject';
import { Navbar } from './components/Navbar';
import { Toolbar, CanvasMode } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { NodeDetailModal } from './components/NodeDetailModal';
import { ConnectionModal } from './components/ConnectionModal';
import { SearchModal } from './components/SearchModal';
import { ExportImportModal } from './components/ExportImportModal';
import { GuideModal } from './components/GuideModal';

export default function App() {
  const [project, setProject] = useState<StoryProject>(() => loadProject());
  const [isDark, setIsDark] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Interactive modes & Selection state
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Modals state
  const [expandedNode, setExpandedNode] = useState<StoryNode | null>(null);
  const [activeConnectionModal, setActiveConnectionModal] = useState<{
    isOpen: boolean;
    connection: StoryConnection | null;
    sourceNode: StoryNode | null;
    targetNode: StoryNode | null;
  }>({
    isOpen: false,
    connection: null,
    sourceNode: null,
    targetNode: null
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Dragging state for toolbar tools (supports touch)
  const [draggingTool, setDraggingTool] = useState<{type: NodeCategory, x: number, y: number} | null>(null);

  // Auto-save debounce ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const persistProject = useCallback((newProject: StoryProject) => {
    setProject(newProject);
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const ok = saveProject(newProject);
      setSaveStatus(ok ? 'saved' : 'error');
    }, 400);
  }, []);

  // Sync dark class on HTML tag
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Center view calculation
  const handleCenterView = useCallback(() => {
    if (project.nodes.length === 0) {
      persistProject({
        ...project,
        canvasView: { x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 }
      });
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    project.nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 310));
      maxY = Math.max(maxY, n.y + (n.height || 160));
    });

    const boardWidth = maxX - minX || 500;
    const boardHeight = maxY - minY || 400;
    const centerX = minX + boardWidth / 2;
    const centerY = minY + boardHeight / 2;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight - 64;
    const padding = 120;

    const zoomX = (screenW - padding * 2) / boardWidth;
    const zoomY = (screenH - padding * 2) / boardHeight;
    const zoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.35), 1.15);

    const targetX = screenW / 2 - centerX * zoom;
    const targetY = screenH / 2 - centerY * zoom;

    persistProject({
      ...project,
      canvasView: { x: targetX, y: targetY, zoom }
    });
  }, [project, persistProject]);

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Handlers for Nodes ---
  // Pointer drag and drop support for toolbar on touch devices
  useEffect(() => {
    if (!draggingTool) return;

    const handlePointerMove = (e: PointerEvent) => {
      setDraggingTool(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const canvasEl = document.querySelector('.canvas-touch-container');
      if (canvasEl && draggingTool) {
        const rect = canvasEl.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          // Calculate drop coordinates in canvas world space
          const worldX = (e.clientX - rect.left - project.canvasView.x) / project.canvasView.zoom;
          const worldY = (e.clientY - rect.top - project.canvasView.y) / project.canvasView.zoom;
          
          handleAddNodeAtPosition(draggingTool.type, worldX - 155, worldY - 80);
        }
      }
      setDraggingTool(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingTool, project.canvasView]);

  const handleAddNode = (type: NodeCategory) => {
    const cat = NODE_CATEGORIES[type] || NODE_CATEGORIES.note;
    // Calculate center of screen in world coordinates
    const screenW = window.innerWidth;
    const screenH = window.innerHeight - 64;
    const worldX = (screenW / 2 - project.canvasView.x) / project.canvasView.zoom - 150;
    const worldY = (screenH / 2 - project.canvasView.y) / project.canvasView.zoom - 80;

    // Slight random offset if adding multiple nodes
    const offsetX = Math.round((Math.random() - 0.5) * 80);
    const offsetY = Math.round((Math.random() - 0.5) * 80);

    const newNode: StoryNode = {
      id: 'node-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: `عنصر جديد (${cat.name})`,
      content: 'اكتب هنا تفاصيل هذا المربع أو حدث القصة...',
      internalNotes: '',
      type,
      color: cat.defaultColor,
      x: Math.round(worldX + offsetX),
      y: Math.round(worldY + offsetY),
      width: 310,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [cat.name]
    };

    persistProject({
      ...project,
      nodes: [...project.nodes, newNode]
    });
    setSelectedNodeId(newNode.id);
  };

  const handleAddNodeAtPosition = (
    type: NodeCategory = 'box',
    x: number,
    y: number,
    connectFromNodeId?: string
  ) => {
    const cat = NODE_CATEGORIES[type] || NODE_CATEGORIES.box;
    const newNodeId = 'node-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newNode: StoryNode = {
      id: newNodeId,
      title: type === 'note' ? 'مذكرة جديدة' : type === 'image' ? 'صورة جديدة' : 'فرعي جديد',
      content: type === 'note' ? 'اضغط لقراءة أو كتابة المقال الكامل...' : 'اكتب هنا تفاصيل المربع...',
      internalNotes: '',
      type,
      color: cat.defaultColor,
      x: Math.round(x),
      y: Math.round(y),
      width: 310,
      height: 160,
      parentId: connectFromNodeId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [cat.name]
    };

    let nextConns = project.connections;
    if (connectFromNodeId) {
      const newConn: StoryConnection = {
        id: 'conn-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        fromNodeId: connectFromNodeId,
        toNodeId: newNodeId,
        label: 'فرع',
        color: cat.defaultColor,
        style: 'solid',
        createdAt: Date.now()
      };
      nextConns = [...nextConns, newConn];
    }

    persistProject({
      ...project,
      nodes: [...project.nodes, newNode],
      connections: nextConns
    });
    setSelectedNodeId(newNodeId);
  };

  const handleMoveNode = (nodeId: string, newX: number, newY: number) => {
    const nextNodes = project.nodes.map((n) =>
      n.id === nodeId ? { ...n, x: newX, y: newY, updatedAt: Date.now() } : n
    );
    persistProject({
      ...project,
      nodes: nextNodes
    });
  };

  const handleSaveNode = (updatedNode: StoryNode) => {
    const nextNodes = project.nodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n
    );
    persistProject({
      ...project,
      nodes: nextNodes
    });
    setExpandedNode(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    const nextNodes = project.nodes.filter((n) => n.id !== nodeId);
    const nextConns = project.connections.filter(
      (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
    );
    persistProject({
      ...project,
      nodes: nextNodes,
      connections: nextConns
    });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    if (expandedNode?.id === nodeId) setExpandedNode(null);
  };

  // --- Handlers for Connections ---
  const handleStartConnectionBetween = (fromNodeId: string, toNodeId: string) => {
    if (fromNodeId === toNodeId) return;
    const sourceNode = project.nodes.find((n) => n.id === fromNodeId);
    const targetNode = project.nodes.find((n) => n.id === toNodeId);
    if (!sourceNode || !targetNode) return;

    // Check if connection already exists
    const existing = project.connections.find(
      (c) =>
        (c.fromNodeId === fromNodeId && c.toNodeId === toNodeId) ||
        (c.fromNodeId === toNodeId && c.toNodeId === fromNodeId)
    );

    setActiveConnectionModal({
      isOpen: true,
      connection: existing || null,
      sourceNode,
      targetNode
    });
  };

  const handleSaveConnection = (conn: StoryConnection) => {
    const exists = project.connections.some((c) => c.id === conn.id);
    const nextConns = exists
      ? project.connections.map((c) => (c.id === conn.id ? conn : c))
      : [...project.connections, conn];

    persistProject({
      ...project,
      connections: nextConns
    });
    setActiveConnectionModal({ isOpen: false, connection: null, sourceNode: null, targetNode: null });
  };

  const handleDeleteConnection = (connectionId: string) => {
    const nextConns = project.connections.filter((c) => c.id !== connectionId);
    persistProject({
      ...project,
      connections: nextConns
    });
    setSelectedConnectionId(null);
  };

  // Jump to specific node (center & zoom)
  const handleJumpToNode = (node: StoryNode) => {
    setSelectedNodeId(node.id);
    const screenW = window.innerWidth;
    const screenH = window.innerHeight - 64;
    const nodeCenter = {
      x: node.x + (node.width || 310) / 2,
      y: node.y + (node.height || 160) / 2
    };

    const targetZoom = 1.05;
    const targetX = screenW / 2 - nodeCenter.x * targetZoom;
    const targetY = screenH / 2 - nodeCenter.y * targetZoom;

    persistProject({
      ...project,
      canvasView: { x: targetX, y: targetY, zoom: targetZoom }
    });
  };

  // Load template
  const handleLoadTemplate = (type: 'detective' | 'blank') => {
    if (
      project.nodes.length > 0 &&
      !window.confirm('هل أنت متأكد؟ سيتم استبدال اللوحة الحالية بالنموذج المختار (يمكنك تصدير نسختك الحالية كـ JSON أولاً).')
    ) {
      return;
    }

    const targetProject = type === 'detective' ? SAMPLE_DETECTIVE_PROJECT : BLANK_PROJECT_TEMPLATE;
    const newProject: StoryProject = {
      ...targetProject,
      id: 'story-' + Date.now(),
      lastSavedAt: Date.now()
    };
    persistProject(newProject);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
  };

  const handleUpdateNode = (updatedNode: StoryNode) => {
    const nextNodes = project.nodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n
    );
    persistProject({
      ...project,
      nodes: nextNodes
    });
  };

  const handleUpdateConnection = (updatedConn: StoryConnection) => {
    const nextConns = project.connections.map((c) =>
      c.id === updatedConn.id ? updatedConn : c
    );
    persistProject({
      ...project,
      connections: nextConns
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-['Cairo',sans-serif] select-none">
      {/* الشريط العلوي */}
      <Navbar
        project={project}
        onUpdateTitle={(newTitle) => persistProject({ ...project, title: newTitle })}
        onUpdateDescription={(newDesc) => persistProject({ ...project, description: newDesc })}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onZoomIn={() =>
          persistProject({
            ...project,
            canvasView: {
              ...project.canvasView,
              zoom: Math.min(project.canvasView.zoom * 1.15, 2.5)
            }
          })
        }
        onZoomOut={() =>
          persistProject({
            ...project,
            canvasView: {
              ...project.canvasView,
              zoom: Math.max(project.canvasView.zoom * 0.85, 0.25)
            }
          })
        }
        onResetZoom={handleCenterView}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        saveStatus={saveStatus}
        onLoadTemplate={handleLoadTemplate}
      />

      {/* منطقة مساحة العمل اللانهائية واللوحة */}
      <main className="relative flex-1 w-full overflow-hidden">
        <Canvas
          nodes={project.nodes}
          connections={project.connections}
          selectedNodeId={selectedNodeId}
          onSelectNode={(node) => setSelectedNodeId(node?.id || null)}
          onExpandNode={(node) => setExpandedNode(node)}
          onEditNode={(node) => setExpandedNode(node)}
          onDeleteNode={handleDeleteNode}
          onUpdateNode={handleUpdateNode}
          selectedConnectionId={selectedConnectionId}
          onSelectConnection={(conn) => setSelectedConnectionId(conn?.id || null)}
          onUpdateConnection={handleUpdateConnection}
          onDeleteConnection={handleDeleteConnection}
          onMoveNode={handleMoveNode}
          canvasView={project.canvasView}
          onUpdateCanvasView={(newView) =>
            setProject((prev) => ({ ...prev, canvasView: newView }))
          }
          canvasMode={canvasMode}
          onStartConnectionBetween={handleStartConnectionBetween}
          onAddNodeAtPosition={handleAddNodeAtPosition}
          isDark={isDark}
        />

        {/* شريط الأدوات العائم لإضافة المربعات وتغيير وضع العمل */}
        <Toolbar
          onAddNode={handleAddNode}
          canvasMode={canvasMode}
          onSetCanvasMode={setCanvasMode}
          onCenterView={handleCenterView}
          nodeCount={project.nodes.length}
          connectionCount={project.connections.length}
          onDragToolStart={(type, x, y) => setDraggingTool({ type, x, y })}
        />

        {/* Ghost drag element */}
        {draggingTool && (
          <div
            className="fixed pointer-events-none z-50 flex items-center justify-center p-3 rounded-xl bg-slate-800/80 border-2 border-amber-400 shadow-2xl opacity-80 scale-105"
            style={{
              left: draggingTool.x,
              top: draggingTool.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-white text-xs font-bold whitespace-nowrap">
              إفلات لإضافة العنصر
            </span>
          </div>
        )}
      </main>

      {/* النافذة المنبثقة للتفاصيل الكاملة والملاحظات */}
      <NodeDetailModal
        node={expandedNode}
        isOpen={!!expandedNode}
        onClose={() => setExpandedNode(null)}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        allNodes={project.nodes}
        connections={project.connections}
        onJumpToNode={handleJumpToNode}
      />

      {/* نافذة تسمية الرابط والعلاقة */}
      <ConnectionModal
        isOpen={activeConnectionModal.isOpen}
        onClose={() =>
          setActiveConnectionModal({ isOpen: false, connection: null, sourceNode: null, targetNode: null })
        }
        connection={activeConnectionModal.connection}
        sourceNode={activeConnectionModal.sourceNode}
        targetNode={activeConnectionModal.targetNode}
        onSave={handleSaveConnection}
        onDelete={handleDeleteConnection}
      />

      {/* نافذة البحث والتصفية */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={project.nodes}
        onSelectNode={handleJumpToNode}
      />

      {/* نافذة التصدير والاستيراد ومشاركة الذكاء الاصطناعي */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        project={project}
        onImportProject={(imported) => {
          persistProject(imported);
          handleCenterView();
        }}
      />

      {/* نافذة دليل التشغيل والاستخدام */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
