const fs = require('fs');
let content = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

// Add onCenterView to props
content = content.replace(
  'showCoordinates?: boolean;',
  'showCoordinates?: boolean;\n  onCenterView?: () => void;'
);

// Add onCenterView to destructured props
content = content.replace(
  'showCoordinates = true',
  'showCoordinates = true,\n  onCenterView'
);

// Find the Floating Zoom Controls Panel
const zoomTarget = `{/* Floating Zoom Controls Panel (أزرار التحكم بالزوم والتصغير الفائق) */}
      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md select-none">
        <button
          onClick={() => handleZoomStep(1.2)}
          className="p-2 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 rounded-xl transition"
          title="تكبير اللوحة والعناصر (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleSetTargetZoom(1.0)}
          className="px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 hover:bg-slate-800 rounded-xl transition border border-slate-700/60"
          title="إعادة ضبط الزوم إلى 100%"
        >
          {Math.round(canvasView.zoom * 100)}%
        </button>

        <button
          onClick={() => handleZoomStep(0.8)}
          className="p-2 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 rounded-xl transition"
          title="تصغير اللوحة (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>`;

// Replace it with the new top panel and make center view big enough, and add Maximize2 import
const zoomReplacement = `{/* Floating Top Navigation & Zoom Panel */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-full shadow-lg backdrop-blur-md select-none">
        {onCenterView && (
          <button
            onClick={onCenterView}
            className="p-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-full transition shadow flex items-center gap-2"
            title="توسيط اللوحة وعرض جميع العناصر (النظرة الشاملة)"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">النظرة الشاملة</span>
          </button>
        )}
        <div className="w-px h-5 bg-slate-700 mx-1"></div>
        <button
          onClick={() => handleZoomStep(0.8)}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-full transition"
          title="تصغير اللوحة (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleSetTargetZoom(1.0)}
          className="px-2 py-1 text-[10px] font-mono font-bold text-cyan-300 hover:bg-slate-800 rounded-full transition border border-slate-700/60"
          title="إعادة ضبط الزوم إلى 100%"
        >
          {Math.round(canvasView.zoom * 100)}%
        </button>

        <button
          onClick={() => handleZoomStep(1.2)}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-full transition"
          title="تكبير اللوحة والعناصر (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>`;

content = content.replace(zoomTarget, zoomReplacement);

if (!content.includes('Maximize2')) {
  content = content.replace(/ZoomOut,/, 'ZoomOut, Maximize2,');
}

fs.writeFileSync('src/components/Canvas.tsx', content);
