const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const sProps = `  lastPlacedTime: number;`;
const rProps = `  lastPlacedTime: number;
  lastOffhandPlacedTime: number;`;
code = code.replace(sProps, rProps);

const sInitial = `  lastPlacedTime: 0,`;
const rInitial = `  lastPlacedTime: 0,
  lastOffhandPlacedTime: 0,`;
code = code.replace(sInitial, rInitial);

const sRemoveOffhand = `  removeOffhand: (count) => set((state) => {
    if (!state.offhand.type) return state;
    const remaining = state.offhand.count - count;
    return { offhand: remaining > 0 ? { ...state.offhand, count: remaining } : { type: null, count: 0 } };
  }),`;

const rRemoveOffhand = `  removeOffhand: (count) => set((state) => {
    if (!state.offhand.type) return state;
    const remaining = state.offhand.count - count;
    return { 
      offhand: remaining > 0 ? { ...state.offhand, count: remaining } : { type: null, count: 0 },
      lastOffhandPlacedTime: performance.now()
    };
  }),`;
code = code.replace(sRemoveOffhand, rRemoveOffhand);

fs.writeFileSync('src/store.ts', code);
