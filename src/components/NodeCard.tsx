import React, { useState, useRef } from 'react';
import { 
  Square,
  FileText, 
  Image as ImageIcon,
  User, 
  Calendar, 
  MapPin, 
  Lock, 
  Flag, 
  Lightbulb, 
  Maximize2, 
  Edit3, 
  Trash2, 
  Link2, 
  Upload,
  Type,
  Palette,
  Scaling,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { StoryNode, NODE_CATEGORIES, FontStyleOption, FontSizeOption, NODE_PALETTE_COLORS } from '../types/story';

interface NodeCardProps {
  node: StoryNode;
  isSelected: boolean;
  sequenceNumber?: number;
  isChildNode?: boolean;
  isHoveredTarget?: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onExpand: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onStartConnect: (e: React.MouseEvent) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, anchorPos: 'top' | 'right' | 'bottom' | 'left', nodeId: string) => void;
  onDragStart: (e: React.PointerEvent | React.MouseEvent | React.TouchEvent, node: StoryNode) => void;
  onUpdateNode?: (updatedNode: StoryNode) => void;
  isConnectingSource: boolean;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  sequenceNumber = 1,
  isChildNode = false,
  isHoveredTarget = false,
  onSelect,
  onExpand,
  onEdit,
  onDelete,
  onStartConnect,
  onAnchorPointerDown,
  onDragStart,
  onUpdateNode,
  isConnectingSource
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(node.title);
  const [inlineContent, setInlineContent] = useState(node.content);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cat = NODE_CATEGORIES[node.type] || NODE_CATEGORIES.box;
  // Fixed theme for Note element (no custom color modification), standard card color for others
  const isNoteType = node.type === 'note';
  const isImageType = node.type === 'image';
  const isBoxType = node.type === 'box';
  const isHeadingType = node.type === 'heading';

  const cardColor = isNoteType ? '#fbbf24' : isHeadingType ? 'transparent' : (node.color || cat.defaultColor);

  // Get CSS font family class
  const getFontFamilyClass = (font?: FontStyleOption) => {
    if (isNoteType) return "font-serif";
    switch (font) {
      case 'amiri': return "font-['Amiri',serif]";
      case 'tajawal': return "font-['Tajawal',sans-serif]";
      case 'ibm': return "font-['IBM_Plex_Sans_Arabic',sans-serif]";
      case 'courier': return "font-mono";
      default: return "font-['Cairo',sans-serif]";
    }
  };

  // Get CSS font size class
  const getFontSizeClass = (size?: FontSizeOption) => {
    if (isNoteType) return "text-sm sm:text-base";
    if (isHeadingType) {
      switch (size) {
        case 'sm': return 'text-3xl sm:text-4xl';
        case 'base': return 'text-4xl sm:text-5xl';
        case 'lg': return 'text-5xl sm:text-6xl';
        case 'xl': return 'text-6xl sm:text-7xl';
        default: return 'text-4xl sm:text-5xl';
      }
    }
    switch (size) {
      case 'sm': return 'text-xs sm:text-sm';
      case 'lg': return 'text-base sm:text-lg';
      case 'xl': return 'text-lg sm:text-xl';
      case '2xl': return 'text-xl sm:text-2xl';
      default: return 'text-sm sm:text-base';
    }
  };

  // Handle local image file upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateNode) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdateNode({
          ...node,
          imageUrl: dataUrl,
          updatedAt: Date.now()
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Corner resize handling (4 corners)
  const handleCornerResizeStart = (e: React.PointerEvent, corner: 'nw' | 'ne' | 'se' | 'sw') => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = node.width || 310;
    const startH = node.height || 160;
    const startNodeX = node.x;
    const startNodeY = node.y;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      let newWidth = startW;
      let newHeight = startH;
      let newX = startNodeX;
      let newY = startNodeY;

      if (corner === 'se') {
        newWidth = Math.max(220, startW + dx);
        newHeight = Math.max(120, startH + dy);
      } else if (corner === 'sw') {
        newWidth = Math.max(220, startW - dx);
        newHeight = Math.max(120, startH + dy);
        newX = startNodeX + (startW - newWidth);
      } else if (corner === 'ne') {
        newWidth = Math.max(220, startW + dx);
        newHeight = Math.max(120, startH - dy);
        newY = startNodeY + (startH - newHeight);
      } else if (corner === 'nw') {
        newWidth = Math.max(220, startW - dx);
        newHeight = Math.max(120, startH - dy);
        newX = startNodeX + (startW - newWidth);
        newY = startNodeY + (startH - newHeight);
      }

      if (onUpdateNode) {
        onUpdateNode({
          ...node,
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
          updatedAt: Date.now()
        });
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      data-node-id={node.id}
      className={`absolute select-none cursor-move transition-all duration-150 overflow-visible ${
        isNoteType 
          ? 'bg-amber-50/95 dark:bg-[#fdfbf7] text-slate-900 shadow-xl rounded-sm'
          : isHeadingType
          ? 'text-slate-100 shadow-xl rounded-2xl backdrop-blur-md'
          : 'bg-slate-900/95 dark:bg-slate-900/95 text-slate-100 shadow-xl rounded-2xl backdrop-blur-md'
      } ${isChildNode && !isNoteType && !isHeadingType ? 'border-dashed' : ''} ${
        isHoveredTarget
          ? 'ring-4 ring-cyan-400 scale-105 shadow-2xl z-30'
          : isSelected
          ? 'ring-4 ring-amber-500/70 shadow-2xl z-20'
          : isConnectingSource
          ? 'ring-4 ring-cyan-500 animate-pulse z-20'
          : 'hover:shadow-2xl z-10'
      }`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width || 310}px`,
        minHeight: `${node.height || 160}px`,
        borderTopWidth: isNoteType ? '0px' : '5px',
        borderTopColor: cardColor,
        backgroundColor: isHeadingType ? (node.backgroundColor || 'rgba(15, 23, 42, 0.95)') : undefined,
        borderRightWidth: (isNoteType || isHeadingType) ? '0px' : '1px',
        borderRightColor: isSelected ? '#f59e0b' : '#334155',
        borderBottomWidth: (isNoteType || isHeadingType) ? '0px' : '1px',
        borderBottomColor: isSelected ? '#f59e0b' : '#334155',
        borderLeftWidth: (isNoteType || isHeadingType) ? '0px' : '1px',
        borderLeftColor: isSelected ? '#f59e0b' : '#334155',
        boxShadow: isNoteType ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)' : undefined,
        touchAction: 'none'
      }}
      onClick={onSelect}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDragStart(e, node);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 0. Top Sequential Number Badge (الترتيب والتسلسل الهرمي) */}
      <div 
        className={`absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-2.5 py-0.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1 border transition-all pointer-events-none select-none ${
          isChildNode 
            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/90 ring-2 ring-cyan-500/30' 
            : 'bg-amber-950 text-amber-300 border-amber-500/90 ring-2 ring-amber-500/30'
        }`}
      >
        {isChildNode ? (
          <>
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>فرعي #{sequenceNumber}</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
            <span>رئيسي #{sequenceNumber}</span>
          </>
        )}
      </div>
      {/* 1. Floating Toolbar when selected (شريط أدوات عائم للعنصر) */}
      {isSelected && (
        <div 
          className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border-2 border-amber-500 text-slate-100 rounded-2xl shadow-2xl px-2 py-1.5 flex items-center gap-1.5 backdrop-blur-lg animate-in fade-in zoom-in duration-150 whitespace-nowrap select-none"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* حذف */}
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
            title="حذف هذا المربع"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">حذف</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          {/* تعديل النص */}
          <button
            onClick={(e) => {
              if (isNoteType) {
                onExpand(e);
              } else {
                setIsEditingInline(!isEditingInline);
              }
            }}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
            title="تعديل الكتابة مباشرة"
          >
            <Edit3 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">تعديل</span>
          </button>

          {/* نوع الخط */}
          {!isNoteType && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowFontPicker(!showFontPicker);
                  setShowColorPicker(false);
                  setShowSizePicker(false);
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                title="تغيير نوع/شكل الخط"
              >
                <Type className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">الخط</span>
              </button>

              {showFontPicker && (
                <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl flex flex-col gap-1 w-36 z-50">
                  <span className="text-[10px] text-slate-400 px-1 font-bold">اختر الخط:</span>
                  {[
                    { id: 'cairo', name: 'Cairo (افتراضي)' },
                    { id: 'amiri', name: 'أميري (عربي تقليدي)' },
                    { id: 'tajawal', name: 'تجول (عصري)' },
                    { id: 'ibm', name: 'IBM Plex' },
                    { id: 'courier', name: 'Monospace' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        if (onUpdateNode) {
                          onUpdateNode({ ...node, fontFamily: f.id as FontStyleOption });
                        }
                        setShowFontPicker(false);
                      }}
                      className={`px-2 py-1 text-xs text-right rounded-lg hover:bg-slate-800 transition ${
                        node.fontFamily === f.id ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-200'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* لون المربع (يُخفى للمذكرة لأنها تعتمد مظهراً ثابتاً للمستند) */}
          {!isNoteType && !isHeadingType && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowFontPicker(false);
                  setShowSizePicker(false);
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                title="تغيير لون المربع"
              >
                <Palette className="w-4 h-4" style={{ color: cardColor }} />
                <span className="hidden sm:inline">اللون</span>
              </button>

              {showColorPicker && (
                <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1.5 w-40 z-50">
                  {NODE_PALETTE_COLORS.map((p) => (
                    <button
                      key={p.hex}
                      onClick={() => {
                        if (onUpdateNode) {
                          onUpdateNode({ ...node, color: p.hex });
                        }
                        setShowColorPicker(false);
                      }}
                      className={`w-7 h-7 rounded-lg border transition hover:scale-110 ${
                        node.color === p.hex ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {isHeadingType && (
            <>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBgColorPicker(!showBgColorPicker);
                    setShowTextColorPicker(false);
                    setShowFontPicker(false);
                    setShowSizePicker(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                  title="تغيير لون الخلفية"
                >
                  <Palette className="w-4 h-4" style={{ color: node.backgroundColor || '#0f172a' }} />
                  <span className="hidden sm:inline">الخلفية</span>
                </button>

                {showBgColorPicker && (
                  <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1.5 w-40 z-50">
                    {NODE_PALETTE_COLORS.map((p) => (
                      <button
                        key={p.hex}
                        onClick={() => {
                          if (onUpdateNode) {
                            onUpdateNode({ ...node, backgroundColor: p.hex });
                          }
                          setShowBgColorPicker(false);
                        }}
                        className={`w-7 h-7 rounded-lg border transition hover:scale-110 ${
                          node.backgroundColor === p.hex ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                      />
                    ))}
                    <button
                        onClick={() => {
                          if (onUpdateNode) {
                            onUpdateNode({ ...node, backgroundColor: 'transparent' });
                          }
                          setShowBgColorPicker(false);
                        }}
                        className={`w-7 h-7 rounded-lg border transition hover:scale-110 ${
                          node.backgroundColor === 'transparent' ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                        }`}
                        style={{ background: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px' }}
                        title={'شفاف'}
                      />
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTextColorPicker(!showTextColorPicker);
                    setShowBgColorPicker(false);
                    setShowFontPicker(false);
                    setShowSizePicker(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                  title="تغيير لون النص"
                >
                  <div className="w-4 h-4 rounded-full border border-slate-500" style={{ backgroundColor: node.textColor || node.color || cat.defaultColor }} />
                  <span className="hidden sm:inline">النص</span>
                </button>

                {showTextColorPicker && (
                  <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1.5 w-40 z-50">
                    {NODE_PALETTE_COLORS.map((p) => (
                      <button
                        key={p.hex}
                        onClick={() => {
                          if (onUpdateNode) {
                            onUpdateNode({ ...node, textColor: p.hex });
                          }
                          setShowTextColorPicker(false);
                        }}
                        className={`w-7 h-7 rounded-lg border transition hover:scale-110 ${
                          node.textColor === p.hex ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                      />
                    ))}
                    <button
                        onClick={() => {
                          if (onUpdateNode) {
                            onUpdateNode({ ...node, textColor: '#f8fafc' });
                          }
                          setShowTextColorPicker(false);
                        }}
                        className={`w-7 h-7 rounded-lg border transition hover:scale-110 ${
                          node.textColor === '#f8fafc' ? 'ring-2 ring-cyan-400 border-transparent' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: '#f8fafc' }}
                        title={'أبيض'}
                      />
                  </div>
                )}
              </div>
            </>
          )}

          {/* حجم النص */}
          {!isNoteType && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowSizePicker(!showSizePicker);
                  setShowColorPicker(false);
                  setShowFontPicker(false);
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                title="تغيير حجم النص"
              >
                <Scaling className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">حجم النص</span>
              </button>

              {showSizePicker && (
                <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl flex flex-col gap-1 w-28 z-50">
                  {[
                    { id: 'sm', label: 'صغير (S)' },
                    { id: 'base', label: 'متوسط (M)' },
                    { id: 'lg', label: 'كبير (L)' },
                    { id: 'xl', label: 'كبير جداً (XL)' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (onUpdateNode) {
                          onUpdateNode({ ...node, fontSize: s.id as FontSizeOption });
                        }
                        setShowSizePicker(false);
                      }}
                      className={`px-2 py-1 text-xs text-right rounded-lg hover:bg-slate-800 transition ${
                        node.fontSize === s.id ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* زر التوسيع للمذكرة */}
          {isNoteType && (
            <button
              onClick={onExpand}
              className="p-1.5 hover:bg-amber-500/20 text-amber-400 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="عرض المقالة الكاملة والتعديل الممتد"
            >
              <Maximize2 className="w-4 h-4" />
              <span>قراءة/توسيع</span>
            </button>
          )}

          {/* زر الصورة */}
          {isImageType && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="تغيير الصورة من المعرض"
            >
              <Upload className="w-4 h-4" />
              <span>رفع صورة</span>
            </button>
          )}
        </div>
      )}

      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* 2. Four Connection Anchors (نقاط الربط الأربعة - تظهر فقط عند تحديد العنصر) */}
      {isSelected && (
        <>
          {/* Top Anchor */}
          <button
            onClick={onStartConnect}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (onAnchorPointerDown) onAnchorPointerDown(e, 'top', node.id);
            }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-500 hover:bg-cyan-400 border-2 border-slate-900 text-slate-950 flex items-center justify-center shadow-xl hover:scale-125 transition cursor-crosshair z-40 animate-in fade-in zoom-in duration-150"
            title="اسحب للخارج للربط أو لإنشاء مربع فرعي جديد"
          >
            <Link2 className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          {/* Right Anchor */}
          <button
            onClick={onStartConnect}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (onAnchorPointerDown) onAnchorPointerDown(e, 'right', node.id);
            }}
            className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-cyan-500 hover:bg-cyan-400 border-2 border-slate-900 text-slate-950 flex items-center justify-center shadow-xl hover:scale-125 transition cursor-crosshair z-40 animate-in fade-in zoom-in duration-150"
            title="اسحب للخارج للربط أو لإنشاء مربع فرعي جديد"
          >
            <Link2 className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          {/* Bottom Anchor */}
          <button
            onClick={onStartConnect}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (onAnchorPointerDown) onAnchorPointerDown(e, 'bottom', node.id);
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-500 hover:bg-cyan-400 border-2 border-slate-900 text-slate-950 flex items-center justify-center shadow-xl hover:scale-125 transition cursor-crosshair z-40 animate-in fade-in zoom-in duration-150"
            title="اسحب للخارج للربط أو لإنشاء مربع فرعي جديد"
          >
            <Link2 className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          {/* Left Anchor */}
          <button
            onClick={onStartConnect}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (onAnchorPointerDown) onAnchorPointerDown(e, 'left', node.id);
            }}
            className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-cyan-500 hover:bg-cyan-400 border-2 border-slate-900 text-slate-950 flex items-center justify-center shadow-xl hover:scale-125 transition cursor-crosshair z-40 animate-in fade-in zoom-in duration-150"
            title="اسحب للخارج للربط أو لإنشاء مربع فرعي جديد"
          >
            <Link2 className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </>
      )}

      {/* 3. Header Tag / Title Bar */}
      {!isHeadingType && (
        <div className={`px-3.5 py-2 flex items-center justify-between border-b ${isNoteType ? 'border-amber-900/10 bg-amber-900/5' : 'border-slate-800 bg-slate-800/40'}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span 
              className="p-1 rounded-lg shrink-0 shadow-sm"
              style={isNoteType ? { backgroundColor: '#fbbf24', color: '#78350f' } : { backgroundColor: `${cardColor}25`, color: cardColor }}
            >
              {isNoteType && <FileText className="w-3.5 h-3.5" />}
              {isImageType && <ImageIcon className="w-3.5 h-3.5" />}
              {isBoxType && <Square className="w-3.5 h-3.5" />}
              {!isNoteType && !isImageType && !isBoxType && <FileText className="w-3.5 h-3.5" />}
            </span>

            <span className={`text-xs font-bold truncate ${isNoteType ? 'text-amber-900' : 'text-slate-300'}`}>
              {isNoteType ? 'مذكرة (Note)' : cat.name}
            </span>
          </div>

          {/* Note expand button badge */}
          {isNoteType && (
            <button
              onClick={onExpand}
              className="text-[11px] font-bold bg-amber-500 text-amber-950 hover:bg-amber-400 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm transition"
              title="توسيع المذكرة لقراءة المقال الكامل"
            >
              <span>فتح المستند</span>
              <ChevronRight className="w-3 h-3 rotate-180" />
            </button>
          )}
        </div>
      )}

      {/* 4. Main Card Content (Body) */}
      <div className={`p-4 ${getFontFamilyClass(node.fontFamily)}`}>
        {/* If Image Element -> Display Image */}
        {isImageType ? (
          <div className="flex flex-col items-center gap-2">
            {node.imageUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group/img">
                <img 
                  src={node.imageUrl} 
                  alt={node.title} 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center gap-1 text-white text-xs font-bold"
                >
                  <Upload className="w-4 h-4" />
                  <span>تغيير الصورة</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl bg-slate-950/50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 transition cursor-pointer p-4"
              >
                <Upload className="w-6 h-6 text-emerald-500" />
                <span className="text-xs font-bold">اضغط هنا لإضافة صورة من جهازك</span>
              </button>
            )}

            <h3 className={`font-bold text-slate-100 text-center ${getFontSizeClass(node.fontSize)} mt-1`}>
              {node.title || 'صورة بدون عنوان'}
            </h3>
          </div>
        ) : isEditingInline ? (
          /* Inline Edit Mode */
          <div className="space-y-2 select-text" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              placeholder="العنوان..."
              className={`w-full bg-slate-950 border border-amber-500 text-slate-100 px-2.5 py-1 rounded-lg focus:outline-none ${isHeadingType ? 'text-2xl font-black text-center' : 'text-sm font-bold'}`}
            />
            {!isHeadingType && (
              <textarea
                value={inlineContent}
                onChange={(e) => setInlineContent(e.target.value)}
                placeholder="اكتب المحتوى هنا..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-amber-500 resize-none"
              />
            )}
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => {
                  if (onUpdateNode) {
                    onUpdateNode({
                      ...node,
                      title: inlineTitle.trim() || 'بدون عنوان',
                      content: inlineContent,
                      updatedAt: Date.now()
                    });
                  }
                  setIsEditingInline(false);
                }}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold"
              >
                حفظ
              </button>
              <button
                onClick={() => setIsEditingInline(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          /* Standard Display Area */
          <div className="select-none text-center">
            <h3 
              className={`font-black leading-tight ${isNoteType ? 'text-amber-950 border-b border-amber-900/10 pb-1 mb-2' : isHeadingType ? 'text-shadow-md' : 'text-slate-100 mb-1.5'} ${getFontSizeClass(node.fontSize)}`}
              style={isHeadingType ? { color: node.textColor || node.color || cat.defaultColor } : undefined}
            >
              {node.title || (isNoteType ? 'عنوان الملاحظة' : isHeadingType ? 'عنوان رئيسي' : 'بدون عنوان')}
            </h3>

            {!isHeadingType && (
              <p className={`line-clamp-4 leading-relaxed ${isNoteType ? 'text-amber-950/80 font-serif' : 'text-slate-300 font-[\'Cairo\',sans-serif]'} ${getFontSizeClass(node.fontSize)} opacity-90`}>
                {node.content || (isNoteType ? 'اضغط على "فتح المستند" لكتابة وقراءة التفاصيل الكاملة...' : 'اكتب نص المربع هنا...')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 5. Four Corner Resize Handles (مقابض التحكم بالحجم للأركان الأربعة) */}
      {isSelected && (
        <>
          {/* Top-Left Corner Handle */}
          <div
            onPointerDown={(e) => handleCornerResizeStart(e, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 cursor-nwse-resize shadow-lg hover:scale-125 transition z-30"
            title="سحب لتغيير الحجم من الزاوية"
          />
          {/* Top-Right Corner Handle */}
          <div
            onPointerDown={(e) => handleCornerResizeStart(e, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 cursor-nesw-resize shadow-lg hover:scale-125 transition z-30"
            title="سحب لتغيير الحجم من الزاوية"
          />
          {/* Bottom-Right Corner Handle */}
          <div
            onPointerDown={(e) => handleCornerResizeStart(e, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 cursor-nwse-resize shadow-lg hover:scale-125 transition z-30"
            title="سحب لتغيير الحجم من الزاوية"
          />
          {/* Bottom-Left Corner Handle */}
          <div
            onPointerDown={(e) => handleCornerResizeStart(e, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 cursor-swne-resize shadow-lg hover:scale-125 transition z-30"
            title="سحب لتغيير الحجم من الزاوية"
          />
        </>
      )}
    </div>
  );
};
