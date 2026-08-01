const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
  /<button\n\s*type="submit"\n\s*className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500\/20 mt-2"/,
  '<button\n                type="button"\n                onClick={handleCreateSubmit}\n                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 mt-2"'
);

content = content.replace(
  /<button\n\s*type="submit"\n\s*className="px-5 py-2\.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-cyan-500\/20"/,
  '<button\n                  type="button"\n                  onClick={handleSaveProjectEdit}\n                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20"'
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
