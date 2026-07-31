const fs = require('fs');
let code = fs.readFileSync('src/components/ConnectionModal.tsx', 'utf8');

// Add state for bidirectional
code = code.replace(
  "const [style, setStyle] = useState<'solid' | 'dashed' | 'dotted'>(initialStyle);",
  "const [style, setStyle] = useState<'solid' | 'dashed' | 'dotted'>(initialStyle);\n  const [bidirectional, setBidirectional] = useState(connection ? !!connection.bidirectional : false);"
);

code = code.replace(
  "setStyle(connection.style || 'solid');",
  "setStyle(connection.style || 'solid');\n      setBidirectional(!!connection.bidirectional);"
);

code = code.replace(
  "setStyle('solid');",
  "setStyle('solid');\n      setBidirectional(false);"
);

// Save logic
code = code.replace(
  "color,\n        style,\n        createdAt: connection ? connection.createdAt : Date.now()",
  "color,\n        style,\n        bidirectional,\n        createdAt: connection ? connection.createdAt : Date.now()"
);

// UI for bidirectional
const newUI = `
          {/* نمط السهم */}
          <div className="mb-6">
            <label className="block text-slate-400 text-sm mb-3">اتجاه العلاقة</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBidirectional(false)}
                className={\`flex-1 py-2 px-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 \${
                  !bidirectional
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                }\`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>اتجاه واحد</span>
              </button>
              <button
                type="button"
                onClick={() => setBidirectional(true)}
                className={\`flex-1 py-2 px-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 \${
                  bidirectional
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                }\`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>اتجاهين (⬌)</span>
              </button>
            </div>
          </div>
          
          <div className="mb-6">
`;

code = code.replace('<div className="mb-6">', newUI);
code = code.replace("import { X, ArrowRight, ArrowRightLeft }", "import { X, ArrowRight, ArrowRightLeft }"); // Just to check if ArrowRightLeft is there

// ensure ArrowRightLeft is imported
if (!code.includes("ArrowRightLeft")) {
  code = code.replace("import { X } from 'lucide-react';", "import { X, ArrowRight, ArrowRightLeft } from 'lucide-react';");
  code = code.replace("import { X, Plus } from 'lucide-react';", "import { X, Plus, ArrowRight, ArrowRightLeft } from 'lucide-react';");
  code = code.replace("import { X, Palette } from 'lucide-react';", "import { X, Palette, ArrowRight, ArrowRightLeft } from 'lucide-react';");
  code = code.replace("import { X, Save } from 'lucide-react';", "import { X, Save, ArrowRight, ArrowRightLeft } from 'lucide-react';");
}

// In case lucide-react import was different
if (!code.includes("ArrowRightLeft")) {
  code = code.replace("import { X ", "import { X, ArrowRight, ArrowRightLeft ");
}

fs.writeFileSync('src/components/ConnectionModal.tsx', code);
console.log("Done");
