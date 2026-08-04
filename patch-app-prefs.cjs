const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const \[isDark, setIsDark\] = useState<boolean>\(true\);/,
  `const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref-isDark');
    return saved !== null ? saved === 'true' : true;
  });`
);

content = content.replace(
  /const \[showCoordinates, setShowCoordinates\] = useState<boolean>\(true\);/,
  `const [showCoordinates, setShowCoordinates] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref-showCoords');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('pref-isDark', isDark.toString());
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('pref-showCoords', showCoordinates.toString());
  }, [showCoordinates]);`
);

fs.writeFileSync('src/App.tsx', content);
