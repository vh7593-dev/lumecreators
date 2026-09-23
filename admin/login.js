(() => {
  'use strict';
  const form = document.querySelector('#login-form');
  const error = document.querySelector('#login-error');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    if (!form.reportValidity()) return;
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: document.querySelector('#email').value.trim(),
          password: document.querySelector('#password').value
        })
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.detail || 'Não foi possível entrar.');
      }
      location.replace('/admin/');
    } catch (cause) {
      error.textContent = cause.message || 'Não foi possível entrar.';
      button.disabled = false;
      document.querySelector('#password').select();
    }
  });
})();
