import { StoryProject, UserProfile, NODE_CATEGORIES, StoryNode, StoryConnection, NodeCategory } from '../types/story';
import { SAMPLE_DETECTIVE_PROJECT, BLANK_PROJECT_TEMPLATE } from './sampleProject';

const LEGACY_STORAGE_KEY = 'STORY_NOVEL_MAPPER_PROJECT_V1';
const PROJECTS_LIST_KEY = 'STORY_NOVEL_MAPPER_PROJECTS_V2';
const ACTIVE_PROJECT_ID_KEY = 'STORY_NOVEL_MAPPER_ACTIVE_ID_V2';
const USER_PROFILE_KEY = 'STORY_NOVEL_MAPPER_USER_PROFILE_V2';
const CLOUD_VAULT_KEY = 'STORY_NOVEL_MAPPER_CLOUD_VAULT_V2';

// ---------------- USER PROFILE STORAGE ----------------

export const DEFAULT_GUEST_USER: UserProfile = {
  id: 'guest_user_1',
  name: 'كاتب المخططات الروائية',
  email: 'author@storymapper.app',
  googleConnected: false,
  createdAt: Date.now(),
  lastSyncedAt: Date.now()
};

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw) as UserProfile;
    }
  } catch (e) {
    console.error('Error loading user profile:', e);
  }
  return DEFAULT_GUEST_USER;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    const updated = { ...profile, lastSyncedAt: Date.now() };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    // Also store in cloud backup vault
    syncCloudVault(updated);
  } catch (e) {
    console.error('Error saving user profile:', e);
  }
}

// ---------------- MULTI-PROJECT STORAGE ----------------

export function loadAllProjects(): StoryProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as StoryProject[];
      }
    }

    // Try migration from Legacy V1 single project
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyProject = JSON.parse(legacyRaw) as StoryProject;
      if (legacyProject && legacyProject.nodes) {
        const migratedList = [legacyProject];
        saveAllProjects(migratedList);
        return migratedList;
      }
    }

    // Default initial project list
    const defaultList = [SAMPLE_DETECTIVE_PROJECT];
    saveAllProjects(defaultList);
    return defaultList;
  } catch (err) {
    console.error('Error loading projects list, fallback to sample:', err);
    return [SAMPLE_DETECTIVE_PROJECT];
  }
}

export function saveAllProjects(projects: StoryProject[]): boolean {
  try {
    const serialized = JSON.stringify(projects);
    localStorage.setItem(PROJECTS_LIST_KEY, serialized);
    // Also sync to account backup vault
    syncCloudVault(undefined, projects);
    return true;
  } catch (err) {
    console.error('Error saving all projects:', err);
    return false;
  }
}

export function getActiveProjectId(): string {
  try {
    const id = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
    if (id) return id;
  } catch (e) {
    console.error('Error loading active project id:', e);
  }
  const projects = loadAllProjects();
  return projects[0]?.id || SAMPLE_DETECTIVE_PROJECT.id;
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  } catch (e) {
    console.error('Error setting active project id:', e);
  }
}

export function loadProject(id?: string): StoryProject {
  const projects = loadAllProjects();
  const targetId = id || getActiveProjectId();
  const found = projects.find(p => p.id === targetId);
  if (found) return found;

  if (projects.length > 0) return projects[0];
  return SAMPLE_DETECTIVE_PROJECT;
}

export function saveProject(project: StoryProject): boolean {
  try {
    const projects = loadAllProjects();
    const index = projects.findIndex(p => p.id === project.id);
    const updatedProject: StoryProject = {
      ...project,
      lastSavedAt: Date.now()
    };

    if (index >= 0) {
      projects[index] = updatedProject;
    } else {
      projects.unshift(updatedProject);
    }

    setActiveProjectId(updatedProject.id);
    return saveAllProjects(projects);
  } catch (err) {
    console.error('Error auto-saving project:', err);
    return false;
  }
}

