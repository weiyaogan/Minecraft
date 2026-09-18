const fs = require('fs');
let code = fs.readFileSync('src/components/InventoryUI.tsx', 'utf8');

const sOffhandRender = `             {renderSlot('offhand', 0, offhand)}
          </div>`;

const rOffhandRender = `             {renderSlot('offhand', 0, offhand)}
             {!offhand.type && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                 <svg width="20" height="24" viewBox="0 0 20 24" fill="none" stroke="#555555" strokeWidth="2">
                   <path d="M10 2L2 5V11C2 17 8 21 10 22C12 21 18 17 18 11V5L10 2Z" />
                 </svg>
               </div>
             )}
          </div>`;

code = code.replace(sOffhandRender, rOffhandRender);

const sArmorSlots = `          {/* Armor slots placeholder */}
          <div className="flex flex-col gap-[4px]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#8b8b8b]" style={{ width: '36px', height: '36px', boxShadow: 'inset 2px 2px 0px 0px #373737, inset -2px -2px 0px 0px #ffffff' }} />
            ))}
          </div>`;

const rArmorSlots = `          {/* Armor slots placeholder */}
          <div className="flex flex-col gap-[4px]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#8b8b8b] relative flex items-center justify-center" style={{ width: '36px', height: '36px', boxShadow: 'inset 2px 2px 0px 0px #373737, inset -2px -2px 0px 0px #ffffff' }}>
                {i === 0 && <svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke="#555555" strokeWidth="2" className="opacity-50"><path d="M2 14V8C2 4 6 2 10 2C14 2 18 4 18 8V14M4 14V11M16 14V11" /></svg>}
                {i === 1 && <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#555555" strokeWidth="2" className="opacity-50"><path d="M4 2L2 6V18H6V12H14V18H18V6L16 2H4Z" /></svg>}
                {i === 2 && <svg width="18" height="20" viewBox="0 0 18 20" fill="none" stroke="#555555" strokeWidth="2" className="opacity-50"><path d="M3 2H15V6H13V18H9V8H9V18H5V6H3V2Z" /></svg>}
                {i === 3 && <svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke="#555555" strokeWidth="2" className="opacity-50"><path d="M2 2V10H6V14H14V10H18V2" /></svg>}
              </div>
            ))}
          </div>`;

code = code.replace(sArmorSlots, rArmorSlots);

fs.writeFileSync('src/components/InventoryUI.tsx', code);
