# မြန်မာ Voice Studio

Hugging Face ရှိ OpenBMB VoxCPM2 Demo ကို အသုံးပြုသော browser web app ဖြစ်ပါသည်။ Text-to-Speech နှင့် reference audio ဖြင့် voice cloning အသုံးပြုနိုင်ပါသည်။

## ပါဝင်သော Function များ

- မြန်မာဘာသာ UI နှင့် mobile responsive layout
- Text-to-Speech
- Voice Cloning အတွက် WAV / MP3 / OGG upload
- Voice style chips နှင့် ကိုယ်တိုင် style ရေးနိုင်ခြင်း
- CFG creativity ချိန်ညှိခြင်း
- Text normalization
- Voice cloning အတွက် denoise ရွေးချယ်မှု
- Audio play နှင့် download
- Browser local history
- Current Gradio 6 `/gradio_api/call/generate` API
- SSE generation result streaming
- Request timeout နှင့် ပိုမိုရှင်းလင်းသော error handling

## စတင်အသုံးပြုပုံ

ဒီ folder ထဲမှာ terminal ဖွင့်ပြီး run ပါ။

```bash
python3 -m http.server 8765
```

ပြီးလျှင် browser တွင် `http://127.0.0.1:8765` ကိုဖွင့်ပါ။ `file://` ဖြင့် တိုက်ရိုက်ဖွင့်မည့်အစား local HTTP server သုံးရန် အကြံပြုပါသည်။

## Hugging Face API

လက်ရှိ VoxCPM Demo သည် Gradio 6 ကို အသုံးပြုထားပြီး `generate` endpoint ကို public API အဖြစ် expose လုပ်ထားပါသည်။ ဒီ version က အရင်အသုံးပြုထားသော `/queue/join` + `fn_index` + `/queue/data` flow ကို မသုံးတော့ဘဲ အောက်ပါ flow ကိုသုံးပါသည်။

```text
POST /gradio_api/call/generate
        ↓
{ "event_id": "..." }
        ↓
GET /gradio_api/call/generate/{event_id}
        ↓
SSE: generating / complete / error
```

## လုံခြုံရေး

- အသံဖန်တီးရန် internet connection လိုပါသည်။
- AI processing request များသည် public Hugging Face VoxCPM Demo သို့ ပို့ပါသည်။
- ကိုယ်ရေးကိုယ်တာစာသား၊ လျှို့ဝှက်အချက်အလက်၊ ခွင့်ပြုချက်မရှိသော တခြားသူ၏အသံ မတင်ပါနှင့်။
- Voice cloning ကို ခွင့်ပြုချက်ရှိသောအသံများနှင့် တရားဝင်/ကျင့်ဝတ်နှင့်ညီသော ရည်ရွယ်ချက်များအတွက်သာ အသုံးပြုပါ။
- Public demo ဖြစ်သောကြောင့် queue ပြည့်ခြင်း၊ cold start ကြာခြင်း သို့မဟုတ် ယာယီ unavailable ဖြစ်ခြင်းများ ဖြစ်နိုင်ပါသည်။

## စမ်းသပ်စစ်ဆေးခြင်း

`app.js` ကို JavaScript syntax check လုပ်နိုင်ပါသည်။

```bash
node --check app.js
```

Network smoke test အတွက်:

```bash
node smoke-test.js
```

Smoke test သည် network access ရှိသော environment မှသာ အလုပ်လုပ်ပါမည်။
