// copy-datavis.js
import fs from 'fs-extra';

fs.copySync('./public/datavis', './dist/datavis');
console.log('✅ Đã copy datavis vào dist/datavis');
