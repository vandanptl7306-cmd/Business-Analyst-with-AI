const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  let files = [];
  try {
    files = fs.readdirSync(dirPath);
  } catch(e) {
    return arrayOfFiles;
  }

  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
      return;
    }
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

function checkUnused(baseDir, packageJsonPath) {
  const allFiles = getAllFiles(baseDir);
  
  const sourceFiles = allFiles.filter(f => f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx'));
  
  const contents = sourceFiles.map(f => ({ path: f, content: fs.readFileSync(f, 'utf8') }));
  
  const unusedFiles = [];
  
  allFiles.forEach(file => {
    // Skip main entry points and common configs
    if (file.endsWith('app.js') || file.endsWith('server.js') || file.endsWith('main.jsx') || 
        file.endsWith('index.js') || file.endsWith('index.css') || file.endsWith('vite-env.d.ts') ||
        file.includes('config') || file.includes('.env') || file.includes('package.json')) {
      return;
    }
    
    const basename = path.basename(file);
    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    
    let isUsed = false;
    for (const src of contents) {
      if (src.path === file) continue;
      
      if (src.content.includes(nameWithoutExt) || src.content.includes(basename)) {
        isUsed = true;
        break;
      }
    }
    
    if (!isUsed) {
      unusedFiles.push(file);
    }
  });
  
  // Check npm packages
  let unusedPackages = [];
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = Object.keys(pkg.dependencies || {});
    
    deps.forEach(dep => {
      let isUsed = false;
      for (const src of contents) {
        if (src.content.includes(`'${dep}'`) || src.content.includes(`"${dep}"`) || src.content.includes(`\`${dep}\``)) {
          isUsed = true;
          break;
        }
      }
      if (!isUsed) {
        unusedPackages.push(dep);
      }
    });
  }
  
  return { unusedFiles, unusedPackages };
}

const backend = checkUnused(path.join(__dirname, 'src'), path.join(__dirname, 'package.json'));
const frontend = checkUnused(path.join(__dirname, 'client/src'), path.join(__dirname, 'client/package.json'));

console.log('--- BACKEND ---');
console.log('Unused Files:');
backend.unusedFiles.forEach(f => console.log(f.replace(__dirname, '')));
console.log('\nUnused Packages:');
backend.unusedPackages.forEach(f => console.log(f));

console.log('\n--- FRONTEND ---');
console.log('Unused Files:');
frontend.unusedFiles.forEach(f => console.log(f.replace(__dirname, '')));
console.log('\nUnused Packages:');
frontend.unusedPackages.forEach(f => console.log(f));
