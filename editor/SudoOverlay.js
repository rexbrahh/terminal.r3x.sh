import { sudoManager } from '../security/SudoManager.js';

export class SudoOverlay {
  constructor(api, { onSuccess } = {}) {
    this.api = api;
    this.onSuccess = onSuccess;
    this.container = null;
    this.status = null;
    this.input = null;
  }

  open() {
    if (this.container) return;
    const div = document.createElement('div');
    div.className = 'sudo-overlay';
    div.innerHTML = `
      <div class="sudo-box">
        <div class="sudo-title">sudo password required</div>
        <input class="sudo-input" type="password" placeholder="Password" />
        <div class="sudo-actions">
          <button class="sudo-submit">Continue</button>
          <button class="sudo-cancel">Cancel</button>
        </div>
        <div class="sudo-status"></div>
      </div>
    `;
    document.body.appendChild(div);
    this.container = div;
    this.status = div.querySelector('.sudo-status');
    this.input = div.querySelector('.sudo-input');
    this.installStyles();
    this.bind();
    this.input.focus();
  }

  close() {
    if (!this.container) return;
    document.removeEventListener('keydown', this._onKey, true);
    this.container.remove();
    this.container = null;
  }

  bind() {
    const submit = this.container.querySelector('.sudo-submit');
    const cancel = this.container.querySelector('.sudo-cancel');
    submit.addEventListener('click', () => this.submit());
    cancel.addEventListener('click', () => this.close());
    this._onKey = (e) => {
      if (e.key === 'Enter') { this.submit(); e.preventDefault(); }
      if (e.key === 'Escape') { this.close(); e.preventDefault(); }
    };
    document.addEventListener('keydown', this._onKey, true);
  }

  async submit() {
    const pwd = this.input.value;
    if (!pwd) return;
    this.setStatus('Authenticating…');
    const { data, error, status } = await this.api.invokeFunction('sudo-login', { password: pwd });
    if (error || status >= 400) {
      let msg = 'Authentication failed';
      const reason = (typeof error === 'string' ? error : error?.error) || '';
      if (reason === 'origin') msg = 'Origin not allowed (check ALLOWED_ORIGINS)';
      else if (reason === 'password' || reason === 'auth') msg = 'Wrong password';
      this.setStatus(msg);
      return;
    }
    const { token, exp } = data || {};
    if (!token) {
      this.setStatus('Invalid response');
      return;
    }
    sudoManager.setToken(token, exp);
    this.setStatus('Elevated for a limited time');
    setTimeout(() => this.close(), 300);
    if (typeof this.onSuccess === 'function') this.onSuccess();
  }

  setStatus(text) { if (this.status) this.status.textContent = text; }

  installStyles() {
    if (document.getElementById('sudo-style')) return;
    const style = document.createElement('style');
    style.id = 'sudo-style';
    style.textContent = `
      .sudo-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;}
      .sudo-box { width: 360px; background: #001900; border: 1px solid #0f0; color: #d0ffd0; padding: 12px; font-family: Consolas, "Courier New", monospace; }
      .sudo-title { color: #80ff80; margin-bottom: 8px; }
      .sudo-input { width: 100%; padding: 6px; background: #000; color: #d0ffd0; border: 1px solid #0f0; }
      .sudo-actions { display:flex; gap:8px; margin-top: 8px; }
      .sudo-actions button { padding: 4px 8px; background: #002b00; color: #c8ffc8; border: 1px solid #0f0; cursor:pointer; }
      .sudo-actions button:hover { background:#013d01; }
      .sudo-status { margin-top: 8px; color:#80ff80; font-size: 12px; }
    `;
    document.head.appendChild(style);
  }
}
