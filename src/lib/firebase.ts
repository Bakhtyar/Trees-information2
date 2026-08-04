import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
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
const firebaseConfig = {
  apiKey: "AIzaSyD-2gB2CeYBqBTAX5oqD6LAz5WyoiY0tvg",
  authDomain: "vercel111.firebaseapp.com",
  projectId: "vercel111",
  storageBucket: "vercel111.firebasestorage.app",
  messagingSenderId: "118085727200",
  appId: "1:118085727200:web:f401c14f46afb16556f185",
  measurementId: "G-P91N8C6D18"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- Auth Helper Functions ---

export async function deleteProjectFromFirestore(projectId: string) {
  try {
    if (!projectId) return;
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    console.error('Error deleting project from Firestore:', err);
  }
}

/**
 * Fetch user profile from Firestore by email
 */
export async function getUserFromFirestoreByEmail(email: string) {
  if (!email || !email.trim()) return null;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const emailDocId = cleanEmail.replace(/[^a-z0-9]/gi, '_');

    // 1. Direct doc lookup in users_by_email (instant & no index needed)
    const directSnap = await getDoc(doc(db, 'users_by_email', emailDocId));
    if (directSnap.exists()) {
      return directSnap.data();
    }

    // 2. Query users collection where email == cleanEmail
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);
    let foundUser: any = null;
    querySnapshot.forEach((docSnap) => {
      foundUser = docSnap.data();
    });
    if (foundUser) return foundUser;

    // 3. Fallback check by generated UID
    const oldFallbackUid = 'usr_' + btoa(encodeURIComponent(cleanEmail)).replace(/=/g, '');
    const newFallbackUid = 'usr_' + btoa(encodeURIComponent(cleanEmail)).replace(/=/g, '').substring(0, 24);
    
    const oldUidSnap = await getDoc(doc(db, 'users', oldFallbackUid));
    if (oldUidSnap.exists()) {
      return oldUidSnap.data();
    }
    
    const newUidSnap = await getDoc(doc(db, 'users', newFallbackUid));
    if (newUidSnap.exists()) {
      return newUidSnap.data();
    }

    return null;
  } catch (err) {
    console.error('Error fetching user by email from Firestore:', err);
    return null;
  }
}

/**
 * Sign in with Google Popup or Email Fallback
 */
export async function loginWithGoogle(userEmailHint?: string) {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result && result.user) {
      return { user: result.user, error: null, fallback: false, redirecting: false };
    }
  } catch (err: any) {
    console.warn('Google Sign-in Popup Note:', err);
    // Do NOT call signInWithRedirect here, as it navigates the iframe to Google OAuth which returns 403 in embedded frames.
    const targetEmail = userEmailHint ? userEmailHint.trim().toLowerCase() : '';
    if (targetEmail) {
      const existingDoc = await getUserFromFirestoreByEmail(targetEmail);
      if (existingDoc) {
        return {
          user: null,
          error: null,
          fallback: true,
          fallbackUser: existingDoc,
          fallbackMsg: 'تم تسجيل الدخول واسترجاع بيانات حسابك من السيرفر السحابي بنجاح!'
        };
      }
      const newUid = 'usr_' + btoa(encodeURIComponent(targetEmail)).replace(/=/g, '').substring(0, 24);
      const newProfile = {
        id: newUid,
        uid: newUid,
        email: targetEmail,
        name: targetEmail.split('@')[0],
        googleConnected: true,
        createdAt: Date.now()
      };
      await saveUserToFirestore(newUid, newProfile);
      return {
        user: null,
        error: null,
        fallback: true,
        fallbackUser: newProfile,
        fallbackMsg: 'تم إنشاء حسابك وتوصيله بالسيرفر السحابي بنجاح!'
      };
    }
    return { 
      user: null, 
      error: 'تعذر فتح نافذة Google المنبثقة في بيئة العرض المباشرة. يمكنك كتابة بريدك الإلكتروني أدناه لتسجيل الدخول والربط السحابي المباشر.', 
      fallback: false 
    };
  }
  return { 
    user: null, 
    error: 'تعذر فتح نافذة Google. يرجى استخدام بريدك الإلكتروني للربط السحابي المباشر.', 
    fallback: false 
  };
}

