// Google sends the id_token back in the fragment; hand it to /api/google and go to the panel.
(async () => {
  const hash = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, '', '/google');
  const fail = text => {
    document.getElementById('msg').textContent = text;
    document.getElementById('back').hidden = false;
  };
  const token = hash.get('id_token');
  if (!token) return fail(hash.get('error') === 'access_denied' ? 'Cancelaste el inicio con Google.' : 'Google no devolvió la cuenta.');
  const r = await fetch('/api/google', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id_token: token }) });
  const d = await r.json().catch(() => ({}));
  if (r.ok) location.replace('/');
  else fail(d.error || 'No se pudo entrar.');
})();
