// copy-datavis.js
const fs = require('fs-extra');

fs.copySync('./public/datavis', './dist/datavis');
console.log('✅ Đã copy datavis vào dist/datavis');