/**
 * Register a new user with Email + Password
 */
export async function registerWithEmail(email: string, pass: string, displayName: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  // Check if account already exists in Firestore
  const existingDoc = await getUserFromFirestoreByEmail(cleanEmail);
  if (existingDoc) {
    return {
      user: null,
      error: 'هذا البريد الإلكتروني مسجل مسبقاً في السيرفر السحابي! يرجى الانتقال إلى تبويب "تسجيل الدخول" لكتابة كلمة المرور وتصفح حسابك.',
      fallback: false
    };
  }

  const uid = 'usr_' + btoa(encodeURIComponent(cleanEmail)).replace(/=/g, '').substring(0, 24);
  const userPayload = {
    id: uid,
    uid: uid,
    email: cleanEmail,
    password: cleanPass,
    name: displayName.trim() || cleanEmail.split('@')[0] || 'كاتب المخططات',
    googleConnected: true,
    createdAt: Date.now(),
    lastSyncedAt: Date.now()
  };

  // Always save profile to Firestore
  await saveUserToFirestore(uid, userPayload);

  // Try Firebase Auth in background
  try {
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    if (displayName) {
      await updateProfile(userCred.user, { displayName });
    }
    return { user: userCred.user, fallbackUser: userPayload, error: null, fallback: true };
  } catch (err: any) {
    console.log('Firebase auth register note:', err?.message);
    if (err.code === 'auth/email-already-in-use') {
      return { 
        user: null, 
        error: 'هذا البريد الإلكتروني مسجل مسبقاً! يرجى الانتقال إلى تبويب "تسجيل الدخول".', 
        fallback: false 
      };
    }
    return { user: null, fallbackUser: userPayload, error: null, fallback: true };
  }
}

/**
 * Sign in with Email + Password
 */
export async function loginWithEmail(email: string, pass: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. First check Firestore database for existing user account
  const firestoreUser = await getUserFromFirestoreByEmail(cleanEmail);

  if (firestoreUser) {
    // Validate stored password
    if (firestoreUser.password) {
      if (firestoreUser.password !== cleanPass) {
        return {
          user: null,
          error: 'كلمة المرور غير صحيحة! يرجى التأكد من كلمة المرور وإعادة المحاولة.',
          fallback: false
        };
      }
    } else {
      return {
        user: null,
        error: 'هذا الحساب تم إنشاؤه عبر Google ولا يحتوي على كلمة مرور. يرجى تسجيل الدخول من خلال حساب Google، أو استخدام ميزة "إعادة تعيين كلمة المرور".',
        fallback: false
      };
    }

    const uid = firestoreUser.id || firestoreUser.uid || ('usr_' + btoa(encodeURIComponent(cleanEmail)).replace(/=/g, '').substring(0, 24));
    return {
      user: null,
      error: null,
      fallback: true,
      fallbackUser: {
        ...firestoreUser,
        id: uid,
        uid: uid,
        password: cleanPass
      }
    };
  }

  // 2. Try Firebase Auth if not found in Firestore
  try {
    const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const uid = userCred.user.uid;
    const profile = {
      id: uid,
      uid: uid,
      email: cleanEmail,
      name: userCred.user.displayName || cleanEmail.split('@')[0],
      password: cleanPass,
      googleConnected: true,
      lastSyncedAt: Date.now()
    };
    await saveUserToFirestore(uid, profile);
    return { user: userCred.user, fallbackUser: profile, error: null, fallback: false };
  } catch (err: any) {
    console.error('Email Login Error:', err);
    let msg = 'لم نجد حساباً مسجلاً بهذا البريد الإلكتروني. يمكنك الذهاب لتبويب "ربط Google / إنشاء حساب" لإنشاء حسابك الجديد.';
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = 'كلمة المرور غير صحيحة! يرجى التأكد من كلمة المرور وإعادة المحاولة.';
    }
    return { user: null, error: msg, fallback: false };
  }
}

