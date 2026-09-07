// Smoke test for the current Gradio 6 VoxCPM API.
// Run in a modern Node.js version with: node smoke-test.js
const SPACE = 'https://openbmb-voxcpm-demo.hf.space';
const API = `${SPACE}/gradio_api`;
const GENERATE = `${API}/call/generate`;

const data = [
  'မင်္ဂလာပါ။ စမ်းသပ်အသံဖြစ်ပါတယ်။',
  'နွေးထွေးသော မြန်မာအသံ၊ ရှင်းရှင်းပြောပါ',
  null,
  false,
  '',
  2,
  true,
  false,
  10,
  null
];

const start = await fetch(GENERATE, {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({data})
});
console.log('generate_start', start.status, await start.text());
