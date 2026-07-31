import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  MapPin, 
  Lock, 
  Flag, 
  FileText, 
  Lightbulb, 
  StickyNote, 
  Tag, 
  Palette, 
  Trash2, 
  Save, 
  Link2,
  ArrowRight
} from 'lucide-react';
import { 
  StoryNode, 
  NodeCategory, 
  NODE_CATEGORIES, 
  NODE_PALETTE_COLORS,
  StoryConnection
} from '../types/story';

interface NodeDetailModalProps {
  node: StoryNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: StoryNode) => void;
  onDelete: (nodeId: string) => void;
  allNodes: StoryNode[];
  connections: StoryConnection[];
  onJumpToNode: (node: StoryNode) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
  allNodes,
  connections,
  onJumpToNode
}) => {
  if (!isOpen || !node) return null;

  const [title, setTitle] = useState(node.title);
  const [content, setContent] = useState(node.content);
  const [internalNotes, setInternalNotes] = useState(node.internalNotes || '');
  const [type, setType] = useState<NodeCategory>(node.type);
  const [color, setColor] = useState(node.color);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(node.tags || []);

  useEffect(() => {
    setTitle(node.title);
    setContent(node.content);
    setInternalNotes(node.internalNotes || '');
    setType(node.type);
    setColor(node.color);
    setTags(node.tags || []);
  }, [node]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  const handleSave = () => {
    onSave({
      ...node,
      title: title.trim() || 'عنصر بدون عنوان',
      content,
      internalNotes,
      type,
      color,
      tags,
      updatedAt: Date.now()
    });
    onClose();
  };

  // Find connections related to this node
  const outgoing = connections.filter((c) => c.fromNodeId === node.id);
  const incoming = connections.filter((c) => c.toNodeId === node.id);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'User': return <User className="w-4 h-4" />;
      case 'Calendar': return <Calendar className="w-4 h-4" />;
      case 'MapPin': return <MapPin className="w-4 h-4" />;
      case 'Lock': return <Lock className="w-4 h-4" />;
      case 'Flag': return <Flag className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Lightbulb': return <Lightbulb className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (node.type === 'note') {
    return (
      <div className="fixed inset-0 z-50 flex justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden">
        {/* Document Editor view */}
        <div className="relative w-full h-full sm:max-w-5xl bg-[#f5f3ef] sm:rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-900 border border-amber-900/10">
          
          {/* Document Header Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#fdfbf7] border-b border-amber-900/10 shadow-sm shrink-0 z-10">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shadow-inner">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                   <h2 className="text-xs font-bold text-amber-700/80 uppercase tracking-wider">مذكرة (Document)</h2>
                   <p className="text-[10px] font-bold text-amber-900/40">يتم الحفظ تلقائياً</p>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
               <button
                 type="button"
                 onClick={() => {
                    if (window.confirm('هل أنت متأكد من حذف هذا المربع نهائيًا؟')) {
                      onDelete(node.id);
                      onClose();
                    }
                 }}
                 className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                 title="حذف المذكرة"
               >
                 <Trash2 className="w-5 h-5" />
               </button>
               <button
                 onClick={handleSave}
                 className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition shadow-md"
               >
                 <span>رجوع وإغلاق</span>
                 <ArrowRight className="w-4 h-4" />
               </button>
             </div>
          </div>
          
          {/* Document Content Canvas */}
          <div className="flex-1 overflow-y-auto w-full flex flex-col items-center bg-[#f5f3ef] p-0 sm:p-8">
             <div className="w-full max-w-3xl bg-[#fdfbf7] min-h-full sm:min-h-[85vh] p-8 sm:p-16 shadow-sm border-x border-b sm:border border-amber-900/10 sm:rounded-sm flex flex-col relative">
                
                {/* Title */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان الوثيقة..."
                  className="w-full bg-transparent text-3xl sm:text-4xl font-black text-amber-950 mb-8 pb-4 border-b-2 border-amber-900/10 focus:outline-none focus:border-amber-500 transition-colors font-serif leading-tight placeholder-amber-900/20"
                />
                
                {/* Main Content */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب محتوى المذكرة هنا..."
                  className="w-full bg-transparent text-lg text-amber-950/90 leading-relaxed focus:outline-none resize-none flex-1 min-h-[400px] font-serif placeholder-amber-900/30"
                />

                {/* Meta details at bottom of page (Internal notes & Tags) */}
                <div className="mt-16 pt-8 border-t border-amber-900/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Internal Notes */}
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                        <StickyNote className="w-4 h-4" />
                        <span>ملاحظات جانبية (للكاتب فقط)</span>
                      </label>
                      <textarea
                        rows={4}
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="أضف ملاحظاتك الخاصة هنا..."
                        className="w-full bg-amber-50/50 border border-amber-900/10 rounded-xl px-4 py-3 text-sm text-amber-900 focus:outline-none focus:border-amber-400 transition leading-relaxed resize-none placeholder-amber-900/40"
                      />
                    </div>
                    
                    {/* Tags */}
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                        <Tag className="w-4 h-4" />
                        <span>وسوم المذكرة</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-amber-100/50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold"
                          >
                            <span>#{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(idx)}
                              className="hover:text-red-500 transition ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="أضف وسماً (مثال: #فصل_أول) + Enter"
                        className="w-full bg-transparent border border-amber-900/10 rounded-xl px-4 py-2.5 text-sm text-amber-900 focus:outline-none focus:border-amber-400 transition placeholder-amber-900/30"
                      />
                    </div>
                  </div>
                </div>

             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ borderTopWidth: '8px', borderTopColor: color }}
      >
        {/* شريط العنوان واختيار الفئة */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="p-2.5 rounded-xl text-white shadow-md shrink-0"
              style={{ backgroundColor: color }}
            >
              {getIcon(NODE_CATEGORIES[type]?.icon || 'FileText')}
            </span>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-400">
                تعديل وتفاصيل المربع • {NODE_CATEGORIES[type]?.name}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 truncate">
                {title || 'عنصر بدون عنوان'}
              </h2>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="p-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
            title="رجوع وحفظ تلقائي للمقالة"
          >
            <X className="w-5 h-5" />
            <span>إغلاق وحفظ</span>
          </button>
        </div>

        {/* محتوى النافذة القابل للتمرير */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. اختيار نوع العنصر (شخصية، حدث، سر...) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              نوع العنصر في القصة / التحقيق:
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(NODE_CATEGORIES) as NodeCategory[]).map((catKey) => {
                const cat = NODE_CATEGORIES[catKey];
                const isCurrent = type === catKey;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setType(catKey);
                      if (color === NODE_CATEGORIES[type].defaultColor) {
                        setColor(cat.defaultColor);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border transition ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span style={{ color: cat.defaultColor }}>
                      {getIcon(cat.icon)}
                    </span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. تخصيص لون المربع */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>لون المربع والتمييز:</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {NODE_PALETTE_COLORS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => setColor(col.hex)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    color === col.hex ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}

              {/* اختيار لون مخصص */}
              <label className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                />
                <span>لون آخر</span>
              </label>
            </div>
          </div>

          {/* 3. عنوان المربع */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              عنوان المربع / الشخصية / الحدث:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: المحقق كامل، أو انقطاع الكهرباء في ليلة العاصفة..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* 4. النص الكامل والمحتوى الرئيسي للقصة */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>المحتوى الكامل للمربع / تفاصيل الحدث أو الشخصية:</span>
              <span className="text-slate-500 font-normal">{content.length} حرف</span>
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب هنا كل التفاصيل، الحوار المقترح، الخلفية الدرامية للشخصية، أو الدليل السري..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-base text-slate-100 focus:outline-none focus:border-amber-500 transition leading-relaxed"
            />
          </div>

          {/* 5. ملاحظات داخلية سرية للكاتب */}
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4">
            <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
              <StickyNote className="w-4 h-4" />
              <span>ملاحظات داخلية خاصة داخل المربع (للمؤلف فقط):</span>
            </label>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="مثال: يجب مراجعة هذا الحدث مع الفصل الرابع، أو هذا هو دافع الجريمة الحقيقي..."
              className="w-full bg-slate-900/80 border border-amber-800/50 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-500 transition leading-relaxed"
            />
          </div>

          {/* 6. الوسوم (Tags) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>الوسوم والتصنيفات (اضغط Enter للإضافة):</span>
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="hover:text-red-400 transition ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="اكتب وسمًا مثل: #بطل_القصة أو #الفصل_الأول ثم اضغط Enter..."
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* 7. قائمة الروابط والعلاقات المتصلة بهذا المربع */}
          {(outgoing.length > 0 || incoming.length > 0) && (
            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-amber-400" />
                <span>الروابط والعلاقات المرتبطة بهذا المربع ({outgoing.length + incoming.length}):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {outgoing.map((conn) => {
                  const target = allNodes.find((n) => n.id === conn.toNodeId);
                  if (!target) return null;
                  return (
                    <div
                      key={conn.id}
                      onClick={() => {
                        onClose();
                        onJumpToNode(target);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold shrink-0">
                          → {conn.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-amber-400">
                          {target.title}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0" />
                    </div>
                  );
                })}

                {incoming.map((conn) => {
                  const source = allNodes.find((n) => n.id === conn.fromNodeId);
                  if (!source) return null;
                  return (
                    <div
                      key={conn.id}
                      onClick={() => {
                        onClose();
                        onJumpToNode(source);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold shrink-0">
                          ← {conn.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-amber-400">
                          من: {source.title}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* شريط الأزرار السفلي (حفظ، حذف، إغلاق) */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من حذف هذا المربع نهائيًا؟')) {
                onDelete(node.id);
                onClose();
              }
            }}
            className="flex items-center gap-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 px-4 py-2.5 rounded-xl text-sm font-bold border border-red-800/50 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف المربع</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
