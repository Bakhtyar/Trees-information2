import React, { useState } from 'react';
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
  Type
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
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  canvasMode,
  onSetCanvasMode,
  onCenterView,
  nodeCount,
  connectionCount,
  onDragToolStart
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

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

  const [dragToast, setDragToast] = useState<string | null>(null);

  const handleItemClick = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragToast(`اسحب عنصر "${name}" وأفلته في أي مكان داخل اللوحة لإضافته!`);
    setTimeout(() => setDragToast(null), 3000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-20 flex flex-col items-end gap-2 select-none">
      {dragToast && (
        <div className="bg-amber-500 text-slate-950 px-3 py-2 rounded-xl shadow-2xl text-xs font-bold animate-bounce border-2 border-amber-300 max-w-xs text-center">
          {dragToast}
        </div>
      )}

      {/* شريط الأزرار العلوي: وضع العمل وإحصائيات سريعة */}
      <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl">
        <button
          onClick={() => onSetCanvasMode('select')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
            canvasMode === 'select'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="سحب وتحريك المربعات واللوحة (V)"
        >
          <Move className="w-4 h-4" />
          <span>تحديد وتحريك</span>
        </button>

        <button
          onClick={() => onSetCanvasMode('connect')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
            canvasMode === 'connect'
              ? 'bg-cyan-500 text-slate-950 shadow-md animate-pulse'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="وضع الربط السريع: اضغط على مربع أول ثم مربع ثانٍ لربطهما بخط وسهم (C)"
        >
          <Link2 className="w-4 h-4" />
          <span>ربط المربعات</span>
        </button>

        <div className="h-6 w-px bg-slate-700 mx-1" />

        <button
          onClick={onCenterView}
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition"
          title="توسيط اللوحة وعرض كل العناصر (Space)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition"
          title={isExpanded ? 'تصغير قائمة الإضافة' : 'إظهار قائمة الإضافة'}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* قائمة إضافة عناصر جديدة */}
      {isExpanded && (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-2xl w-80 max-w-[calc(100vw-40px)]">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة عنصر للوحة</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {nodeCount} مربع • {connectionCount} رابط
            </span>
          </div>

          {/* العناصر الأساسية الأربعة (العنوان، المربع، المذكرة، الصورة) */}
          <div className="mb-2">
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
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400 group cursor-grab active:cursor-grabbing touch-none"
                    title="اسحب العنصر وأفلت في المكان المطلوب على اللوحة لإضافته"
                  >
                    <span
                      className="p-2 rounded-xl mb-1 shrink-0 transition group-hover:scale-110 shadow-sm"
                      style={{ backgroundColor: `${cat.defaultColor}25`, color: cat.defaultColor }}
                    >
                      {getIcon(cat.icon)}
                    </span>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* عناصر فرعية إضافية */}
          <details className="mt-2 pt-2 border-t border-slate-800 group">
            <summary className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer font-medium select-none flex items-center justify-between">
              <span>تصنيفات أخرى للقصة (شخصيات، أماكن، أحداث...)</span>
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
                    className="flex items-center gap-2 p-2 rounded-xl text-right transition bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-500 cursor-grab active:cursor-grabbing touch-none"
                    title="اسحب العنصر وأفلته في أي مكان على اللوحة لإضافته"
                  >
                    <span
                      className="p-1 rounded-lg shrink-0"
                      style={{ backgroundColor: `${cat.defaultColor}20`, color: cat.defaultColor }}
                    >
                      {getIcon(cat.icon)}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 truncate">
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
  );
};
