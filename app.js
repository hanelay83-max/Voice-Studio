(() => {
  'use strict';
  const SPACE = 'https://openbmb-voxcpm-demo.hf.space';
  const API = `${SPACE}/gradio_api`;
  const $ = s => document.querySelector(s);
  const text = $('#text-input'), style = $('#style-input'), cfg = $('#cfg');
  let mode = 'tts', fileData = null, busy = false, session = Math.random().toString(36).slice(2, 10);
  const setStatus = (message, kind = '') => { const el = $('#status'); el.textContent = message; el.className = `status ${kind}`; };
  const setBusy = value => { busy = value; $('#generate').disabled = value; $('#spinner').hidden = !value; $('#generate-label').hidden = value; document.querySelectorAll('.tab,.chip').forEach(x => x.disabled = value); };
  text.addEventListener('input', () => $('#char-count').textContent = text.value.length);
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
    if (busy) return; document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); btn.classList.add('active'); mode = btn.dataset.mode;
    $('#tts-options').hidden = mode !== 'tts'; $('#clone-options').hidden = mode !== 'clone'; setStatus(mode === 'clone' ? 'အသံ sample ဖိုင်တင်ပါ' : 'စာသားနှင့် အသံပုံစံထည့်ပါ');
  }));
  document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => { style.value = chip.dataset.style; style.focus(); }));
  document.querySelectorAll('[data-sample]').forEach(x => x.addEventListener('click', () => { text.value = x.dataset.sample; text.dispatchEvent(new Event('input')); }));
  $('#clear-text').addEventListener('click', () => { text.value = ''; text.dispatchEvent(new Event('input')); text.focus(); });
  cfg.addEventListener('input', () => $('#cfg-value').textContent = Number(cfg.value).toFixed(1));
  $('#toggle-advanced').addEventListener('click', () => { const b = $('#advanced-body'); b.hidden = !b.hidden; $('#toggle-advanced').textContent = b.hidden ? 'ဖွင့်မည်' : 'ပိတ်မည်'; });
  const fmt = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(2)} MB`;
  const upload = async file => { if (!file || !file.type.startsWith('audio/')) throw Error('Audio ဖိုင်သာ ရွေးချယ်ပါ'); if (file.size > 20*1024*1024) throw Error('ဖိုင်အရွယ်အစား 20MB ထက်မကျော်ရ'); setStatus('Reference အသံဖိုင် upload လုပ်နေသည်…'); const fd = new FormData(); fd.append('files', file, file.name); const r = await fetch(`${API}/upload`, { method:'POST', body:fd }); if (!r.ok) throw Error(`Upload မအောင်မြင်ပါ (HTTP ${r.status})`); const paths = await r.json(); return { path:Array.isArray(paths)?paths[0]:paths, url:null, orig_name:file.name, mime_type:file.type, is_stream:false, meta:{_type:'gradio.FileData'} }; };
  const chooseFile = async file => { try { fileData = await upload(file); $('#file-title').textContent = file.name; $('#file-meta').textContent = `${fmt(file.size)} • အသုံးပြုရန်အဆင်သင့်`; $('#remove-file').hidden = false; setStatus('အသံဖိုင် အဆင်သင့်ဖြစ်ပါပြီ','ok'); } catch(e) { fileData=null; setStatus(e.message,'error'); } };
  $('#audio-input').addEventListener('change', e => chooseFile(e.target.files[0]));
  const dz = $('#dropzone'); dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor='var(--cyan)'; }); dz.addEventListener('dragleave', () => dz.style.borderColor=''); dz.addEventListener('drop', e => { e.preventDefault(); dz.style.borderColor=''; chooseFile(e.dataTransfer.files[0]); });
  $('#remove-file').addEventListener('click', () => { fileData=null; $('#audio-input').value=''; $('#file-title').textContent='အသံဖိုင်ရွေးပါ သို့မဟုတ် ဆွဲချပါ'; $('#file-meta').textContent='WAV, MP3, OGG • 20MB အထိ'; $('#remove-file').hidden=true; });
  const run = data => new Promise((resolve, reject) => {
    let source, done=false; const finish=()=>{ if(done)return; done=true; if(source)source.close(); };
    fetch(`${API}/queue/join`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,event_data:null,fn_index:2,trigger_id:2,session_hash:session})})
      .then(r => { if(!r.ok) throw Error(`Queue join မအောင်မြင်ပါ (HTTP ${r.status})`); source = new EventSource(`${API}/queue/data?fn_index=2&session_hash=${encodeURIComponent(session)}`); source.onmessage = event => { const m=JSON.parse(event.data); if(m.msg==='estimation') setStatus(m.rank?`Queue ထဲတွင် ${m.rank} ယောက်ရှိသည်…`:'စတင်နေသည်…'); if(m.msg==='process_starts') setStatus('AI model စတင်နေသည်…'); if(m.msg==='process_generating') setStatus('အသံဖန်တီးနေသည်…'); if(m.msg==='progress' && m.data?.[0] !== undefined) setStatus(`အသံဖန်တီးနေသည်… ${Math.round(m.data[0]*100)}%`); if(m.msg==='queue_full'){reject(Error('Demo queue ပြည့်နေပါသည်။ ခဏအကြာ ပြန်ကြိုးစားပါ'));finish();} if(m.msg==='process_completed'){if(m.success===false){reject(Error(typeof m.output?.data==='string'?m.output.data:'AI generation မအောင်မြင်ပါ'));}else resolve(m.output?.data);finish();}}; source.onerror=()=>{reject(Error('Hugging Face server နှင့် ချိတ်ဆက်မှု ပြတ်တောက်ပါသည်'));finish();}; })
      .catch(e=>{reject(e);finish();});
  });
  const show = output => { const f=output?.[0]; const url=f?.url || (f?.path ? `${SPACE}/file=${encodeURIComponent(f.path)}` : null); if(!url) throw Error('Audio output မရရှိပါ'); const player=$('#audio-player'); player.src=url; player.load(); const ext=(f.orig_name||'').split('.').pop()||'mp3'; $('#download').disabled=false; $('#download').onclick=()=>{ const a=document.createElement('a'); a.href=url; a.download=`myanmar-voice-${Date.now()}.${ext}`; a.click(); }; $('#empty').hidden=true; $('#result').hidden=false; $('#mode-meta').textContent=mode==='clone'?'Voice Cloning':'Text to Speech'; $('#size-meta').textContent=f.size?fmt(f.size):'Audio ready'; player.onloadedmetadata=()=>$('#duration-meta').textContent=`${Math.floor(player.duration/60)}:${String(Math.floor(player.duration%60)).padStart(2,'0')}`; const wave=$('#wave'); wave.innerHTML=''; for(let i=0;i<34;i++){const bar=document.createElement('i');bar.style.height=`${12+Math.random()*42}px`;wave.appendChild(bar);} saveHistory(text.value); };
  const saveHistory = value => { const list=JSON.parse(localStorage.getItem('myvoice-history')||'[]'); list.unshift(value.slice(0,90)); localStorage.setItem('myvoice-history',JSON.stringify([...new Set(list)].slice(0,8))); renderHistory(); };
  const renderHistory = () => { const list=JSON.parse(localStorage.getItem('myvoice-history')||'[]'); const box=$('#history-list'); box.innerHTML=list.length?list.map((x,i)=>`<button class="history-item" data-index="${i}">${x}</button>`).join(''):'<p class="muted">ဒီ browser ထဲမှာသာ မှတ်တမ်းတင်ထားပါမည်။</p>'; box.querySelectorAll('.history-item').forEach(b=>b.onclick=()=>{text.value=list[Number(b.dataset.index)];text.dispatchEvent(new Event('input'));}); };
  $('#clear-history').addEventListener('click',()=>{localStorage.removeItem('myvoice-history');renderHistory();});
  $('#generate').addEventListener('click', async () => { if(busy)return; if(!text.value.trim()) return setStatus('ဖတ်မည့်စာသား ထည့်ပါ','error'); if(mode==='clone'&&!fileData)return setStatus('Reference အသံဖိုင် တင်ပါ','error'); setBusy(true); setStatus('Hugging Face demo သို့ ချိတ်ဆက်နေသည်…'); try { const data=[text.value.trim(), style.value.trim(), mode==='clone'?fileData:null, false, '', Number(cfg.value), $('#normalize').checked, $('#denoise').checked&&mode==='clone']; show(await run(data)); setStatus('အသံဖန်တီးပြီးပါပြီ','ok'); } catch(e) { console.error(e); setStatus(e.message,'error'); } finally {setBusy(false);} });
  renderHistory();
})();
