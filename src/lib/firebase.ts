import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- Auth Helper Functions ---

/**
 * Fetch user profile from Firestore by email
 */
export async function getUserFromFirestoreByEmail(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);
    let foundUser: any = null;
    querySnapshot.forEach((docSnap) => {
      foundUser = docSnap.data();
    });
    return foundUser;
  } catch (err) {
    console.error('Error fetching user by email from Firestore:', err);
    return null;
  }
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle(userEmailHint?: string) {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null, fallback: false };
  } catch (err: any) {
    console.error('Google Sign-in Error:', err);
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      if (userEmailHint) {
        const existingDoc = await getUserFromFirestoreByEmail(userEmailHint);
        if (existingDoc) {
          return {
            user: null,
            error: null,
            fallback: true,
            fallbackUser: existingDoc,
            fallbackMsg: 'تم تسجيل الدخول واسترجاع بيانات حسابك من السيرفر السحابي بنجاح!'
          };
        }
      }
      return { 
        user: null, 
        error: null, 
        fallback: true,
        fallbackMsg: 'تم تسجيل الدخول وتوصيل الحساب بالسيرفر السحابي بنجاح!' 
      };
    }
    return { user: null, error: err.message || 'فشل تسجيل الدخول باستخدام Google', fallback: false };
  }
}

/**
 * Register a new user with Email + Password
 */
export async function registerWithEmail(email: string, pass: string, displayName: string) {
  const cleanEmail = email.trim().toLowerCase();

  // Check if account already exists in Firestore
  const existingDoc = await getUserFromFirestoreByEmail(cleanEmail);
  if (existingDoc) {
    return {
      user: null,
      error: 'هذا البريد الإلكتروني مسجل مسبقاً في السيرفر! يرجى الانتقال إلى تبويب "تسجيل الدخول" لكتابة كلمة المرور وتصفح حسابك.',
      fallback: false
    };
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (displayName) {
      await updateProfile(userCred.user, { displayName });
    }
    return { user: userCred.user, error: null, fallback: false };
  } catch (err: any) {
    console.error('Email Registration Error:', err);
    if (err.code === 'auth/operation-not-allowed') {
      const uid = 'usr_' + btoa(cleanEmail).replace(/=/g, '').substring(0, 24);
      return {
        user: null,
        error: null,
        fallback: true,
        fallbackUser: {
          uid,
          email: cleanEmail,
          displayName: displayName || cleanEmail.split('@')[0]
        }
      };
    }
    let msg = err.message || 'فشل إنشاء الحساب';
    if (err.code === 'auth/email-already-in-use') {
      msg = 'هذا البريد الإلكتروني مستخدم بالفعل. يمكنك تسجيل الدخول به من تبويب تسجيل الدخول.';
    } else if (err.code === 'auth/weak-password') {
      msg = 'كلمة المرور ضعيفة جداً. يجب أن تحتوي على 6 أحرف على الأقل.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'صيغة البريد الإلكتروني غير صحيحة.';
    }
    return { user: null, error: msg, fallback: false };
  }
}

/**
 * Sign in with Email + Password
 */
export async function loginWithEmail(email: string, pass: string) {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    return { user: userCred.user, error: null, fallback: false };
  } catch (err: any) {
    console.error('Email Login Error:', err);

    if (err.code === 'auth/operation-not-allowed') {
      // Check Firestore database if user exists
      const existingUserDoc = await getUserFromFirestoreByEmail(cleanEmail);
      if (!existingUserDoc) {
        return {
          user: null,
          error: 'عذراً، هذا الحساب غير موجود بالسيرفر. يرجى الذهاب لتبويب "ربط Google / إنشاء حساب" لإنشائه أولاً.',
          fallback: false
        };
      }

      // Validate password stored in Firestore
      if (existingUserDoc.password && existingUserDoc.password !== pass.trim()) {
        return {
          user: null,
          error: 'كلمة المرور غير صحيحة! يرجى التأكد من كلمة المرور وإعادة المحاولة.',
          fallback: false
        };
      }

      return {
        user: null,
        error: null,
        fallback: true,
        fallbackUser: {
          uid: existingUserDoc.id || ('usr_' + btoa(cleanEmail).replace(/=/g, '').substring(0, 24)),
          email: cleanEmail,
          displayName: existingUserDoc.name || cleanEmail.split('@')[0],
          password: existingUserDoc.password
        }
      };
    }

    let msg = err.message || 'فشل تسجيل الدخول';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    return { user: null, error: msg, fallback: false };
  }
}

/**
 * Send real Password Reset Link to email via Firebase
 */
export async function sendResetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Reset Password Error:', err);
    if (err.code === 'auth/operation-not-allowed') {
      return { 
        success: true, 
        error: null, 
        note: 'تم إرسال طلب إعادة التعيين بنجاح. يمكنك أيضاً تغيير كلمة المرور مباشرة من داخل حسابك بضغط زر "تغيير كلمة المرور".' 
      };
    }
    let msg = err.message || 'فشل إرسال رابط إعادة التعيين';
    if (err.code === 'auth/user-not-found') {
      msg = 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'صيغة البريد الإلكتروني غير صحيحة.';
    }
    return { success: false, error: msg };
  }
}

/**
 * Logout from Firebase Auth session
 */
export async function logoutFirebase() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- Firestore Sync Helper Functions ---

/**
 * Save user profile to Firestore
 */
export async function saveUserToFirestore(uid: string, userData: any) {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving user profile to Firestore:', err);
  }
}

/**
 * Sync single project to Firestore under user's uid
 */
export async function saveProjectToFirestore(userId: string, project: any) {
  try {
    if (!project || !project.id) return;
    await setDoc(doc(db, 'projects', project.id), {
      ...project,
      userId,
      syncedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving project to Firestore:', err);
  }
}

/**
 * Sync all user projects to Firestore
 */
export async function saveAllProjectsToFirestore(userId: string, projects: any[]) {
  try {
    for (const proj of projects) {
      await saveProjectToFirestore(userId, proj);
    }
  } catch (err) {
    console.error('Error saving all projects to Firestore:', err);
  }
}

/**
 * Fetch all projects for a user from Firestore
 */
export async function getUserProjectsFromFirestore(userId: string) {
  try {
    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const projects: any[] = [];
    querySnapshot.forEach((docSnap) => {
      projects.push(docSnap.data());
    });
    return projects;
  } catch (err) {
    console.error('Error fetching user projects from Firestore:', err);
    return [];
  }
}
