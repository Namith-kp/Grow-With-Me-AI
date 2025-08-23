const fs = require('fs');
const path = require('path');

console.log('Verifying build output...');

const distPath = path.join(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found!');
  process.exit(1);
}

if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ index.html not found in dist!');
  process.exit(1);
}

console.log('✅ dist directory exists');
console.log('✅ index.html exists');

// Check index.html content
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
console.log('\n📄 index.html content preview:');
console.log(indexHtml.substring(0, 200) + '...');

// Check for asset references
const assetMatches = indexHtml.match(/src="([^"]+)"/g);
if (assetMatches) {
  console.log('\n🔗 Asset references found:');
  assetMatches.forEach(match => {
    const src = match.match(/src="([^"]+)"/)[1];
    console.log(`  - ${src}`);
    
    // Check if asset exists
    if (src.startsWith('./')) {
      const assetPath = path.join(distPath, src.substring(2));
      if (fs.existsSync(assetPath)) {
        console.log(`    ✅ Asset exists: ${assetPath}`);
      } else {
        console.error(`    ❌ Asset missing: ${assetPath}`);
      }
    }
  });
}

// List all files in dist
console.log('\n📁 Files in dist directory:');
const listFiles = (dir, indent = '') => {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      console.log(`${indent}📁 ${item}/`);
      listFiles(fullPath, indent + '  ');
    } else {
      console.log(`${indent}📄 ${item}`);
    }
  });
};

listFiles(distPath);

console.log('\n✅ Build verification complete!');
