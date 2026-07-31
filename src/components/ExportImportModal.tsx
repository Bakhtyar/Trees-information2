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
  const [activeTab, setActiveTab] = useState<'preview' | 'options'>('preview');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        {/* شريط العنوان والتنقل */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                مركز المشاركة وخريطة التصدير التفاعلية (Human + AI Map)
              </h3>
              <p className="text-xs text-slate-400 hidden sm:block">
                خريطة قصة تفاعلية حيّة تربط العقد، الفروع، الملاحظات، والبيانات المشفّرة للذكاء الاصطناعي
              </p>
            </div>
          </div>

          {/* تبويبات الانتقال */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'preview'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>معاينة الخريطة التفاعلية الحية</span>
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'options'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>خيارات التصدير والتنزيل</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-950">
          {errorMsg && (
            <div className="m-4 p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-sm flex items-center gap-2 shrink-0">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'preview' ? (
            /* معاينة تفاعلية حية داخل إطار iframe */
            <div className="flex-1 flex flex-col h-full w-full relative">
              {/* شريط الإجراءات المباشرة للمعاينة */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  معاينة حية حقيقية لتقرير الويب والخريطة التفاعلية المصدّرة:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openHTMLPreviewInNewTab(project)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs font-bold transition"
                    title="فتح خريطة القصة التفاعلية في تبويب مستقل جديد"
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

              {/* الإطار المضمن الحقيقي */}
              <iframe
                srcDoc={previewSrcDoc}
                title="Interactive Story Map Live Preview"
                className="w-full flex-1 border-none bg-slate-950"
              />
            </div>
          ) : (
            /* قائمة الخيارات */
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* 1. التصدير التفاعلي للويب (HTML + Embedded JSON) */}
              <div className="bg-gradient-to-r from-cyan-950/30 via-slate-800/40 to-slate-800/40 border border-cyan-500/30 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h4 className="font-bold text-base text-cyan-300 flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-cyan-400" />
                      <span>تصدير خريطة القصة التفاعلية المكتملة (HTML Web App)</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      يولّد ملف HTML مستقل ومباشر يجمع بين الخريطة التفاعلية البصرية، شجرة الفروع والروابط بين العقد، والملاحظات السرية، مع تضمين كائن <strong>JSON الكامل المقروء آلياً</strong> داخل الملف للذكاء الاصطناعي.
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => downloadHTMLReport(project)}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل خريطة الويب التفاعلية (.html)</span>
                  </button>

                  <button
                    onClick={() => openHTMLPreviewInNewTab(project)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>فتح المعاينة التفاعلية في تبويب جديد</span>
                  </button>
                </div>
              </div>

              {/* 2. التصدير النصي المنظم (Markdown .md) */}
              <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5">
                <h4 className="font-bold text-base text-slate-100 mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>تصدير تقرير نصي شامل (Markdown .md)</span>
                </h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  ملف نصي منسق يحتوي على جميع العقد والعناوين، الوسوم، الملاحظات الداخلية، جداول الإحداثيات، والعلاقات، بالإضافة إلى الشفرة الخام في نهايته. ممتاز للتوثيق واللصق في أدوات الكتابة أو المساعدين الآليين.
                </p>

                <button
                  onClick={() => downloadMarkdownFile(project)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-600/50 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>تحميل تقرير Markdown (.md)</span>
                </button>
              </div>

              {/* 3. البيانات الخام الكاملة (JSON Export & Import) */}
              <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5">
                <h4 className="font-bold text-base text-slate-100 mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>تصدير واستيراد بيانات JSON الخام</span>
                </h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  ملف البيانات الأساسي للمشروع للنسخ الاحتياطي أو الاستيراد مرة أخرى في البرنامج على أي جهاز، يحفظ موقع كل عنصر في اللوحة وألوانه وتنسيق خطه.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => exportToJSON(project)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير بيانات JSON (.json)</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>استيراد مشروع من ملف (Import)</span>
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

              {/* 4. النسخ السريع للذكاء الاصطناعي (Copy AI Prompt) */}
              <div className="bg-gradient-to-br from-purple-950/40 to-amber-950/30 border border-purple-500/30 rounded-2xl p-5">
                <h4 className="font-bold text-base text-purple-300 mb-1 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <span>نسخ الملخص الكامل فوراً للذكاء الاصطناعي (ChatGPT / Gemini / Claude)</span>
                </h4>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  يقوم بنسخ نص موجه ومصمم بعناية يحتوي على كل نصوص المربعات، الملاحظات السرية للكاتب، العلاقات، والشفرة المكملة لصقها مباشرة في شات الذكاء الاصطناعي لتلقي اقتراحات فورية لتطوير القصة!
                </p>

                <button
                  onClick={handleCopyAIPrompt}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition shadow-xl ${
                    copiedAI
                      ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                  }`}
                >
                  {copiedAI ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>
                    {copiedAI ? 'تم نسخ التقرير الشامل للحافظة بنجاح ✓' : 'نسخ التقرير المكتمل للذكاء الاصطناعي (Copy AI Context)'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* تذييل النافذة */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            * يحتوي ملف الويب على خريطة بصرية تفاعلية بالإضافة لكائن JSON المضمّن.
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

