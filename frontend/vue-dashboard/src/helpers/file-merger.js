// This is a simple script to merge the ChatView.vue parts into a single file

const fs = require('fs');
const path = require('path');

const partsDir = path.join(__dirname, '..', 'views');
const outputFile = path.join(partsDir, 'ChatView.vue');

// Read all parts and combine them
const parts = [
  fs.readFileSync(path.join(partsDir, 'ChatView.vue.part1'), 'utf8'),
  fs.readFileSync(path.join(partsDir, 'ChatView.vue.part2'), 'utf8'),
  fs.readFileSync(path.join(partsDir, 'ChatView.vue.part3'), 'utf8'),
  fs.readFileSync(path.join(partsDir, 'ChatView.vue.part4'), 'utf8'),
  fs.readFileSync(path.join(partsDir, 'ChatView.vue.part5'), 'utf8'),
  fs.readFileSync(path.join(partsDir, 'ChatView.vue.part6'), 'utf8')
];

// Combine parts and write to the output file
fs.writeFileSync(outputFile, parts.join(''));
console.log('ChatView.vue has been created successfully.');
