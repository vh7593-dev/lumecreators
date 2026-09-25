(() => {
  'use strict';
  if (!window.LUME_BACKEND) {
    document.body.innerHTML = '<main style="max-width:640px;margin:12vh auto;padding:32px;font:16px/1.5 Arial,sans-serif"><h1>Painel indisponível nesta versão.</h1><p>Abra a LUME pelo servidor com autenticação. O servidor estático não protege o painel nem salva dados para toda a equipe.</p></main>';
    return;
  }
  const CONFIG_KEY = 'lume_config_v1';
  const LEADS_KEY = 'lume_leads_v3';
  const defaultFAQ = [
    ['Quem pode participar?', 'Creators de diferentes tamanhos podem participar. Perfis com até 1.000 seguidores também são analisados; a seleção considera os perfis mais alinhados à campanha.'],
    ['Quanto tempo dura a campanha?', 'A campanha apresentada nesta página possui duração de 3 dias.'],
    ['Quanto é o pagamento?', 'O pagamento previsto é de R$600 para creators que cumprirem integralmente os critérios da campanha.'],
    ['Existe meta?', 'Sim. Para esta campanha, é necessário gerar no mínimo 30 depositantes válidos dentro dos 3 dias, além de cumprir as demais condições apresentadas no briefing.'],
    ['Como recebo o briefing?', 'Após concluir a seleção e assistir à apresentação da campanha, você pode falar diretamente com a equipe da LUME pelo WhatsApp.'],
    ['Preciso pagar para participar?', 'Não. A participação na seleção é gratuita: basta responder ao quiz. Não cobramos taxa, cadastro ou qualquer pagamento do creator.']
  ];
  const campaignFeedbacks = Array.isArray(window.LUME_FEEDBACKS)
    ? window.LUME_FEEDBACKS.map(item => ({ ...item }))
    : [];
  const defaults = {
    campaign: { name: 'Campanha Creators — Setembro 2026', status: 'Seleção aberta', value: 'R$600', duration: '3 dias', goal: '30', minFollowers: '1.000', whatsapp: '5513920073887', instagram: 'https://instagram.com/lume.creators', active: true },
    content: {
      heroTitle: 'Divulgue uma plataforma de jogos.', heroHighlight: 'Ganhe R$600 em 3 dias.',
      heroText: 'Você não paga nada para participar. Basta responder ao quiz: a LUME analisa as respostas e seleciona os perfis mais alinhados à campanha.', heroCta: 'Responder o quiz',
      processTitle: 'Uma campanha. Um briefing claro. Um processo simples.', processText: 'A LUME conecta creators a campanhas digitais e acompanha todo o processo pelo WhatsApp.',
      benefitsTitle: 'Você sabe o que importa.', faqTitle: 'Dúvidas frequentes.', finalTitle: 'Quatro respostas. Depois, clareza.',
      finalText: 'Veja se o seu perfil pode avançar para o briefing da LUME CREATORS.',
      conditions: 'Para receber os R$600 desta campanha, o creator deverá cumprir integralmente o briefing, manter as divulgações pelo período determinado e gerar no mínimo 30 depositantes válidos durante os 3 dias.',
      legalText: 'A participação está sujeita à disponibilidade de campanhas e à aprovação do perfil. Para a campanha anunciada nesta página, o pagamento de R$600 está condicionado ao cumprimento integral do briefing, permanência das divulgações durante o período solicitado e obtenção de no mínimo 30 depositantes válidos dentro dos 3 dias da campanha. Resultados e disponibilidade podem variar de acordo com cada campanha.'
    },
    vsl: { url: '', type: 'mp4-upload', format: '9:16', thumbnail: '' },
    analytics: { ga4Id: '', metaPixelId: '967499879728317' }, faq: defaultFAQ,
    legal: {
      contact: 'Fale com a equipe da LUME CREATORS pelo WhatsApp disponibilizado após a conclusão da análise ou pelo Instagram oficial @lume.creators.',
      privacy: 'Os dados informados no quiz são usados para analisar a compatibilidade inicial do perfil com a campanha, acompanhar a origem da candidatura e melhorar esta experiência. Não solicitamos nome, e-mail ou telefone antes do resultado. Os dados podem ser excluídos mediante solicitação à LUME CREATORS.',
      campaign: 'A participação depende da disponibilidade da campanha e da aprovação do perfil. O pagamento anunciado está condicionado ao cumprimento integral do briefing, à permanência das divulgações pelo período solicitado e à obtenção da meta mínima de depositantes válidos.',
      terms: 'Ao utilizar esta página, você declara que as informações fornecidas são verdadeiras e compreende que a pré-seleção não garante participação, contratação ou pagamento. As condições finais são apresentadas no briefing da campanha.'
    },
    feedbacks: campaignFeedbacks
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  let localSaved = {};
  try { localSaved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch (_) {}
  const serverSaved = window.LUME_ADMIN_CONFIG || {};
  const migrateLocalConfig = Boolean(window.LUME_BACKEND && !Object.keys(serverSaved).length && Object.keys(localSaved).length);
  const saved = window.LUME_BACKEND ? (migrateLocalConfig ? localSaved : serverSaved) : localSaved;
  let config = {
    ...defaults, ...saved,
    campaign: { ...defaults.campaign, ...(saved.campaign || {}) }, content: { ...defaults.content, ...(saved.content || {}) },
    vsl: { ...defaults.vsl, ...(saved.vsl || {}) }, analytics: { ...defaults.analytics, ...(saved.analytics || {}) },
    legal: { ...defaults.legal, ...(saved.legal || {}) }, faq: saved.faq?.length ? saved.faq : defaults.faq,
    feedbacks: Array.isArray(saved.feedbacks) && saved.feedbacks.some(item => item?.name || item?.text) ? saved.feedbacks : defaults.feedbacks
  };
  if (!config.analytics.metaPixelId) config.analytics.metaPixelId = defaults.analytics.metaPixelId;
  if (window.LUME_EXTERNAL_VIDEO_ONLY && !window.LUME_EXTERNAL_VIDEO_CONFIGURED && config.vsl.type === 'mp4-upload') {
    config.vsl.type = 'mp4';
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
  let pendingVideoFile = null;
  let dirty = false;
  let creators = [];
  let editingCreatorId = null;
  let selectedStatus = '';
  let rankingExpanded = false;
  let ranking = [];

  async function api(path, options = {}) {
    const headers = { ...options.headers };
    if (options.body && !(options.body instanceof Blob)) headers['Content-Type'] = 'application/json';
    if (options.method && options.method !== 'GET') headers['X-CSRF-Token'] = window.LUME_CSRF || '';
    const response = await fetch(path, { credentials: 'same-origin', ...options, headers });
    if (response.status === 401) { location.replace('/admin/login/'); throw new Error('Sua sessão terminou.'); }
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.detail || 'Não foi possível concluir a ação.');
    }
    return response.headers.get('content-type')?.includes('application/json') ? response.json() : response;
  }

  function fillInputs() {
    Object.entries(config.campaign).forEach(([key, value]) => {
      const input = $(`#campaign-${key}`);
      if (!input) return;
      if (input.type === 'checkbox') input.checked = Boolean(value); else input.value = value ?? '';
    });
    $('#campaign-whatsapp').value = config.campaign.whatsapp || defaults.campaign.whatsapp;
    Object.entries(config.content).forEach(([key, value]) => { const input = $(`#content-${key}`); if (input) input.value = value ?? ''; });
    Object.entries(config.vsl).forEach(([key, value]) => { const input = $(`#vsl-${key}`); if (input) input.value = value ?? ''; });
    Object.entries(config.analytics).forEach(([key, value]) => { const input = $(`#analytics-${key}`); if (input) input.value = value ?? ''; });
    Object.entries(config.legal).forEach(([key, value]) => { const input = $(`#legal-${key}`); if (input) input.value = value ?? ''; });
    renderFAQ(); renderFeedbacks(); checkVideo(); loadCreators();
  }

  function markDirty() { dirty = true; $('#save-bar').classList.add('visible'); }
  function renderFAQ() {
    const root = $('#faq-editor'); root.innerHTML = '';
    config.faq.forEach((item, index) => {
      const row = document.createElement('div'); row.className = 'faq-edit'; row.dataset.index = index;
      row.innerHTML = `<label>Pergunta<input class="faq-q" type="text" value="${escapeHTML(item[0])}"></label><label>Resposta<textarea class="faq-a" rows="3">${escapeHTML(item[1])}</textarea></label><button class="icon-danger remove-faq" type="button" aria-label="Remover pergunta">×</button>`;
      root.appendChild(row);
    });
  }

  function renderFeedbacks() {
    const root = $('#feedback-editor'); root.innerHTML = '';
    config.feedbacks.forEach((item, index) => {
      const card = document.createElement('article'); card.className = `feedback-edit${item.active ? '' : ' disabled'}`; card.dataset.index = index;
      card.innerHTML = `
        <div class="feedback-top"><strong>Slot ${index + 1}${item.demo ? ' • Exemplo' : ''}</strong><label class="switch"><input class="feedback-active" type="checkbox" ${item.active ? 'checked' : ''}><span></span> Ativo</label></div>
        <div class="feedback-fields">
          <label>Nome<input class="feedback-name" type="text" value="${escapeHTML(item.name)}"></label>
          <label>Seguidores<input class="feedback-followers" type="text" value="${escapeHTML(item.followers || '')}" placeholder="Ex.: 31,8 mil seguidores"></label>
          <label>Cidade<input class="feedback-city" type="text" value="${escapeHTML(item.city)}"></label>
          <label>Estado<input class="feedback-state" type="text" value="${escapeHTML(item.state)}" maxlength="2"></label>
          <label class="full">Feedback<textarea class="feedback-text" rows="4">${escapeHTML(item.text)}</textarea></label>
          <label class="full">Resposta da LUME<textarea class="feedback-reply" rows="3" placeholder="Resposta curta da agência ao creator">${escapeHTML(item.reply || '')}</textarea></label>
        </div>`;
      root.appendChild(card);
    });
  }

  function collectFAQ() {
    return $$('.faq-edit').map(row => [$('.faq-q', row).value.trim(), $('.faq-a', row).value.trim()]).filter(item => item[0] || item[1]);
  }

  function collectFeedbacks() {
    return $$('.feedback-edit').map((card, index) => {
      const name = $('.feedback-name', card).value.trim();
      return {
        id: config.feedbacks[index]?.id || Date.now() + index,
        active: $('.feedback-active', card).checked,
        demo: /^Creator exemplo/i.test(name),
        name,
        followers: $('.feedback-followers', card).value.trim(),
        city: $('.feedback-city', card).value.trim(),
        state: $('.feedback-state', card).value.trim().toUpperCase(), text: $('.feedback-text', card).value.trim(),
        reply: $('.feedback-reply', card).value.trim()
      };
    });
  }

  function collectConfig() {
    const campaign = {}; $$('#campaign input').forEach(input => { const key = input.id.replace('campaign-', ''); campaign[key] = input.type === 'checkbox' ? input.checked : input.value.trim(); });
    const content = {}; $$('#content input, #content textarea').forEach(input => content[input.id.replace('content-', '')] = input.value.trim());
    const vsl = {}; $$('#vsl input:not([type=file]), #vsl select').forEach(input => vsl[input.id.replace('vsl-', '')] = input.value.trim());
    const analytics = {}; $$('#analytics input').forEach(input => analytics[input.id.replace('analytics-', '')] = input.value.trim());
    const legal = {}; $$('#faq textarea[id^=legal-]').forEach(input => legal[input.id.replace('legal-', '')] = input.value.trim());
    return { ...config, campaign, content, vsl, analytics, legal, faq: collectFAQ(), feedbacks: collectFeedbacks() };
  }

  function validate(next) {
    if (!next.campaign.name) return 'Informe o nome da campanha.';
    if (next.campaign.whatsapp && next.campaign.whatsapp.replace(/\D/g, '').length < 10) return 'Confira o WhatsApp com DDI e DDD.';
    if (!pendingVideoFile && !['mp4', 'mp4-upload'].includes(next.vsl.type)) return 'Para liberar o contato aos 80%, selecione um vídeo MP4.';
    if (window.LUME_EXTERNAL_VIDEO_ONLY && next.vsl.type === 'mp4-upload' && !window.LUME_EXTERNAL_VIDEO_CONFIGURED) return 'Na Vercel, informe uma URL direta de MP4.';
    if (window.LUME_EXTERNAL_VIDEO_ONLY && next.vsl.type === 'mp4' && next.vsl.url && !/^https:\/\/[^\s]+$/i.test(next.vsl.url)) return 'Use uma URL HTTPS direta para o MP4.';
    if (next.analytics.ga4Id && !/^G-[A-Z0-9]+$/i.test(next.analytics.ga4Id)) return 'O ID do GA4 deve começar com G-.';
    if (next.analytics.metaPixelId && !/^\d{8,20}$/.test(next.analytics.metaPixelId)) return 'Confira o ID numérico do Meta Pixel.';
    return '';
  }

  async function saveAll() {
    const next = collectConfig();
    const error = validate(next); if (error) { toast(error); return; }
    if (pendingVideoFile) {
      try {
        if (window.LUME_BACKEND) {
          await api('/api/admin/video', { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body: pendingVideoFile });
        } else {
          await storeVideo(pendingVideoFile);
        }
        next.vsl.type = 'mp4-upload'; $('#vsl-type').value = 'mp4-upload'; pendingVideoFile = null;
      }
      catch (_) { toast('Não foi possível salvar o MP4 neste navegador.'); return; }
    }
    try {
      if (window.LUME_BACKEND) {
        await api('/api/admin/config', { method: 'PUT', body: JSON.stringify(next) });
      } else {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
      }
    } catch (cause) { toast(cause.message); return; }
    config = next;
    dirty = false; $('#save-bar').classList.remove('visible'); toast('Alterações salvas.'); checkVideo();
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('lume_creator_db', 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('media')) request.result.createObjectStore('media'); };
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
  }
  async function storeVideo(file) { const db = await openDB(); return new Promise((resolve, reject) => { const request = db.transaction('media', 'readwrite').objectStore('media').put(file, 'campaignVideo'); request.onsuccess = resolve; request.onerror = () => reject(request.error); }); }
  async function checkVideo() {
    if (window.LUME_BACKEND) {
      try {
        const status = await api('/api/admin/video/status');
        if (status.external_only) {
          $('.upload-field').hidden = true;
          const uploadOption = $('#vsl-type option[value="mp4-upload"]');
          uploadOption.textContent = 'MP4 externo configurado no servidor';
          uploadOption.disabled = !status.external_url;
          $('.vsl-requirement').textContent = 'Na Vercel, hospede o MP4 fora do servidor e cole uma URL direta HTTPS abaixo. O arquivo não pode ser salvo no disco da função.';
          $('#video-file-status').textContent = status.external_url ? 'MP4 externo configurado.' : config.vsl.type === 'mp4' && config.vsl.url ? 'URL direta de MP4 cadastrada.' : 'Configure uma URL direta de MP4 antes de divulgar.';
        } else {
          $('#video-file-status').textContent = status.uploaded ? `Arquivo salvo (${formatBytes(status.size)})` : 'Nenhum arquivo salvo.';
        }
      } catch (_) { $('#video-file-status').textContent = 'Não foi possível verificar o vídeo.'; }
      return;
    }
    try { const db = await openDB(); const request = db.transaction('media').objectStore('media').get('campaignVideo'); request.onsuccess = () => { $('#video-file-status').textContent = request.result ? `Arquivo salvo: ${request.result.name || 'campanha.mp4'} (${formatBytes(request.result.size)})` : 'Nenhum arquivo salvo.'; }; } catch (_) {}
  }
  const formatBytes = bytes => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

  const statusNames = {
    novo: 'Novo', contatado: 'Contatado', fechado: 'Fechado', divulgando: 'Divulgando',
    concluido: 'Concluído', nao_divulgou: 'Não divulgou', recusado: 'Recusado'
  };
  const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(cents) || 0) / 100);
  const toCents = value => Math.round(Number(value || 0) * 100);

  async function loadCreators() {
    loadResetSummary();
    try {
      const [data, dashboard, analytics, ranked] = await Promise.all([
        api('/api/admin/creators'), api(`/api/admin/dashboard?period=${$('#dashboard-period').value}`),
        api(`/api/admin/analytics?period=${$('#dashboard-period').value}`),
        api(`/api/admin/ranking?order=${$('#ranking-order').value}`)
      ]);
      creators = data.creators;
      ranking = ranked.creators;
      renderCreators(); renderDashboard(dashboard); renderFunnel(analytics); renderRanking(); renderRecent();
      if (window.LUME_BACKEND) {
        let localLeads = [];
        try { localLeads = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]'); } catch (_) {}
        $('#import-local-leads').hidden = !localLeads.length;
      }
    } catch (cause) {
      toast(cause.message || 'Não foi possível carregar o painel.');
      $('#funnel-chart').innerHTML = '<p class="empty-insight">Não foi possível carregar o funil. Recarregue a página.</p>';
      $('#ranking-list').innerHTML = '<p class="empty-insight">Não foi possível carregar o ranking.</p>';
      $('#creator-rows').innerHTML = '<tr class="empty-row"><td colspan="9">Não foi possível carregar os creators. Recarregue a página.</td></tr>';
    }
  }

  function renderDashboard(data) {
    $('#metric-total').textContent = String(data.total || 0);
    $('#metric-today').textContent = String(data.new_today || 0);
    $('#metric-depositors').textContent = String(data.depositors || 0);
    $('#metric-contact').textContent = String(data.need_contact || 0);
    $('#metric-closed').textContent = String(data.closed || 0);
    $('#metric-running').textContent = String(data.running || 0);
    $('#metric-completed').textContent = String(data.completed || 0);
    $('#metric-revenue').textContent = money(data.revenue_cents);
    $('#metric-payout').textContent = money(data.payout_cents);
    $('#metric-balance').textContent = money(data.balance_cents);
    $('#dashboard-date').textContent = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  }

  let resetKind = '', resetBusy = false;
  const resetPhrases = { funnel: 'ZERAR FUNIL', creators: 'APAGAR CREATORS' };
  async function loadResetSummary() {
    try {
      const data = await api('/api/admin/reset-summary');
      for (const kind of ['funnel', 'creators']) {
        const count = kind === 'funnel' ? data.events : data.creators;
        const last = data.last_resets[`reset_${kind}_at`];
        $(`#reset-${kind}-summary`).textContent = `${Number(count).toLocaleString('pt-BR')} ${kind === 'funnel' ? 'eventos registrados' : 'creators cadastrados'}.${last ? ` Última limpeza: ${new Date(last).toLocaleString('pt-BR')}.` : ''}`;
      }
      return data;
    } catch (_) {
      $('#reset-funnel-summary').textContent = 'Contagem indisponível. Atualize o painel.';
      $('#reset-creators-summary').textContent = 'Contagem indisponível. Atualize o painel.';
      return null;
    }
  }
  $$('[data-reset-kind]').forEach(button => button.addEventListener('click', async () => {
    if (resetBusy) return;
    resetBusy = true;
    const data = await loadResetSummary();
    resetBusy = false;
    if (!data) { toast('Não foi possível conferir os dados. Tente novamente.'); return; }
    resetKind = button.dataset.resetKind;
    $('#reset-title').textContent = resetKind === 'funnel' ? 'Zerar dados do funil?' : 'Apagar todos os creators?';
    $('#reset-description').textContent = resetKind === 'funnel'
      ? `Existem ${data.events} eventos. Todas as métricas serão zeradas no momento da confirmação. Os creators serão mantidos.`
      : `Existem ${data.creators} creators. Todos os cadastros, notas e valores serão apagados no momento da confirmação. Os totais do funil serão mantidos. Exporte o CSV antes se precisar guardar os contatos.`;
    $('#reset-phrase').textContent = resetPhrases[resetKind];
    $('#reset-confirmation').value = '';
    $('#reset-error').textContent = '';
    $('#reset-submit').disabled = true;
    $('#reset-dialog').showModal();
    $('#reset-confirmation').focus();
  }));
  $('#reset-confirmation').addEventListener('input', () => {
    $('#reset-submit').disabled = resetBusy || $('#reset-confirmation').value !== resetPhrases[resetKind];
  });
  $('#reset-cancel').addEventListener('click', () => { if (!resetBusy) $('#reset-dialog').close(); });
  $('#reset-dialog').addEventListener('cancel', event => { if (resetBusy) event.preventDefault(); });
  $('#reset-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (resetBusy || $('#reset-confirmation').value !== resetPhrases[resetKind]) return;
    resetBusy = true;
    $('#reset-submit').disabled = true; $('#reset-cancel').disabled = true;
    try {
      const result = await api('/api/admin/reset', { method: 'POST', body: JSON.stringify({ kind: resetKind, confirmation: $('#reset-confirmation').value }) });
      $('#reset-dialog').close();
      await loadCreators();
      toast(result.kind === 'funnel' ? 'Funil zerado. Nova contagem iniciada.' : `${result.removed} creators apagados.`);
    } catch (cause) { $('#reset-error').textContent = cause.message; }
    finally { resetBusy = false; $('#reset-cancel').disabled = false; $('#reset-submit').disabled = $('#reset-confirmation').value !== resetPhrases[resetKind]; }
  });

  const funnelStages = [
    ['page_view', 'Visitou a página'], ['quiz_started', 'Iniciou o quiz'],
    ['quiz_completed', 'Concluiu o quiz'], ['profile_preselected', 'Chegou ao resultado'],
    ['vsl_started', 'Iniciou a VSL'], ['vsl_25', 'Assistiu 25%'],
    ['vsl_50', 'Assistiu 50%'], ['vsl_75', 'Assistiu 75%'],
    ['vsl_80', 'Assistiu 80%'], ['briefing_unlocked', 'Liberou contato'],
    ['whatsapp_intent', 'Clicou para receber briefing']
  ];
  function renderFunnel(data) {
    const counts = data.counts || {};
    const root = $('#funnel-chart');
    if (!counts.page_view) {
      root.innerHTML = '<div class="empty-insight"><strong>O funil começa aqui</strong><p>As primeiras visitas aparecerão assim que a versão atualizada entrar no ar.</p></div>';
    } else {
      const max = counts.page_view || 1;
      root.innerHTML = funnelStages.map(([key, label], index) => {
        const value = counts[key] || 0;
        const previous = index ? counts[funnelStages[index - 1][0]] || 0 : 0;
        const percent = index && previous ? Math.min(100, value / previous * 100) : 0;
        const fall = index && previous ? Math.max(0, previous - value) : 0;
        return `<div class="funnel-row"><span class="funnel-index">${String(index + 1).padStart(2, '0')}</span><div class="funnel-main"><div class="funnel-label"><span>${label}</span><strong>${value.toLocaleString('pt-BR')}</strong></div><div class="funnel-rail"><i style="width:${Math.max(2, value / max * 100)}%"></i></div></div><span class="funnel-rate">${index ? `${previous ? `${percent.toFixed(1).replace('.', ',')}%` : '—'}<small>${fall ? `−${fall}` : ''}</small>` : '100%'}</span></div>`;
      }).join('');
    }
    const branches = [
      ['analysis_offer_view', 'Visualizaram oferta'], ['analysis_offer_buy', 'Clicaram para comprar'],
      ['analysis_offer_decline', 'Recusaram oferta'], ['whatsapp_clicked', 'Abriram WhatsApp']
    ];
    $('#funnel-note').innerHTML = `<strong>Depois do briefing</strong><div class="funnel-branches">${branches.map(([key, label]) => `<span>${label}<b>${(counts[key] || 0).toLocaleString('pt-BR')}</b></span>`).join('')}</div><small>Contagem por visita, desde a implantação deste tracking. A oferta é opcional; suas escolhas são caminhos diferentes.</small>`;
  }

  function renderRanking() {
    const list = rankingExpanded ? ranking : ranking.slice(0, 5);
    $('#ranking-list').innerHTML = list.length ? list.map((item, index) => {
      const balance = (item.revenue_cents || 0) - (item.payout_cents || 0);
      return `<div class="ranking-item rank-${index + 1}"><span class="rank-number">${String(index + 1).padStart(2, '0')}</span><div class="rank-identity"><strong>${escapeHTML(item.name || item.instagram)}</strong><span>${escapeHTML(item.instagram)} · ${statusNames[item.status] || 'Novo'}</span></div><div class="rank-primary"><strong>${item.valid_depositors || 0}</strong><small>válidos</small></div><div class="rank-finance"><span>${money(item.revenue_cents)} receita</span><small>${money(item.payout_cents)} pago · ${money(balance)} saldo</small></div></div>`;
    }).join('') : '<div class="empty-insight"><strong>O ranking começa aqui</strong><p>Os creators aparecerão quando depositantes ou receita forem cadastrados.</p></div>';
    $('#ranking-toggle').hidden = ranking.length <= 5;
    $('#ranking-toggle').textContent = rankingExpanded ? 'Mostrar top 5' : 'Ver ranking completo';
    $('#ranking-controls').hidden = !rankingExpanded;
  }

  const dateLabel = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Data não informada' : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };
  const relativeDate = value => {
    const difference = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(difference) || difference < 0) return dateLabel(value);
    const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    if (difference < 60000) return 'agora';
    if (difference < 3600000) return relative.format(-Math.floor(difference / 60000), 'minute');
    if (difference < 86400000) return relative.format(-Math.floor(difference / 3600000), 'hour');
    return dateLabel(value);
  };
  function renderRecent() {
    const recent = [...creators].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 6);
    $('#recent-creators').innerHTML = recent.length ? recent.map(item => `<div class="recent-item"><span class="recent-avatar">${escapeHTML((item.name || item.instagram || '?').replace('@', '').slice(0, 1).toUpperCase())}</span><div><strong>${escapeHTML(item.name || item.instagram)}</strong><small>${escapeHTML(item.instagram)} · ${item.source === 'quiz' ? 'Quiz' : 'Manual'}</small></div><time title="${dateLabel(item.created_at)}">${relativeDate(item.created_at)}</time></div>`).join('') : '<div class="empty-insight"><strong>Sem entradas ainda</strong><p>Novos creators aparecerão aqui assim que concluírem o quiz.</p></div>';
  }

  function renderCreators() {
    const query = $('#creator-search').value.trim().toLocaleLowerCase('pt-BR');
    const filtered = creators.filter(item =>
      (!selectedStatus || item.status === selectedStatus) &&
      (!query || `${item.name} ${item.instagram}`.toLocaleLowerCase('pt-BR').includes(query))
    );
    const sort = $('#creator-order').value;
    const sortValue = item => sort === 'valid' ? item.valid_depositors : sort === 'revenue' ? item.revenue_cents : (item.revenue_cents || 0) - (item.payout_cents || 0);
    filtered.sort((a, b) => sort === 'recent' ? String(b.created_at).localeCompare(String(a.created_at)) :
      sort === 'oldest' ? String(a.created_at).localeCompare(String(b.created_at)) : sortValue(b) - sortValue(a));
    $('#creator-count').textContent = `${filtered.length.toLocaleString('pt-BR')} ${filtered.length === 1 ? 'creator encontrado' : 'creators encontrados'}`;
    $('#creator-rows').innerHTML = filtered.length ? filtered.map(item => {
      const name = escapeHTML(item.name || item.instagram);
      const account = `<small>${escapeHTML(item.instagram)}</small>`;
      const balance = (item.revenue_cents || 0) - (item.payout_cents || 0);
      return `<tr><td data-label="Creator"><strong>${name}</strong>${account}</td><td data-label="Origem / data"><strong>${item.source === 'quiz' ? 'Quiz' : 'Manual'}</strong><small>${dateLabel(item.created_at)}</small></td><td data-label="Seguidores">${escapeHTML(item.followers || '—')}</td><td data-label="Situação"><span class="status-label status-${escapeHTML(item.status)}">${statusNames[item.status] || 'Novo'}</span></td><td data-label="Válidos">${item.valid_depositors || 0}</td><td data-label="Receita">${money(item.revenue_cents)}</td><td data-label="Pagamento">${money(item.payout_cents)}</td><td data-label="Saldo">${money(balance)}</td><td><button class="row-action" type="button" data-creator-id="${escapeHTML(item.id)}">Ver detalhes</button></td></tr>`;
    }).join('') : '<tr class="empty-row"><td colspan="9">Nenhum creator encontrado. Ajuste os filtros ou adicione um contato.</td></tr>';
  }

  function openCreator(item = null) {
    editingCreatorId = item?.id || null;
    $('#creator-dialog-title').textContent = item ? 'Editar creator' : 'Novo creator';
    $('#creator-name').value = item?.name || '';
    $('#creator-instagram').value = item?.instagram || '';
    $('#creator-instagram').readOnly = Boolean(item);
    $('#creator-followers').value = item?.followers || '';
    $('#creator-status').value = item?.status || 'novo';
    $('#creator-valid').value = item?.valid_depositors || 0;
    $('#creator-revenue').value = ((item?.revenue_cents || 0) / 100).toFixed(2);
    $('#creator-payout').value = ((item?.payout_cents || 0) / 100).toFixed(2);
    $('#creator-notes').value = item?.notes || '';
    const context = $('#creator-context');
    if (item) {
      const attribution = item.attribution || {};
      const details = [
        ['Entrada', dateLabel(item.created_at)], ['Origem', item.source === 'quiz' ? 'Quiz' : 'Manual'],
        ['Stories', item.stories || 'Não informado'], ['Campanhas anteriores', item.experience || 'Não informado'],
        ['UTM source', attribution.utm_source || '—'], ['UTM medium', attribution.utm_medium || '—'],
        ['UTM campaign', attribution.utm_campaign || '—'], ['Saldo', money((item.revenue_cents || 0) - (item.payout_cents || 0))]
      ];
      context.innerHTML = details.map(([label, value]) => `<div><span>${label}</span><strong>${escapeHTML(value)}</strong></div>`).join('');
      context.hidden = false;
      $('#open-creator-instagram').href = `https://instagram.com/${encodeURIComponent(item.instagram.replace(/^@/, ''))}`;
      $('#open-creator-instagram').hidden = false;
    } else { context.hidden = true; $('#open-creator-instagram').hidden = true; }
    $('#delete-creator').hidden = !item;
    $('#creator-form-error').textContent = '';
    $('#creator-dialog').showModal();
    $('#creator-name').focus();
  }

  async function saveCreator(event) {
    event.preventDefault();
    const button = $('#save-creator');
    button.disabled = true;
    $('#creator-form-error').textContent = '';
    try {
      const instagram = $('#creator-instagram').value.trim();
      const valid = Number($('#creator-valid').value || 0);
      const revenue = toCents($('#creator-revenue').value);
      const payout = toCents($('#creator-payout').value);
      if (!/^@?[A-Za-z0-9._]{2,30}$/.test(instagram)) throw new Error('Informe um Instagram válido.');
      if (!Number.isInteger(valid) || valid < 0 || !Number.isFinite(revenue) || revenue < 0 || !Number.isFinite(payout) || payout < 0) throw new Error('Confira os números informados.');
      const fields = {
        name: $('#creator-name').value.trim(), followers: $('#creator-followers').value.trim(),
        status: $('#creator-status').value, valid_depositors: valid, revenue_cents: revenue,
        payout_cents: payout, notes: $('#creator-notes').value.trim()
      };
      if (!window.LUME_BACKEND) throw new Error('Abra o painel no servidor para salvar creators.');
      if (editingCreatorId) {
        await api(`/api/admin/creators/${encodeURIComponent(editingCreatorId)}`, { method: 'PATCH', body: JSON.stringify(fields) });
      } else {
        await api('/api/admin/creators', { method: 'POST', body: JSON.stringify({ ...fields, instagram }) });
      }
      $('#creator-dialog').close();
      await loadCreators();
      toast('Creator salvo.');
    } catch (cause) { $('#creator-form-error').textContent = cause.message || 'Não foi possível salvar.'; }
    finally { button.disabled = false; }
  }

  function exportLeads() {
    if (window.LUME_BACKEND) {
      location.href = '/api/admin/export.csv';
      return;
    }
    toast('Abra o painel no servidor para exportar os creators.');
  }

  let toastTimer; function toast(message) { const el = $('#admin-toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600); }

  document.addEventListener('input', event => {
    if (!event.target.closest('main') || event.target.closest('#creators,#dashboard')) return;
    markDirty();
    if (event.target.classList.contains('feedback-active')) event.target.closest('.feedback-edit').classList.toggle('disabled', !event.target.checked);
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'vsl-file') {
      const file = event.target.files[0]; if (!file) return;
      pendingVideoFile = file; $('#video-file-status').textContent = `Pronto para salvar: ${file.name} (${formatBytes(file.size)})`; markDirty();
    }
  });
  document.addEventListener('click', event => {
    const remove = event.target.closest('.remove-faq'); if (!remove) return;
    config.faq = collectFAQ(); config.faq.splice(Number(remove.closest('.faq-edit').dataset.index), 1); renderFAQ(); markDirty();
  });
  $('#add-faq').addEventListener('click', () => { config.faq = collectFAQ(); config.faq.push(['', '']); renderFAQ(); markDirty(); $$('.faq-q').at(-1)?.focus(); });
  $('#add-feedback').addEventListener('click', () => { config.feedbacks = collectFeedbacks(); config.feedbacks.push({ id: Date.now(), active: false, demo: false, name: '', followers: '', city: '', state: '', text: '', reply: '' }); renderFeedbacks(); markDirty(); });
  $('#save-all').addEventListener('click', saveAll); $('#save-bottom').addEventListener('click', saveAll);
  $('#export-leads').addEventListener('click', exportLeads);
  $('#creator-search').addEventListener('input', renderCreators);
  $('#creator-order').addEventListener('change', renderCreators);
  $('#status-filters').addEventListener('click', event => {
    const button = event.target.closest('button[data-status]');
    if (!button) return;
    selectedStatus = button.dataset.status;
    $$('#status-filters button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    renderCreators();
  });
  $('#dashboard-period').addEventListener('change', async () => {
    try {
      const period = $('#dashboard-period').value;
      const [dashboard, analytics] = await Promise.all([api(`/api/admin/dashboard?period=${period}`), api(`/api/admin/analytics?period=${period}`)]);
      renderDashboard(dashboard); renderFunnel(analytics);
    } catch (cause) { toast(cause.message); }
  });
  $('#ranking-toggle').addEventListener('click', () => { rankingExpanded = !rankingExpanded; renderRanking(); });
  $('#ranking-order').addEventListener('change', async () => {
    try { ranking = (await api(`/api/admin/ranking?order=${$('#ranking-order').value}`)).creators; renderRanking(); }
    catch (cause) { toast(cause.message); }
  });
  $('#add-creator').addEventListener('click', () => openCreator());
  $('#creator-rows').addEventListener('click', event => {
    const button = event.target.closest('[data-creator-id]');
    if (button) openCreator(creators.find(item => item.id === button.dataset.creatorId));
  });
  $('#creator-form').addEventListener('submit', saveCreator);
  $('#close-creator').addEventListener('click', () => $('#creator-dialog').close());
  $('#cancel-creator').addEventListener('click', () => $('#creator-dialog').close());
  $('#delete-creator').addEventListener('click', async () => {
    if (!editingCreatorId || !confirm('Excluir permanentemente este registro do painel?')) return;
    try {
      await api(`/api/admin/creators/${encodeURIComponent(editingCreatorId)}`, { method: 'DELETE' });
      $('#creator-dialog').close();
      await loadCreators();
      toast('Registro excluído.');
    } catch (cause) { $('#creator-form-error').textContent = cause.message || 'Não foi possível excluir.'; }
  });
  $('#creator-dialog').addEventListener('click', event => { if (event.target === $('#creator-dialog')) $('#creator-dialog').close(); });
  $('#import-local-leads').addEventListener('click', async () => {
    let leads = [];
    try { leads = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]'); } catch (_) {}
    if (!leads.length) return;
    try {
      const result = await api('/api/admin/import-leads', { method: 'POST', body: JSON.stringify({ leads }) });
      await loadCreators();
      toast(`${result.added} ${result.added === 1 ? 'registro importado' : 'registros importados'}.`);
    } catch (cause) { toast(cause.message); }
  });
  if (window.LUME_BACKEND) {
    $('#admin-user').textContent = window.LUME_ADMIN_NAME || window.LUME_ADMIN_EMAIL || '';
    $('#admin-user').hidden = false;
    $('#logout').hidden = false;
    $('#logout').addEventListener('click', async () => {
      try { await api('/api/auth/logout', { method: 'POST' }); location.replace('/admin/login/'); }
      catch (cause) { toast(cause.message); }
    });
  }
  const sectionLinks = [...document.querySelectorAll('aside nav a[href^="#"]')];
  const sections = sectionLinks.map(link => ({ link, section: document.querySelector(link.getAttribute('href')) })).filter(item => item.section);
  let navFrame = 0;
  const updateCurrentSection = () => {
    navFrame = 0;
    let current = sections[0];
    for (const item of sections) {
      if (item.section.getBoundingClientRect().top <= 180) current = item;
    }
    for (const item of sections) {
      const active = item === current;
      item.link.classList.toggle('is-current', active);
      if (active) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  };
  addEventListener('scroll', () => {
    if (!navFrame) navFrame = requestAnimationFrame(updateCurrentSection);
  }, { passive: true });
  addEventListener('resize', updateCurrentSection);
  updateCurrentSection();
  addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  fillInputs();
  if (migrateLocalConfig) {
    api('/api/admin/config', { method: 'PUT', body: JSON.stringify(config) }).catch(cause => toast(`Configuração anterior não importada: ${cause.message}`));
  }
})();
