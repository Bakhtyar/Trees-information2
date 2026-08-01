const fs = require('fs');
let content = fs.readFileSync('src/components/ConnectionModal.tsx', 'utf8');

content = content.replace(
  /<button\n\s*type="submit"\n\s*className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg transition"/,
  '<button\n                type="button"\n                onClick={handleSave}\n                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg transition"'
);

fs.writeFileSync('src/components/ConnectionModal.tsx', content);
