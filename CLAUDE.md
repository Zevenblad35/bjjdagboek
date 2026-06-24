---
import Auth from '../layouts/Auth.astro';
---
<Auth title="Inloggen">
<div class="auth-page">
  <div class="auth-card">
    <div class="auth-logo">
      <div style="width:48px;height:48px;background:var(--blue);border-radius:14px;display:grid;place-items:center;color:white;font-size:24px;margin:0 auto 12px">⬡</div>
      <div style="font-family:'Space Mono',monospace;font-size:12px;color:var(--muted);letter-spacing:.06em">BJJ DAGBOEK</div>
    </div>
    <div class="auth-title">Welkom terug</div>
    <div class="auth-sub">Log in op je account</div>

    <div id="error-msg" style="display:none;background:var(--red-bg);color:var(--red);border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:14px"></div>

    <form id="login-form">
      <div class="form-group">
        <label class="form-label">E-mailadres</label>
        <input class="form-input" type="email" name="email" required autocomplete="email" placeholder="jij@example.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Wachtwoord</label>
        <input class="form-input" type="password" name="password" required autocomplete="current-password" placeholder="••••••••" />
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:4px">Inloggen</button>
    </form>

    <div class="auth-link">
      Nog geen account? <a href="/registreren">Registreer hier</a>
    </div>
  </div>
</div>

<script>
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  const errEl = document.getElementById('error-msg')!;
  const data = new FormData(form);

  btn.textContent = 'Even wachten…';
  btn.disabled = true;
  errEl.style.display = 'none';

  try {
    const res = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.get('email'),
        password: data.get('password'),
      }),
    });

    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      const json = await res.json().catch(() => ({}));
      errEl.textContent = json.message || 'E-mail of wachtwoord klopt niet.';
      errEl.style.display = 'block';
      btn.textContent = 'Inloggen';
      btn.disabled = false;
    }
  } catch {
    errEl.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    errEl.style.display = 'block';
    btn.textContent = 'Inloggen';
    btn.disabled = false;
  }
});
</script>
</Auth>