/**
 * Send Password Reset Link & Check Firestore Account
 */
export async function sendResetPassword(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  let dbUser = null;

  try {
    dbUser = await getUserFromFirestoreByEmail(cleanEmail);
  } catch (e) {
    console.error('Error finding user for reset:', e);
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return { success: true, error: null, dbUser };
  } catch (err: any) {
    console.log('Reset Password Firebase Auth note:', err?.message);
    if (dbUser) {
      return { success: true, error: null, dbUser };
    }
    return { 
      success: false, 
      error: 'تعذر العثور على حساب بهذا البريد. تأكد من صحة البريد أو أنشئ حساباً جديداً.',
      dbUser: null 
    };
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

function sanitizeForFirestore(data: any): any {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
}

/**
 * Save user profile to Firestore
 */
export async function saveUserToFirestore(uid: string, userData: any) {
  try {
    const cleanEmail = userData.email ? userData.email.trim().toLowerCase() : null;
    const docData = sanitizeForFirestore({
      ...userData,
      id: uid,
      updatedAt: Date.now()
    });

    // Save to users collection
    await setDoc(doc(db, 'users', uid), docData, { merge: true });

    // Also save to users_by_email index doc for instant lookup
    if (cleanEmail) {
      const emailDocId = cleanEmail.replace(/[^a-z0-9]/gi, '_');
      await setDoc(doc(db, 'users_by_email', emailDocId), docData, { merge: true });
    }
  } catch (err) {
    console.error('Error saving user profile to Firestore:', err);
  }
}

/**
 * Sync single project to Firestore under user's uid
 */
export async function saveProjectToFirestore(userId: string, project: any, userEmail?: string) {
  try {
    if (!project || !project.id) return;
    const cleanDoc = sanitizeForFirestore({
      ...project,
      userId,
      userEmail: userEmail ? userEmail.trim().toLowerCase() : '',
      syncedAt: Date.now()
    });
    await setDoc(doc(db, 'projects', project.id), cleanDoc, { merge: true });
  } catch (err) {
    console.error('Error saving project to Firestore:', err);
  }
}

/**
 * Sync all user projects to Firestore
 */
export async function saveAllProjectsToFirestore(userId: string, projects: any[], userEmail?: string) {
  try {
    for (const proj of projects) {
      await saveProjectToFirestore(userId, proj, userEmail);
    }
  } catch (err) {
    console.error('Error saving all projects to Firestore:', err);
  }
}

/**
 * Fetch all projects for a user from Firestore
 */
export async function getUserProjectsFromFirestore(userId: string, userEmail?: string) {
  try {
    const projectsMap = new Map<string, any>();

    // 1. Fetch by userId
    const qUser = query(collection(db, 'projects'), where('userId', '==', userId));
    const querySnapshot = await getDocs(qUser);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.id) {
        projectsMap.set(data.id, data);
      }
    });

    // 1b. Fetch by old legacy userId format (without substring) if userEmail is provided
    if (userEmail && userEmail.trim()) {
      const cleanEmail = userEmail.trim().toLowerCase();
      const oldFallbackUid = 'usr_' + btoa(encodeURIComponent(cleanEmail)).replace(/=/g, '');
      if (oldFallbackUid !== userId) {
        const qOldUser = query(collection(db, 'projects'), where('userId', '==', oldFallbackUid));
        const oldQuerySnapshot = await getDocs(qOldUser);
        oldQuerySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.id) {
            projectsMap.set(data.id, data);
          }
        });
      }
    }

    // 2. Fetch by userEmail if provided
    if (userEmail && userEmail.trim()) {
      const cleanEmail = userEmail.trim().toLowerCase();
      const qEmail = query(collection(db, 'projects'), where('userEmail', '==', cleanEmail));
      const emailSnapshot = await getDocs(qEmail);
      emailSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id) {
          projectsMap.set(data.id, data);
        }
      });
    }

    return Array.from(projectsMap.values());
  } catch (err) {
    console.error('Error fetching user projects from Firestore:', err);
    return [];
  }
}
