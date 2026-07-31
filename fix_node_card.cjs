const fs = require('fs');
let code = fs.readFileSync('src/components/NodeCard.tsx', 'utf8');

code = code.replace(
  "isHeadingType\n          ? 'bg-transparent text-slate-100'\n          : isNoteType \n          ? 'bg-amber-50/95 dark:bg-[#fdfbf7] text-slate-900 shadow-xl rounded-sm'",
  "isNoteType \n          ? 'bg-amber-50/95 dark:bg-[#fdfbf7] text-slate-900 shadow-xl rounded-sm'\n          : isHeadingType\n          ? 'text-slate-100 shadow-xl rounded-2xl backdrop-blur-md'"
);

code = code.replace(
  "? (isHeadingType ? 'ring-2 ring-amber-500/50 bg-slate-800/50 rounded-2xl z-20 shadow-xl' : 'ring-4 ring-amber-500/70 shadow-2xl z-20')",
  "? 'ring-4 ring-amber-500/70 shadow-2xl z-20'"
);

code = code.replace(
  "borderTopWidth: (isNoteType || isHeadingType) ? '0px' : '5px',\n        borderTopColor: cardColor,",
  "borderTopWidth: isNoteType ? '0px' : '5px',\n        borderTopColor: cardColor,\n        backgroundColor: isHeadingType ? (node.backgroundColor || 'rgba(15, 23, 42, 0.95)') : undefined,"
);

// We should also replace the text color logic where it renders the title
code = code.replace(
  "style={isHeadingType ? { color: node.color || cat.defaultColor } : undefined}",
  "style={isHeadingType ? { color: node.textColor || node.color || cat.defaultColor } : undefined}"
);

fs.writeFileSync('src/components/NodeCard.tsx', code);
console.log("Done");
