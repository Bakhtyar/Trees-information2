import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Square,
  FileText, 
  Image as ImageIcon,
  User, 
  Calendar, 
  MapPin, 
  Lock, 
  Flag, 
  Lightbulb, 
  Link2, 
  Move, 
  Maximize2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Type,
  Undo2,
  Redo2,
  GripVertical,
  Wrench,
  X,
  EyeOff,
  Layers
} from 'lucide-react';
import { NodeCategory, NODE_CATEGORIES } from '../types/story';

export type CanvasMode = 'select' | 'connect';

interface ToolbarProps {
  onAddNode: (type: NodeCategory) => void;
  canvasMode: CanvasMode;
  onSetCanvasMode: (mode: CanvasMode) => void;
  onCenterView: () => void;
  nodeCount: number;
  connectionCount: number;
  onDragToolStart?: (type: NodeCategory, x: number, y: number) => void;
  showCoordinates?: boolean;
  onToggleCoordinates?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  canvasMode,
  onSetCanvasMode,
  onCenterView,
  nodeCount,
  connectionCount,
  onDragToolStart,
  showCoordinates = true,
  onToggleCoordinates,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragToast, setDragToast] = useState<string | null>(null);

  // Position state for dragging the toolbar anywhere
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize position to bottom right default on mount
  useEffect(() => {
    if (position === null) {
      const defaultX = Math.max(20, window.innerWidth - 380);
      const defaultY = Math.max(80, window.innerHeight - 380);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position]);

  // Dragging the toolbar window itself
  const handleToolbarPointerDown = (e: React.PointerEvent) => {
    // Only trigger drag if clicked on the drag handle
    if ((e.target as HTMLElement).closest('.toolbar-drag-handle')) {
      e.preventDefault();
      setIsDraggingToolbar(true);
      const currentX = position?.x || (window.innerWidth - 380);
      const currentY = position?.y || (window.innerHeight - 380);
      dragStartOffsetRef.current = {
        x: e.clientX - currentX,
        y: e.clientY - currentY
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleToolbarPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingToolbar) return;
    e.preventDefault();
    const newX = Math.min(Math.max(10, e.clientX - dragStartOffsetRef.current.x), window.innerWidth - 100);
    const newY = Math.min(Math.max(10, e.clientY - dragStartOffsetRef.current.y), window.innerHeight - 80);
    setPosition({ x: newX, y: newY });
  };

  const handleToolbarPointerUp = (e: React.PointerEvent) => {
    if (isDraggingToolbar) {
      setIsDraggingToolbar(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore pointer release errors
      }
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Square': return <Square className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Image': return <ImageIcon className="w-4 h-4" />;
      case 'User': return <User className="w-4 h-4" />;
      case 'Calendar': return <Calendar className="w-4 h-4" />;
      case 'MapPin': return <MapPin className="w-4 h-4" />;
      case 'Lock': return <Lock className="w-4 h-4" />;
      case 'Flag': return <Flag className="w-4 h-4" />;
      case 'Lightbulb': return <Lightbulb className="w-4 h-4" />;
      case 'Type': return <Type className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  const coreTypes: NodeCategory[] = ['heading', 'box', 'note', 'image'];
  const extraTypes: NodeCategory[] = ['character', 'event', 'place', 'secret', 'ending', 'idea'];

  const handleItemClick = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragToast(`اسحب عنصر "${name}" وأفلته في أي مكان داخل اللوحة!`);
    setTimeout(() => setDragToast(null), 3000);
  };

  // If hidden, render a compact floating toggle button
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-30 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-2xl shadow-amber-500/30 flex items-center gap-2 border border-amber-300 transition-all hover:scale-105 active:scale-95 animate-fadeIn select-none"
        title="إظهار صندوق الأدوات المتنقل"
      >
        <Wrench className="w-4 h-4" />
        <span>صندوق الأدوات</span>
        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
      </button>
    );
  }

  const posX = position ? position.x : (typeof window !== 'undefined' ? window.innerWidth - 380 : 20);
  const posY = position ? position.y : (typeof window !== 'undefined' ? window.innerHeight - 380 : 20);

  return (
    <div
      className="fixed z-30 flex flex-col items-end gap-2 select-none touch-none"
      style={{ left: `${posX}px`, top: `${posY}px` }}
      onPointerDown={handleToolbarPointerDown}
      onPointerMove={handleToolbarPointerMove}
      onPointerUp={handleToolbarPointerUp}
    >
      {dragToast && (
        <div className="bg-amber-500 text-slate-950 px-3 py-2 rounded-xl shadow-2xl text-xs font-bold animate-bounce border-2 border-amber-300 max-w-xs text-center">
          {dragToast}
        </div>
      )}

      {/* النافذة العائمة لصندوق الأدوات */}
      <div className={`bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl transition-all duration-200 overflow-hidden ${
        isDraggingToolbar ? 'ring-2 ring-amber-500/60 shadow-amber-500/20' : ''
      }`}>
        {/* شريط الإمساك والسحب العلوي (Drag Header) */}
        <div className="toolbar-drag-handle flex items-center justify-between px-3 py-2 bg-slate-800/90 border-b border-slate-700/60 cursor-move text-slate-300 hover:bg-slate-800">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-slate-100">صندوق الأدوات (اسحب للتحريك)</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition"
              title={isExpanded ? 'تصغير قائمة الأدوات' : 'توسيع قائمة الأدوات'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition"
              title="إخفاء صندوق الأدوات (يمكن إظهاره بضغطة زر)"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* شريط أدوات التحكم السريعة (التحريك والربط والتراجع والإحداثيات) */}
        <div className="p-2 border-b border-slate-800 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onSetCanvasMode('select')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              canvasMode === 'select'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800 bg-slate-800/60 border border-slate-700/50'
            }`}
            title="سحب وتحريك المربعات واللوحة (V)"
          >
            <Move className="w-3.5 h-3.5" />
            <span>تحريك</span>
          </button>

          <button
            onClick={() => onSetCanvasMode('connect')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              canvasMode === 'connect'
                ? 'bg-cyan-500 text-slate-950 shadow-md animate-pulse'
                : 'text-slate-300 hover:bg-slate-800 bg-slate-800/60 border border-slate-700/50'
            }`}
            title="وضع الربط السريع: اضغط على مربع أول ثم ثانٍ لربطهما (C)"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>ربط</span>
          </button>

          {/* أزرار التراجع والإعادة */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                canUndo
                  ? 'hover:bg-slate-700 text-amber-400 hover:text-amber-300'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="تراجع عن خطوة (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                canRedo
                  ? 'hover:bg-slate-700 text-cyan-400 hover:text-cyan-300'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="إعادة للتقدم (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {onToggleCoordinates && (
            <button
              onClick={onToggleCoordinates}
              className={`p-1.5 rounded-xl text-xs font-bold transition border ${
                showCoordinates
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={showCoordinates ? 'إخفاء الشبكة المكانية' : 'إظهار الشبكة المكانية'}
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}

          
        </div>

        {/* قائمة إضافة عناصر جديدة */}
        {isExpanded && (
          <div className="p-3 w-80 max-w-[calc(100vw-40px)] space-y-3 dir-rtl text-right">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة عناصر للوحة</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                {nodeCount} مربع • {connectionCount} رابط
              </span>
            </div>

            {/* العناصر الأساسية الأربعة */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                العناصر الأساسية:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {coreTypes.map((catKey) => {
                  const cat = NODE_CATEGORIES[catKey];
                  return (
                    <button
                      key={cat.id}
                      onClick={(e) => handleItemClick(e, cat.name)}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/node-type', cat.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onPointerDown={(e) => {
                        if (onDragToolStart) onDragToolStart(cat.id as NodeCategory, e.clientX, e.clientY);
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-xl text-center transition bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400 group cursor-grab active:cursor-grabbing"
                      title="اسحب العنصر وأفلته في اللوحة لإضافته"
                    >
                      <span
                        className="p-1.5 rounded-lg mb-1 shrink-0 transition group-hover:scale-110 shadow-sm"
                        style={{ backgroundColor: `${cat.defaultColor}25`, color: cat.defaultColor }}
                      >
                        {getIcon(cat.icon)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* تصنيفات فرعية للقصة */}
            <details className="pt-2 border-t border-slate-800 group">
              <summary className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer font-medium select-none flex items-center justify-between">
                <span>تصنيفات أخرى (شخصية، مكان، حدث...)</span>
                <ChevronDown className="w-3.5 h-3.5 transition group-open:rotate-180" />
              </summary>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {extraTypes.map((catKey) => {
                  const cat = NODE_CATEGORIES[catKey];
                  return (
                    <button
                      key={cat.id}
                      onClick={(e) => handleItemClick(e, cat.name)}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/node-type', cat.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onPointerDown={(e) => {
                        if (onDragToolStart) onDragToolStart(cat.id as NodeCategory, e.clientX, e.clientY);
                      }}
                      className="flex items-center gap-2 p-1.5 rounded-xl text-right transition bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-500 cursor-grab active:cursor-grabbing"
                      title="اسحب العنصر وأفلته على اللوحة"
                    >
                      <span
                        className="p-1 rounded-lg shrink-0"
                        style={{ backgroundColor: `${cat.defaultColor}20`, color: cat.defaultColor }}
                      >
                        {getIcon(cat.icon)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-300 truncate">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};
