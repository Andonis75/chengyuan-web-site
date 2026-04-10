const fs = require('fs');
const path = require('path');

const dirs = [
  'xcx/miniprogram/assets/icons',
  'xcx/miniprogram/assets/images'
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// 1x1 transparent PNG base64
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const buffer = Buffer.from(pngBase64, 'base64');

const files = [
  'xcx/miniprogram/assets/icons/home.png',
  'xcx/miniprogram/assets/icons/home-active.png',
  'xcx/miniprogram/assets/icons/sample.png',
  'xcx/miniprogram/assets/icons/sample-active.png',
  'xcx/miniprogram/assets/icons/insight.png',
  'xcx/miniprogram/assets/icons/insight-active.png',
  'xcx/miniprogram/assets/icons/profile.png',
  'xcx/miniprogram/assets/icons/profile-active.png',
  'xcx/miniprogram/assets/images/default-avatar.png'
];

files.forEach(file => {
  fs.writeFileSync(file, buffer);
});
console.log('Icons generated');