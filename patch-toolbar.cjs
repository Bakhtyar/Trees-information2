const fs = require('fs');
let content = fs.readFileSync('src/components/Toolbar.tsx', 'utf8');

const targetBtn = `<button
            onClick={onCenterView}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/50 transition"
            title="توسيط اللوحة وعرض العناصر"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>`;

content = content.replace(targetBtn, '');
fs.writeFileSync('src/components/Toolbar.tsx', content);
