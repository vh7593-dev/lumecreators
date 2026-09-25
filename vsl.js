(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const token = sessionStorage.getItem('lume_flow_token_v1');
  if (!token) { location.replace('/'); return; }
  let config, instagram, watchedUntil = 0, unlocked = false, buying = false;
  const sent = new Set();
  const auth = { Authorization: `Bearer ${token}` };
  async function api(path, options = {}) {
    const response = await fetch(path, { ...options, headers: { ...auth, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }, cache: 'no-store', keepalive: true });
    if (response.status === 401) { sessionStorage.removeItem('lume_flow_token_v1'); location.replace('/'); throw Error('Sessão encerrada.'); }
    if (!response.ok) throw Error('Não foi possível conectar. Tente novamente.');
    return response.json();
  }
  function event(name) {
    if (sent.has(name)) return;
    sent.add(name);
    if (window.fbq) window.fbq('trackCustom', name);
    if (window.gtag) window.gtag('event', name);
    api('/api/vsl/events', { method: 'POST', body: JSON.stringify({ event: name }) }).catch(() => sent.delete(name));
  }
  function analytics() {
    const pixel = config.analytics?.metaPixelId || '967499879728317';
    if (/^\d{8,20}$/.test(pixel)) {
      const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
      const script = document.createElement('script'); script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(script);
      fbq('init', pixel); fbq('track', 'PageView');
    }
    const ga4Id = config.analytics?.ga4Id || '';
    if (/^G-[A-Z0-9]+$/.test(ga4Id)) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      const script = document.createElement('script'); script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`; document.head.appendChild(script);
      window.gtag('js', new Date()); window.gtag('config', ga4Id);
    }
  }
  const format = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '--:--';
  function initVideo() {
    const vsl = config.vsl || {};
    const source = vsl.type === 'mp4' ? vsl.url : vsl.type === 'mp4-upload' ? '/media/campaign.mp4' : '';
    if (!source) { $('state').hidden = false; $('state').textContent = 'O vídeo ainda não está disponível. Entre em contato com a LUME.'; return; }
    if (vsl.format === '9:16') $('video-shell').classList.add('vertical');
    $('video-start').addEventListener('click', () => {
      const video = document.createElement('video');
      video.src = source;
      video.playsInline = true;
      video.preload = 'metadata';
      video.disablePictureInPicture = true;
      video.disableRemotePlayback = true;
      video.setAttribute('playsinline', '');
      $('video-shell').replaceChildren(video);
      $('watch').hidden = false;
      let lastTick = performance.now();
      function update() {
        const ratio = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(watchedUntil / video.duration, 1) : 0;
        const percent = Math.floor(ratio * 100);
        $('watch-fill').style.transform = `scaleX(${ratio})`;
        $('watch-track').setAttribute('aria-valuenow', String(percent));
        $('watch-label').textContent = `${percent}% assistido`;
        $('watch-time').textContent = `${format(watchedUntil)} / ${format(video.duration)}`;
        for (const threshold of [25, 50, 75]) if (percent >= threshold) event(`vsl_${threshold}`);
        if (ratio >= .8 && !unlocked) {
          unlocked = true; event('vsl_80'); $('briefing').hidden = false;
          $('unlock').textContent = 'Briefing liberado. Você já pode falar com a equipe.';
        }
      }
      video.addEventListener('loadedmetadata', update);
      video.addEventListener('playing', () => { lastTick = performance.now(); $('play').textContent = 'Pausar'; event('vsl_started'); });
      video.addEventListener('pause', () => { $('play').textContent = 'Reproduzir'; });
      video.addEventListener('ratechange', () => { if (video.playbackRate !== 1) video.playbackRate = 1; });
      video.addEventListener('seeking', () => { if (video.currentTime > watchedUntil + .1) video.currentTime = watchedUntil; });
      video.addEventListener('timeupdate', () => {
        if (video.seeking || !Number.isFinite(video.duration)) return;
        const now = performance.now(), elapsed = (now - lastTick) / 1000;
        if (video.currentTime > watchedUntil + Math.max(.5, elapsed * 1.5 + .25)) { video.currentTime = watchedUntil; lastTick = now; return; }
        if (!video.paused) watchedUntil = Math.max(watchedUntil, video.currentTime);
        lastTick = now; update();
      });
      video.addEventListener('ended', () => { watchedUntil = video.duration; update(); event('vsl_completed'); });
      video.addEventListener('error', () => { $('state').hidden = false; $('state').textContent = 'O vídeo não carregou. Atualize a página e tente novamente.'; });
      document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
      $('play').onclick = () => video.paused ? video.play().catch(() => {}) : video.pause();
      $('mute').onclick = () => { video.muted = !video.muted; $('mute').textContent = video.muted ? 'Ativar som' : 'Silenciar'; };
      video.addEventListener('click', () => video.paused ? video.play().catch(() => {}) : video.pause());
      video.play().catch(() => { $('play').textContent = 'Reproduzir'; });
    }, { once: true });
  }
  function whatsapp(afterPurchase = false) {
    const number = String(config.whatsapp || '').replace(/\D/g, '');
    if (!number) { $('offer-error').textContent = 'WhatsApp indisponível no momento.'; return; }
    const message = afterPurchase
      ? `Olá! Acabei de comprar a análise de perfil da LUME.\n\nInstagram: ${instagram}\n\nQuero enviar as informações para receber minha análise.`
      : `Olá! Finalizei o quiz e assisti ao briefing da LUME CREATORS.\n\nInstagram: ${instagram}\n\nQuero receber os próximos passos da campanha.`;
    event(afterPurchase ? 'analysis_whatsapp_clicked' : 'whatsapp_clicked');
    location.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
  function decline() { event('analysis_offer_declined'); $('offer').close(); whatsapp(); }
  $('briefing').addEventListener('click', () => {
    if (!unlocked) return;
    event('briefing_cta_clicked'); event('analysis_offer_view'); $('offer').showModal();
  });
  $('skip').addEventListener('click', decline);
  $('offer-close').addEventListener('click', decline);
  $('offer').addEventListener('cancel', e => { e.preventDefault(); decline(); });
  $('buy').addEventListener('click', async () => {
    if (buying) return;
    buying = true; $('buy').disabled = true; $('offer-error').textContent = '';
    event('analysis_offer_buy_clicked');
    event('analysis_checkout_started');
    location.assign(config.checkout_url);
  });
  api('/api/vsl/session').then(data => {
    config = data; instagram = data.instagram;
    $('stage-content').hidden = false; $('state').hidden = true;
    analytics(); event('vsl_page_view'); initVideo();
  }).catch(() => { $('state').textContent = 'Não foi possível carregar o briefing. Atualize a página.'; });
})();
