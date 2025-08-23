const fs = require('fs');
const path = require('path');

// Read the original package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Create a web-only version
const webPackage = {
  ...package,
  dependencies: {}
};

// Only include web-compatible dependencies
const webDependencies = [
  '@google/genai',
  '@heroicons/react',
  '@radix-ui/react-slot',
  '@react-spring/three',
  '@react-spring/web',
  '@react-three/drei',
  '@react-three/fiber',
  '@react-three/postprocessing',
  'class-variance-authority',
  'clsx',
  'firebase',
  'framer-motion',
  'leva',
  'lucide-react',
  'motion',
  'ogl',
  'react',
  'react-dom',
  'react-icons',
  'react-spinners',
  'react-spring',
  'recharts',
  'tailwind-merge',
  'three',
  'three-stdlib'
];

// Add only web dependencies
webDependencies.forEach(dep => {
  if (package.dependencies[dep]) {
    webPackage.dependencies[dep] = package.dependencies[dep];
  }
});

// Add dev dependencies
webPackage.devDependencies = package.devDependencies;

// Write the web package.json
const webPackagePath = path.join(__dirname, '..', 'package.web.json');
fs.writeFileSync(webPackagePath, JSON.stringify(webPackage, null, 2));

console.log('Web-only package.json created successfully!');
console.log('Use "npm install --package-lock-only" with package.web.json for web builds');
