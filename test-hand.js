const { Euler, Vector3 } = require('three');
const e = new Euler(-1.6, -0.4, 0.1, 'XYZ');
const v = new Vector3(0, 1, 0);
v.applyEuler(e);
console.log("Local Y axis points to:", v);
