const fs = require('fs');
let code = fs.readFileSync('src/world/textures.ts', 'utf8');

const sOld = `const BEDROCK_B64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAvklEQVQ4T4WS2w3FIAxDMwsrdBgGYCjGbeVKRgeL3vsRJQ3Bj5QaY9zXdW3Re7/nnLfOXCvz3LlUaFDhS8w6V3avtbaBvABuZu3LvuCwIgEW5VqyQDhI+Wm1zGimHHBtSyRbFiiP37R16r0ARLWvfz2rFUh9sZ/YaMvgRfT811/sjDoxUQ3ZuGADFh9RbpugZOXrLW44LaQ9kinWEikt5VJdxrZEZzWtisPcD1WsHaT8X1Y2BUR3ncsySL4H9R5CYf5qPXwY2QAAAABJRU5ErkJggg==";`;
const rNew = `const BEDROCK_B64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAqElEQVR42o1S2xHAIAjjz4EcxgEcynHbw7v0Ag21H7SKmAdoY4yr9x7Cc2utHa21/a/qzD98IYcX8t4BccfPNoAngcprXAYbk2FtOQHAnM/ygwWWW4Wy50TGaIqNFfEZcgY038w5nyLOZ/9BQcXMkRvLik3NXHW9CvtirvzD4ush5Y6zfGZldcYMYFHyVe5p4p/5Hx8SiivPsJJVHMeorAQFaubVI1LAN6bl+kSu3fg1AAAAAElFTkSuQmCC";`;

code = code.replace(sOld, rNew);
fs.writeFileSync('src/world/textures.ts', code);
