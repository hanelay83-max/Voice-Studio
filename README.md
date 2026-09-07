# မြန်မာ Voice Studio

တစ်ယောက်တည်းအသုံးပြုရန် ပြုလုပ်ထားသော local web app ဖြစ်ပါသည်။ Domain မလိုပါ။ Browser ထဲကနေ Hugging Face ရှိ VoxCPM demo ကို ချိတ်၍ Text-to-Speech နှင့် Voice Cloning အသုံးပြုနိုင်ပါသည်။

## ပါဝင်သော Function များ

- မြန်မာဘာသာ UI နှင့် mobile responsive layout
- Text-to-Speech
- Voice Cloning အတွက် WAV / MP3 / OGG upload
- Voice style chips နှင့် ကိုယ်တိုင် style ရေးနိုင်ခြင်း
- Creativity ချိန်ညှိခြင်း
- Text normalization
- Voice cloning အတွက် noise reduction ရွေးချယ်မှု
- Audio play နှင့် download
- Browser local history (စာသားအတိုချုံးများသာ)
- Hugging Face queue status နှင့် error message

## စတင်အသုံးပြုပုံ

ဒီ folder ထဲမှာ terminal ဖွင့်ပြီး အောက်ပါ command ကို run ပါ။

```bash
python3 -m http.server 8765
```

ထို့နောက် browser တွင် [http://127.0.0.1:8765](http://127.0.0.1:8765) ကိုဖွင့်ပါ။ `file:///.../index.html` ဖြင့် တိုက်ရိုက်ဖွင့်မည့်အစား local server သုံးရန် အကြံပြုပါသည်။

## အရေးကြီးသော မှတ်ချက်

- အသံဖန်တီးရန် internet connection လိုပါသည်။
- AI processing သည် `openbmb-voxcpm-demo.hf.space` သို့ ပို့ပါသည်။
- ကိုယ်ရေးကိုယ်တာစာသား၊ လျှို့ဝှက်အချက်အလက်၊ ခွင့်ပြုချက်မရှိသော တခြားသူ၏အသံ မတင်ပါနှင့်။
- Public Hugging Face demo ဖြစ်သောကြောင့် queue ပြည့်ခြင်း သို့မဟုတ် ခဏရပ်နားခြင်း ဖြစ်နိုင်ပါသည်။
- Voice cloning ကို ခွင့်ပြုချက်ရှိသောအသံများနှင့် တရားဝင်/ကျင့်ဝတ်နှင့်ညီသော ရည်ရွယ်ချက်များအတွက်သာ အသုံးပြုပါ။

## စမ်းသပ်စစ်ဆေးထားမှု

- JavaScript syntax စစ်ဆေးပြီးပါပြီ။
- Local HTTP server မှ `index.html`, `style.css`, `app.js` သုံးခုလုံး အောင်မြင်စွာ serve ဖြစ်ကြောင်း စစ်ပြီးပါပြီ။
- Hugging Face queue API သို့ မြန်မာစာ test request ပို့၍ `process_completed` နှင့် audio output အောင်မြင်စွာ ပြန်ရကြောင်း စစ်ပြီးပါပြီ။
