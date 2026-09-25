(() => {
  const token = sessionStorage.getItem('lume_flow_token_v1');
  if (!token) { location.replace('/'); return; }
  fetch('/api/vsl/session', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }).then(async response => {
    if (!response.ok) throw Error();
    const data = await response.json();
    const status = await fetch('/api/analysis/status', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }).then(r => r.json());
    if (status.status === 'paid') {
      document.getElementById('title').textContent = 'Pagamento recebido.';
      document.getElementById('description').textContent = 'Agora fale com nossa equipe para receber sua análise.';
    }
    document.getElementById('contact').onclick = () => {
      fetch('/api/vsl/events', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'analysis_whatsapp_clicked' }), keepalive: true }).catch(() => {});
      const number = String(data.whatsapp || '').replace(/\D/g, '');
      const message = `Olá! Acabei de comprar a análise de perfil da LUME.\n\nInstagram: ${data.instagram}\n\nQuero enviar as informações para receber minha análise.`;
      if (number) location.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    };
  }).catch(() => { location.replace('/'); });
})();
