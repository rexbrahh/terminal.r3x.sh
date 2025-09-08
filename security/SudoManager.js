// Simple in-memory sudo token manager

class SudoManager {
  constructor() {
    this.token = null;
    this.exp = 0; // epoch ms
    this.persistSession = false; // optional sessionStorage persistence
    this.loadFromSession();
  }

  isElevated() {
    return !!this.token && Date.now() < this.exp;
  }

  getToken() {
    if (this.isElevated()) return this.token;
    return null;
  }

  setToken(token, expMs) {
    this.token = token;
    this.exp = expMs || (Date.now() + 10 * 60 * 1000);
    this.saveToSession();
  }

  clear() {
    this.token = null;
    this.exp = 0;
    this.saveToSession();
  }

  setPersist(persist) {
    this.persistSession = !!persist;
    this.saveToSession();
  }

  saveToSession() {
    try {
      if (this.persistSession) {
        sessionStorage.setItem('sudo.token', this.token || '');
        sessionStorage.setItem('sudo.exp', String(this.exp || 0));
      } else {
        sessionStorage.removeItem('sudo.token');
        sessionStorage.removeItem('sudo.exp');
      }
    } catch {}
  }

  loadFromSession() {
    try {
      const t = sessionStorage.getItem('sudo.token');
      const e = Number(sessionStorage.getItem('sudo.exp')); 
      if (t && e && e > Date.now()) {
        this.token = t;
        this.exp = e;
        this.persistSession = true;
      }
    } catch {}
  }
}

export const sudoManager = new SudoManager();

