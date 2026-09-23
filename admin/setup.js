(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const profileForm = $('#profile-form');

  function showError(selector, message) {
    $(selector).textContent = message;
  }

  async function post(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.detail || 'Não foi possível concluir. Tente novamente.');
    return result;
  }

  fetch('/api/setup/status', { credentials: 'same-origin' })
    .then(response => response.json())
    .then(status => {
      if (!status.available) {
        location.replace('/admin/login/');
        return;
      }
      $('#setup-key-field').hidden = !status.requires_key;
      $('#setup-key').required = status.requires_key;
      if (!status.key_configured) showError('#profile-error', 'A chave de configuração ainda não foi definida na hospedagem. Configure LUME_SETUP_TOKEN antes de criar a conta.');
    })
    .catch(() => showError('#profile-error', 'Não foi possível verificar a configuração do servidor.'));

  profileForm.addEventListener('submit', async event => {
    event.preventDefault();
    showError('#profile-error', '');
    const password = $('#password').value;
    if (!profileForm.reportValidity()) return;
    if (password !== $('#password-confirm').value) {
      showError('#profile-error', 'As senhas não coincidem.');
      return;
    }
    const button = $('#profile-submit');
    button.disabled = true;
    try {
      await post('/api/setup/start', {
        display_name: $('#display-name').value.trim(),
        email: $('#email').value.trim(),
        password,
        setup_key: $('#setup-key').value
      });
      location.replace('/admin/');
    } catch (cause) {
      showError('#profile-error', cause.message);
    } finally {
      button.disabled = false;
    }
  });
})();
