import { StoryProject, NODE_CATEGORIES, StoryNode, StoryConnection } from '../types/story';
import { SAMPLE_DETECTIVE_PROJECT } from './sampleProject';

const STORAGE_KEY = 'STORY_NOVEL_MAPPER_PROJECT_V1';
const BACKUP_KEY = 'STORY_NOVEL_MAPPER_BACKUP_V1';

export function loadProject(): StoryProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProject(SAMPLE_DETECTIVE_PROJECT);
      return SAMPLE_DETECTIVE_PROJECT;
    }
    const data = JSON.parse(raw) as StoryProject;
    if (!data.nodes || !Array.isArray(data.nodes)) {
      return SAMPLE_DETECTIVE_PROJECT;
    }
    return data;
  } catch (err) {
    console.error('Error loading project from localStorage, fallback to sample:', err);
    return SAMPLE_DETECTIVE_PROJECT;
  }
}

export function saveProject(project: StoryProject): boolean {
  try {
    const toSave: StoryProject = {
      ...project,
      lastSavedAt: Date.now()
    };
    const serialized = JSON.stringify(toSave);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Error auto-saving project to localStorage:', err);
    return false;
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

export function generateHTMLReport(project: StoryProject): string {
  const jsonString = JSON.stringify(project, null, 2);
  const markdownText = exportToMarkdown(project);
  const safeTitle = project.title || 'مخطط القصة والرواية';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} - التقرير الشامل والمستند التفاعلي</title>
  <!-- Embedded Raw Machine-Readable JSON for AI Analysis -->
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
      <button class="tab-btn" onclick="switchTab('list-tab')">
        📋 الفهرس والقائمة التفصيلية
      </button>
      <button class="tab-btn" onclick="switchTab('ai-tab')">
        🤖 بيانات الذكاء الاصطناعي (JSON / MD)
      </button>
    </div>
  </nav>

  <!-- Header Banner -->
  <header class="header-banner">
    <h1>${safeTitle}</h1>
    <p>${project.description || 'مخطط القصة التفاعلي المصمم للعرض البشري والتحليل الآلي بالذكاء الاصطناعي.'}</p>
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
                data-id="${node.id}"
                style="left: ${node.x}px; top: ${node.y}px; border-color: ${color};"
                onclick="openNodeModal('${node.id}')"
              >
                <div class="map-node-header">
                  <span class="map-node-badge" style="background-color: ${color}">
                    ${cat.name}
                  </span>
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

  <!-- TAB 2: Structured List View -->
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
                  <strong style="color:var(--accent-cyan);">🔗 الروابط والعلاقات:</strong>
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
        <h3 style="color:var(--accent-purple); font-size:18px; margin-bottom:8px;">🤖 البيانات المشفّرة الكاملة بصيغة JSON</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">
          يمكن للذكاء الاصطناعي قراءة هذا الكائن مباشرة لفهم جميع عناصر القصة والعلاقات دون تخمين بصري.
        </p>
        <button class="copy-btn" onclick="copyText('jsonCode')">نسخ كائن JSON المكتمل 📋</button>
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
    const PROJECT_DATA = JSON.parse(document.getElementById('story-data').textContent);

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

export function generateAIPrompt(project: StoryProject): string {
  let prompt = `أهلاً أيها الذكاء الاصطناعي، هذي بيانات ومخطط قصة ورواية مكتملة بعنوان ("${project.title}")، محددة بجميع العقد، النصوص الكاملة، الملاحظات الداخلية، والروابط بين الشخصيات والأحداث.\n\n`;
  prompt += `### 1. بيانات المشروع العامة:\n`;
  prompt += `- العنوان: ${project.title}\n`;
  prompt += `- الوصف: ${project.description || 'مشروع درامي/قصصي'}\n`;
  prompt += `- إجمالي العقد: ${project.nodes.length} | إجمالي العلاقات: ${project.connections.length}\n\n`;

  prompt += `### 2. قائمة العُقد والمربعات والنصوص الكاملة:\n`;
  project.nodes.forEach((n, idx) => {
    const cat = NODE_CATEGORIES[n.type] || NODE_CATEGORIES.box;
    prompt += `\nعقدة #${idx + 1}: [${cat.name}] "${n.title}" (ID: \`${n.id}\`)\n`;
    prompt += `  - المحتوى النصي: ${n.content || 'لا يوجد نص'}\n`;
    if (n.internalNotes) {
      prompt += `  - ملاحظات الكاتب السرية: ${n.internalNotes}\n`;
    }
    if (n.tags && n.tags.length > 0) {
      prompt += `  - الوسوم: ${n.tags.join(', ')}\n`;
    }
  });

  if (project.connections.length > 0) {
    prompt += `\n### 3. شبكة العلاقات والروابط المباشرة بين العُقد:\n`;
    project.connections.forEach((c) => {
      const source = project.nodes.find((n) => n.id === c.fromNodeId);
      const target = project.nodes.find((n) => n.id === c.toNodeId);
      const arrow = c.bidirectional ? '⬌' : '➔';
      if (source && target) {
        prompt += `- "${source.title}" (\`${source.id}\`) ${arrow} [${c.label || 'مرتبط بـ'}] ${arrow} "${target.title}" (\`${target.id}\`)\n`;
      }
    });
  }

  prompt += `\n### 4. البيانات الخام الكاملة بصيغة JSON:\n`;
  prompt += `\`\`\`json\n${JSON.stringify(project, null, 2)}\n\`\`\`\n\n`;

  prompt += `### 5. المطلوب منك كخبير حبكة وتطوير سيناريو:\n`;
  prompt += `1. تحليل مدى تماسك القصة والعلاقات والدافع الدرامي للشخصيات بناءً على النصوص والملاحظات.\n`;
  prompt += `2. اكتشاف أي ثغرات درامية أو منطقية في تسلسل الأحداث والمخطط.\n`;
  prompt += `3. تقديم 3 اقتراحات إبداعية لتطوير الأحداث والحبكة.\n`;

  return prompt;
}
