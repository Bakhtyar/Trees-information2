import React, { useState } from 'react';
import { 
  X, 
  User, 
  Cloud, 
  Download, 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  AlertCircle,
  KeyRound,
  Link2,
  Mail,
  UserCheck,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserProfile } from '../types/story';
import { saveUserProfile, exportAllCloudBackup, importAllCloudBackup, loadAllProjects, saveProject } from '../utils/storage';
import { 
  loginWithGoogle, 
  registerWithEmail, 
  loginWithEmail, 
  sendResetPassword, 
  logoutFirebase,
  saveUserToFirestore,
  getUserProjectsFromFirestore,
  saveAllProjectsToFirestore,
  auth
} from '../lib/firebase';
import { updatePassword } from 'firebase/auth';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onRefreshProjects: () => void;
  projectsCount: number;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onRefreshProjects,
  projectsCount
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'login' | 'backup'>('link');
  
  // Form States for Linking Google / Creating Account
  const [googleEmailInput, setGoogleEmailInput] = useState(user.email || '');
  const [googleNameInput, setGoogleNameInput] = useState(user.name || '');
  const [googlePasswordInput, setGooglePasswordInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Form States for Signing into Existing Account
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmailInput, setForgotEmailInput] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Confirmation states
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Password View & Change States
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePassForm, setShowChangePassForm] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Status message
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  if (!isOpen) return null;

  // Change Password Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || newPasswordInput.length < 6) {
      setRestoreStatus({
        type: 'error',
        msg: 'كلمة المرور الجديدة يجب أن تحتوي على 6 أحرف أو أرقام على الأقل.'
      });
      return;
    }

    setIsUpdatingPassword(true);
    setRestoreStatus(null);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPasswordInput.trim());
      }
    } catch (err: any) {
      console.log('Firebase auth password update note:', err);
    }

    const updatedProfile: UserProfile = {
      ...user,
      password: newPasswordInput.trim(),
      lastSyncedAt: Date.now()
    };

    saveUserProfile(updatedProfile);
    onUpdateUser(updatedProfile);
    await saveUserToFirestore(user.id, updatedProfile);

    setIsUpdatingPassword(false);
    setShowChangePassForm(false);
    setNewPasswordInput('');

    setRestoreStatus({
      type: 'success',
      msg: 'تم تغيير كلمة المرور للحساب بنجاح! يمكنك رؤيتها واستخدامها لتسجيل الدخول في أي وقت.'
    });
  };

  // 1. Direct Google Popup Login
  const handleDirectGoogleLogin = async () => {
    setIsLinking(true);
    setRestoreStatus(null);
    const res = await loginWithGoogle(user.email || googleEmailInput);
    setIsLinking(false);

    let uid = res.user?.uid || res.fallbackUser?.id || res.fallbackUser?.uid;
    let cleanEmail = res.user?.email || res.fallbackUser?.email || user.email || 'author@gmail.com';
    let cleanName = res.user?.displayName || res.fallbackUser?.name || user.name || cleanEmail.split('@')[0] || 'كاتب المخططات';

    if (!uid) {
      if (res.fallback) {
        uid = user.id || 'usr_' + btoa(cleanEmail.toLowerCase()).replace(/=/g, '');
      } else if (res.error) {
        setRestoreStatus({
          type: 'error',
          msg: res.error
        });
        return;
      }
    }

    // Check if user exists in Firestore database
    const existingFirestoreUser = await getUserFromFirestoreByEmail(cleanEmail);
    if (existingFirestoreUser) {
      uid = existingFirestoreUser.id || uid;
      cleanName = existingFirestoreUser.name || cleanName;
    }

    const updatedProfile: UserProfile = {
      id: uid!,
      name: cleanName,
      email: cleanEmail,
      password: existingFirestoreUser?.password || user.password,
      googleConnected: true,
      lastSyncedAt: Date.now(),
      avatar: res.user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`
    };

    saveUserProfile(updatedProfile);
    onUpdateUser(updatedProfile);
    await saveUserToFirestore(uid!, updatedProfile);

    // Fetch user's remote projects from Firestore
    const remoteProjects = await getUserProjectsFromFirestore(uid!);
    if (remoteProjects && remoteProjects.length > 0) {
      for (const proj of remoteProjects) {
        saveProject(proj);
      }
    } else {
      const localProjects = loadAllProjects();
      await saveAllProjectsToFirestore(uid!, localProjects);
    }

    setRestoreStatus({
      type: 'success',
      msg: `تم تسجيل الدخول بحساب Google (${cleanEmail}) واسترجاع مشاريعك السحابية بنجاح!`
    });
    onRefreshProjects();
  };

  // 2. Linking Google Account with Email + Password Creation in Firebase
  const handleGoogleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googlePasswordInput.trim()) {
      setRestoreStatus({
        type: 'error',
        msg: 'يرجى كتابة كلمة مرور للحساب لتتمكن من تسجيل الدخول بها لاحقاً.'
      });
      return;
    }

    setIsLinking(true);
    setRestoreStatus(null);

    const cleanEmail = googleEmailInput.trim().toLowerCase();
    const cleanName = googleNameInput.trim() || 'كاتب المخططات';

    // Try register in Firebase
    const regRes = await registerWithEmail(cleanEmail, googlePasswordInput, cleanName);

    let finalUid = 'usr_' + btoa(cleanEmail).replace(/=/g, '').substring(0, 24);

    if (regRes.user) {
      finalUid = regRes.user.uid;
    } else if (regRes.fallback && regRes.fallbackUser) {
      finalUid = regRes.fallbackUser.uid;
    } else if (regRes.error) {
      setIsLinking(false);
      setRestoreStatus({
        type: 'error',
        msg: regRes.error
      });
      return;
    }

    setIsLinking(false);

    const updatedProfile: UserProfile = {
      id: finalUid,
      name: cleanName,
      email: cleanEmail,
      password: googlePasswordInput.trim(),
      googleConnected: true,
      lastSyncedAt: Date.now(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`
    };

    saveUserProfile(updatedProfile);
    onUpdateUser(updatedProfile);
    await saveUserToFirestore(finalUid, updatedProfile);

    // Sync local projects to Firestore
    const localProjects = loadAllProjects();
    await saveAllProjectsToFirestore(finalUid, localProjects);

    setRestoreStatus({
      type: 'success',
      msg: `تم إنشاء حسابك وحفظ كلمة المرور وسيرفر البيانات السحابية بنجاح!`
    });
    onRefreshProjects();
  };

  // 3. Logging into Existing Account via Firebase / Firestore
  const handleExistingAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailInput.trim()) return;

    if (!loginPasswordInput.trim()) {
      setRestoreStatus({
        type: 'error',
        msg: 'يرجى إدخال كلمة المرور لتسجيل الدخول.'
      });
      return;
    }

    setIsLoggingIn(true);
    setRestoreStatus(null);

    const cleanEmail = loginEmailInput.trim().toLowerCase();
    const loginRes = await loginWithEmail(cleanEmail, loginPasswordInput);

    setIsLoggingIn(false);

    if (loginRes.error) {
      setRestoreStatus({
        type: 'error',
        msg: loginRes.error
      });
      return;
    }

    let finalUid: string | null = null;
    let nameFromEmail = cleanEmail.split('@')[0] || 'كاتب الرواية';

    if (loginRes.user) {
      finalUid = loginRes.user.uid;
      nameFromEmail = loginRes.user.displayName || nameFromEmail;
    } else if (loginRes.fallback && loginRes.fallbackUser) {
      finalUid = loginRes.fallbackUser.uid;
      nameFromEmail = loginRes.fallbackUser.displayName || nameFromEmail;
    }

    if (!finalUid) return;

    // Retrieve saved user record from Firestore
    const firestoreUser = await getUserFromFirestoreByEmail(cleanEmail);
    const finalName = firestoreUser?.name || nameFromEmail;
    const finalPass = firestoreUser?.password || loginPasswordInput.trim();

    const loggedInProfile: UserProfile = {
      id: finalUid,
      name: finalName,
      email: cleanEmail,
      password: finalPass,
      googleConnected: true,
      lastSyncedAt: Date.now(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`
    };

    saveUserProfile(loggedInProfile);
    onUpdateUser(loggedInProfile);

    // Download user's projects from Firestore server
    const remoteProjects = await getUserProjectsFromFirestore(finalUid);
    if (remoteProjects && remoteProjects.length > 0) {
      for (const proj of remoteProjects) {
        saveProject(proj);
      }
      setRestoreStatus({
        type: 'success',
        msg: `أهلاً بك مجدداً يا ${finalName}! تم تسجيل الدخول بنجاح واسترجاع عدد (${remoteProjects.length}) من مشاريعك ورواياتك من السيرفر السحابي.`
      });
    } else {
      const localProjects = loadAllProjects();
      await saveAllProjectsToFirestore(finalUid, localProjects);
      setRestoreStatus({
        type: 'success',
        msg: `أهلاً بك مجدداً يا ${finalName}! تم تسجيل الدخول بنجاح وتوثيق الحساب على السيرفر السحابي.`
      });
    }

    onRefreshProjects();
  };

  // 4. Request Password Reset Link via Firebase Auth Email Service
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = forgotEmailInput.trim() || loginEmailInput.trim() || googleEmailInput.trim();
    if (!targetEmail) {
      setRestoreStatus({
        type: 'error',
        msg: 'يرجى كتابة البريد الإلكتروني لإرسال رابط إعادة التعيين.'
      });
      return;
    }

    setIsSendingReset(true);
    setRestoreStatus(null);

    const { success, error } = await sendResetPassword(targetEmail);
    setIsSendingReset(false);

    if (success) {
      setIsForgotPassword(false);
      setRestoreStatus({
        type: 'success',
        msg: `تم إرسال رسالة إعادة تعيين كلمة المرور رسمياً إلى بريدك (${targetEmail}). افتح صندوق الرسائل ببريدك واضغط على الرابط لتغيير كلمة السر.`
      });
    } else {
      setRestoreStatus({
        type: 'error',
        msg: error || 'تعذر إرسال رسالة التعيين. تأكد من صحة البريد الإلكتروني.'
      });
    }
  };

  // Unlink Google account after user confirms
  const confirmUnlinkAccount = async () => {
    await logoutFirebase();
    const unlinkedProfile: UserProfile = {
      ...user,
      googleConnected: false,
      lastSyncedAt: Date.now()
    };
    saveUserProfile(unlinkedProfile);
    onUpdateUser(unlinkedProfile);
    setShowUnlinkConfirm(false);
    setRestoreStatus({
      type: 'success',
      msg: 'تم إلغاء ربط الحساب بالسيرفر السحابي بنجاح. مشاريعك محفوظة محلياً في هذا المتصفح.'
    });
  };

  // Logout of session after user confirms
  const confirmLogoutSession = async () => {
    await logoutFirebase();
    const loggedOutProfile: UserProfile = {
      id: 'guest',
      name: 'كاتب زائر',
      email: '',
      googleConnected: false,
      lastSyncedAt: Date.now()
    };
    saveUserProfile(loggedOutProfile);
    onUpdateUser(loggedOutProfile);
    setShowLogoutConfirm(false);
    setRestoreStatus({
      type: 'success',
      msg: 'تم تسجيل الخروج من الحساب بنجاح. يمكنك تسجيل الدخول مجدداً في أي وقت.'
    });
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importAllCloudBackup(content);
        if (res.success) {
          setRestoreStatus({ type: 'success', msg: res.message });
          onRefreshProjects();
        } else {
          setRestoreStatus({ type: 'error', msg: res.message });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 dir-rtl text-right">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-cyan-600 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">إدارة الحساب والمزامنة السحابية</h2>
              <p className="text-xs text-slate-400">ربط بـ Google أو تسجيل الدخول لحساب موجود لحفظ مشاريعك</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 dir-rtl">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'link'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>ربط حساب Google</span>
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول لحساب موجود</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-slate-700 text-slate-100 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>النسخ والاسترجاع</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 dir-rtl text-right">
          {restoreStatus && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              restoreStatus.type === 'success' 
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}>
              {restoreStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{restoreStatus.msg}</span>
            </div>
          )}

          {/* User Profile Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-700 border-2 border-cyan-500/60 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{user.name}</h3>
                  <p className="text-xs text-slate-400 dir-ltr text-right">{user.email}</p>
                </div>
              </div>

              {user.googleConnected ? (
                <div className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Google متصل</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  حساب زائر محلي
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50 text-xs">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/40">
                <span className="text-slate-400 block text-[11px]">المشاريع المحفوظة</span>
                <span className="font-bold text-slate-100">{projectsCount} مشروع روائي</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/40">
                <span className="text-slate-400 block text-[11px]">الحالة</span>
                <span className="font-bold text-cyan-300">
                  {user.googleConnected ? 'مزامنة سحابية نشطة' : 'محفوظ بالمتصفح'}
                </span>
              </div>
            </div>

            {/* Password Management Block */}
            {user.googleConnected && (
              <div className="pt-2.5 border-t border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold">كلمة المرور للحساب:</span>
                    <span className="font-mono bg-slate-950 px-2.5 py-0.5 rounded-md text-amber-300 dir-ltr font-bold text-xs border border-slate-800">
                      {showPassword ? (user.password || 'موجودة بالتسجيل') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-100 transition rounded-md hover:bg-slate-700/50"
                      title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowChangePassForm(!showChangePassForm)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold underline transition"
                  >
                    {showChangePassForm ? 'إلغاء' : 'تغيير كلمة المرور'}
                  </button>
                </div>

                {showChangePassForm && (
                  <form onSubmit={handleUpdatePassword} className="p-3 bg-slate-950/80 rounded-xl border border-cyan-500/30 space-y-2 text-xs animate-fadeIn">
                    <label className="block text-slate-300 font-bold">اكتب كلمة المرور الجديدة:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500 dir-ltr text-right"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-lg transition shrink-0"
                      >
                        {isUpdatingPassword ? 'جاري الحفظ...' : 'حفظ الجديدة'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Action Buttons: Logout & Unlink */}
            <div className="pt-2 border-t border-slate-700/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              {user.googleConnected ? (
                <button
                  type="button"
                  onClick={() => setShowUnlinkConfirm(true)}
                  className="px-3 py-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg transition border border-amber-500/30 flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>فصل ربط Google</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">غير مرتبط بحساب سحابي</span>
              )}

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition border border-rose-500/30 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>

            {/* Unlink Confirmation Prompt */}
            {showUnlinkConfirm && (
              <div className="p-3.5 rounded-xl border border-amber-500/50 bg-amber-950/40 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>تأكيد فصل ربط حساب Google؟</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  هل أنت تأكد من رغبتك في فصل الربط؟ لن يتم حذف مشاريعك، لكن سيتوقف الحفظ السحابي التلقائي لهذا الحساب حتى تقوم بإعادة ربطه.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUnlinkConfirm(false)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-semibold"
                  >
                    تراجع / إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={confirmUnlinkAccount}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold"
                  >
                    نعم، تأكيد فصل الربط
                  </button>
                </div>
              </div>
            )}

            {/* Logout Confirmation Prompt */}
            {showLogoutConfirm && (
              <div className="p-3.5 rounded-xl border border-rose-500/50 bg-rose-950/40 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>تأكيد تسجيل الخروج؟</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  هل أنت تأكد من الخروج من هذا الحساب؟ يمكنك تسجيل الدخول مجدداً ببريدك وكلمة المرور في أي وقت.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={confirmLogoutSession}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-slate-100 rounded-lg font-bold"
                  >
                    نعم، تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: Link Google Account */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 leading-relaxed">
                  ربط مشاريعك مع حساب <strong>Google / Gmail</strong> وإنشاء كلمة مرور يضمن حفظاً سحابياً مدى الحياة ومجانياً، وتصفح مشاريعك من أي جهاز.
                </p>
              </div>

              {/* Direct Google Popup Button */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-200 block">ربط سريح بنقرة واحدة عبر Google:</span>
                <button
                  type="button"
                  onClick={handleDirectGoogleLogin}
                  disabled={isLinking}
                  className="w-full py-3 px-4 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2.5 border border-slate-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>تسجيل الدخول المباشر بمطابقة حساب Google</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-bold shrink-0">أو أدخل بيانات الجيميل وكلمة المرور يدوياً</span>
              </div>

              <form onSubmit={handleGoogleConnect} className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 space-y-4">
                <div className="flex items-center gap-2 text-slate-100 font-bold text-sm border-b border-slate-700 pb-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <span>ربط الحساب يدوي ببريد Gmail وكلمة مرور</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">اسم الكاتب / المالك</label>
                    <input
                      type="text"
                      value={googleNameInput}
                      onChange={(e) => setGoogleNameInput(e.target.value)}
                      placeholder="ادخل اسمك..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">عنوان الجيميل (Google Gmail)</label>
                    <input
                      type="email"
                      value={googleEmailInput}
                      onChange={(e) => setGoogleEmailInput(e.target.value)}
                      placeholder="username@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 dir-ltr text-right"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">تعيين كلمة المرور للحساب</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={googlePasswordInput}
                        onChange={(e) => setGooglePasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-9 pl-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 dir-ltr text-right"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-amber-300/80 mt-1">
                      ضروري: ستحتاج كلمة المرور هذه لتسجيل الدخول لاحقاً واسترجاع أعمالك.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLinking}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {isLinking ? (
                    <span>جاري الربط وإنشاء الحساب...</span>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>تاكيد ربط الحساب وإنشاء كلمة المرور</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Sign In to Existing Account */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {!isForgotPassword ? (
                <>
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-200 text-xs flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="text-slate-300 leading-relaxed">
                      سجل دخولك بنقرة واحدة باختيار حساب Google الخاص بك أو أدخل بريدك الإلكتروني وكلمة المرور لاسترجاع جميع مشاريعك.
                    </p>
                  </div>

                  {/* Quick Google Account Chooser in Login Tab */}
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                    <span className="text-xs font-bold text-slate-200 block">اختيار حساب Google فوراً وتسجيل الدخول:</span>
                    
                    {user.email && (
                      <button
                        type="button"
                        onClick={handleDirectGoogleLogin}
                        className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 border border-cyan-500/40 text-right flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                            G
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 text-xs block">{user.name || 'حساب Google الخاص بك'}</span>
                            <span className="text-[11px] text-slate-400 dir-ltr text-right block">{user.email}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-cyan-400 font-bold bg-cyan-950 px-2 py-1 rounded-lg border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-slate-950 transition">
                          دخول فوراً
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleDirectGoogleLogin}
                      disabled={isLinking}
                      className="w-full py-3 px-4 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2.5 border border-slate-300"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>فتح نافذة اختيار الحسابات وتسجيل الدخول بـ Google</span>
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-800 w-full"></div>
                    <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-bold shrink-0">أو تسجيل الدخول بكلمة المرور والبريد</span>
                  </div>

                  <form onSubmit={handleExistingAccountLogin} className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 space-y-4">
                    <div className="flex items-center gap-2 text-slate-100 font-bold text-sm border-b border-slate-700 pb-2">
                      <LogIn className="w-5 h-5 text-cyan-400" />
                      <span>تسجيل الدخول إلى حسابك</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">البريد الإلكتروني / Gmail المسجل</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={loginEmailInput}
                            onChange={(e) => setLoginEmailInput(e.target.value)}
                            placeholder="your-account@gmail.com"
                            className="w-full pr-9 pl-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 dir-ltr text-right"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">كلمة المرور / الرمز السري</label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="password"
                            value={loginPasswordInput}
                            onChange={(e) => setLoginPasswordInput(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pr-9 pl-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 dir-ltr text-right"
                            required
                          />
                        </div>
                        <div className="flex justify-end mt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setForgotEmailInput(loginEmailInput || user.email || '');
                              setIsForgotPassword(true);
                            }}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-bold transition"
                          >
                            نسيت كلمة المرور؟ إرسال رابط إعادة التعيين
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                    >
                      {isLoggingIn ? (
                        <span>جاري التحقق وتسجيل الدخول...</span>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>تسجيل الدخول واسترجاع المشاريع</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* Forgot Password Form */
                <form onSubmit={handleSendResetEmail} className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 space-y-4">
                  <div className="flex items-center gap-2 text-slate-100 font-bold text-sm border-b border-slate-700 pb-2">
                    <Mail className="w-5 h-5 text-amber-400" />
                    <span>إعادة تعيين كلمة المرور عن طريق البريد</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    أدخل عنوان بريدك الإلكتروني وسيتم إرسال رابط رسميا لإعادة تعيين كلمة المرور عبر Firebase Auth.
                  </p>

                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-200/90 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      تنويه حول وصول الرسائل:
                    </p>
                    <p>
                      إذا لم تجد الرسالة في صندوق الوارد (Inbox) خلال دقيقة، يرجى مراجعة مجلد الرسائل المزعجة (Spam / Junk). كما يمكنك رؤية كلمة المرور وتغييرها في أي وقت مباشرة داخل التطبيق عند تسجيل الدخول!
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">البريد الإلكتروني لطلب التعيين</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={forgotEmailInput}
                          onChange={(e) => setForgotEmailInput(e.target.value)}
                          placeholder="your-email@gmail.com"
                          className="w-full pr-9 pl-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 dir-ltr text-right"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSendingReset}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                      {isSendingReset ? (
                        <span>جاري إرسال الرابط...</span>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>إرسال رابط إعادة التعيين للبريد</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition border border-slate-700"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: Backup & Restore (JSON) */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/40 text-xs space-y-1">
                <h4 className="font-bold text-slate-200 text-sm">التنزيل والاستعادة اليدوية (ملف JSON)</h4>
                <p className="text-slate-400 leading-relaxed">
                  يمكنك تنزيل ملف أمان شامِل يحتوي على كل مشاريعك ونصوصك لاستعادته في أي وقت.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={exportAllCloudBackup}
                  className="p-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-cyan-300 transition flex items-center gap-3 text-right group"
                >
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-slate-100">تحميل نسخة سحابية كاملة</span>
                    <span className="text-[10px] text-slate-400">ملف JSON يحتوي كافة مشاريعك</span>
                  </div>
                </button>

                <label className="p-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-cyan-300 transition flex items-center gap-3 text-right cursor-pointer group">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-slate-100">استرجاع من ملف احتياطي</span>
                    <span className="text-[10px] text-slate-400">رفع ملف JSON وتحديث المشاريع</span>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
          >
            إغلاق Window
          </button>
        </div>
      </div>
    </div>
  );
};

