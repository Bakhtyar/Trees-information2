import React, { useState, useEffect } from 'react';
import { X, Link2, Trash2, Check, ArrowRight, ArrowRightLeft } from 'lucide-react';
import { 
  StoryConnection, 
  StoryNode, 
  PRESET_RELATIONS, 
  RelationType 
} from '../types/story';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: StoryConnection | null;
  sourceNode: StoryNode | null;
  targetNode: StoryNode | null;
  onSave: (conn: StoryConnection) => void;
  onDelete: (connectionId: string) => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  connection,
  sourceNode,
  targetNode,
  onSave,
  onDelete
}) => {
  if (!isOpen || (!connection && (!sourceNode || !targetNode))) return null;

  const initialLabel = connection ? connection.label : 'مرتبط بـ';
  const initialColor = connection ? connection.color : '#3b82f6';
  const initialStyle = connection ? (connection.style || 'solid') : 'solid';

  const [label, setLabel] = useState(initialLabel);
  const [customLabel, setCustomLabel] = useState(
    PRESET_RELATIONS[initialLabel] ? '' : initialLabel
  );
  const [isCustom, setIsCustom] = useState(!PRESET_RELATIONS[initialLabel]);
  const [color, setColor] = useState(initialColor);
  const [style, setStyle] = useState<'solid' | 'dashed' | 'dotted'>(initialStyle);
  const [bidirectional, setBidirectional] = useState(connection ? !!connection.bidirectional : false);

  useEffect(() => {
    if (connection) {
      const isPreset = !!PRESET_RELATIONS[connection.label];
      setLabel(connection.label);
      setIsCustom(!isPreset);
      setCustomLabel(isPreset ? '' : connection.label);
      setColor(connection.color);
      setStyle(connection.style || 'solid');
      setBidirectional(!!connection.bidirectional);
    } else {
      setLabel('مرتبط بـ');
      setIsCustom(false);
      setCustomLabel('');
      setColor('#3b82f6');
      setStyle('solid');
      setBidirectional(false);
    }
  }, [connection, sourceNode, targetNode]);

  const handlePresetClick = (key: string) => {
    const preset = PRESET_RELATIONS[key];
    setLabel(key);
    setIsCustom(false);
    setColor(preset.defaultColor);
    setStyle(preset.style);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLabel = isCustom ? (customLabel.trim() || 'مرتبط بـ') : label;
    const newConn: StoryConnection = connection ? {
      ...connection,
      label: finalLabel,
      color,
      style,
      bidirectional
    } : {
      id: 'conn-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      fromNodeId: sourceNode!.id,
      toNodeId: targetNode!.id,
      label: finalLabel,
      color,
      style,
      bidirectional,
      createdAt: Date.now()
    };
    onSave(newConn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
        {/* شريط العنوان */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">
              {connection ? 'تعديل الرابط والعلاقة بين المربعين' : 'إنشاء رابط جديد بين المربعين'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* توضيح أطراف العلاقة */}
          {sourceNode && targetNode && (
            <div className="flex items-center justify-between p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-sm font-semibold">
              <div className="truncate text-right max-w-[40%] text-slate-200">
                {sourceNode.title || 'المربع الأول'}
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mx-2" />
              <div className="truncate text-left max-w-[40%] text-slate-200">
                {targetNode.title || 'المربع الثاني'}
              </div>
            </div>
          )}

          {/* 1. تسمية العلاقة (الأزرار الجاهزة أو مخصص) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2.5">
              تسمية العلاقة على الخط:
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.keys(PRESET_RELATIONS).map((key) => {
                const preset = PRESET_RELATIONS[key];
                const isCurrent = !isCustom && label === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetClick(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsCustom(true);
                  setCustomLabel('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  isCustom
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                + تسمية أخرى...
              </button>
            </div>

            {isCustom && (
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="اكتب تسمية العلاقة هنا (مثال: شقيق، حليف، يخفي الدليل...)"
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          {/* 2. لون سهم العلاقة */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              لون الخط والسهم:
            </label>
            <div className="flex items-center gap-2">
              {['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#dc2626', '#0ea5e9'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === col ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          {/* 3. شكل الخط (متصل، متقطع، منقط) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              نمط الخط:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['solid', 'dashed', 'dotted'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    style === s
                      ? 'bg-slate-800 border-amber-500 text-amber-400'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {s === 'solid' ? 'خط متصل ───' : s === 'dashed' ? 'خط متقطع - - -' : 'خط منقط • • •'}
                </button>
              ))}
            </div>
          </div>

          {/* 4. اتجاه السهم (أحادي / مزدوج) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              اتجاه السهم:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBidirectional(false)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                  !bidirectional
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>سهم باتجاه واحد (➔)</span>
              </button>
              <button
                type="button"
                onClick={() => setBidirectional(true)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                  bidirectional
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>سهم مزدوج (⬌)</span>
              </button>
            </div>
          </div>

          {/* أزرار الحفظ والحذف */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {connection ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(connection.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-800/50 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف الرابط</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg transition"
              >
                حفظ الرابط
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
