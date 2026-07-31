import React, { useState, useMemo } from 'react';
import { Search, X, User, Calendar, MapPin, Lock, Flag, FileText, Lightbulb, ArrowLeft, Tag } from 'lucide-react';
import { StoryNode, NodeCategory, NODE_CATEGORIES } from '../types/story';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: StoryNode[];
  onSelectNode: (node: StoryNode) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  nodes,
  onSelectNode
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'all'>('all');

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchCategory = selectedCategory === 'all' || node.type === selectedCategory;
      if (!matchCategory) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const titleMatch = node.title.toLowerCase().includes(q);
      const contentMatch = node.content.toLowerCase().includes(q);
      const notesMatch = (node.internalNotes || '').toLowerCase().includes(q);
      const tagMatch = (node.tags || []).some((t) => t.toLowerCase().includes(q));

      return titleMatch || contentMatch || notesMatch || tagMatch;
    });
  }, [nodes, query, selectedCategory]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* شريط البحث العلوي */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن عنوان مربع، شخصية، حدث، سر، أو وسم..."
            autoFocus
            className="w-full bg-transparent border-0 text-base font-bold text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold transition shrink-0"
          >
            إغلاق
          </button>
        </div>

        {/* أزرار تصفية حسب النوع */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-800/40 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            الكل ({nodes.length})
          </button>

          {(Object.keys(NODE_CATEGORIES) as NodeCategory[]).map((catKey) => {
            const cat = NODE_CATEGORIES[catKey];
            const count = nodes.filter((n) => n.type === catKey).length;
            if (count === 0 && selectedCategory !== catKey) return null;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition ${
                  selectedCategory === catKey
                    ? 'bg-slate-700 text-amber-300 border border-amber-500'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span style={{ color: cat.defaultColor }}>{getIcon(cat.icon)}</span>
                <span>{cat.name} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* قائمة النتائج */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-semibold">لم يتم العثور على أي مربع مطابق لبحثك.</p>
            </div>
          ) : (
            filteredNodes.map((node) => {
              const cat = NODE_CATEGORIES[node.type];
              return (
                <div
                  key={node.id}
                  onClick={() => {
                    onSelectNode(node);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/60 cursor-pointer transition group"
                  style={{ borderRightWidth: '4px', borderRightColor: node.color || cat.defaultColor }}
                >
                  <div className="flex flex-col min-w-0 pr-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${node.color || cat.defaultColor}20`,
                          color: node.color || cat.defaultColor
                        }}
                      >
                        {cat.name}
                      </span>
                      <h4 className="font-bold text-base text-slate-100 truncate group-hover:text-amber-400 transition">
                        {node.title || 'بدون عنوان'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {node.content || '(بدون نص)'}
                    </p>
                  </div>

                  <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-400 shrink-0 transition-transform group-hover:-translate-x-1" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
