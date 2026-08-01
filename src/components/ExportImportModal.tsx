import React, { useRef, useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileText, 
  FileCode, 
  Sparkles, 
  Check, 
  Copy, 
  Share2, 
  AlertCircle,
  Database,
  Eye,
  Bot,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { StoryProject } from '../types/story';
import { 
  exportToJSON, 
  importFromJSONFile, 
  downloadMarkdownFile, 
  downloadHTMLReport, 
  downloadAIPromptFile,
  openHTMLPreviewInNewTab,
  generateHTMLReport,
  generateAIPrompt 
} from '../utils/storage';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: StoryProject;
  onImportProject: (project: StoryProject) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  project,
  onImportProject
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'download' | 'preview'>('download');
  const [copiedAI, setCopiedAI] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const previewSrcDoc = useMemo(() => {
    return generateHTMLReport(project);
  }, [project]);

  const handleJSONImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const imported = await importFromJSONFile(file);
      onImportProject(imported);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء استيراد ملف JSON.');
    }
  };

  const handleCopyAIPrompt = () => {
    const promptText = generateAIPrompt(project);
    navigator.clipboard.writeText(promptText);
    setCopiedAI(true);
    setTimeout(() => setCopiedAI(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* شريط العنوان التفاعلي */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-amber-500 rounded-2xl text-slate-950 shadow-lg shadow-purple-500/20">
              <Bot className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-100">
                  مركز مشاركة وتنزيل القصة للذكاء الاصطناعي
                </h3>
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  محدث ⚡
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تنزيل ملف توصيف شامل يحتوي على كل الأكواد، الخريطة، شجرة التفرع، والملاحظات للذكاء الاصطناعي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* أزرار التبديل العلوية */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('download')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === 'download'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>التنزيل والمشاركة</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === 'preview'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>معاينة الويب الحية</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* محتوى النافذة الرئيسي */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-950 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'download' ? (
            <div className="space-y-6">
              {/* 🎯 ZAR (BUTTON) HERO PRIMARY: تنزيل ملف التوصيف الشامل للذكاء الاصطناعي */}
              <div className="bg-gradient-to-br from-purple-950/90 via-slate-900 to-amber-950/60 border-2 border-purple-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center sm:text-right">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/40 text-purple-300 px-3 py-1 rounded-full text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>الزر الموصى به لـ ChatGPT و Gemini و Claude</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    تنزيل ملف توصيف الخريطة الشاملة للذكاء الاصطناعي (.txt)
                  </h2>

                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    يحتوي الملف المنزّل على <strong>عشرات الأكواد البرمجية والتوصيفات الجاهزة</strong> التي تشرح للذكاء الاصطناعي مواقع المربعات، الأهمية السردية، شجرة التفرع، ترتيب القراءة، الروابط، والملاحظات الداخلية بالكامل.
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    {/* الزر الرئيسي البارز للتنزيل */}
                    <button
                      onClick={() => downloadAIPromptFile(project)}
                      className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 via-purple-600 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-slate-950 px-8 py-4 rounded-2xl text-base sm:text-lg font-black shadow-2xl shadow-purple-600/40 transition transform hover:scale-[1.03] active:scale-[0.98] w-full sm:w-auto"
                    >
                      <Download className="w-6 h-6 stroke-[3]" />
                      <span>🚀 تنزيل ملف التوصيف الشامل (.txt)</span>
                    </button>

                    {/* زر النسخ السريع */}
                    <button
                      onClick={handleCopyAIPrompt}
                      className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition border w-full sm:w-auto ${
                        copiedAI
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800/90 hover:bg-slate-800 text-purple-300 border-purple-500/40'
                      }`}
                    >
                      {copiedAI ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Copy className="w-5 h-5" />}
                      <span>{copiedAI ? 'تم نسخ التقرير الحافظة بنجاح ✓' : 'نسخ النص مباشرة دون تنزيل'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* خيارات التصدير الثانوية المساندة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* تنزيل HTML */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
                      <FileCode className="w-4 h-4" />
                      <span>خريطة الويب التفاعلية</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      ملف HTML متكامل للعرض والتصفح التفاعلي في أي متصفح.
                    </p>
                  </div>
                  <button
                    onClick={() => downloadHTMLReport(project)}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition w-full"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل (.html)</span>
                  </button>
                </div>

                {/* تنزيل Markdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                      <FileText className="w-4 h-4" />
                      <span>مستند نصي منسق</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      ملف Markdown (.md) منسق يحتوي على العناوين والملاحظات.
                    </p>
                  </div>
                  <button
                    onClick={() => downloadMarkdownFile(project)}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition w-full"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل (.md)</span>
                  </button>
                </div>

                {/* تنزيل واستيراد JSON */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                      <Database className="w-4 h-4" />
                      <span>بيانات المشاريح الخام</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      حفظ واستعادة مشروع القصة الكامل بصيغة JSON.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportToJSON(project)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-2.5 rounded-xl text-xs font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تصدير JSON</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>استيراد</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleJSONImport}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* معاينة تفاعلية حية داخل إطار iframe */
            <div className="h-[60vh] w-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col">
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  معاينة حية حقيقية لتقرير الويب والخريطة التفاعلية المصدّرة:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openHTMLPreviewInNewTab(project)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs font-bold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح في تبويب جديد</span>
                  </button>

                  <button
                    onClick={() => downloadHTMLReport(project)}
                    className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل ملف HTML</span>
                  </button>
                </div>
              </div>

              <iframe
                srcDoc={previewSrcDoc}
                title="Interactive Story Map Live Preview"
                className="w-full flex-1 border-none bg-slate-950"
              />
            </div>
          )}
        </div>

        {/* تذييل النافذة */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 hidden sm:inline">
            * ملف التوصيف الشامل (.txt) مصمم هيدروليكياً وتوبولوجياً ليفهمه أي نموذج ذكاء اصطناعي بنسبة 100%.
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition ms-auto"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

