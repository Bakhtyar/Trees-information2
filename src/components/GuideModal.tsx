import React from 'react';
import { 
  X, 
  HelpCircle, 
  Move, 
  Link2, 
  Maximize2, 
  Share2, 
  Sparkles, 
  FolderDown, 
  MousePointer, 
  Palette, 
  CheckCircle 
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* شريط العنوان */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-extrabold text-slate-100">
              دليل الاستخدام والتشغيل: لوحة تخطيط الرواية والقصة
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى الدليل */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 text-slate-200">
          {/* 1. مقدمة وكيفية التشغيل */}
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-800/30 border border-slate-700 p-5 rounded-2xl">
            <h4 className="text-base font-bold text-amber-400 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>كيف يعمل المشروع بدون سيرفر وكيف تفتحه؟</span>
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              هذا التطبيق مبرمج باستخدام <b>HTML + CSS + JavaScript / TypeScript</b> ويعمل <b>بالكامل داخل المتصفح</b> دون الحاجة إلى أي سيرفر خلفي أو قاعدة بيانات خارجية.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-300">
              <li>
                <b>الحفظ التلقائي الفوري:</b> يتم حفظ جميع العقد والروابط والتعديلات تلقائيًا داخل متصفحك (LocalStorage) لحظة إجرائها. إذا أغلقت الصفحة وعدت إليها في أي وقت، ستجد مشروعك كما تركته تمامًا.
              </li>
              <li>
                <b>التشغيل المحلي في حاسوبك:</b> لفتح المشروع محليًا، يكفي تشغيل أمر <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-mono text-xs">npm run dev</code> في المجلد، أو تصدير المشروع إلى ملف JSON واحتفاظك به كنسخة دائمة.
              </li>
            </ul>
          </div>

          {/* 2. أساسيات العمل على اللوحة */}
          <div>
            <h4 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
              <MousePointer className="w-5 h-5 text-amber-400" />
              <span>أساسيات التحكم في اللوحة اللانهائية</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
                <span className="font-bold text-sm text-amber-300 block mb-1">
                  1. إضافة عناصر وعُقد جديدة
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  من الزاوية السفلية، اضغط على زر "إضافة عنصر" واختر نوع العقدة: <b>شخصية، حدث، مكان، سر/لغز، نهاية، ملاحظة، أو فكرة</b>.
                </p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
                <span className="font-bold text-sm text-amber-300 block mb-1">
                  2. السحب والتكبير والتصغير
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اسحب أي مربع بحرية في المساحة اللانهائية. استخدم عجلة الفأرة للتكبير والتصغير، أو اضغط بالزر الأيسر في خلفية اللوحة لتحريك المساحة كاملة.
                </p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
                <span className="font-bold text-sm text-amber-300 block mb-1">
                  3. التوسيع والتعديل والملاحظات
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اضغط على أي مربع أو زر التوسيع <Maximize2 className="w-3.5 h-3.5 inline text-amber-400" /> لفتح نافذة التفاصيل الكاملة، حيث يمكنك كتابة نصوص طويلة وملاحظات داخلية سرية للمؤلف وتغيير لون العقدة.
                </p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
                <span className="font-bold text-sm text-amber-300 block mb-1">
                  4. ربط المربعات والأسهم
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  لربط أي مربعين: اضغط على أيقونة الربط <Link2 className="w-3.5 h-3.5 inline text-cyan-400" /> في المربع الأول، ثم اضغط على المربع الثاني، واختر اسم العلاقة (مثال: <b>سبب، نتيجة، سر، يقتل، يكتشف</b>).
                </p>
              </div>
            </div>
          </div>

          {/* 3. التصدير والاستيراد ومشاركة الذكاء الاصطناعي */}
          <div>
            <h4 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Share2 className="w-5 h-5 text-amber-400" />
              <span>التصدير، الاستيراد، والذكاء الاصطناعي</span>
            </h4>
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                • <b>Export JSON:</b> يحفظ لك ملفًا واحدًا يحتوي على كل تفاصيل المشروع وألوانه وروابطه لفتحها في أي وقت.
              </p>
              <p>
                • <b>Export Markdown & HTML:</b> يولد لك مستندًا نصيًا وتقريرًا ويب أنيقًا لجميع الفصول والشخصيات والأسرار.
              </p>
              <p>
                • <b>نسخ ملخص الذكاء الاصطناعي (AI Prompt):</b> اضغط على زر <span className="text-purple-400 font-bold">"مشاركة مع الذكاء الاصطناعي"</span> لنسخ وصف تفصيلي ومنسق للمشروع بالكامل جاهز للصق في ChatGPT أو Claude أو Gemini لتحليل حبكة روايتك!
              </p>
            </div>
          </div>
        </div>

        {/* تذييل الدليل */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20"
          >
            فهمت، ابدأ التخطيط للرواية الآن
          </button>
        </div>
      </div>
    </div>
  );
};
