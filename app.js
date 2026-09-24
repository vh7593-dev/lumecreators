(() => {
  'use strict';

  const STORAGE = {
    config: 'lume_config_v1',
    leads: 'lume_leads_v3',
    utm: 'lume_utm_v1',
    analysisOfferSeen: 'lume_analysis_offer_seen_v1'
  };

  const ANALYSIS_CHECKOUT_URL = 'https://app.zuptos.com.br/checkout/91649c8ef6555a41';
  const analysisCheckoutURL = (() => {
    try {
      const url = new URL(ANALYSIS_CHECKOUT_URL);
      return url.protocol === 'https:' ? url.href : '';
    } catch (_) { return ''; }
  })();

  const campaignFeedbacks = Array.isArray(window.LUME_FEEDBACKS)
    ? window.LUME_FEEDBACKS.map(item => ({ ...item }))
    : [];

  const defaults = {
    campaign: {
      name: 'Campanha Creators — Setembro 2026', status: 'Seleção aberta', value: 'R$600',
      duration: '3 dias', goal: '30', minFollowers: '1.000', whatsapp: '5513920073887',
      instagram: 'https://instagram.com/lume.creators', active: true
    },
    content: {
      heroTitle: 'Divulgue uma plataforma de jogos.',
      heroHighlight: 'Ganhe R$600 em 3 dias.',
      heroText: 'Você não paga nada para participar. Basta responder ao quiz: a LUME analisa as respostas e seleciona os perfis mais alinhados à campanha.',
      heroCta: 'Responder o quiz',
      processTitle: 'Uma campanha. Um briefing claro. Um processo simples.',
      processText: 'A LUME conecta creators a campanhas digitais e acompanha todo o processo pelo WhatsApp.',
      benefitsTitle: 'Você sabe o que importa.',
      faqTitle: 'Dúvidas frequentes.',
      finalTitle: 'Quatro respostas. Depois, clareza.',
      finalText: 'Veja se o seu perfil pode avançar para o briefing da LUME CREATORS.',
      conditions: 'Para receber os R$600 desta campanha, o creator deverá cumprir integralmente o briefing, manter as divulgações pelo período determinado e gerar no mínimo 30 depositantes válidos durante os 3 dias.',
      legalText: 'A participação está sujeita à disponibilidade de campanhas e à aprovação do perfil. Para a campanha anunciada nesta página, o pagamento de R$600 está condicionado ao cumprimento integral do briefing, permanência das divulgações durante o período solicitado e obtenção de no mínimo 30 depositantes válidos dentro dos 3 dias da campanha. Resultados e disponibilidade podem variar de acordo com cada campanha.'
    },
    vsl: { url: '', type: 'mp4-upload', format: '9:16', thumbnail: '' },
    faq: [
      ['Quem pode participar?', 'Creators de diferentes tamanhos podem participar. Perfis com até 1.000 seguidores também são analisados; a seleção considera os perfis mais alinhados à campanha.'],
      ['Quanto tempo dura a campanha?', 'A campanha apresentada nesta página possui duração de 3 dias.'],
      ['Quanto é o pagamento?', 'O pagamento previsto é de R$600 para creators que cumprirem integralmente os critérios da campanha.'],
      ['Existe meta?', 'Sim. Para esta campanha, é necessário gerar no mínimo 30 depositantes válidos dentro dos 3 dias, além de cumprir as demais condições apresentadas no briefing.'],
      ['Como recebo o briefing?', 'Após concluir a seleção e assistir à apresentação da campanha, você pode falar diretamente com a equipe da LUME pelo WhatsApp.'],
      ['Preciso pagar para participar?', 'Não. A participação na seleção é gratuita: basta responder ao quiz. Não cobramos taxa, cadastro ou qualquer pagamento do creator.']
    ],
    legal: {
      contact: 'Fale com a equipe da LUME CREATORS pelo WhatsApp disponibilizado após a conclusão da análise ou pelo Instagram oficial @lume.creators.',
      privacy: 'Os dados informados no quiz são usados para analisar a compatibilidade inicial do perfil com a campanha, acompanhar a origem da candidatura e melhorar esta experiência. Não solicitamos nome, e-mail ou telefone antes do resultado. Os dados podem ser excluídos mediante solicitação à LUME CREATORS.',
      campaign: 'A participação depende da disponibilidade da campanha e da aprovação do perfil. O pagamento anunciado está condicionado ao cumprimento integral do briefing, à permanência das divulgações pelo período solicitado e à obtenção da meta mínima de depositantes válidos.',
      terms: 'Ao utilizar esta página, você declara que as informações fornecidas são verdadeiras e compreende que a pré-seleção não garante participação, contratação ou pagamento. As condições finais são apresentadas no briefing da campanha.'
    },
    feedbacks: campaignFeedbacks
  };

  const mergeConfig = (base, saved) => ({
    ...base, ...saved,
    campaign: { ...base.campaign, ...(saved?.campaign || {}) },
    content: { ...base.content, ...(saved?.content || {}) },
    vsl: { ...base.vsl, ...(saved?.vsl || {}) },
    legal: { ...base.legal, ...(saved?.legal || {}) },
    faq: Array.isArray(saved?.faq) && saved.faq.length ? saved.faq : base.faq,
    feedbacks: Array.isArray(saved?.feedbacks) && saved.feedbacks.some(item => item?.name || item?.text) ? saved.feedbacks : base.feedbacks
  });

  let config = defaults;
  if (window.LUME_BACKEND) {
    config = mergeConfig(defaults, window.LUME_SERVER_CONFIG || {});
  } else {
    try { config = mergeConfig(defaults, JSON.parse(localStorage.getItem(STORAGE.config) || 'null')); } catch (_) {}
  }
  if (!config.campaign.whatsapp) config.campaign.whatsapp = defaults.campaign.whatsapp;
  if (config.feedbacks.some(item => /^Creator exemplo/i.test(item?.name || '')) && campaignFeedbacks.length) {
    config.feedbacks = campaignFeedbacks.map(item => ({ ...item }));
  }
  if (config.content.heroTitle === 'Ganhe R$600' && config.content.heroHighlight === 'em 3 dias.') {
    config.content.heroTitle = defaults.content.heroTitle;
    config.content.heroHighlight = defaults.content.heroHighlight;
  }
  if (config.content.heroText === 'Divulgue uma campanha da LUME CREATORS com briefing claro e acompanhamento pelo WhatsApp.') {
    config.content.heroText = defaults.content.heroText;
  }
  if (config.content.heroText === 'Você publicará conteúdos no Instagram divulgando uma plataforma de jogos, seguindo o briefing da LUME e com acompanhamento pelo WhatsApp.') {
    config.content.heroText = defaults.content.heroText;
  }
  if (config.content.heroCta === 'Analisar meu perfil') config.content.heroCta = defaults.content.heroCta;
  config.faq = config.faq.map(item => {
    if (item[0] === 'Quem pode participar?' && item[1]?.includes('a partir de 1.000 seguidores')) return defaults.faq[0];
    if (item[0] === 'Preciso pagar para participar?' && item[1] === 'Não existe cobrança para realizar o processo de análise do perfil.') return defaults.faq[5];
    return item;
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  function track(event, parameters = {}) {
    const payload = { event, ...parameters };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.fbq === 'function') window.fbq('trackCustom', event, parameters);
    window.dispatchEvent(new CustomEvent('lume:analytics', { detail: payload }));
  }

  function initAnalytics() {
    const ga4Id = config.analytics?.ga4Id;
    if (ga4Id && /^G-[A-Z0-9]+$/i.test(ga4Id)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', ga4Id, { send_page_view: false });
    }
    const pixelId = config.analytics?.metaPixelId;
    if (pixelId && /^\d{8,20}$/.test(pixelId)) {
      const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
      const script = document.createElement('script'); script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(script);
      fbq('init', pixelId);
    }
  }

  function captureAttribution() {
    const names = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
    const params = new URLSearchParams(location.search);
    let previous = {};
    try { previous = JSON.parse(sessionStorage.getItem(STORAGE.utm) || '{}'); } catch (_) {}
    const current = { ...previous };
    names.forEach(name => { if (params.get(name)) current[name] = params.get(name); });
    sessionStorage.setItem(STORAGE.utm, JSON.stringify(current));
    return current;
  }

  const attribution = captureAttribution();

  function applyConfig() {
    $$('[data-content]').forEach(el => {
      const value = config.content[el.dataset.content];
      if (typeof value === 'string') el.textContent = value;
    });
    $$('[data-campaign]').forEach(el => {
      const value = config.campaign[el.dataset.campaign];
      if (typeof value === 'string') el.textContent = value;
    });
    $$('[data-instagram-link]').forEach(el => el.href = config.campaign.instagram || defaults.campaign.instagram);
    wrapHeroAmount();
    renderFAQ();
    renderFeedbacks();
    $('#analysis-offer').hidden = !analysisCheckoutURL;
    $('#vsl').classList.toggle('has-analysis-offer', Boolean(analysisCheckoutURL));
    if (!config.campaign.active) {
      $('#quiz').hidden = true;
      $$('.js-open-quiz').forEach(button => {
        button.disabled = true;
        button.textContent = 'Seleção encerrada';
        button.style.opacity = '.55';
      });
    }
  }

  function wrapHeroAmount() {
    const element = $('[data-content="heroHighlight"]');
    if (!element) return;
    const text = element.textContent;
    const match = text.match(/R\$\s?[\d.]+(?:,\d{2})?/);
    if (!match) return;
    const index = match.index;
    const amount = document.createElement('span');
    amount.className = 'hero-amount-inline';
    amount.textContent = match[0];
    element.replaceChildren(
      document.createTextNode(text.slice(0, index)),
      amount,
      document.createTextNode(text.slice(index + match[0].length))
    );
  }

  function renderFAQ() {
    const list = $('#faq-list');
    list.innerHTML = config.faq.map(([question, answer], index) => `
      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-${index}">
          <span>${escapeHTML(question)}</span><i aria-hidden="true"></i>
        </button>
        <div class="faq-answer" id="faq-answer-${index}"><p>${escapeHTML(answer)}</p></div>
      </div>`).join('');
    $$('.faq-question', list).forEach((button, index) => button.addEventListener('click', () => {
      const answer = button.nextElementSibling;
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      answer.style.maxHeight = open ? '0px' : `${answer.scrollHeight}px`;
      if (!open) track('faq_opened', { question: config.faq[index][0] });
      window.setTimeout(() => window.LumeMotion?.refresh?.(), 340);
    }));
  }

  function renderFeedbacks() {
    const active = config.feedbacks.filter(item => item.active && item.name && item.text);
    const section = $('#depoimentos');
    if (!active.length) { section.hidden = true; return; }
    section.hidden = false;
    $('#feedback-track').innerHTML = active.map(item => {
      const location = [item.city, item.state].filter(Boolean).map(escapeHTML).join(', ');
      const followers = escapeHTML(item.followers || '');
      const meta = followers || location
        ? `<p class="feedback-meta">${followers ? `<strong>${followers}</strong>` : ''}${location ? `<span>${location}</span>` : ''}</p>`
        : '';
      const reply = item.reply ? `<div class="agency-reply"><strong>LUME CREATORS</strong><p>${escapeHTML(item.reply)}</p></div>` : '';
      return `<article class="feedback-card${item.demo ? ' feedback-demo' : ''}"><div class="feedback-head"><div class="feedback-name"><strong>${escapeHTML(item.name)}</strong></div>${meta}</div><span class="feedback-badge">${item.demo ? 'Exemplo — substituir' : 'Creator LUME'}</span><blockquote>“${escapeHTML(item.text)}”</blockquote>${reply}</article>`;
    }).join('');
  }

  const questions = [
    { title: 'Quantos seguidores você tem no Instagram?', options: ['Até 1 mil', '1 mil a 5 mil', '5 mil a 10 mil', '10 mil a 50 mil', '50 mil a 100 mil', '100 mil+'] },
    { title: 'Com que frequência você aparece nos Stories?', options: ['Todos os dias', 'Algumas vezes por semana', 'Raramente'] },
    { title: 'Você já participou de alguma campanha digital?', options: ['Sim', 'Ainda não'] },
    { title: 'Qual é o seu Instagram?', input: true }
  ];
  let step = 0;
  let answers = {};
  let quizStarted = false;
  let videoContactReady = false;
  const VIDEO_UNLOCK_RATIO = .8;

  function ensureQuizStarted() {
    if (quizStarted) return;
    quizStarted = true;
    track('quiz_started');
  }

  function openQuiz() {
    if (!config.campaign.active) return;
    step = 0;
    answers = {};
    $('#quiz-modal').hidden = false;
    track('hero_cta_clicked', { location: this?.closest?.('section')?.className || 'header' });
    track('click_quiz');
    ensureQuizStarted();
    renderQuestion();
    $('#quiz').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function renderQuestion() {
    const question = questions[step];
    $('#quiz-counter').textContent = `${step + 1} de 4`;
    $('#quiz-progress').style.width = `${(step + 1) * 25}%`;
    const stage = $('#quiz-stage');
    if (question.input) {
      stage.innerHTML = `<div class="question-panel"><h2 id="quiz-question">${question.title}</h2><form class="instagram-form" id="instagram-form" novalidate><input id="instagram-input" name="instagram" type="text" inputmode="text" autocomplete="off" autocapitalize="none" placeholder="@usuario" aria-label="Seu usuário do Instagram"><span class="error" id="instagram-error" aria-live="polite"></span><button class="button" type="submit">Analisar perfil</button></form></div>`;
      const input = $('#instagram-input');
      input.focus({ preventScroll: true });
      $('#instagram-form').addEventListener('submit', submitInstagram);
    } else {
      stage.innerHTML = `<div class="question-panel"><h2 id="quiz-question">${question.title}</h2><div class="option-list">${question.options.map(option => `<button class="quiz-option" type="button" data-value="${escapeHTML(option)}">${escapeHTML(option)}</button>`).join('')}</div></div>`;
      $$('.quiz-option', stage).forEach(button => button.addEventListener('click', () => selectAnswer(button.dataset.value)));
      $('.quiz-option', stage)?.focus({ preventScroll: true });
    }
    track(`quiz_question_${step + 1}`, { question: step + 1 });
    window.LumeMotion?.animateQuestion?.($('.question-panel', stage));
  }

  function selectAnswer(value) {
    ensureQuizStarted();
    answers[`question_${step + 1}`] = value;
    step += 1;
    setTimeout(renderQuestion, 120);
  }

  async function submitInstagram(event) {
    event.preventDefault();
    const field = $('#instagram-input');
    let value = field.value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@/, '').trim();
    if (!/^[a-zA-Z0-9._]{2,30}$/.test(value)) {
      $('#instagram-error').textContent = 'Digite um usuário válido, como @seuusuario.';
      field.setAttribute('aria-invalid', 'true');
      field.focus();
      return;
    }
    answers.question_4 = `@${value}`;
    track('quiz_question_4', { completed: true });
    track('quiz_completed');
    const button = $('#instagram-form button');
    button.disabled = true;
    try {
      await saveLead();
    } catch (_) {
      $('#instagram-error').textContent = 'Não foi possível enviar sua análise. Tente novamente.';
      button.disabled = false;
      return;
    }
    beginAnalysis();
  }

  async function saveLead() {
    const lead = {
      id: `lume_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      answers: { ...answers }, instagram: answers.question_4,
      attribution, createdAt: new Date().toISOString(),
      campaign: { name: config.campaign.name, status: config.campaign.status, value: config.campaign.value, duration: config.campaign.duration, goal: config.campaign.goal },
      device: { userAgent: navigator.userAgent, language: navigator.language, viewport: `${innerWidth}x${innerHeight}`, touch: navigator.maxTouchPoints > 0 }
    };
    if (window.LUME_BACKEND) {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      if (!response.ok) throw new Error('Não foi possível salvar a análise.');
      return;
    }
    let leads = [];
    try { leads = JSON.parse(localStorage.getItem(STORAGE.leads) || '[]'); } catch (_) {}
    leads.push(lead);
    localStorage.setItem(STORAGE.leads, JSON.stringify(leads));
  }

  function beginAnalysis() {
    $('#quiz-modal').hidden = true;
    $('#analysis-screen').hidden = false;
    document.body.classList.add('locked');
    track('profile_analysis_started');
    const message = $('#analysis-message');
    const states = ['Verificando perfil', 'Conferindo critérios', 'Buscando campanha disponível'];
    states.forEach((text, index) => setTimeout(() => {
      message.style.opacity = '0';
      setTimeout(() => { message.textContent = text; message.style.opacity = '1'; }, 130);
    }, index * 650));
    setTimeout(showResult, 2100);
  }

  function showResult() {
    $('#analysis-screen').hidden = true;
    document.body.classList.remove('locked');
    $('#resultado').hidden = false;
    track('profile_preselected', { instagram: answers.question_4 });
    window.LumeMotion?.initResult?.();
    requestAnimationFrame(() => {
      $('#resultado').scrollIntoView({ behavior: 'auto' });
      window.LumeMotion?.refresh?.();
    });
    observeVSL();
  }

  function observeVSL() {
    const section = $('#vsl');
    if (!('IntersectionObserver' in window)) { track('vsl_view'); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { track('vsl_view'); observer.disconnect(); }
    }, { rootMargin: '250px' });
    observer.observe(section);
  }

  function youtubeId(url) {
    const match = String(url).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    return match?.[1] || '';
  }

  function vimeoId(url) { return String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] || ''; }

  function driveId(url) { return String(url).match(/^https:\/\/drive\.google\.com\/file\/d\/([\w-]+)/)?.[1] || ''; }

  function openVideoDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('lume_creator_db', 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('media')) request.result.createObjectStore('media'); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getUploadedVideo() {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction('media').objectStore('media').get('campaignVideo');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function createNativeVideo(source) {
    const video = document.createElement('video');
    video.src = source;
    video.playsInline = true;
    video.preload = 'metadata';
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', 'Vídeo do briefing da campanha');
    return video;
  }

  async function loadVSL() {
    const frame = $('#video-frame');
    const loadButton = $('#load-video');
    loadButton.disabled = true;
    frame.classList.toggle('vertical', config.vsl.format === '9:16');
    let element;
    if (config.vsl.type === 'drive' && driveId(config.vsl.url)) {
      element = document.createElement('iframe');
      element.src = `https://drive.google.com/file/d/${driveId(config.vsl.url)}/preview`;
      element.title = 'Vídeo da campanha LUME CREATORS';
      element.allow = 'autoplay; fullscreen';
      element.allowFullscreen = true;
    } else if (config.vsl.type === 'youtube' && youtubeId(config.vsl.url)) {
      element = document.createElement('iframe');
      element.src = `https://www.youtube-nocookie.com/embed/${youtubeId(config.vsl.url)}?autoplay=1&rel=0&modestbranding=1`;
      element.title = 'Vídeo da campanha LUME CREATORS';
      element.allow = 'autoplay; encrypted-media; picture-in-picture';
      element.allowFullscreen = true;
    } else if (config.vsl.type === 'vimeo' && vimeoId(config.vsl.url)) {
      element = document.createElement('iframe');
      element.src = `https://player.vimeo.com/video/${vimeoId(config.vsl.url)}?autoplay=1&title=0&byline=0`;
      element.title = 'Vídeo da campanha LUME CREATORS';
      element.allow = 'autoplay; fullscreen; picture-in-picture';
      element.allowFullscreen = true;
    } else if (config.vsl.type === 'mp4' && config.vsl.url) {
      element = createNativeVideo(config.vsl.url);
    } else if (config.vsl.type === 'mp4-upload') {
      if (window.LUME_BACKEND) {
        element = createNativeVideo('/media/campaign.mp4');
      } else {
        try {
          const blob = await getUploadedVideo();
          if (blob) element = createNativeVideo(URL.createObjectURL(blob));
        } catch (_) {}
      }
    }
    if (!element) { loadButton.disabled = false; showToast('Cadastre a VSL no painel administrativo.'); return; }
    frame.replaceChildren(element);
    if (element.tagName === 'VIDEO') {
      $('#video-watch').hidden = false;
      wireVideoPlayer(element);
      element.play().catch(() => {
        $('#video-play-pause').textContent = 'Reproduzir';
        showToast('Toque no vídeo ou em Reproduzir para começar.');
      });
    } else {
      $('.video-watch-note').textContent = 'Este formato de vídeo não permite verificar o tempo assistido. Para liberar o contato, a LUME precisa cadastrar um arquivo MP4 no painel.';
      $('#video-watch').hidden = true;
      track('vsl_opened', { provider: config.vsl.type });
    }
    if (config.vsl.type === 'drive') {
      const fallback = document.createElement('a');
      fallback.className = 'video-external';
      fallback.href = `https://drive.google.com/file/d/${driveId(config.vsl.url)}/view`;
      fallback.target = '_blank';
      fallback.rel = 'noopener noreferrer';
      fallback.textContent = 'Se o vídeo não carregar, abrir no Drive';
      frame.after(fallback);
    }
    window.LumeMotion?.refresh?.();
  }

  function formatVideoTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const whole = Math.floor(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  }

  function wireVideoPlayer(video) {
    const sent = new Set();
    const progress = $('#video-watch-track');
    const label = $('#video-watch-label');
    const timeLabel = $('#video-watch-time');
    const playPause = $('#video-play-pause');
    const mute = $('#video-mute');
    let watchedUntil = 0;
    let lastTick = performance.now();

    function updateProgress() {
      const duration = video.duration;
      const ratio = Number.isFinite(duration) && duration > 0 ? Math.min(watchedUntil / duration, 1) : 0;
      const percent = Math.floor(ratio * 100);
      $('#video-watch-fill').style.transform = `scaleX(${ratio})`;
      progress.setAttribute('aria-valuenow', String(percent));
      progress.setAttribute('aria-valuetext', `${percent}% assistido`);
      label.textContent = `${percent}% assistido${videoContactReady ? ' · contato liberado' : ''}`;
      timeLabel.textContent = `${formatVideoTime(watchedUntil)} / ${formatVideoTime(duration)}`;
      [25, 50, 75].forEach(mark => {
        if (percent >= mark && !sent.has(mark)) { sent.add(mark); track(`vsl_${mark}`); }
      });
      if (ratio >= VIDEO_UNLOCK_RATIO && !videoContactReady) {
        videoContactReady = true;
        $('#video-contact').hidden = false;
        $('#video-watch-announcement').textContent = 'Contato liberado. Você já pode receber o briefing.';
        label.textContent = `${percent}% assistido · contato liberado`;
        track('vsl_80');
        window.LumeMotion?.refresh?.();
      }
    }

    video.addEventListener('loadedmetadata', updateProgress);
    video.addEventListener('playing', () => {
      lastTick = performance.now();
      playPause.textContent = 'Pausar';
      if (!sent.has('start')) { sent.add('start'); track('vsl_started', { provider: 'mp4' }); }
    });
    video.addEventListener('pause', () => { playPause.textContent = 'Reproduzir'; });
    video.addEventListener('ratechange', () => { if (video.playbackRate !== 1) video.playbackRate = 1; });
    video.addEventListener('seeking', () => {
      if (video.currentTime > watchedUntil + .1) {
        video.currentTime = watchedUntil;
        showToast('Não é possível avançar. Assista ao vídeo para liberar o contato.');
      }
    });
    video.addEventListener('timeupdate', () => {
      if (video.seeking || !Number.isFinite(video.duration)) return;
      const now = performance.now();
      const elapsed = (now - lastTick) / 1000;
      if (video.currentTime > watchedUntil + Math.max(.5, elapsed * 1.5 + .25)) {
        video.currentTime = watchedUntil;
        lastTick = now;
        return;
      }
      if (!video.paused) watchedUntil = Math.max(watchedUntil, video.currentTime);
      lastTick = now;
      updateProgress();
    });
    video.addEventListener('ended', () => {
      watchedUntil = video.duration;
      updateProgress();
      playPause.textContent = 'Reproduzir';
      track('vsl_completed');
    });
    video.addEventListener('error', () => showToast('O vídeo não carregou. Recarregue a página e tente novamente.'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
    playPause.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => showToast('Não foi possível reproduzir o vídeo.'));
      else video.pause();
    });
    mute.addEventListener('click', () => {
      video.muted = !video.muted;
      mute.textContent = video.muted ? 'Ativar som' : 'Silenciar';
    });
    video.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => showToast('Não foi possível reproduzir o vídeo.'));
      else video.pause();
    });
    updateProgress();
  }

  let analysisOfferSeenInMemory = false;

  function hasSeenAnalysisOffer() {
    try { return analysisOfferSeenInMemory || sessionStorage.getItem(STORAGE.analysisOfferSeen) === 'true'; }
    catch (_) { return analysisOfferSeenInMemory; }
  }

  function markAnalysisOfferSeen() {
    analysisOfferSeenInMemory = true;
    try { sessionStorage.setItem(STORAGE.analysisOfferSeen, 'true'); } catch (_) {}
  }

  function openAnalysisCheckout(placement) {
    if (!analysisCheckoutURL) return;
    track('analysis_offer_click', { placement });
    window.location.assign(analysisCheckoutURL);
  }

  function continueToWhatsApp(afterOffer = false) {
    const number = String(config.campaign.whatsapp || '').replace(/\D/g, '');
    if (!number) { showToast('O WhatsApp ainda não foi configurado.'); return; }
    const message = `Olá! Finalizei o quiz da LUME CREATORS e assisti ao vídeo da campanha. Quero receber o briefing e entender os próximos passos.\n\nInstagram: ${answers.question_4 || '@usuario'}`;
    if (afterOffer) track('whatsapp_continue_after_offer');
    track('whatsapp_clicked', { instagram: answers.question_4 || '' });
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  function openWhatsApp() {
    if (!videoContactReady) { showToast('Assista a pelo menos 80% do vídeo para liberar o contato.'); return; }
    if (!String(config.campaign.whatsapp || '').replace(/\D/g, '')) { showToast('O WhatsApp ainda não foi configurado.'); return; }
    track('whatsapp_intent');
    if (analysisCheckoutURL && !hasSeenAnalysisOffer()) {
      markAnalysisOfferSeen();
      track('analysis_offer_view', { placement: 'modal' });
      $('#analysis-modal').showModal();
      document.body.classList.add('analysis-dialog-open');
      $('#analysis-modal-close').focus();
      return;
    }
    continueToWhatsApp(hasSeenAnalysisOffer());
  }

  function declineAnalysisOffer(reason) {
    track('analysis_offer_decline', { reason });
    $('#analysis-modal').close();
    continueToWhatsApp(true);
  }

  const legalTitles = { contact: 'Contato', privacy: 'Política de Privacidade', campaign: 'Termos da Campanha', terms: 'Termos de Uso' };
  function openLegal(type) {
    $('#legal-content').innerHTML = `<h2>${legalTitles[type]}</h2><p>${escapeHTML(config.legal[type] || '')}</p>`;
    $('#legal-modal').showModal();
  }

  let toastTimer;
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function bindEvents() {
    $$('.js-open-quiz').forEach(button => button.addEventListener('click', openQuiz));
    $('#load-video').addEventListener('click', loadVSL);
    $('#video-contact').addEventListener('click', openWhatsApp);
    $('#analysis-offer-buy').addEventListener('click', () => {
      track('analysis_offer_section_click');
      openAnalysisCheckout('section');
    });
    $('#analysis-modal-buy').addEventListener('click', () => openAnalysisCheckout('modal'));
    $('#analysis-modal-skip').addEventListener('click', () => declineAnalysisOffer('skip'));
    $('#analysis-modal-close').addEventListener('click', () => declineAnalysisOffer('close'));
    $('#analysis-modal').addEventListener('close', () => document.body.classList.remove('analysis-dialog-open'));
    $('#analysis-modal').addEventListener('cancel', () => track('analysis_offer_decline', { reason: 'escape' }));
    $('#analysis-modal').addEventListener('click', event => {
      if (event.target !== $('#analysis-modal')) return;
      track('analysis_offer_decline', { reason: 'backdrop' });
      $('#analysis-modal').close();
    });
    $$('[data-instagram-link]').forEach(link => link.addEventListener('click', () => track('instagram_clicked', { location: link.closest('section,footer')?.className || 'header' })));
    $$('[data-legal]').forEach(button => button.addEventListener('click', () => openLegal(button.dataset.legal)));
    $('#close-legal').addEventListener('click', () => $('#legal-modal').close());
    $('#legal-modal').addEventListener('click', event => { if (event.target === $('#legal-modal')) $('#legal-modal').close(); });
  }

  applyConfig();
  renderQuestion();
  bindEvents();
  initAnalytics();
  track('page_view', { campaign: config.campaign.name, ...attribution });
})();