export function createNewProject(
  title: string, 
  description: string = '', 
  genre: string = 'عام', 
  templateType: 'blank' | 'detective' | 'scifi' | 'fantasy' = 'blank'
): StoryProject {
  const newId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  let baseNodes: StoryNode[] = [];
  let baseConnections: StoryConnection[] = [];

  if (templateType === 'detective') {
    baseNodes = JSON.parse(JSON.stringify(SAMPLE_DETECTIVE_PROJECT.nodes));
    baseConnections = JSON.parse(JSON.stringify(SAMPLE_DETECTIVE_PROJECT.connections));
  } else if (templateType === 'scifi') {
    baseNodes = [
      {
        id: 'scifi_1',
        title: 'محطة أوريون الفضائية',
        content: 'المقر الرئيسي لقيادة الملاحة المجرة وإدارة الثقوب الدودية',
        type: 'place',
        color: '#10b981',
        x: 0,
        y: 0,
        width: 320,
        height: 170,
        tags: ['موقع', 'فضاء'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'scifi_2',
        title: 'القائد أريان',
        content: 'قبطان السفينة والمكتشف الأول للممر الفضائي المجهول',
        type: 'character',
        color: '#3b82f6',
        x: 400,
        y: 50,
        width: 310,
        height: 160,
        tags: ['بطل', 'قائد'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    baseConnections = [
      {
        id: 'conn_scifi_1',
        fromNodeId: 'scifi_2',
        toNodeId: 'scifi_1',
        label: 'يقود',
        color: '#0ea5e9',
        createdAt: Date.now()
      }
    ];
  } else if (templateType === 'fantasy') {
    baseNodes = [
      {
        id: 'fantasy_1',
        title: 'مملكة أرادور الخالدة',
        content: 'قلعة الفانتازيا والمركز السحري لعشيرة الفرسان',
        type: 'place',
        color: '#10b981',
        x: 0,
        y: 0,
        width: 320,
        height: 170,
        tags: ['مملكة', 'سحر'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'fantasy_2',
        title: 'الساحر إلدور',
        content: 'حارس البلورة القديمة ومستشار الملك',
        type: 'character',
        color: '#8b5cf6',
        x: 420,
        y: 20,
        width: 310,
        height: 160,
        tags: ['ساحر', 'حليف'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    baseConnections = [
      {
        id: 'conn_fan_1',
        fromNodeId: 'fantasy_2',
        toNodeId: 'fantasy_1',
        label: 'يحمي',
        color: '#8b5cf6',
        createdAt: Date.now()
      }
    ];
  }

  const newProject: StoryProject = {
    id: newId,
    title: title || 'مشروع روائي جديد',
    description: description || 'مخطط زمني ومكاني لتطور أحداث الرواية وشخصياتها.',
    genre,
    createdAt: Date.now(),
    nodes: baseNodes,
    connections: baseConnections,
    canvasView: { x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 },
    lastSavedAt: Date.now(),
    version: 2
  };

  const projects = loadAllProjects();
  projects.unshift(newProject);
  saveAllProjects(projects);
  setActiveProjectId(newId);
  return newProject;
}

export function duplicateProject(projectId: string): StoryProject | null {
  const projects = loadAllProjects();
  const source = projects.find(p => p.id === projectId);
  if (!source) return null;

  const newId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const duplicated: StoryProject = {
    ...JSON.parse(JSON.stringify(source)),
    id: newId,
    title: `${source.title} (نسخة)`,
    createdAt: Date.now(),
    lastSavedAt: Date.now()
  };

  projects.unshift(duplicated);
  saveAllProjects(projects);
  return duplicated;
}

export function deleteProject(projectId: string): StoryProject[] {
  let projects = loadAllProjects();
  projects = projects.filter(p => p.id !== projectId);
  
  if (projects.length === 0) {
    const fresh = createNewProject('مشروع جديد', 'بداية قصة جديدة', 'عام', 'blank');
    return [fresh];
  }

  saveAllProjects(projects);
  if (getActiveProjectId() === projectId) {
    setActiveProjectId(projects[0].id);
  }
  return projects;
}

// ---------------- CLOUD VAULT BACKUP & SYNC ----------------

export function syncCloudVault(profileOverride?: UserProfile, projectsOverride?: StoryProject[]): void {
  try {
    const profile = profileOverride || getUserProfile();
    const projects = projectsOverride || loadAllProjects();
    const vault = {
      user: profile,
      projects,
      vaultVersion: 2,
      syncedAt: Date.now()
    };
    localStorage.setItem(CLOUD_VAULT_KEY, JSON.stringify(vault));
  } catch (e) {
    console.error('Error syncing cloud vault:', e);
  }
}

export function exportAllCloudBackup(): void {
  const profile = getUserProfile();
  const projects = loadAllProjects();
  const backupData = {
    appName: 'Story Novel Spatial Mapper',
    user: profile,
    projectsCount: projects.length,
    projects,
    backupTimestamp: Date.now(),
    backupDateStr: new Date().toISOString()
  };

  const serialized = JSON.stringify(backupData, null, 2);
  const blob = new Blob([serialized], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (profile.name || 'user').replace(/\s+/g, '-');
  a.download = `StoryMapper-Backup-${safeName}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAllCloudBackup(jsonContent: string): { success: boolean; message: string; count?: number } {
  try {
    const data = JSON.parse(jsonContent);
    if (!data || (!data.projects && !Array.isArray(data))) {
      return { success: false, message: 'صيغة ملف النسخة الاحتياطية غير صالحة.' };
    }

    let importedProjects: StoryProject[] = [];
    if (Array.isArray(data.projects)) {
      importedProjects = data.projects;
    } else if (Array.isArray(data)) {
      importedProjects = data;
    }

    if (importedProjects.length === 0) {
      return { success: false, message: 'لم يتم العثور على أي مشاريع داخل الملف.' };
    }

    if (data.user && typeof data.user === 'object') {
      saveUserProfile({ ...data.user, googleConnected: true });
    }

    saveAllProjects(importedProjects);
    setActiveProjectId(importedProjects[0].id);

    return {
      success: true,
      message: `تمت استعادة ${importedProjects.length} مشروع بنجاح إلى حسابك والمتصفح!`,
      count: importedProjects.length
    };
  } catch (e) {
    console.error('Error importing backup:', e);
    return { success: false, message: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.' };
  }
}

export function exportToJSON(project: StoryProject): void {
  const serialized = JSON.stringify(project, null, 2);
  const blob = new Blob([serialized], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (project.title || 'project').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '');
  a.download = `${safeTitle}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getMajorZoneLetter(index: number): string {
  let letter = '';
  let idx = index;
  while (idx >= 0) {
    letter = String.fromCharCode((idx % 26) + 65) + letter;
    idx = Math.floor(idx / 26) - 1;
  }
  return letter;
}

export function getSpatialZoneForPos(x: number, y: number, sectorSize = 350) {
  const xSec = Math.floor(x / sectorSize);
  const ySec = Math.floor(y / sectorSize);

  const parentZone = xSec >= 0 
    ? getMajorZoneLetter(xSec)
    : `-${getMajorZoneLetter(Math.abs(xSec) - 1)}`;

  let yStr = '';
  if (ySec >= 0) {
    yStr = `${ySec + 1}`;
  } else {
    yStr = `-${Math.abs(ySec)}`;
  }

  const childZone = `${parentZone}${yStr}`;

  // Deep Micro-Subzone calculation (50px precision sub-grid inside 350px sector)
  const SUB_GRID_SIZE = 50;
  const localX = Math.floor((((x % sectorSize) + sectorSize) % sectorSize));
  const localY = Math.floor((((y % sectorSize) + sectorSize) % sectorSize));
  
  const subCol = Math.floor(localX / SUB_GRID_SIZE) + 1; // 1 to 7
  const subRow = Math.floor(localY / SUB_GRID_SIZE) + 1; // 1 to 7
  const subIndex = (subRow - 1) * 7 + subCol; // 1 to 49

  const deepZone = `${childZone}.s${subIndex}`;

  return {
    xSec,
    ySec,
    parentZone,
    yNum: ySec >= 0 ? ySec + 1 : ySec,
    childZone,
    deepZone,
    subCol,
    subRow,
    subIndex,
    microCoords: `(${Math.round(x)}, ${Math.round(y)})`
  };
}

export function importFromJSONFile(file: File): Promise<StoryProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as StoryProject;
        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
          reject(new Error('ملف المشروع غير صالح أو لا يحتوي على عناصر القصة.'));
          return;
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف.'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function exportToMarkdown(project: StoryProject): string {
  let md = `# 📚 ${project.title || 'مخطط القصة والرواية'}\n\n`;
  if (project.description) {
    md += `> **الوصف العام:** ${project.description}\n\n`;
  }
  md += `*تاريخ التصدير:* ${new Date().toLocaleString('ar-EG')}\n`;
  md += `*عدد المربعات والعقد:* ${project.nodes.length} | *عدد العلاقات والروابط:* ${project.connections.length}\n\n`;
  md += `---\n\n`;

  // 1. Summary table of nodes
  md += `## 📊 فهرس العُقد والمربعات\n\n`;
  md += `| المعرف (ID) | العنوان | النوع | الموقع النسبى (X, Y) | الألوان |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  project.nodes.forEach((node) => {
    const cat = NODE_CATEGORIES[node.type];
    const catName = cat ? cat.name : node.type;
    md += `| \`${node.id}\` | **${node.title || 'بدون عنوان'}** | ${catName} | (${Math.round(node.x)}, ${Math.round(node.y)}) | ${node.color || '#3b82f6'} |\n`;
  });
  md += `\n---\n\n`;

  // 2. Connections Table
  if (project.connections.length > 0) {
    md += `## 🔗 شبكة العلاقات والروابط بين العُقد\n\n`;
    md += `| المعرف | المصدر (fromNodeId) | الهدف (toNodeId) | اسم العلاقة (relationLabel) | اتجاه السهم |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    project.connections.forEach((conn) => {
      const source = project.nodes.find((n) => n.id === conn.fromNodeId);
      const target = project.nodes.find((n) => n.id === conn.toNodeId);
      const arrow = conn.bidirectional ? '⬌ مزدوج' : '➔ أحادي';
      const sourceTitle = source ? `**${source.title}** (\`${source.id}\`)` : conn.fromNodeId;
      const targetTitle = target ? `**${target.title}** (\`${target.id}\`)` : conn.toNodeId;
      md += `| \`${conn.id}\` | ${sourceTitle} | ${targetTitle} | \`${conn.label || 'مرتبط بـ'}\` | ${arrow} |\n`;
    });
    md += `\n---\n\n`;
  }

  // 3. Detailed node contents categorized
  md += `## 📝 التفاصيل الكاملة والملاحظات لكل عقدة\n\n`;
  const categories = Object.keys(NODE_CATEGORIES) as Array<keyof typeof NODE_CATEGORIES>;

  categories.forEach((catKey) => {
    const cat = NODE_CATEGORIES[catKey];
    const catNodes = project.nodes.filter((n) => n.type === catKey);
    if (catNodes.length === 0) return;

    md += `### 📌 ${cat.namePlural} (${catNodes.length})\n\n`;
    catNodes.forEach((node) => {
      md += `#### 🔹 ${node.title || 'بدون عنوان'} (ID: \`${node.id}\`)\n`;
      md += `- **النوع:** ${cat.name}\n`;
      md += `- **الإحداثيات:** X=${Math.round(node.x)}, Y=${Math.round(node.y)}\n`;
      if (node.parentId) {
        const parent = project.nodes.find((n) => n.id === node.parentId);
        md += `- **عقدة فرعية تابعة لـ:** ${parent ? `**${parent.title}** (\`${parent.id}\`)` : node.parentId}\n`;
      }
      if (node.tags && node.tags.length > 0) {
        md += `- **الوسوم:** ${node.tags.map((t) => `#${t}`).join(' ')}\n`;
      }
      md += `\n**المحتوى النصي الكامل:**\n`;
      md += `\`\`\`text\n${node.content || '(لا يوجد نص دقيق داخل هذه العقدة)'}\n\`\`\`\n\n`;

      if (node.internalNotes && node.internalNotes.trim()) {
        md += `> 💡 **ملاحظات الكاتب السرية (Internal Writer Notes):**\n> ${node.internalNotes.replace(/\n/g, '\n> ')}\n\n`;
      }

      // Outgoing & incoming connections
      const outgoing = project.connections.filter((c) => c.fromNodeId === node.id);
      const incoming = project.connections.filter((c) => c.toNodeId === node.id);

      if (outgoing.length > 0 || incoming.length > 0) {
        md += `**الروابط المباشرة بهذا العنصر:**\n`;
        outgoing.forEach((c) => {
          const target = project.nodes.find((n) => n.id === c.toNodeId);
          const direction = c.bidirectional ? '⬌' : '➔';
          md += `- ${direction} [**${c.label}**] إلى: **${target ? target.title : c.toNodeId}** (\`${c.toNodeId}\`)\n`;
        });
        incoming.forEach((c) => {
          const source = project.nodes.find((n) => n.id === c.fromNodeId);
          const direction = c.bidirectional ? '⬌' : '⬅';
          md += `- ${direction} [**${c.label}**] من: **${source ? source.title : c.fromNodeId}** (\`${c.fromNodeId}\`)\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });
  });

  // Embedded Raw JSON for AI reading
  md += `## 🤖 البيانات الخام المضمّنة (Embedded Machine-Readable JSON)\n\n`;
  md += `يمكن لأي نموذج ذكاء اصطناعي (Gemini / Claude / ChatGPT) تحليل الكائن التالي مباشرة:\n\n`;
  md += `\`\`\`json\n${JSON.stringify(project, null, 2)}\n\`\`\`\n`;

  return md;
}

export function downloadMarkdownFile(project: StoryProject): void {
  const mdContent = exportToMarkdown(project);
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (project.title || 'project').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '');
  a.download = `${safeTitle}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface AISmartNodeSchema {
  nodeId: string; // e.g., "MAIN-001" or "MAIN-003-BR-001"
  nodeType: 'MAIN' | 'BRANCH';
  identity: {
    mainOrderId: number | null;
    branchOrderId: number | null;
    parentMainNode: string | null;
  };
  spatial: {
    spatialAddress: string; // e.g. "MAIN-A1-01" or "BR-B2-03"
    parentZone: string; // e.g. "A"
    childZone: string; // e.g. "A1"
    localIndex: number; // e.g. 1
    depthLevel: number;
    exactCoordinates: {
      x: number;
      y: number;
      centerX: number;
      centerY: number;
    };
    surroundingNodes: {
      north: string | null;
      south: string | null;
      east: string | null;
      west: string | null;
    };
  };
  orderingAndFlow: {
    readingOrder: number;
    storyOrder: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    importance: 'CRUCIAL' | 'SECONDARY' | 'OPTIONAL';
    readAfter: string[];
    readBefore: string[];
    dependsOn: string[];
    continueTo: string | null;
  };
  content: {
    title: string;
    description: string;
  };
}

export interface AnalyzedNodeTopology {
  id: string;
  smartId: string;
  title: string;
  type: NodeCategory;
  categoryName: string;
  content: string;
  internalNotes?: string;
  tags: string[];
  
  // Narrative Role & Significance
  narrativeRole: string;
  
  // Topology & Branch Level
  treeLevel: number;
  branchPosition: string;
  pathType: string;
  
  // Upstream & Downstream Context
  predecessors: Array<{ id: string; smartId: string; title: string; type: string; relationLabel: string }>;
  successors: Array<{ id: string; smartId: string; title: string; type: string; relationLabel: string }>;
  
  // Spatial Proximity Neighbors
  spatialNeighbors: Array<{ id: string; smartId: string; title: string; type: string; distancePx: number }>;
  
  // Reading Priority & Sequence Order
  readingSequence: number;
  readPriorityCategory: string;
  canBeDeferred: boolean;

  // Embedded AI Schema
  aiSchema: AISmartNodeSchema;
}

export interface StoryTopologyAnalysis {
  nodes: Record<string, AnalyzedNodeTopology>;
  aiSmartSchemas: AISmartNodeSchema[];
  readingGuide: {
    mustReadFirst: Array<{ id: string; smartId: string; title: string; narrativeRole: string; reason: string }>;
    mainPlotLine: Array<{ id: string; smartId: string; title: string; narrativeRole: string; level: number; sequence: number }>;
    subplots: Array<{ id: string; smartId: string; title: string; branchPosition: string; sequence: number }>;
    deferrableElements: Array<{ id: string; smartId: string; title: string; type: string; sequence: number }>;
  };
  relationshipsCatalog: Array<{
    id: string;
    fromId: string;
    fromSmartId: string;
    fromTitle: string;
    toId: string;
    toSmartId: string;
    toTitle: string;
    label: string;
    semanticMeaning: string;
    bidirectional: boolean;
  }>;
}

export function analyzeStoryTopology(project: StoryProject): StoryTopologyAnalysis {
  const nodes = project.nodes || [];
  const connections = project.connections || [];
  const nodeMap = new Map<string, StoryNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Build connection graphs
  const outgoingMap = new Map<string, Array<{ toId: string; label: string }>>();
  const incomingMap = new Map<string, Array<{ fromId: string; label: string }>>();
  
  nodes.forEach(n => {
    outgoingMap.set(n.id, []);
    incomingMap.set(n.id, []);
  });

  connections.forEach(c => {
    if (nodeMap.has(c.fromNodeId) && nodeMap.has(c.toNodeId)) {
      outgoingMap.get(c.fromNodeId)?.push({ toId: c.toNodeId, label: c.label || 'مرتبط بـ' });
      incomingMap.get(c.toNodeId)?.push({ fromId: c.fromNodeId, label: c.label || 'مرتبط بـ' });
      if (c.bidirectional) {
        outgoingMap.get(c.toNodeId)?.push({ toId: c.fromNodeId, label: c.label || 'مرتبط بـ' });
        incomingMap.get(c.fromNodeId)?.push({ fromId: c.toNodeId, label: c.label || 'مرتبط بـ' });
      }
    }
  });

  // Include explicit parent-child relations
  nodes.forEach(n => {
    if (n.parentId && nodeMap.has(n.parentId)) {
      if (!incomingMap.get(n.id)?.some(item => item.fromId === n.parentId)) {
        incomingMap.get(n.id)?.push({ fromId: n.parentId, label: 'تفرّع من' });
        outgoingMap.get(n.parentId)?.push({ toId: n.id, label: 'تفرّع منه' });
      }
    }
  });

  // Determine root nodes
  const roots: string[] = [];
  nodes.forEach(n => {
    const inc = incomingMap.get(n.id) || [];
    if (inc.length === 0) {
      roots.push(n.id);
    }
  });

  // Calculate Levels using BFS
  const treeLevelMap = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; level: number }> = roots.map(r => ({ id: r, level: 0 }));
  
  roots.forEach(r => {
    treeLevelMap.set(r, 0);
    visited.add(r);
  });

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const outs = outgoingMap.get(id) || [];
    outs.forEach(edge => {
      if (!visited.has(edge.toId)) {
        visited.add(edge.toId);
        treeLevelMap.set(edge.toId, level + 1);
        queue.push({ id: edge.toId, level: level + 1 });
      }
    });
  }

  nodes.forEach(n => {
    if (!treeLevelMap.has(n.id)) {
      treeLevelMap.set(n.id, n.parentId && treeLevelMap.has(n.parentId) ? treeLevelMap.get(n.parentId)! + 1 : 0);
    }
  });

  // --- 1. SPATIAL SYSTEM CALCULATIONS (Bounding Box & Sector Address - Negative & Positive 4 Quadrants) ---
  const SECTOR_SIZE = 350; // pixels per spatial sector
  const spatialInfoMap = new Map<string, {
    parentZone: string;
    childZone: string;
    localIndex: number;
    spatialAddress: string;
    exactX: number;
    exactY: number;
    centerX: number;
    centerY: number;
  }>();

  // Group nodes by childZone based on node center
  const nodesByZoneMap = new Map<string, StoryNode[]>();
  nodes.forEach(n => {
    const nodeW = (n as any).width || 310;
    const nodeH = (n as any).height || 160;
    const cX = Math.round(n.x + nodeW / 2);
    const cY = Math.round(n.y + nodeH / 2);
    const { childZone } = getSpatialZoneForPos(cX, cY, SECTOR_SIZE);

    if (!nodesByZoneMap.has(childZone)) {
      nodesByZoneMap.set(childZone, []);
    }
    nodesByZoneMap.get(childZone)!.push(n);
  });

  nodesByZoneMap.forEach((zoneNodes, childZone) => {
    // Sort nodes inside this specific zone by center Y then center X
    zoneNodes.sort((a, b) => {
      const aW = (a as any).width || 310;
      const aH = (a as any).height || 160;
      const bW = (b as any).width || 310;
      const bH = (b as any).height || 160;
      const cYa = a.y + aH / 2;
      const cYb = b.y + bH / 2;
      if (Math.abs(cYa - cYb) > 15) return cYa - cYb;
      return (a.x + aW / 2) - (b.x + bW / 2);
    });

    zoneNodes.forEach((n, idx) => {
      const localIndex = idx + 1;
      const nodeW = (n as any).width || 310;
      const nodeH = (n as any).height || 160;
      const cX = Math.round(n.x + nodeW / 2);
      const cY = Math.round(n.y + nodeH / 2);
      const { parentZone } = getSpatialZoneForPos(cX, cY, SECTOR_SIZE);

      spatialInfoMap.set(n.id, {
        parentZone,
        childZone,
        localIndex,
        spatialAddress: `${childZone}-${String(localIndex).padStart(2, '0')}`,
        exactX: Math.round(n.x),
        exactY: Math.round(n.y),
        centerX: cX,
        centerY: cY
      });
    });
  });

  // --- 2. SMART IDENTITY SYSTEM (MAIN vs BRANCH Identifiers) ---
  const isMainNode = (n: StoryNode): boolean => {
    const inc = incomingMap.get(n.id) || [];
    const out = outgoingMap.get(n.id) || [];
    const titleLower = (n.title || '').toLowerCase();
    const typeStr = n.type as string;
    return (
      typeStr === 'heading' ||
      typeStr === 'event' ||
      typeStr === 'ending' ||
      typeStr === 'climax' ||
      titleLower.includes('بداية') ||
      titleLower.includes('ذروة') ||
      titleLower.includes('نهاية') ||
      (inc.length === 0 && out.length > 0)
    );
  };

  const uuidToSmartIdMap = new Map<string, string>();
  const uuidToIdentityMap = new Map<string, { nodeType: 'MAIN' | 'BRANCH'; mainOrderId: number | null; branchOrderId: number | null; parentMainNode: string | null }>();

  // Sort main candidates by tree level then topological order
  const mainCandidates = nodes.filter(n => isMainNode(n)).sort((a, b) => {
    const lvlA = treeLevelMap.get(a.id) || 0;
    const lvlB = treeLevelMap.get(b.id) || 0;
    if (lvlA !== lvlB) return lvlA - lvlB;
    return a.x !== b.x ? a.x - b.x : a.y - b.y;
  });

  // If no main candidates, designate first root or node as main
  if (mainCandidates.length === 0 && nodes.length > 0) {
    mainCandidates.push(nodes[0]);
  }

  const mainSet = new Set<string>(mainCandidates.map(m => m.id));

  // Assign MAIN IDs
  mainCandidates.forEach((m, idx) => {
    const orderNum = idx + 1;
    const smartId = `MAIN-${String(orderNum).padStart(3, '0')}`;
    uuidToSmartIdMap.set(m.id, smartId);
    uuidToIdentityMap.set(m.id, {
      nodeType: 'MAIN',
      mainOrderId: orderNum,
      branchOrderId: null,
      parentMainNode: null
    });
  });

  // Assign BRANCH IDs by tracing to nearest parent MAIN node
  const branchCounterByMain = new Map<string, number>();

  nodes.forEach(n => {
    if (!mainSet.has(n.id)) {
      // Find parent MAIN node
      let parentMainId: string | null = null;

      // Check direct predecessors
      const inc = incomingMap.get(n.id) || [];
      for (const edge of inc) {
        if (mainSet.has(edge.fromId)) {
          parentMainId = uuidToSmartIdMap.get(edge.fromId) || null;
          break;
        }
      }

      // If not directly connected, check parentId or default to first MAIN
      if (!parentMainId && n.parentId && mainSet.has(n.parentId)) {
        parentMainId = uuidToSmartIdMap.get(n.parentId) || null;
      }

      if (!parentMainId) {
        parentMainId = mainCandidates[0] ? uuidToSmartIdMap.get(mainCandidates[0].id) || 'MAIN-001' : 'MAIN-001';
      }

      const branchCount = (branchCounterByMain.get(parentMainId) || 0) + 1;
      branchCounterByMain.set(parentMainId, branchCount);

      const smartId = `${parentMainId}-BR-${String(branchCount).padStart(3, '0')}`;
      uuidToSmartIdMap.set(n.id, smartId);
      uuidToIdentityMap.set(n.id, {
        nodeType: 'BRANCH',
        mainOrderId: null,
        branchOrderId: branchCount,
        parentMainNode: parentMainId
      });
    }
  });

  // Update spatial addresses with nodeType prefix
  nodes.forEach(n => {
    const sInfo = spatialInfoMap.get(n.id);
    const smartId = uuidToSmartIdMap.get(n.id) || n.id;
    if (sInfo) {
      const prefix = smartId.startsWith('MAIN') ? 'MAIN' : 'BR';
      sInfo.spatialAddress = `${prefix}-${sInfo.childZone}-${String(sInfo.localIndex).padStart(2, '0')}`;
    }
  });

  // --- 3. SURROUNDING SPATIAL DIRECTIONAL NEIGHBORS ---
  const surroundingNodesMap = new Map<string, { north: string | null; south: string | null; east: string | null; west: string | null }>();

  nodes.forEach(n1 => {
    let north: { smartId: string; dist: number } | null = null;
    let south: { smartId: string; dist: number } | null = null;
    let east: { smartId: string; dist: number } | null = null;
    let west: { smartId: string; dist: number } | null = null;

    nodes.forEach(n2 => {
      if (n1.id !== n2.id) {
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sId = uuidToSmartIdMap.get(n2.id) || n2.id;

        if (dy < -25 && Math.abs(dx) <= Math.abs(dy) * 1.5) {
          if (!north || dist < north.dist) north = { smartId: sId, dist };
        } else if (dy > 25 && Math.abs(dx) <= Math.abs(dy) * 1.5) {
          if (!south || dist < south.dist) south = { smartId: sId, dist };
        } else if (dx > 25 && Math.abs(dy) <= Math.abs(dx) * 1.5) {
          if (!east || dist < east.dist) east = { smartId: sId, dist };
        } else if (dx < -25 && Math.abs(dy) <= Math.abs(dx) * 1.5) {
          if (!west || dist < west.dist) west = { smartId: sId, dist };
        }
      }
    });

    surroundingNodesMap.set(n1.id, {
      north: north ? (north as { smartId: string }).smartId : null,
      south: south ? (south as { smartId: string }).smartId : null,
      east: east ? (east as { smartId: string }).smartId : null,
      west: west ? (west as { smartId: string }).smartId : null
    });
  });

  // Calculate standard spatial distance neighbors for legacy view
  const spatialNeighborsMap = new Map<string, Array<{ id: string; smartId: string; title: string; type: string; distancePx: number }>>();
  nodes.forEach(n1 => {
    const dists: Array<{ id: string; smartId: string; title: string; type: string; distancePx: number }> = [];
    nodes.forEach(n2 => {
      if (n1.id !== n2.id) {
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
        dists.push({
          id: n2.id,
          smartId: uuidToSmartIdMap.get(n2.id) || n2.id,
          title: n2.title || 'بدون عنوان',
          type: n2.type,
          distancePx: dist
        });
      }
    });
    dists.sort((a, b) => a.distancePx - b.distancePx);
    spatialNeighborsMap.set(n1.id, dists.slice(0, 3));
  });

  const analyzedNodes: Record<string, AnalyzedNodeTopology> = {};

  // Sort nodes for reading order & story timeline order
  const chronologicalSorted = [...nodes].sort((a, b) => {
    const lvlA = treeLevelMap.get(a.id) || 0;
    const lvlB = treeLevelMap.get(b.id) || 0;
    if (lvlA !== lvlB) return lvlA - lvlB;
    return a.x !== b.x ? a.x - b.x : a.y - b.y;
  });

  const storyOrderMap = new Map<string, number>();
  chronologicalSorted.forEach((n, idx) => {
    storyOrderMap.set(n.id, idx + 1);
  });

  nodes.forEach(n => {
    const inc = incomingMap.get(n.id) || [];
    const out = outgoingMap.get(n.id) || [];
    const level = treeLevelMap.get(n.id) || 0;
    const smartId = uuidToSmartIdMap.get(n.id) || n.id;
    const identity = uuidToIdentityMap.get(n.id) || { nodeType: 'BRANCH', mainOrderId: null, branchOrderId: 1, parentMainNode: null };
    const sInfo = spatialInfoMap.get(n.id) || {
      parentZone: 'A',
      childZone: 'A1',
      localIndex: 1,
      spatialAddress: 'MAIN-A1-01',
      exactX: Math.round(n.x),
      exactY: Math.round(n.y),
      centerX: Math.round(n.x + (n.width || 310) / 2),
      centerY: Math.round(n.y + (n.height || 160) / 2)
    };
    const surrounding = surroundingNodesMap.get(n.id) || { north: null, south: null, east: null, west: null };

    // 1. Branch Position
    let branchPosition = 'عقدة متوسطة (Middle)';
    if (inc.length === 0 && out.length === 0) {
      branchPosition = 'عقدة مستقلة (Standalone)';
    } else if (inc.length === 0) {
      branchPosition = 'بداية مسار / جذر (Start/Root)';
    } else if (out.length === 0) {
      branchPosition = 'نهاية فرع / ختام (End/Leaf)';
    }

    // 2. Narrative Role
    let narrativeRole = 'عنصر مساند (Supporting Element)';
    const titleLower = (n.title || '').toLowerCase();
    if ((n.type as string) === 'ending' || titleLower.includes('نهاية') || titleLower.includes('ختام')) {
      narrativeRole = 'نهاية / ختام (Resolution)';
    } else if (titleLower.includes('ذروة') || titleLower.includes('مواجهة') || titleLower.includes('صراع') || (inc.length + out.length > 4)) {
      narrativeRole = 'ذروة (Climax)';
    } else if (n.type === 'secret' || titleLower.includes('سر') || titleLower.includes('لغز')) {
      narrativeRole = 'كشف / لغز (Reveal/Mystery)';
    } else if (branchPosition.includes('بداية') && (n.type === 'event' || n.type === 'heading')) {
      narrativeRole = 'تمهيد (Setup)';
    } else if (n.type === 'event' || n.type === 'heading') {
      narrativeRole = 'حدث رئيسي (Major Event)';
    } else if (n.type === 'idea') {
      narrativeRole = 'فكرة / مسودة (Draft/Idea)';
    }

    // 3. Path Type
    let pathType = 'خط درامي فرعي (Subplot)';
    if (identity.nodeType === 'MAIN' || n.type === 'heading' || n.type === 'event' || narrativeRole.includes('ذروة') || narrativeRole.includes('تمهيد') || narrativeRole.includes('نهاية')) {
      pathType = 'المسار الرئيسي (Main Plot)';
    } else if (n.type === 'character' || n.type === 'place' || n.type === 'secret') {
      pathType = 'بطاقة شخصية / مكان (Lore & Character)';
    } else if (n.type === 'note' || n.type === 'idea') {
      pathType = 'ملاحظات وتوثيق (Author Notes)';
    }

    // 4. Predecessors & Successors
    const predecessors = inc.map(i => {
      const pNode = nodeMap.get(i.fromId);
      return {
        id: i.fromId,
        smartId: uuidToSmartIdMap.get(i.fromId) || i.fromId,
        title: pNode?.title || 'بدون عنوان',
        type: pNode?.type || 'box',
        relationLabel: i.label
      };
    });

    const successors = out.map(o => {
      const sNode = nodeMap.get(o.toId);
      return {
        id: o.toId,
        smartId: uuidToSmartIdMap.get(o.toId) || o.toId,
        title: sNode?.title || 'بدون عنوان',
        type: sNode?.type || 'box',
        relationLabel: o.label
      };
    });

    // 5. Read priority & deferrability
    let readPriorityCategory = 'التفريعات الجانبية (Subplot Branch)';
    let canBeDeferred = true;

    if (identity.nodeType === 'MAIN' || (branchPosition.includes('بداية') && pathType.includes('الرئيسي'))) {
      readPriorityCategory = 'يجب قراءته أولاً (Core Setup)';
      canBeDeferred = false;
    } else if (pathType.includes('الرئيسي')) {
      readPriorityCategory = 'المسار الرئيسي المباشر (Main Sequence)';
      canBeDeferred = false;
    } else if (pathType.includes('ملاحظات') || pathType.includes('شخصية')) {
      readPriorityCategory = 'معلومات مساندة (Lore & Background)';
      canBeDeferred = true;
    }

    // 6. Priority & Importance Enums for AI
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (identity.nodeType === 'MAIN' || readPriorityCategory.includes('أولاً')) priority = 'HIGH';
    else if (n.type === 'idea' || n.type === 'note') priority = 'LOW';

    let importance: 'CRUCIAL' | 'SECONDARY' | 'OPTIONAL' = 'SECONDARY';
    if (identity.nodeType === 'MAIN' || narrativeRole.includes('ذروة') || narrativeRole.includes('تمهيد') || narrativeRole.includes('نهاية')) importance = 'CRUCIAL';
    else if (n.type === 'idea' || n.type === 'note') importance = 'OPTIONAL';

    const readAfter = predecessors.map(p => p.smartId);
    const readBefore = successors.map(s => s.smartId);
    const dependsOn = [...readAfter];
    if (n.parentId && uuidToSmartIdMap.has(n.parentId)) {
      const pSmart = uuidToSmartIdMap.get(n.parentId)!;
      if (!dependsOn.includes(pSmart)) dependsOn.push(pSmart);
    }
    const continueTo = readBefore.length > 0 ? readBefore[0] : null;

    const aiSchema: AISmartNodeSchema = {
      nodeId: smartId,
      nodeType: identity.nodeType,
      identity: {
        mainOrderId: identity.mainOrderId,
        branchOrderId: identity.branchOrderId,
        parentMainNode: identity.parentMainNode
      },
      spatial: {
        spatialAddress: sInfo.spatialAddress,
        parentZone: sInfo.parentZone,
        childZone: sInfo.childZone,
        localIndex: sInfo.localIndex,
        depthLevel: level,
        exactCoordinates: {
          x: sInfo.exactX,
          y: sInfo.exactY,
          centerX: sInfo.centerX,
          centerY: sInfo.centerY
        },
        surroundingNodes: surrounding
      },
      orderingAndFlow: {
        readingOrder: 0, // Assigned after sorting
        storyOrder: storyOrderMap.get(n.id) || 1,
        priority,
        importance,
        readAfter,
        readBefore,
        dependsOn,
        continueTo
      },
      content: {
        title: n.title || 'بدون عنوان',
        description: `${n.content || ''}${n.internalNotes ? `\n\n[ملاحظات الكاتب السرية]: ${n.internalNotes}` : ''}`
      }
    };

    analyzedNodes[n.id] = {
      id: n.id,
      smartId,
      title: n.title || 'بدون عنوان',
      type: n.type,
      categoryName: NODE_CATEGORIES[n.type]?.name || 'مربع',
      content: n.content || '',
      internalNotes: n.internalNotes || '',
      tags: n.tags || [],
      narrativeRole,
      treeLevel: level,
      branchPosition,
      pathType,
      predecessors,
      successors,
      spatialNeighbors: spatialNeighborsMap.get(n.id) || [],
      readingSequence: 0,
      readPriorityCategory,
      canBeDeferred,
      aiSchema
    };
  });

  // Assign reading sequence numbers systematically
  const nodeArray = Object.values(analyzedNodes);
  nodeArray.sort((a, b) => {
    const priorityWeight = (item: AnalyzedNodeTopology) => {
      if (item.aiSchema.nodeType === 'MAIN') return 1;
      if (item.readPriorityCategory.includes('أولاً')) return 2;
      if (item.readPriorityCategory.includes('الرئيسي')) return 3;
      return 4;
    };
    const pA = priorityWeight(a);
    const pB = priorityWeight(b);
    if (pA !== pB) return pA - pB;
    if (a.treeLevel !== b.treeLevel) return a.treeLevel - b.treeLevel;
    return a.title.localeCompare(b.title);
  });

  nodeArray.forEach((an, idx) => {
    const seq = idx + 1;
    an.readingSequence = seq;
    an.aiSchema.orderingAndFlow.readingOrder = seq;
  });

  const aiSmartSchemas = nodeArray.map(an => an.aiSchema);

  const mustReadFirst = nodeArray.filter(n => n.readPriorityCategory.includes('أولاً') || (n.treeLevel === 0 && !n.canBeDeferred)).map(n => ({
    id: n.id,
    smartId: n.smartId,
    title: n.title,
    narrativeRole: n.narrativeRole,
    reason: 'عقدة تمهيدية أساسية في جذر القصة'
  }));

  const mainPlotLine = nodeArray.filter(n => n.pathType.includes('الرئيسي')).map(n => ({
    id: n.id,
    smartId: n.smartId,
    title: n.title,
    narrativeRole: n.narrativeRole,
    level: n.treeLevel,
    sequence: n.readingSequence
  }));

  const subplots = nodeArray.filter(n => n.pathType.includes('فرعي')).map(n => ({
    id: n.id,
    smartId: n.smartId,
    title: n.title,
    branchPosition: n.branchPosition,
    sequence: n.readingSequence
  }));

  const deferrableElements = nodeArray.filter(n => n.canBeDeferred).map(n => ({
    id: n.id,
    smartId: n.smartId,
    title: n.title,
    type: n.categoryName,
    sequence: n.readingSequence
  }));

  const relationshipsCatalog = connections.map(c => {
    const from = nodeMap.get(c.fromNodeId);
    const to = nodeMap.get(c.toNodeId);
    const relText = c.label || 'مرتبط بـ';
    const fromSmart = uuidToSmartIdMap.get(c.fromNodeId) || c.fromNodeId;
    const toSmart = uuidToSmartIdMap.get(c.toNodeId) || c.toNodeId;
    return {
      id: c.id,
      fromId: c.fromNodeId,
      fromSmartId: fromSmart,
      fromTitle: from?.title || 'بدون عنوان',
      toId: c.toNodeId,
      toSmartId: toSmart,
      toTitle: to?.title || 'بدون عنوان',
      label: relText,
      semanticMeaning: `العنصر "${from?.title || 'بدون عنوان'}" (${fromSmart}) مرتبط بـ "${to?.title || 'بدون عنوان'}" (${toSmart}) بصلة: [${relText}]`,
      bidirectional: !!c.bidirectional
    };
  });

  return {
    nodes: analyzedNodes,
    aiSmartSchemas,
    readingGuide: {
      mustReadFirst,
      mainPlotLine,
      subplots,
      deferrableElements
    },
    relationshipsCatalog
  };
}

export function generateHTMLReport(project: StoryProject): string {
  const safeTitle = project.title || 'مخطط القصة والرواية';
  const topology = analyzeStoryTopology(project);

  // Build AI-Optimized Hierarchical Data Structure (Outline + Details + Full Narrative Topology)
  const groups = project.nodes
    .filter(n => n.type === 'heading' || n.type === 'place' || n.parentId)
    .map(n => ({
      id: `grp_${n.id}`,
      type: n.type === 'heading' ? 'فصل/عنوان' : (n.type === 'place' ? 'موقع/مسرح' : 'مجموعة فرعية'),
      title: n.title || 'مجموعة بدون عنوان',
      parent: n.parentId ? `grp_${n.parentId}` : null
    }));

  const outlineNodes = project.nodes.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title || 'بدون عنوان',
    group: n.parentId ? `grp_${n.parentId}` : null,
    color: n.color,
    tags: n.tags || [],
    position: { x: Math.round(n.x), y: Math.round(n.y) }
  }));

  const outlineEdges = project.connections.map(c => ({
    id: c.id,
    type: c.label || 'مرتبط بـ',
    label: c.label || 'مرتبط بـ',
    from: c.fromNodeId,
    to: c.toNodeId,
    style: c.style || 'solid',
    bidirectional: !!c.bidirectional
  }));

  const detailsMap: Record<string, { title: string; type: string; content: string; internalNotes?: string; tags?: string[] }> = {};
  project.nodes.forEach(n => {
    detailsMap[n.id] = {
      title: n.title || 'بدون عنوان',
      type: n.type,
      content: n.content || '',
      internalNotes: n.internalNotes || '',
      tags: n.tags || []
    };
  });

  const structuredAIData = {
    metadata: {
      projectTitle: safeTitle,
      description: project.description || '',
      exportedAt: new Date().toISOString(),
      nodeCount: project.nodes.length,
      connectionCount: project.connections.length
    },
    narrativeTopology: {
      readingSequenceGuide: topology.readingGuide,
      nodesTopology: topology.nodes,
      relationshipsCatalog: topology.relationshipsCatalog
    },
    outline: {
      groups,
      nodes: outlineNodes,
      edges: outlineEdges
    },
    details: detailsMap,
    rawProject: project
  };

  const jsonString = JSON.stringify(structuredAIData, null, 2);
  const markdownText = exportToMarkdown(project);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} - التقرير الشامل والمستند التفاعلي (AI + Human Ready)</title>
  <!-- Embedded Machine-Readable Structured JSON (Outline + Details) for AI Analysis -->
  <script id="story-data" type="application/json">
${jsonString}
  </script>
  <style>
    :root {
      --bg-main: #0f172a;
      --bg-card: #1e293b;
      --bg-card-inner: #0f172a;
      --border-color: #334155;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent-cyan: #38bdf8;
      --accent-amber: #f59e0b;
      --accent-emerald: #10b981;
      --accent-purple: #c084fc;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-main);
      color: var(--text-main);
      line-height: 1.6;
      padding: 0;
      margin: 0;
      overflow-x: hidden;
    }

    /* Top Navbar */
    .top-nav {
      background: #1e293b;
      border-bottom: 1px solid var(--border-color);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--accent-cyan);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .nav-tabs {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #0f172a;
      padding: 4px;
      border-radius: 14px;
      border: 1px solid var(--border-color);
    }
    .tab-btn {
      padding: 8px 16px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: var(--text-main);
    }
    .tab-btn.active {
      background: var(--accent-cyan);
      color: #0f172a;
    }

    /* Header Banner */
    .header-banner {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid var(--border-color);
      padding: 24px 32px;
    }
    .header-banner h1 {
      font-size: 26px;
      color: var(--accent-cyan);
      margin-bottom: 6px;
    }
    .header-banner p {
      color: var(--text-muted);
      font-size: 14px;
    }
    .stats-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
    }
    .stat-badge {
      background: #334155;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-main);
    }

    /* Tab Content Wrappers */
    .tab-content {
      display: none;
      padding: 24px;
    }
    .tab-content.active {
      display: block;
    }

    /* Canvas Map Visualizer */
    .canvas-container {
      position: relative;
      width: 100%;
      height: 75vh;
      min-height: 500px;
      background-color: #090d16;
      background-image: 
        radial-gradient(circle, rgba(56, 189, 248, 0.12) 1px, transparent 1px);
      background-size: 28px 28px;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
    }
    .canvas-controls {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 50;
      display: flex;
      gap: 8px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      padding: 6px 12px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    .canvas-btn {
      background: #334155;
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .canvas-btn:hover {
      background: var(--accent-cyan);
      color: #0f172a;
    }
    .canvas-viewport {
      position: absolute;
      inset: 0;
      transform-origin: 0 0;
      cursor: grab;
    }
    .canvas-viewport:active {
      cursor: grabbing;
    }

    /* SVG Connections */
    .svg-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 10000px;
      height: 10000px;
      pointer-events: none;
      overflow: visible;
    }

    /* Visual Map Node Cards */
    .map-node {
      position: absolute;
      width: 220px;
      background: #1e293b;
      border: 2px solid var(--border-color);
      border-radius: 16px;
      padding: 14px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6);
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
      z-index: 10;
    }
    .map-node:hover {
      transform: translateY(-3px) scale(1.02);
      border-color: var(--accent-cyan) !important;
      box-shadow: 0 12px 30px rgba(56, 189, 248, 0.3);
    }
    .map-node-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .map-node-badge {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
      color: white;
      text-transform: uppercase;
    }
    .map-node-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .map-node-preview {
      font-size: 11px;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    /* List View Styles */
    .container-list {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }
    @media(min-width: 900px) {
      .container-list {
        grid-template-columns: 300px 1fr;
      }
    }
    .sidebar {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 20px;
      height: fit-content;
      position: sticky;
      top: 80px;
    }
    .search-box {
      width: 100%;
      padding: 10px 14px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      color: var(--text-main);
      font-size: 14px;
      margin-bottom: 16px;
      outline: none;
    }
    .filter-btn {
      width: 100%;
      text-align: right;
      padding: 10px 12px;
      margin-bottom: 6px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 10px;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .filter-btn.active {
      background: #334155;
      color: var(--accent-cyan);
      border-color: var(--accent-cyan);
      font-weight: bold;
    }

    /* Node Detail Card in List */
    .node-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .node-title { font-size: 18px; font-weight: 800; color: white; margin: 8px 0; }
    .node-body {
      background: var(--bg-card-inner);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      margin-top: 12px;
      white-space: pre-wrap;
      font-size: 14px;
    }
    .notes-box {
      background: rgba(245, 158, 11, 0.08);
      border-right: 4px solid var(--accent-amber);
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
      font-size: 13px;
      color: #fcd34d;
    }

    /* Modal Dialog */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }
    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-box {
      background: #1e293b;
      border: 1px solid var(--border-color);
      border-radius: 24px;
      width: 100%;
      max-width: 650px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
      position: relative;
    }
    .close-modal-btn {
      position: absolute;
      top: 20px;
      left: 20px;
      background: #334155;
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: bold;
    }

    /* Code Blocks for AI */
    pre code {
      display: block;
      background: #0f172a;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      color: #38bdf8;
      font-family: monospace;
      font-size: 13px;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .copy-btn {
      background: var(--accent-cyan);
      color: #0f172a;
      border: none;
      padding: 8px 16px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 12px;
    }
    .hidden { display: none !important; }
  </style>
</head>
<body>

  <!-- Top Navigation -->
  <nav class="top-nav">
    <div class="brand-title">
      📚 <span>${safeTitle}</span>
    </div>

    <div class="nav-tabs">
      <button class="tab-btn active" onclick="switchTab('map-tab')">
        🗺️ الخريطة والمخطط التفاعلي
      </button>
      <button class="tab-btn" onclick="switchTab('narrative-tab')">
        🧠 دليل التفرع والتسلسل السردي
      </button>
      <button class="tab-btn" onclick="switchTab('list-tab')">
        📋 الفهرس والقائمة التفصيلية
      </button>
      <button class="tab-btn" onclick="switchTab('ai-tab')">
        🤖 بيانات الذكاء الاصطناعي (JSON Outline & Details)
      </button>
    </div>
  </nav>

  <!-- Header Banner -->
  <header class="header-banner">
    <h1>${safeTitle}</h1>
    <p>${project.description || 'مخطط القصة التفاعلي المصمم للعرض البشري والتحليل الآلي المباشر بالذكاء الاصطناعي.'}</p>
    <div class="stats-bar">
      <span class="stat-badge">📌 المربعات والعُقد: <strong>${project.nodes.length}</strong></span>
      <span class="stat-badge">🔗 الروابط والعلاقات: <strong>${project.connections.length}</strong></span>
      <span class="stat-badge">📅 تاريخ التصدير: <strong>${new Date().toLocaleDateString('ar-EG')}</strong></span>
    </div>
  </header>

  <!-- TAB 1: Visual Interactive Map Canvas -->
  <div id="map-tab" class="tab-content active">
    <div class="canvas-container" id="canvasContainer">
      <div class="canvas-controls">
        <button class="canvas-btn" onclick="resetCanvasView()">إعادة ضبط العرض 🔄</button>
        <button class="canvas-btn" onclick="zoomCanvas(1.2)">تكبير +</button>
        <button class="canvas-btn" onclick="zoomCanvas(0.8)">تصغير -</button>
      </div>

      <div class="canvas-viewport" id="canvasViewport">
        <!-- SVG Connections Layer -->
        <svg class="svg-layer" id="svgLayer">
          <defs>
            <marker id="arrow-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-head-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 10 1 L 0 5 L 10 9 z" fill="#38bdf8" />
            </marker>
          </defs>
          <g id="svgConnectionsGroup"></g>
        </svg>

        <!-- HTML Nodes Layer -->
        <div id="nodesMapGroup">
          ${project.nodes.map(node => {
            const cat = NODE_CATEGORIES[node.type] || NODE_CATEGORIES.box;
            const color = node.color || cat.defaultColor;
            return `
              <div 
                class="map-node" 
                id="map-node-${node.id}"
                data-node-id="${node.id}"
                data-node-type="${node.type}"
                data-node-group="${node.parentId || ''}"
                style="left: ${node.x}px; top: ${node.y}px; border-color: ${color};"
                onclick="openNodeModal('${node.id}')"
              >
                <div class="map-node-header">
                  <span class="map-node-badge" style="background-color: ${color}">
                    ${cat.name}
                  </span>
                  <span style="font-size:10px; color:var(--text-muted); font-family:monospace;">${node.id}</span>
                </div>
                <div class="map-node-title">${node.title || 'بدون عنوان'}</div>
                <div class="map-node-preview">${node.content || '(انقر لرؤية المحتوى النصي الكامل والملاحظات)'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- TAB 2: Intelligent Narrative Topology & Reading Order -->
  <div id="narrative-tab" class="tab-content">
    <div style="max-width:1100px; margin:0 auto; display:grid; gap:24px;">
      
      <div style="background:#1e293b; border:1px solid var(--border-color); border-radius:20px; padding:24px;">
        <h2 style="color:var(--accent-cyan); font-size:20px; margin-bottom:8px;">🧭 دليل التفرع التوبولوجي وتسلسل القراءة السردي</h2>
        <p style="color:var(--text-muted); font-size:14px; margin-bottom:16px;">
          ينقل هذا الدليل معنى الخريطة وشجرتها بالكامل: مستوى كل عقدة في التفرع، هل هي بداية مسار، حدث رئيسي، كشف، ذروة، أو نهاية، وما الذي يجب قراءته أولاً وما يمكن تأجيله.
        </p>

        <!-- 1. Must read first (Roots & Setup) -->
        ${topology.readingGuide.mustReadFirst.length > 0 ? `
          <div style="margin-top:16px; background:rgba(56, 189, 248, 0.08); border:1px solid rgba(56, 189, 248, 0.3); border-radius:16px; padding:16px;">
            <h3 style="color:var(--accent-cyan); font-size:16px; margin-bottom:12px;">📌 1. العُقد التمهيدية الرئيسية (ما يجب قراءته أولاً):</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px;">
              ${topology.readingGuide.mustReadFirst.map(item => `
                <div style="background:#0f172a; border:1px solid #334155; border-radius:12px; padding:12px; cursor:pointer;" onclick="openNodeModal('${item.id}')">
                  <span style="background:var(--accent-cyan); color:#0f172a; font-size:11px; font-weight:800; padding:2px 8px; border-radius:6px; float:left;">بداية جذرية</span>
                  <div style="font-weight:bold; color:white; font-size:15px;">${item.title}</div>
                  <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${item.reason} | <code>${item.id}</code></div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 2. Main Plot Line -->
        <div style="margin-top:24px;">
          <h3 style="color:var(--accent-amber); font-size:16px; margin-bottom:12px;">🎬 2. مسار القصة الرئيسي المباشر (Main Plot Sequence):</h3>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${topology.readingGuide.mainPlotLine.map(item => {
              const fullNode = topology.nodes[item.id];
              return `
                <div style="background:#0f172a; border-right:4px solid var(--accent-amber); border-radius:12px; padding:16px; cursor:pointer;" onclick="openNodeModal('${item.id}')">
                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="background:#f59e0b; color:#0f172a; font-weight:800; font-size:12px; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;">#${item.sequence}</span>
                      <strong style="color:white; font-size:16px;">${item.title}</strong>
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                      <span style="background:#1e293b; color:var(--accent-purple); border:1px solid var(--border-color); font-size:11px; padding:2px 8px; border-radius:6px;">${fullNode?.narrativeRole || 'حدث'}</span>
                      <span style="background:#1e293b; color:var(--accent-cyan); border:1px solid var(--border-color); font-size:11px; padding:2px 8px; border-radius:6px;">عمق التفرع: ${item.level}</span>
                      <span style="background:#1e293b; color:#94a3b8; border:1px solid var(--border-color); font-size:11px; padding:2px 8px; border-radius:6px;">${fullNode?.branchPosition}</span>
                    </div>
                  </div>
                  
                  ${fullNode?.content ? `<div style="font-size:13px; color:#cbd5e1; margin-top:8px;">${fullNode.content.substring(0, 150)}${fullNode.content.length > 150 ? '...' : ''}</div>` : ''}

                  ${(fullNode?.predecessors.length > 0 || fullNode?.successors.length > 0) ? `
                    <div style="margin-top:10px; font-size:12px; color:var(--text-muted); display:flex; flex-wrap:wrap; gap:12px;">
                      ${fullNode.predecessors.length > 0 ? `<span>⬅ يسبقه: ${fullNode.predecessors.map(p => `<strong>${p.title}</strong> (${p.relationLabel})`).join(', ')}</span>` : ''}
                      ${fullNode.successors.length > 0 ? `<span>➔ يليه: ${fullNode.successors.map(s => `<strong>${s.title}</strong> (${s.relationLabel})`).join(', ')}</span>` : ''}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. Subplots & Side Branches -->
        ${topology.readingGuide.subplots.length > 0 ? `
          <div style="margin-top:24px;">
            <h3 style="color:var(--accent-purple); font-size:16px; margin-bottom:12px;">🔀 3. الخطوط الدرامية والتفريعات الفرعية (Subplots):</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:12px;">
              ${topology.readingGuide.subplots.map(item => {
                const fullNode = topology.nodes[item.id];
                return `
                  <div style="background:#0f172a; border:1px solid var(--border-color); border-radius:12px; padding:14px; cursor:pointer;" onclick="openNodeModal('${item.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:11px; color:var(--accent-purple); font-weight:bold;">#${item.sequence} | فرعي</span>
                      <span style="font-size:11px; color:var(--text-muted);">${fullNode?.branchPosition}</span>
                    </div>
                    <div style="font-weight:bold; color:white; font-size:15px; margin-top:4px;">${item.title}</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${fullNode?.content ? fullNode.content.substring(0, 90) + '...' : ''}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 4. Deferrable Background Elements -->
        ${topology.readingGuide.deferrableElements.length > 0 ? `
          <div style="margin-top:24px;">
            <h3 style="color:var(--accent-emerald); font-size:16px; margin-bottom:12px;">📚 4. معلومات وخلفيات مساندة (يمكن تأجيل قراءتها دون كسر القصة):</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:10px;">
              ${topology.readingGuide.deferrableElements.map(item => `
                <div style="background:#0f172a; border:1px solid rgba(16, 185, 129, 0.2); border-radius:10px; padding:10px 14px; cursor:pointer;" onclick="openNodeModal('${item.id}')">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:white; font-size:14px;">${item.title}</strong>
                    <span style="font-size:10px; background:rgba(16, 185, 129, 0.2); color:#10b981; padding:2px 6px; border-radius:4px;">${item.type}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 5. Typed Semantic Relationships Catalog -->
        ${topology.relationshipsCatalog.length > 0 ? `
          <div style="margin-top:28px; background:#0f172a; border:1px solid var(--border-color); border-radius:16px; padding:16px;">
            <h3 style="color:var(--accent-cyan); font-size:16px; margin-bottom:12px;">🔗 5. الكتالوج الدلالي للروابط والعلاقات المباشرة بين المربعات:</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${topology.relationshipsCatalog.map(rel => `
                <div style="background:#1e293b; border-radius:8px; padding:10px 14px; font-size:13px; color:#e2e8f0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                  <div>
                    <strong style="color:white;">${rel.fromTitle}</strong> 
                    <span style="color:var(--accent-amber); font-weight:bold; margin:0 6px;">⬌ [نوع العلاقة: ${rel.label}] ➔</span> 
                    <strong style="color:white;">${rel.toTitle}</strong>
                  </div>
                  <span style="font-size:11px; color:var(--text-muted); font-family:monospace;">${rel.semanticMeaning}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

      </div>

    </div>
  </div>

  <!-- TAB 3: Structured List View -->
  <div id="list-tab" class="tab-content">
    <div class="container-list">
      <aside class="sidebar">
        <h3>🔍 البحث والتصفية</h3>
        <input type="text" id="searchInput" class="search-box" placeholder="ابحث في العناوين أو المحتوى..." oninput="filterListNodes()" />

        <h3>📌 تصفية حسب الفئة</h3>
        <button class="filter-btn active" data-cat="all" onclick="setCategoryFilter('all')">
          <span>جميع الفئات</span>
          <span>(${project.nodes.length})</span>
        </button>
        ${Object.keys(NODE_CATEGORIES).map(catKey => {
          const cat = NODE_CATEGORIES[catKey as keyof typeof NODE_CATEGORIES];
          const count = project.nodes.filter(n => n.type === catKey).length;
          if (count === 0) return '';
          return `
            <button class="filter-btn" data-cat="${catKey}" onclick="setCategoryFilter('${catKey}')">
              <span>${cat.namePlural}</span>
              <span>(${count})</span>
            </button>
          `;
        }).join('')}
      </aside>

      <main id="listNodesContainer">
        ${project.nodes.map(node => {
          const cat = NODE_CATEGORIES[node.type] || NODE_CATEGORIES.box;
          const color = node.color || cat.defaultColor;
          const outgoing = project.connections.filter(c => c.fromNodeId === node.id);
          const incoming = project.connections.filter(c => c.toNodeId === node.id);

          return `
            <article 
              class="node-card" 
              data-node-id="${node.id}" 
              data-type="${node.type}" 
              data-title="${(node.title || '').replace(/"/g, '&quot;')}"
              style="border-top: 4px solid ${color};"
            >
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="background:${color}; color:white; padding:2px 8px; border-radius:6px; font-size:12px; font-weight:bold;">
                  ${cat.name}
                </span>
                <span style="font-size:12px; color:var(--text-muted);">ID: <code>${node.id}</code></span>
              </div>

              <h3 class="node-title">${node.title || 'بدون عنوان'}</h3>

              <div class="node-body">
                ${node.content ? node.content : '<em>(لا يوجد نص داخل هذه العقدة)</em>'}
              </div>

              ${node.internalNotes ? `
                <div class="notes-box">
                  <strong>💡 ملاحظات الكاتب السرية:</strong>
                  <div>${node.internalNotes}</div>
                </div>
              ` : ''}

              ${(outgoing.length > 0 || incoming.length > 0) ? `
                <div style="margin-top:12px; padding-top:8px; border-top:1px dashed var(--border-color); font-size:12px;">
                  <strong style="color:var(--accent-cyan);">🔗 الروابط والعلاقات المحددة:</strong>
                  <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">
                    ${outgoing.map(c => {
                      const target = project.nodes.find(n => n.id === c.toNodeId);
                      const arrow = c.bidirectional ? '⬌' : '➔';
                      return `<span style="background:#0f172a; padding:4px 10px; border-radius:12px; border:1px solid #334155;">${arrow} [${c.label || 'مرتبط بـ'}] إلى: <strong>${target ? target.title : c.toNodeId}</strong></span>`;
                    }).join('')}
                    ${incoming.map(c => {
                      const source = project.nodes.find(n => n.id === c.fromNodeId);
                      const arrow = c.bidirectional ? '⬌' : '⬅';
                      return `<span style="background:#0f172a; padding:4px 10px; border-radius:12px; border:1px solid #334155;">${arrow} [${c.label || 'مرتبط بـ'}] من: <strong>${source ? source.title : c.fromNodeId}</strong></span>`;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
            </article>
          `;
        }).join('')}
      </main>
    </div>
  </div>

  <!-- TAB 3: AI Reader & Machine Data View -->
  <div id="ai-tab" class="tab-content">
    <div style="max-width:1100px; margin:0 auto; display:grid; gap:24px;">
      <div style="background:#1e293b; border:1px solid var(--border-color); border-radius:20px; padding:24px;">
        <h3 style="color:var(--accent-purple); font-size:18px; margin-bottom:8px;">🤖 البيانات المفتوحة المنظمة للذكاء الاصطناعي (Outline + Details)</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">
          يحتوي هذا الملف الموحد على قسمين واضحين: <strong>outline</strong> لهيكل وشبكة العقد والروابط، وقسم <strong>details</strong> للنصوص التفصيلية وملاحظات المؤلف.
        </p>
        <button class="copy-btn" onclick="copyText('jsonCode')">نسخ بيانات AI المكتملة (JSON) 📋</button>
        <pre><code id="jsonCode">${jsonString}</code></pre>
      </div>

      <div style="background:#1e293b; border:1px solid var(--border-color); border-radius:20px; padding:24px;">
        <h3 style="color:var(--accent-emerald); font-size:18px; margin-bottom:8px;">📄 التقرير الشامل بصيغة Markdown (.md)</h3>
        <button class="copy-btn" onclick="copyText('mdCode')" style="background:var(--accent-emerald);">نسخ تقرير Markdown 📋</button>
        <pre><code id="mdCode">${markdownText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>
    </div>
  </div>

  <!-- Modal Dialog for Node Details -->
  <div class="modal-overlay" id="nodeModal">
    <div class="modal-box">
      <button class="close-modal-btn" onclick="closeNodeModal()">✕</button>
      <div id="modalContent"></div>
    </div>
  </div>

  <script>
    const AI_RAW_DATA = JSON.parse(document.getElementById('story-data').textContent);
    const PROJECT_DATA = AI_RAW_DATA.rawProject || AI_RAW_DATA;

    // Navigation Tabs
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      event.currentTarget.classList.add('active');

      if (tabId === 'map-tab') {
        setTimeout(renderSVGConnections, 50);
      }
    }

    // Render SVG bezier connections between nodes
    function renderSVGConnections() {
      const svgGroup = document.getElementById('svgConnectionsGroup');
      if (!svgGroup) return;
      svgGroup.innerHTML = '';

      PROJECT_DATA.connections.forEach(conn => {
        const sourceNode = PROJECT_DATA.nodes.find(n => n.id === conn.fromNodeId);
        const targetNode = PROJECT_DATA.nodes.find(n => n.id === conn.toNodeId);
        if (!sourceNode || !targetNode) return;

        // Calculate centers
        const x1 = sourceNode.x + 110;
        const y1 = sourceNode.y + 45;
        const x2 = targetNode.x + 110;
        const y2 = targetNode.y + 45;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const cx1 = x1 + dx * 0.4;
        const cy1 = y1;
        const cx2 = x2 - dx * 0.4;
        const cy2 = y2;

        const pathD = \`M \${x1} \${y1} C \${cx1} \${cy1}, \${cx2} \${cy2}, \${x2} \${y2}\`;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('data-edge-id', conn.id);
        path.setAttribute('data-from-node', conn.fromNodeId);
        path.setAttribute('data-to-node', conn.toNodeId);
        path.setAttribute('data-relation-type', conn.label || 'مرتبط بـ');
        path.setAttribute('stroke', conn.color || '#38bdf8');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        if (conn.style === 'dashed') path.setAttribute('stroke-dasharray', '6,6');
        path.setAttribute('marker-end', 'url(#arrow-head)');
        if (conn.bidirectional) {
          path.setAttribute('marker-start', 'url(#arrow-head-start)');
        }
        svgGroup.appendChild(path);

        // Label Text
        if (conn.label) {
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', midX);
          text.setAttribute('y', midY - 6);
          text.setAttribute('fill', '#fcd34d');
          text.setAttribute('font-size', '12');
          text.setAttribute('font-weight', 'bold');
          text.setAttribute('text-anchor', 'middle');
          text.textContent = conn.label;
          svgGroup.appendChild(text);
        }
      });
    }

    // Modal Details
    function openNodeModal(nodeId) {
      const node = PROJECT_DATA.nodes.find(n => n.id === nodeId);
      if (!node) return;

      const outgoing = PROJECT_DATA.connections.filter(c => c.fromNodeId === node.id);
      const incoming = PROJECT_DATA.connections.filter(c => c.toNodeId === node.id);

      let html = \`
        <div style="font-size:12px; color:var(--accent-amber); font-weight:bold; margin-bottom:4px;">ID: \${node.id}</div>
        <h2 style="font-size:22px; color:var(--accent-cyan); margin-bottom:16px;">\${node.title || 'بدون عنوان'}</h2>
        
        <div style="background:#0f172a; border:1px solid #334155; border-radius:12px; padding:16px; margin-bottom:16px; font-size:14px; white-space:pre-wrap;">
          \${node.content || '<em>(لا يوجد محتوى نصي تفصيلي لهذا المربع)</em>'}
        </div>
      \`;

      if (node.internalNotes) {
        html += \`
          <div style="background:rgba(245, 158, 11, 0.1); border-right:4px solid #f59e0b; padding:12px; border-radius:8px; margin-bottom:16px; font-size:13px; color:#fcd34d;">
            <strong>💡 ملاحظات الكاتب السرية:</strong>
            <div style="margin-top:4px;">\${node.internalNotes}</div>
          </div>
        \`;
      }

      if (outgoing.length > 0 || incoming.length > 0) {
        html += \`<div style="font-size:13px; font-weight:bold; color:white; margin-bottom:8px;">🔗 الروابط المباشرة:</div><div style="display:flex; flex-direction:column; gap:6px;">\`;
        outgoing.forEach(c => {
          const target = PROJECT_DATA.nodes.find(n => n.id === c.toNodeId);
          html += \`<div style="background:#0f172a; border:1px solid #334155; padding:8px 12px; border-radius:10px; font-size:12px;">➔ [\${c.label || 'مرتبط بـ'}] إلى: <strong>\${target ? target.title : c.toNodeId}</strong></div>\`;
        });
        incoming.forEach(c => {
          const source = PROJECT_DATA.nodes.find(n => n.id === c.fromNodeId);
          html += \`<div style="background:#0f172a; border:1px solid #334155; padding:8px 12px; border-radius:10px; font-size:12px;">⬅ [\${c.label || 'مرتبط بـ'}] من: <strong>\${source ? source.title : c.fromNodeId}</strong></div>\`;
        });
        html += \`</div>\`;
      }

      document.getElementById('modalContent').innerHTML = html;
      document.getElementById('nodeModal').classList.add('open');
    }

    function closeNodeModal() {
      document.getElementById('nodeModal').classList.remove('open');
    }

    // Copy helper
    function copyText(elementId) {
      const text = document.getElementById(elementId).innerText;
      navigator.clipboard.writeText(text).then(() => {
        alert('تم نسخ البيانات المحددة بنجاح إلى الحافظة!');
      });
    }

    // List filtering
    let activeCatFilter = 'all';
    function setCategoryFilter(cat) {
      activeCatFilter = cat;
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
      });
      filterListNodes();
    }

    function filterListNodes() {
      const query = document.getElementById('searchInput').value.toLowerCase();
      document.querySelectorAll('#listNodesContainer .node-card').forEach(card => {
        const type = card.getAttribute('data-type');
        const title = card.getAttribute('data-title').toLowerCase();
        const matchesCat = (activeCatFilter === 'all' || type === activeCatFilter);
        const matchesQuery = (!query || title.includes(query));
        card.classList.toggle('hidden', !(matchesCat && matchesQuery));
      });
    }

    // Initial SVG draw and Canvas Pan/Zoom
    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startMouseX = 0;
    let startMouseY = 0;

    function applyCanvasTransform() {
      const viewport = document.getElementById('canvasViewport');
      if (viewport) {
        viewport.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomLevel + ')';
      }
    }

    function resetCanvasView() {
      zoomLevel = 1;
      panX = 0;
      panY = 0;
      applyCanvasTransform();
    }

    function zoomCanvas(factor) {
      zoomLevel = Math.max(0.3, Math.min(3, zoomLevel * factor));
      applyCanvasTransform();
    }

    const container = document.getElementById('canvasContainer');
    if (container) {
      container.addEventListener('mousedown', (e) => {
        if (e.target.closest('.map-node') || e.target.closest('.canvas-controls')) return;
        isPanning = true;
        startMouseX = e.clientX - panX;
        startMouseY = e.clientY - panY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panX = e.clientX - startMouseX;
        panY = e.clientY - startMouseY;
        applyCanvasTransform();
      });

      window.addEventListener('mouseup', () => {
        isPanning = false;
      });

      container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        zoomLevel = Math.max(0.3, Math.min(3, zoomLevel * factor));
        applyCanvasTransform();
      }, { passive: false });
    }

    window.onload = () => {
      renderSVGConnections();
      applyCanvasTransform();
    };
  </script>
</body>
</html>`;
}

export function downloadHTMLReport(project: StoryProject): void {
  const htmlContent = generateHTMLReport(project);
  const safeTitle = project.title || 'مخطط القصة والرواية';
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeFilename = safeTitle.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '');
  a.download = `${safeFilename}-interactive-story-map.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openHTMLPreviewInNewTab(project: StoryProject): void {
  const htmlContent = generateHTMLReport(project);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export function downloadAIPromptFile(project: StoryProject): void {
  const promptText = generateAIPrompt(project);
  const safeTitle = project.title || 'مخطط القصة والرواية';
  const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeFilename = safeTitle.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '');
  a.download = `${safeFilename}-AI-Comprehensive-Narrative.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateAIPrompt(project: StoryProject): string {
  const topology = analyzeStoryTopology(project);
  let prompt = `================================================================================\n`;
  prompt += `🤖 HIERARCHICAL SPATIAL & SMART IDENTITY AI STORY MATRIX / التوصيف السردي والمكاني الشامل للذكاء الاصطناعي\n`;
  prompt += `================================================================================\n`;
  prompt += `عنوان القصة: "${project.title}"\n`;
  prompt += `الوصف العام: ${project.description || 'مشروع قصة سينمائية / رواية تفاعلية'}\n`;
  prompt += `تاريخ التصدير والتوليد: ${new Date().toLocaleString('ar-EG')}\n`;
  prompt += `إحصائيات المخطط: ${project.nodes.length} عقدة | ${project.connections.length} رابط درامي وسردي\n`;
  prompt += `--------------------------------------------------------------------------------\n\n`;

  prompt += `<STORY_SPATIAL_TOPOLOGY_SUMMARY>\n`;
  prompt += `[PROJECT_TITLE]: "${project.title}"\n`;
  prompt += `[TOTAL_NODES_COUNT]: ${project.nodes.length}\n`;
  prompt += `[TOTAL_RELATIONS_COUNT]: ${project.connections.length}\n`;
  prompt += `[MUST_READ_FIRST_ROOT_IDS]: ${topology.readingGuide.mustReadFirst.map(m => `${m.smartId} ("${m.title}")`).join(', ') || 'NONE'}\n`;
  prompt += `[MAIN_PLOT_BACKBONE_SEQUENCE]: ${topology.readingGuide.mainPlotLine.map(m => `[#${m.sequence}|LVL:${m.level}|ID:${m.smartId}] "${m.title}"`).join(' -> ')}\n`;
  prompt += `</STORY_SPATIAL_TOPOLOGY_SUMMARY>\n\n`;

  prompt += `================================================================================\n`;
  prompt += `SECTION 1: AI-OPTIMIZED SMART NODES SCHEMA (JSON ARRAY) / كائنات العقد الذكية المنظمة\n`;
  prompt += `================================================================================\n\n`;

  prompt += `\`\`\`json\n`;
  prompt += JSON.stringify(topology.aiSmartSchemas, null, 2);
  prompt += `\n\`\`\`\n\n`;

  prompt += `================================================================================\n`;
  prompt += `SECTION 2: EXHAUSTIVE NODE DESCRIPTOR CODES / تفاصيل العُقد مع الإحداثيات والتوجيه\n`;
  prompt += `================================================================================\n\n`;

  Object.values(topology.nodes).forEach((an, idx) => {
    const origNode = project.nodes.find(n => n.id === an.id);
    prompt += `<NODE_DESCRIPTOR index="${idx + 1}" smartId="${an.smartId}" uuid="${an.id}">\n`;
    prompt += `  [SMART_NODE_ID]: "${an.smartId}"\n`;
    prompt += `  [NODE_TYPE]: "${an.aiSchema.nodeType}"\n`;
    prompt += `  [TITLE]: "${an.title}"\n`;
    prompt += `  [SPATIAL_ADDRESS]: "${an.aiSchema.spatial.spatialAddress}" (Zone: ${an.aiSchema.spatial.childZone}, Cell: ${an.aiSchema.spatial.localIndex})\n`;
    prompt += `  [ORDER_DIMENSIONS]:\n`;
    prompt += `    - MainOrder: ${an.aiSchema.identity.mainOrderId !== null ? an.aiSchema.identity.mainOrderId : 'N/A (Branch)'}\n`;
    prompt += `    - BranchOrder: ${an.aiSchema.identity.branchOrderId !== null ? an.aiSchema.identity.branchOrderId : 'N/A (Main)'}\n`;
    prompt += `    - ReadingOrder: ${an.aiSchema.orderingAndFlow.readingOrder}\n`;
    prompt += `    - StoryTimelineOrder: ${an.aiSchema.orderingAndFlow.storyOrder}\n`;
    prompt += `  [TRAVERSAL_LOGIC]:\n`;
    prompt += `    - Priority: ${an.aiSchema.orderingAndFlow.priority}\n`;
    prompt += `    - Importance: ${an.aiSchema.orderingAndFlow.importance}\n`;
    prompt += `    - ReadAfter: [${an.aiSchema.orderingAndFlow.readAfter.join(', ')}]\n`;
    prompt += `    - ReadBefore: [${an.aiSchema.orderingAndFlow.readBefore.join(', ')}]\n`;
    prompt += `    - DependsOn: [${an.aiSchema.orderingAndFlow.dependsOn.join(', ')}]\n`;
    prompt += `    - ContinueTo: ${an.aiSchema.orderingAndFlow.continueTo || 'NONE'}\n`;
    prompt += `  [SURROUNDING_NODES_SPATIAL]:\n`;
    prompt += `    - North: ${an.aiSchema.spatial.surroundingNodes.north || 'NONE'}\n`;
    prompt += `    - South: ${an.aiSchema.spatial.surroundingNodes.south || 'NONE'}\n`;
    prompt += `    - East: ${an.aiSchema.spatial.surroundingNodes.east || 'NONE'}\n`;
    prompt += `    - West: ${an.aiSchema.spatial.surroundingNodes.west || 'NONE'}\n`;

    if (origNode) {
      prompt += `  [CANVAS_COORDINATES_PX]: X=${Math.round(origNode.x)}, Y=${Math.round(origNode.y)}\n`;
    }

    prompt += `\n  [FULL_TEXT_CONTENT]:\n`;
    prompt += `  """\n  ${an.content || '(لا يوجد نص تفصيلي داخل هذه العقدة)'}\n  """\n`;

    if (an.internalNotes) {
      prompt += `\n  [SECRET_WRITER_NOTES]:\n`;
      prompt += `  """\n  ${an.internalNotes}\n  """\n`;
    }

    prompt += `</NODE_DESCRIPTOR>\n\n`;
  });

  prompt += `================================================================================\n`;
  prompt += `SECTION 3: SEMANTIC RELATIONSHIPS MATRIX / مصفوفة الروابط والعلاقات الدلالية\n`;
  prompt += `================================================================================\n\n`;

  prompt += `<RELATIONSHIPS_MATRIX_CODES>\n`;
  topology.relationshipsCatalog.forEach((rel, rIdx) => {
    prompt += `<RELATION index="${rIdx + 1}" id="${rel.id}">\n`;
    prompt += `  [FROM]: "${rel.fromSmartId}" ("${rel.fromTitle}")\n`;
    prompt += `  [TO]: "${rel.toSmartId}" ("${rel.toTitle}")\n`;
    prompt += `  [RELATION_LABEL]: "${rel.label}"\n`;
    prompt += `  [BIDIRECTIONAL]: ${rel.bidirectional ? 'YES' : 'NO'}\n`;
    prompt += `  [SEMANTIC_MEANING]: "${rel.semanticMeaning}"\n`;
    prompt += `</RELATION>\n`;
  });
  prompt += `</RELATIONSHIPS_MATRIX_CODES>\n\n`;

  prompt += `================================================================================\n`;
  prompt += `SECTION 4: RAW MACHINE-READABLE STRUCTURAL DATA / كائن البيانات الشامل\n`;
  prompt += `================================================================================\n\n`;

  prompt += `\`\`\`json\n`;
  prompt += JSON.stringify({
    metadata: {
      projectTitle: project.title,
      description: project.description,
      nodeCount: project.nodes.length,
      connectionCount: project.connections.length,
      exportedAt: new Date().toISOString()
    },
    topologyAnalysis: topology,
    rawProjectData: project
  }, null, 2);
  prompt += `\n\`\`\`\n\n`;

  prompt += `================================================================================\n`;
  prompt += `SECTION 5: AI SYSTEM INSTRUCTIONS & ANALYSIS REQUEST / توجيهات الذكاء الاصطناعي\n`;
  prompt += `================================================================================\n`;
  prompt += `أيها الذكاء الاصطناعي والمساعد الدرامي، يرجى استخدام جميع الأكواد البرمجية والتوصيفية المرفقة أعلاه للقيام بـ:\n`;
  prompt += `1. فحص الشجرة والمسار الرئيسي (MAIN Plot Backbone) عبر أبعاد الترتيب الأربعة (MainOrder, BranchOrder, ReadingOrder, StoryOrder).\n`;
  prompt += `2. تتبع العناوين المكانية الهرمية (SpatialAddresses مثل MAIN-A1-01) للتعرف على التوزيع البصري والمكاني للعقد والمجالات المجاورة (surroundingNodes).\n`;
  prompt += `3. تقييم مسار القراءة (ReadingOrder) وتسلسل الأحداث الزمني (StoryOrder) والتأكد من عدم وجود تعارض درامي بين العقد السابقة (readAfter) واللاحقة (readBefore).\n`;
  prompt += `4. استخراج الشخصيات والأماكن وربط علاقاتهم بالأحداث المباشرة.\n`;
  prompt += `5. تقديم 5 اقتراحات تطويرية ملموسة تعزز من صراع الحبكة وتفتح تفريعات درامية غير متوقعة.\n`;

  return prompt;
}
