import React, { useState } from 'react';
import { 
  Plus, 
  BookOpen, 
  FolderPlus, 
  Search, 
  CloudCheck, 
  User, 
  Copy, 
  Trash2, 
  Edit3, 
  Download, 
  Sparkles, 
  Compass, 
  Layers, 
  Clock, 
  Share2, 
  Check, 
  ShieldCheck,
  FileCode,
  ArrowRight,
  ChevronRight,
  Flame,
  X
} from 'lucide-react';
import { StoryProject, UserProfile } from '../types/story';

interface DashboardProps {
  projects: StoryProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (title: string, description: string, genre: string, template: 'blank' | 'detective' | 'scifi' | 'fantasy') => void;
  onUpdateProjectDetails: (projectId: string, title: string, description: string, genre: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onExportProject: (project: StoryProject) => void;
  userProfile: UserProfile;
  onOpenAccountModal: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProjectDetails,
  onDuplicateProject,
  onDeleteProject,
  onExportProject,
  userProfile,
  onOpenAccountModal,
  isDark,
  onToggleTheme
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('الكل');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // New Project Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGenre, setNewGenre] = useState('رواية عامة');
  const [selectedTemplate, setSelectedTemplate] = useState<'blank' | 'detective' | 'scifi' | 'fantasy'>('blank');

  // Edit Project Modal state
  const [editingProject, setEditingProject] = useState<StoryProject | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [editDescInput, setEditDescInput] = useState('');
  const [editGenreInput, setEditGenreInput] = useState('رواية عامة');

  const genres = ['الكل', 'رواية بوليسية', 'خيال علمي', 'فانتازيا', 'رواية عامة'];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre = selectedGenreFilter === 'الكل' || p.genre === selectedGenreFilter;
    return matchesSearch && matchesGenre;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProject(
      newTitle.trim() || 'مشروع روائي جديد',
      newDesc.trim() || 'مخطط زمني ومكاني للأحداث والشخصيات.',
      newGenre,
      selectedTemplate
    );
    setIsNewProjectModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleStartEditing = (p: StoryProject) => {
    setEditingProject(p);
    setEditTitleInput(p.title);
    setEditDescInput(p.description || '');
    setEditGenreInput(p.genre || 'رواية عامة');
  };

  const handleSaveProjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject && editTitleInput.trim()) {
      onUpdateProjectDetails(
        editingProject.id,
        editTitleInput.trim(),
        editDescInput.trim(),
        editGenreInput
      );
      setEditingProject(null);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'حديثاً';
    return new Date(timestamp).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`h-screen w-full flex flex-col overflow-y-auto font-sans select-none transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Main Navigation */}
      <header className={`h-16 px-6 border-b flex items-center justify-between z-30 shrink-0 sticky top-0 backdrop-blur-md ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
            ر
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-400 via-cyan-300 to-cyan-500 bg-clip-text text-transparent">
              خريطة الروايات المكانية
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">منصة التخطيط المكاني والعميق للقصص والشخصيات</p>
          </div>
        </div>

        {/* User Profile & Actions Header Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAccountModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              userProfile.googleConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="إدارة الحساب والتزامن السحابي"
          >
            <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </div>
            <span className="hidden md:inline">{userProfile.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {userProfile.googleConnected ? 'Google متصل' : 'حساب محلي'}
            </span>
          </button>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>مشروع جديد</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-28 space-y-8 dir-rtl text-right">
        {/* Banner Section */}
        <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl ${
          isDark 
            ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border-slate-800' 
            : 'bg-gradient-to-r from-amber-500/10 via-white to-cyan-500/10 border-slate-200'
        }`}>
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مشاريعك محفوظة في المتصفح والحساب المحمي من الفرمتة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              مرحباً بك في أستوديو التخطيط المكانِي!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              قم بإنشاء وتطوير مخططات الروايات والقصص بدقة مكانية عميقة وشبكات روابط ذكية لا تفقد بياناتها أبداً.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAccountModal}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <CloudCheck className="w-4 h-4 text-cyan-400" />
              <span>فحص المزامنة السحابية</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Genre Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenreFilter(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedGenreFilter === g
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مشروع..."
              className={`w-full pr-9 pl-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-500 transition border ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Section Title for Saved Projects */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-100">
              المشاريع المحفوظة ({filteredProjects.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            جميع أعمالك محفوظة وتلقائية التحديث
          </span>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Project Card Action */}
          <div
            onClick={() => setIsNewProjectModalOpen(true)}
            className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition group min-h-[220px] ${
              isDark 
                ? 'border-slate-800 hover:border-amber-500/60 bg-slate-900/40 hover:bg-amber-950/10' 
                : 'border-slate-300 hover:border-amber-500 bg-white hover:bg-amber-50/30'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition shadow-lg shadow-amber-500/10">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200 group-hover:text-amber-400 transition">إنشاء مشروع روائي جديد</h3>
              <p className="text-xs text-slate-400 mt-1">اختر من القوالب الجاهزة أو ابدأ بمخطط فارغ</p>
            </div>
          </div>

          {/* Existing Projects Cards */}
          {filteredProjects.map((p) => {
            const isActive = p.id === activeProjectId;
            const nodeCount = p.nodes ? p.nodes.length : 0;
            const connCount = p.connections ? p.connections.length : 0;

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 relative group shadow-md ${
                  isActive
                    ? 'border-cyan-500/80 bg-slate-900 ring-2 ring-cyan-500/30'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {p.genre || 'رواية عامة'}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(p.lastSavedAt)}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition line-clamp-1">
                    {p.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description || 'لا يوجد وصف للمشروع'}
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 py-2 border-y border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{nodeCount} عقدة مكانيّة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>{connCount} رابطة قصة</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => onSelectProject(p.id)}
                    className="flex-1 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5"
                  >
                    <span>فتح اللوحة والمخطط</span>
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEditing(p)}
                      className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                      title="تعديل اسم المشروع"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDuplicateProject(p.id)}
                      className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition"
                      title="نسخ المشروع"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onExportProject(p)}
                      className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                      title="تصدير JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {projects.length > 1 && (
                      <button
                        onClick={() => onDeleteProject(p.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                        title="حذف المشروع"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal: New Project Creation with Templates */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] dir-rtl text-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-slate-100">إنشاء مشروع روائي جديد</h2>
              </div>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الرواية / المشروع</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: سر الجريمة في المحطة القديمة"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نوع الرواية (التصنيف)</label>
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="رواية عامة">رواية عامة</option>
                    <option value="رواية بوليسية">رواية بوليسية وتحقيق</option>
                    <option value="خيال علمي">خيال علمي وفضاء</option>
                    <option value="فانتازيا">فانتازيا وسحر</option>
                    <option value="دراما">دراما واجتماعي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الوصف المختصر</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="نبذة عن الفكرة الرئيسية..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">اختر قالب البدء</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedTemplate('blank')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                      selectedTemplate === 'blank'
                        ? 'border-amber-500 bg-amber-950/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">📄 مخطط فارغ</span>
                    <span className="text-[10px] text-slate-400">بدء صفحة بيضاء بدون عناصر مسجلة</span>
                  </div>

                  <div
                    onClick={() => setSelectedTemplate('detective')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                      selectedTemplate === 'detective'
                        ? 'border-amber-500 bg-amber-950/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">🕵️ قضية بوليسية (جاهز)</span>
                    <span className="text-[10px] text-slate-400">شخصيات ومسرح جريمة وأدلة مرتبطة</span>
                  </div>

                  <div
                    onClick={() => setSelectedTemplate('scifi')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                      selectedTemplate === 'scifi'
                        ? 'border-amber-500 bg-amber-950/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">🚀 خيال علمي وفضاء</span>
                    <span className="text-[10px] text-slate-400">محطة فضائية وقائد سفينة وعقد مجرة</span>
                  </div>

                  <div
                    onClick={() => setSelectedTemplate('fantasy')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                      selectedTemplate === 'fantasy'
                        ? 'border-amber-500 bg-amber-950/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">🏰 عالم الفانتازيا</span>
                    <span className="text-[10px] text-slate-400">مملكة قديمة وساحر وحراس الخناجر</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 mt-2"
              >
                إنشاء المشروع والبدء والتخطيط
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Project Details (Title, Description, Genre) */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl p-6 space-y-5 dir-rtl text-right shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-slate-100">تعديل عنوان ووصف المشروع</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">عنوان المشروع / الرواية</label>
                <input
                  type="text"
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  placeholder="عنوان الرواية..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 font-semibold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">تصنيف الرواية (النوع)</label>
                <select
                  value={editGenreInput}
                  onChange={(e) => setEditGenreInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="رواية عامة">رواية عامة</option>
                  <option value="رواية بوليسية">رواية بوليسية وتحقيق</option>
                  <option value="خيال علمي">خيال علمي وفضاء</option>
                  <option value="فانتازيا">فانتازيا وسحر</option>
                  <option value="دراما">دراما واجتماعي</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">وصف المشروع والنبذة</label>
                <textarea
                  value={editDescInput}
                  onChange={(e) => setEditDescInput(e.target.value)}
                  rows={3}
                  placeholder="اكتب وصفاً أو نبذة عن ملخص الرواية ومخططها..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
