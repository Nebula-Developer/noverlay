import { EventManager, addCustomEventModifier } from "../src/events/events";

const m = new EventManager<any>();
const seen: any[] = [];

m.on('custom', (v) => { console.log('listener got', v); seen.push(v); });
addCustomEventModifier(m, 'custom', (v) => ({ wrapped: v }));

console.log('emit raw');
m.emit('custom', 'raw');
console.log('seen =', JSON.stringify(seen));
process.exit(0);
