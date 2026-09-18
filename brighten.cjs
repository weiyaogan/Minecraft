const fs = require('fs');
const PNG = require('pngjs').PNG;
const data = fs.readFileSync('test.png');
const png = PNG.sync.read(data);
let min = 255;
let max = 0;
for (let i = 0; i < png.data.length; i += 4) {
  min = Math.min(min, png.data[i]);
  max = Math.max(max, png.data[i]);
}

for (let i = 0; i < png.data.length; i += 4) {
  let val = png.data[i];
  // normalize 0-1
  let norm = (val - min) / (max - min);
  // scale to 40 - 220
  let newVal = Math.floor(40 + norm * 180);
  png.data[i] = newVal;
  png.data[i+1] = newVal;
  png.data[i+2] = newVal;
}
const out = PNG.sync.write(png);
console.log(out.toString('base64'));
