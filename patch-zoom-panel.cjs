const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

content = content.replace(
  /px-5 py-2\.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-full transition shadow-md flex items-center gap-2/,
  'px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-amber-400 font-bold rounded-full transition flex items-center gap-1.5'
);

content = content.replace(
  /<span className="text-sm">النظرة الشاملة<\/span>/,
  '<span className="text-xs">توسيط العرض</span>'
);

content = content.replace(
  /className="p-2 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-full transition"/g,
  'className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-full transition"'
);

fs.writeFileSync('src/components/Canvas.tsx', content);
