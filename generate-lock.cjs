const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const lockfilePath = path.join(__dirname, 'package-lock.json');

const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const lockfile = {
  "name": packageData.name,
  "version": packageData.version,
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": packageData.name,
      "version": packageData.version,
      "type": "module",
      "dependencies": packageData.dependencies || {},
      "devDependencies": packageData.devDependencies || {}
    }
  },
  "dependencies": Object.keys(packageData.dependencies || {}).reduce((acc, dep) => {
    acc[dep] = {
      "version": packageData.dependencies[dep].replace(/^[\^~]/, '')
    };
    return acc;
  }, {}),
  "devDependencies": Object.keys(packageData.devDependencies || {}).reduce((acc, dep) => {
    acc[dep] = {
      "version": packageData.devDependencies[dep].replace(/^[\^~]/, '')
    };
    return acc;
  }, {})
};

fs.writeFileSync(lockfilePath, JSON.stringify(lockfile, null, 2));
console.log('Generated package-lock.json');
