const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const importReplacement = `import { GuideModal } from './components/GuideModal';
import { getRedirectResult } from 'firebase/auth';
import { auth, saveUserToFirestore, getUserFromFirestoreByEmail } from './lib/firebase';`;

content = content.replace(`import { GuideModal } from './components/GuideModal';`, importReplacement);

const useEffectTarget = `  const [redoStack, setRedoStack] = useState<StoryProject[]>([]);
  const isDraggingNodeRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);`;

const useEffectReplacement = `  const [redoStack, setRedoStack] = useState<StoryProject[]>([]);
  const isDraggingNodeRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for Google Sign-in redirect result
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const user = result.user;
        let cleanEmail = user.email || 'author@gmail.com';
        let cleanName = user.displayName || cleanEmail.split('@')[0] || 'كاتب المخططات';
        let uid = user.uid;
        
        const existingDoc = await getUserFromFirestoreByEmail(cleanEmail);
        let profileToSave;
        
        if (existingDoc) {
          profileToSave = existingDoc;
        } else {
          profileToSave = {
            id: uid,
            uid: uid,
            email: cleanEmail,
            name: cleanName,
            googleConnected: true,
            createdAt: Date.now(),
            lastSyncedAt: Date.now()
          };
          await saveUserToFirestore(uid, profileToSave);
        }
        
        saveUserProfile(profileToSave);
        setUserProfile(profileToSave);
        setIsAccountModalOpen(true);
      }
    }).catch(error => {
      console.error("Google Redirect Auth Error:", error);
    });
  }, []);`;

content = content.replace(useEffectTarget, useEffectReplacement);
fs.writeFileSync('src/App.tsx', content);
