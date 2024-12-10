const fs = require('fs');
const path = require('path');

const copyFolderSync = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  fs.readdirSync(src).forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
};

console.log('Copying static files...');
copyFolderSync('weights', 'dist/weights');
copyFolderSync('tmp', 'dist/tmp');
console.log('Static files copied!');
