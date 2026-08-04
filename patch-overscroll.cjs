const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
  /class="bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950 font-\['Cairo',sans-serif\] overflow-hidden"/,
  'class="bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950 font-[\'Cairo\',sans-serif] overflow-hidden overscroll-none"'
);

fs.writeFileSync('index.html', content);
