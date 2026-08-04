const fs = require('fs');
let content = fs.readFileSync('src/components/NodeCard.tsx', 'utf8');

// 1. Add details button to the floating toolbar (around line 307)
const editBtnTarget = `<span className="hidden sm:inline">تعديل</span>
          </button>`;
const editBtnReplacement = `<span className="hidden sm:inline">تعديل</span>
          </button>

          <button
            onClick={onExpand}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
            title="فتح التفاصيل المتقدمة (تغيير النوع، ملاحظات طويلة...)"
          >
            <Maximize2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">تفاصيل</span>
          </button>`;
content = content.replace(editBtnTarget, editBtnReplacement);

// 2. Make the "تعديل" button always trigger inline editing
const editClickTarget = `onClick={(e) => {
              if (isNoteType) {
                onExpand(e);
              } else {
                setIsEditingInline(!isEditingInline);
              }
            }}`;
const editClickReplacement = `onClick={(e) => {
              setIsEditingInline(!isEditingInline);
            }}`;
content = content.replace(editClickTarget, editClickReplacement);

// 3. Make inline editing textarea taller
const textareaTarget = `<textarea
                value={inlineContent}
                onChange={(e) => setInlineContent(e.target.value)}
                placeholder="اكتب المحتوى هنا..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-amber-500 resize-none"
              />`;
const textareaReplacement = `<textarea
                value={inlineContent}
                onChange={(e) => setInlineContent(e.target.value)}
                placeholder="اكتب المحتوى هنا..."
                rows={5}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-amber-500 resize-y min-h-[80px]"
              />`;
content = content.replace(textareaTarget, textareaReplacement);

// 4. Also remove the old isNoteType expansion button in the bottom floating toolbar (it's redundant now, but wait, maybe they like it? I'll leave it but ensure it's there.)
// I'll also add Maximize2 to lucide imports if missing.
if (!content.includes('Maximize2,')) {
    content = content.replace(/Trash2,\s+Save,/, 'Trash2,\n  Save,\n  Maximize2,');
}

fs.writeFileSync('src/components/NodeCard.tsx', content);
