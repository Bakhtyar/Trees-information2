const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
  /<meta name="viewport" content="width=device-width, initial-scale=1.0" \/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />'
);

fs.writeFileSync('index.html', content);
