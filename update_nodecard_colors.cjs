const fs = require('fs');
let code = fs.readFileSync('src/components/NodeCard.tsx', 'utf8');

// Replace color picker state logic to add BG and Text Color pickers for Heading
code = code.replace(
  "const [showColorPicker, setShowColorPicker] = useState(false);",
  "const [showColorPicker, setShowColorPicker] = useState(false);\n  const [showBgColorPicker, setShowBgColorPicker] = useState(false);\n  const [showTextColorPicker, setShowTextColorPicker] = useState(false);"
);

// We need to inject the color pickers in the toolbar.
// Find the toolbar div where pickers are placed.
const colorPickerOld = `          {/* لون المربع (يُخفى للمذكرة لأنها تعتمد مظهراً ثابتاً للمستند) */}
          {!isNoteType && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowFontPicker(false);
                  setShowSizePicker(false);
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                title="تغيير لون المربع"
              >
                <Palette className="w-4 h-4" style={{ color: cardColor }} />
                <span className="hidden sm:inline">اللون</span>
              </button>

              {showColorPicker && (
                <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1.5 w-40 z-50">
                  {NODE_PALETTE_COLORS.map((p) => (
                    <button
                      key={p.hex}
                      onClick={() => {
                        if (onUpdateNode) {
                          onUpdateNode({ ...node, color: p.hex });
                        }
                        setShowColorPicker(false);
                      }}
                      className={\`w-7 h-7 rounded-lg border transition hover:scale-110 \${
                        node.color === p.hex ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                      }\`}
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}`;

const newColorPickers = `          {/* لون المربع (يُخفى للمذكرة لأنها تعتمد مظهراً ثابتاً للمستند) */}
          {!isNoteType && !isHeadingType && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowFontPicker(false);
                  setShowSizePicker(false);
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                title="تغيير لون المربع"
              >
                <Palette className="w-4 h-4" style={{ color: cardColor }} />
                <span className="hidden sm:inline">اللون</span>
              </button>

              {showColorPicker && (
                <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1.5 w-40 z-50">
                  {NODE_PALETTE_COLORS.map((p) => (
                    <button
                      key={p.hex}
                      onClick={() => {
                        if (onUpdateNode) {
                          onUpdateNode({ ...node, color: p.hex });
                        }
                        setShowColorPicker(false);
                      }}
                      className={\`w-7 h-7 rounded-lg border transition hover:scale-110 \${
                        node.color === p.hex ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                      }\`}
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {isHeadingType && (
            <>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBgColorPicker(!showBgColorPicker);
                    setShowTextColorPicker(false);
                    setShowFontPicker(false);
                    setShowSizePicker(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                  title="تغيير لون الخلفية"
                >
                  <Palette className="w-4 h-4" style={{ color: node.backgroundColor || '#0f172a' }} />
                  <span className="hidden sm:inline">الخلفية</span>
                </button>

                {showBgColorPicker && (
                  <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1.5 w-40 z-50">
                    {NODE_PALETTE_COLORS.map((p) => (
                      <button
                        key={p.hex}
                        onClick={() => {
                          if (onUpdateNode) {
                            onUpdateNode({ ...node, backgroundColor: p.hex });
                          }
                          setShowBgColorPicker(false);
                        }}
                        className={\`w-7 h-7 rounded-lg border transition hover:scale-110 \${
                          node.backgroundColor === p.hex ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                        }\`}
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                      />
                    ))}
                    <button
                        onClick={() => {
                          if (onUpdateNode) {
                            onUpdateNode({ ...node, backgroundColor: 'transparent' });
                          }
                          setShowBgColorPicker(false);
                        }}
                        className={\`w-7 h-7 rounded-lg border transition hover:scale-110 \${
                          node.backgroundColor === 'transparent' ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                        }\`}
                        style={{ background: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px' }}
                        title={'شفاف'}
                      />
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTextColorPicker(!showTextColorPicker);
                    setShowBgColorPicker(false);
                    setShowFontPicker(false);
                    setShowSizePicker(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                  title="تغيير لون النص"
                >
                  <div className="w-4 h-4 rounded-full border border-slate-500" style={{ backgroundColor: node.textColor || node.color || cat.defaultColor }} />
                  <span className="hidden sm:inline">النص</span>
                </button>

                {showTextColorPicker && (
                  <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1.5 w-40 z-50">
                    {NODE_PALETTE_COLORS.map((p) => (
                      <button
                        key={p.hex}
                        onClick={() => {
                          if (onUpdateNode) {
                            onUpdateNode({ ...node, textColor: p.hex });
                          }
                          setShowTextColorPicker(false);
                        }}
                        className={\`w-7 h-7 rounded-lg border transition hover:scale-110 \${
                          node.textColor === p.hex ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                        }\`}
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                      />
                    ))}
                    <button
                        onClick={() => {
                          if (onUpdateNode) {
                            onUpdateNode({ ...node, textColor: '#f8fafc' });
                          }
                          setShowTextColorPicker(false);
                        }}
                        className={\`w-7 h-7 rounded-lg border transition hover:scale-110 \${
                          node.textColor === '#f8fafc' ? 'ring-2 ring-cyan-400 border-transparent' : 'border-slate-700'
                        }\`}
                        style={{ backgroundColor: '#f8fafc' }}
                        title={'أبيض'}
                      />
                  </div>
                )}
              </div>
            </>
          )}`;

code = code.replace(colorPickerOld, newColorPickers);

fs.writeFileSync('src/components/NodeCard.tsx', code);
console.log("Done");
