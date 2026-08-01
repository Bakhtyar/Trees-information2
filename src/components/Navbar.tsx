import React, { useState, useRef } from 'react';
import { 
  Search, 
  HelpCircle, 
  Download, 
  Upload, 
  Sun, 
  Moon, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  CheckCircle2, 
  Share2, 
  FileText, 
  FileCode, 
  Sparkles, 
  RefreshCw, 
  PlusSquare,
  ChevronDown,
  Home,
  User,
  Cloud,
  Undo2,
  Redo2
} from 'lucide-react';
import { StoryProject, UserProfile } from '../types/story';

interface NavbarProps {
  project: StoryProject;
  userProfile?: UserProfile;
  onNavigateHome?: () => void;
  onOpenAccountModal?: () => void;
  onUpdateTitle: (newTitle: string) => void;
  onUpdateDescription: (newDesc: string) => void;
  onOpenSearch: () => void;
  onOpenGuide: () => void;
  onOpenExportImport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  saveStatus: 'saved' | 'saving' | 'error';
  onLoadTemplate: (type: 'detective' | 'blank') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  userProfile,
  onNavigateHome,
  onOpenAccountModal,
  onUpdateTitle,
  onUpdateDescription,
  onOpenSearch,
  onOpenGuide,
  onOpenExportImport,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isDark,
  onToggleTheme,
  saveStatus,
  onLoadTemplate,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    } else {
      setTitleInput(project.title);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between gap-3 z-30 select-none shadow-sm shrink-0">
      {/* اليمين: زر الرئيسية وعنوان المشروع وحالة الحفظ */}
      <div className="flex items-center gap-3 min-w-0">
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition shrink-0"
            title="العودة للواجهة الرئيسية والمشاريع"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </button>
        )}
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-slate-800 border border-amber-500/70 rounded px-2 py-0.5 text-base font-bold text-slate-100 focus:outline-none w-56 sm:w-72"
              />
            ) : (
              <button
                onClick={() => {
                  setTitleInput(project.title);
                  setIsEditingTitle(true);
                }}
                className="text-base sm:text-lg font-bold text-slate-100 hover:text-amber-400 truncate transition text-right max-w-[180px] sm:max-w-xs md:max-w-md"
                title="اضغط لتعديل عنوان المشروع"
              >
                {project.title || 'مشروع بدون عنوان'}
              </button>
            )}

            {/* حالة الحفظ التلقائي */}
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">محفوظ تلقائيًا</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-sm">
            {project.description || 'لوحة تخطيط الرواية والشخصيات — مساحة عمل لا نهائية'}
          </p>
        </div>
      </div>

      {/* وسط: البحث والقوالب */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700/70 text-sm transition shadow-sm"
          title="بحث في العقد والملاحظات"
        >
          <Search className="w-4 h-4 text-amber-400" />
          <span>بحث سريع...</span>
          <kbd className="hidden lg:inline-block bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* زر الحساب والتزامن السحابي في الهيدر */}
        {onOpenAccountModal && userProfile && (
          <button
            onClick={onOpenAccountModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              userProfile.googleConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="إدارة الحساب والنسخ السحابي"
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">{userProfile.googleConnected ? 'Google متصل' : 'نسخ سحابي'}</span>
          </button>
        )}

        {/* قائمة قوالب جاهزة */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
            className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700/60 text-sm transition"
          >
            <span>نماذج جاهزة</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showTemplatesMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-sm">
              <button
                onClick={() => {
                  setShowTemplatesMenu(false);
                  onLoadTemplate('detective');
                }}
                className="w-full text-right px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-amber-300"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>نموذج: لغز قصر البارون</span>
              </button>
              <button
                onClick={() => {
                  setShowTemplatesMenu(false);
                  onLoadTemplate('blank');
                }}
                className="w-full text-right px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
              >
                <PlusSquare className="w-4 h-4 shrink-0" />
                <span>مشروع رواية فارغ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* اليسار: أدوات التحكم في التراجع/الإعادة، التكبير، التصدير، ودليل الاستخدام */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* أزرار التراجع والإعادة (Undo & Redo) */}
        <div className="flex items-center bg-slate-800/80 border border-slate-700/70 rounded-xl px-1 py-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
              canUndo
                ? 'hover:bg-slate-700 text-amber-400 hover:text-amber-300'
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="تراجع عن خطوة (Ctrl+Z) - استرجاع المحذوف أو السابق"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden xl:inline">تراجع</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-700/80 mx-0.5" />

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
              canRedo
                ? 'hover:bg-slate-700 text-cyan-400 hover:text-cyan-300'
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="إعادة للتقدم (Ctrl+Y) - الرجوع لنفس النقطة عند التراجع بالغلط"
          >
            <Redo2 className="w-4 h-4" />
            <span className="hidden xl:inline">إعادة</span>
          </button>
        </div>

        {/* أزرار التكبير */}
        <div className="hidden sm:flex items-center bg-slate-800/80 border border-slate-700/70 rounded-xl px-1 py-0.5">
          <button
            onClick={onZoomOut}
            className="p-1.5 hover:bg-slate-700/60 text-slate-300 hover:text-white rounded-lg transition"
            title="تصغير اللوحة (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-amber-400 transition"
            title="إعادة التكبير والتوسيط"
          >
            {Math.round(project.canvasView.zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 hover:bg-slate-700/60 text-slate-300 hover:text-white rounded-lg transition"
            title="تكبير اللوحة (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* زر تصدير واستيراد */}
        <button
          onClick={onOpenExportImport}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-sm transition shadow-md shadow-amber-500/20"
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">تصدير / استيراد</span>
        </button>

        {/* زر دليل التشغيل والاستخدام */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 text-sm transition"
          title="كيف أستخدم هذا التطبيق وأفتحه؟"
        >
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="hidden lg:inline">دليل الاستخدام</span>
        </button>

        {/* زر تبديل السمة (داكن/فاتح) */}
        <button
          onClick={onToggleTheme}
          className="p-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-700/60 transition"
          title={isDark ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
