(() => {
  'use strict';

  // Current VoxCPM Gradio 6 API. The old /queue/join + fn_index flow is no longer used.
  const SPACE = 'https://openbmb-voxcpm-demo.hf.space';
  const API = `${SPACE}/gradio_api`;
  const GENERATE_API = `${API}/call/generate`;

  const $ = s => document.querySelector(s);
  const text = $('#text-input'), style = $('#style-input'), cfg = $('#cfg');
  let mode = 'tts', fileData = null, busy = false;

  const setStatus = (message, kind = '') => {
    const el = $('#status');
    el.textContent = message;
    el.className = `status ${kind}`;
  };

  const setBusy = value => {
    busy = value;
    $('#generate').disabled = value;
    $('#spinner').hidden = !value;
    $('#generate-label').hidden = value;
    document.querySelectorAll('.tab,.chip').forEach(x => x.disabled = value);
  };

  text.addEventListener('input', () => $('#char-count').textContent = text.value.length);

  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
    if (busy) return;
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
    $('#tts-options').hidden = mode !== 'tts';
    $('#clone-options').hidden = mode !== 'clone';
    setStatus(mode === 'clone' ? 'အသံ sample ဖိုင်တင်ပါ' : 'စာသားနှင့် အသံပုံစံထည့်ပါ');
  }));

  document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
    style.value = chip.dataset.style;
    style.focus();
  }));

  document.querySelectorAll('[data-sample]').forEach(x => x.addEventListener('click', () => {
    text.value = x.dataset.sample;
    text.dispatchEvent(new Event('input'));
  }));

  $('#clear-text').addEventListener('click', () => {
    text.value = '';
    text.dispatchEvent(new Event('input'));
    text.focus();
  });

  cfg.addEventListener('input', () => $('#cfg-value').textContent = Number(cfg.value).toFixed(1));

  $('#toggle-advanced').addEventListener('click', () => {
    const b = $('#advanced-body');
    b.hidden = !b.hidden;
    $('#toggle-advanced').textContent = b.hidden ? 'ဖွင့်မည်' : 'ပိတ်မည်';
  });

  const fmt = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;

  const upload = async file => {
    if (!file || !file.type.startsWith('audio/')) throw Error('Audio ဖိုင်သာ ရွေးချယ်ပါ');
    if (file.size > 20 * 1024 * 1024) throw Error('ဖိုင်အရွယ်အစား 20MB ထက်မကျော်ရ');

    setStatus('Reference အသံဖိုင် upload လုပ်နေသည်…');
    const fd = new FormData();
    fd.append('files', file, file.name);

    const r = await fetch(`${API}/upload`, { method: 'POST', body: fd });
    if (!r.ok) throw Error(`Upload မအောင်မြင်ပါ (HTTP ${r.status})`);

    const paths = await r.json();
    const path = Array.isArray(paths) ? paths[0] : paths;
    return {
      path,
      url: null,
      orig_name: file.name,
      mime_type: file.type,
      is_stream: false,
      meta: { _type: 'gradio.FileData' }
    };
  };

  const chooseFile = async file => {
    try {
      fileData = await upload(file);
      $('#file-title').textContent = file.name;
      $('#file-meta').textContent = `${fmt(file.size)} • အသုံးပြုရန်အဆင်သင့်`;
      $('#remove-file').hidden = false;
      setStatus('အသံဖိုင် အဆင်သင့်ဖြစ်ပါပြီ', 'ok');
    } catch (e) {
      fileData = null;
      setStatus(e.message, 'error');
    }
  };

  $('#audio-input').addEventListener('change', e => chooseFile(e.target.files[0]));

  const dz = $('#dropzone');
  dz.addEventListener('dragover', e => {
    e.preventDefault();
    dz.style.borderColor = 'var(--cyan)';
  });
  dz.addEventListener('dragleave', () => dz.style.borderColor = '');
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.style.borderColor = '';
    chooseFile(e.dataTransfer.files[0]);
  });

  $('#remove-file').addEventListener('click', () => {
    fileData = null;
    $('#audio-input').value = '';
    $('#file-title').textContent = 'အသံဖိုင်ရွေးပါ သို့မဟုတ် ဆွဲချပါ';
    $('#file-meta').textContent = 'WAV, MP3, OGG • 20MB အထိ';
    $('#remove-file').hidden = true;
  });

  // Gradio 6 API flow:
  // POST /gradio_api/call/generate -> { event_id }
  // GET  /gradio_api/call/generate/{event_id} -> SSE events
  const run = async data => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000);

    try {
      const start = await fetch(GENERATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
        signal: controller.signal
      });

      if (!start.ok) {
        let detail = '';
        try { detail = await start.text(); } catch (_) {}
        throw Error(`Hugging Face generate request မအောင်မြင်ပါ (HTTP ${start.status})${detail ? `: ${detail.slice(0, 180)}` : ''}`);
      }

      const started = await start.json();
      if (!started?.event_id) throw Error('Hugging Face က event_id မပြန်ပေးပါ');

      const stream = await fetch(`${GENERATE_API}/${encodeURIComponent(started.event_id)}`, {
        method: 'GET',
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal
      });

      if (!stream.ok) throw Error(`Hugging Face result stream မရပါ (HTTP ${stream.status})`);
      if (!stream.body) throw Error('Browser က streaming response ကို မထောက်ပံ့ပါ');

      const reader = stream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const handleEvent = raw => {
        const lines = raw.split(/\r?\n/);
        const eventName = (lines.find(x => x.startsWith('event:')) || '').slice(6).trim();
        const dataLine = lines.find(x => x.startsWith('data:'));
        if (!dataLine) return null;

        const rawData = dataLine.slice(5).trim();
        if (!rawData) return null;

        let payload;
        try { payload = JSON.parse(rawData); }
        catch (_) { payload = rawData; }

        if (eventName === 'queue_full') {
          throw Error('Hugging Face demo queue ပြည့်နေပါသည်။ ခဏအကြာ ပြန်ကြိုးစားပါ');
        }

        if (eventName === 'error') {
          const message = typeof payload === 'string' ? payload : (payload?.message || payload?.error || 'AI generation မအောင်မြင်ပါ');
          throw Error(message);
        }

        if (eventName === 'generating') {
          setStatus('အသံဖန်တီးနေသည်…');
          return null;
        }

        if (eventName === 'complete') {
          return payload;
        }

        return null;
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() || '';

        for (const part of parts) {
          const result = handleEvent(part);
          if (result !== null) {
            try { await reader.cancel(); } catch (_) {}
            return result;
          }
        }
      }

      // Some proxies may omit the final blank line; process the remaining SSE block.
      if (buffer.trim()) {
        const result = handleEvent(buffer);
        if (result !== null) return result;
      }

      throw Error('Hugging Face က audio result မပြန်ပေးဘဲ connection ပိတ်သွားပါသည်');
    } catch (e) {
      if (e?.name === 'AbortError') throw Error('Hugging Face request timeout ဖြစ်သွားပါသည်။ Demo ကို ပြန်စမ်းပါ');
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  };

  const absoluteUrl = value => {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return `${SPACE}${value}`;
    return `${SPACE}/${value}`;
  };

  const show = output => {
    // Gradio Audio output is normally the first item in the completed data array.
    // Be tolerant of a direct FileData object as well.
    const f = Array.isArray(output) ? output[0] : output;
    const url = absoluteUrl(f?.url) || (f?.path ? absoluteUrl(`/file=${encodeURIComponent(f.path)}`) : null);
    if (!url) throw Error('Audio output မရရှိပါ');

    const player = $('#audio-player');
    player.src = url;
    player.load();

    const ext = (f?.orig_name || '').split('.').pop() || 'wav';
    $('#download').disabled = false;
    $('#download').onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `myanmar-voice-${Date.now()}.${ext}`;
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
    };

    $('#empty').hidden = true;
    $('#result').hidden = false;
    $('#mode-meta').textContent = mode === 'clone' ? 'Voice Cloning' : 'Text to Speech';
    $('#size-meta').textContent = f?.size ? fmt(f.size) : 'Audio ready';
    player.onloadedmetadata = () => {
      $('#duration-meta').textContent = `${Math.floor(player.duration / 60)}:${String(Math.floor(player.duration % 60)).padStart(2, '0')}`;
    };

    const wave = $('#wave');
    wave.innerHTML = '';
    for (let i = 0; i < 34; i++) {
      const bar = document.createElement('i');
      bar.style.height = `${12 + Math.random() * 42}px`;
      wave.appendChild(bar);
    }
    saveHistory(text.value);
  };

  const saveHistory = value => {
    const list = JSON.parse(localStorage.getItem('myvoice-history') || '[]');
    list.unshift(value.slice(0, 90));
    localStorage.setItem('myvoice-history', JSON.stringify([...new Set(list)].slice(0, 8)));
    renderHistory();
  };

  const renderHistory = () => {
    const list = JSON.parse(localStorage.getItem('myvoice-history') || '[]');
    const box = $('#history-list');
    box.innerHTML = list.length
      ? list.map((x, i) => `<button class="history-item" data-index="${i}">${x}</button>`).join('')
      : '<p class="muted">ဒီ browser ထဲမှာသာ မှတ်တမ်းတင်ထားပါမည်။</p>';
    box.querySelectorAll('.history-item').forEach(b => b.onclick = () => {
      text.value = list[Number(b.dataset.index)];
      text.dispatchEvent(new Event('input'));
    });
  };

  $('#clear-history').addEventListener('click', () => {
    localStorage.removeItem('myvoice-history');
    renderHistory();
  });

  document.addEventListener('pointerdown', event => {
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  $('#generate').addEventListener('click', async () => {
    if (busy) return;
    if (!text.value.trim()) return setStatus('ဖတ်မည့်စာသား ထည့်ပါ', 'error');
    if (mode === 'clone' && !fileData) return setStatus('Reference အသံဖိုင် တင်ပါ', 'error');

    setBusy(true);
    setStatus('Hugging Face VoxCPM ကို request ပို့နေသည်…');

    try {
      // Current VoxCPM2 / Gradio API input order:
      // text, control_instruction, ref_wav, use_prompt_text,
      // prompt_text_value, cfg_value, do_normalize, denoise, dit_steps, seed_value
      const data = [
        text.value.trim(),
        style.value.trim(),
        mode === 'clone' ? fileData : null,
        false,
        '',
        Number(cfg.value),
        $('#normalize').checked,
        $('#denoise').checked && mode === 'clone',
        10,
        null
      ];

      const result = await run(data);
      show(result);
      setStatus('အသံဖန်တီးပြီးပါပြီ', 'ok');
    } catch (e) {
      console.error(e);
      setStatus(e.message || 'AI generation မအောင်မြင်ပါ', 'error');
    } finally {
      setBusy(false);
    }
  });

  renderHistory();
})();
