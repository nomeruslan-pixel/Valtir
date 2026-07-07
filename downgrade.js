const fs = require('fs');

const pkgPath = './package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const updates = {
  "expo": "~54.0.35",
  "expo-dev-client": "~6.0.21",
  "expo-document-picker": "~14.0.8",
  "expo-image-picker": "~17.0.11",
  "expo-location": "~19.0.8",
  "expo-print": "~15.0.8",
  "expo-sharing": "~14.0.8",
  "expo-status-bar": "~3.0.9",
  "expo-system-ui": "~6.0.9",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-get-random-values": "~1.11.0",
  "react-native-maps": "1.20.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-svg": "15.12.1",
  "react-native-webview": "13.15.0"
};

const devUpdates = {
  "@types/react": "~19.1.10",
  "typescript": "~5.9.2"
};

for (const [key, val] of Object.entries(updates)) {
  if (pkg.dependencies[key]) pkg.dependencies[key] = val;
}

for (const [key, val] of Object.entries(devUpdates)) {
  if (pkg.devDependencies[key]) pkg.devDependencies[key] = val;
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('package.json updated!');
