// Minimal terminal-like pager overlay (less) for text files
// Keys: q to quit, j/k or ArrowUp/Down, PageUp/PageDown, g/G, / search, n/N next/prev, :line

export class LessOverlay {
  constructor({ title, content }) {
    this.title = title || 'less';
    this.content = content || '';
    this.lines = (this.content || '').split('\n');
    this.wrap = true;
    this.searchQuery = '';
    this.matches = [];
    this.matchIndex = -1;
    this.offset = 0; // top line index in logical lines
    this.width = 0;
    this.height = 0;
    this.container = null;
    this.textLayer = null;
    this.status = null;
    this.input = null; // for / and :
    this.onClose = null;
  }

  open() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'less-overlay';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-label', 'pager');
    this.container.innerHTML = `
      <div class="less-box">
        <div class="less-text" tabindex="0" aria-label="pager content"></div>
        <div class="less-status">${this.escape(this.title)} — q:quit /:find g/G top/bottom :N goto n/N next/prev w wrap</div>
        <input class="less-input" aria-label="pager command" />
      </div>
    `;
    document.body.appendChild(this.container);
    this.textLayer = this.container.querySelector('.less-text');
    this.status = this.container.querySelector('.less-status');
    this.input = this.container.querySelector('.less-input');
    this.input.style.display = 'none';

    this.installStyles();
    this.bindEvents();
    this.resize();
    this.render();
    this.textLayer.focus();
  }

  close() {
    if (!this.container) return;
    document.removeEventListener('keydown', this._onKeyDown, true);
    window.removeEventListener('resize', this._onResize);
    this.container.remove();
    this.container = null;
    if (typeof this.onClose === 'function') this.onClose();
  }

  bindEvents() {
    this._onKeyDown = (e) => {
      if (!this.container) return;
      const activeIsInput = document.activeElement === this.input;
      if (activeIsInput) {
        if (e.key === 'Escape') {
          this.hideInput();
          e.preventDefault();
        } else if (e.key === 'Enter') {
          const value = this.input.value;
          if (this.input.dataset.mode === 'search') {
            this.search(value);
          } else if (this.input.dataset.mode === 'goto') {
            const n = parseInt(value, 10);
            if (!isNaN(n)) this.gotoLine(Math.max(1, n));
          }
          this.hideInput();
          e.preventDefault();
        }
        return; // allow typing
      }

      switch (e.key) {
        case 'q':
        case 'Escape':
          this.close();
          e.preventDefault();
          break;
        case 'j':
        case 'ArrowDown':
          this.scrollBy(1);
          e.preventDefault();
          break;
        case 'k':
        case 'ArrowUp':
          this.scrollBy(-1);
          e.preventDefault();
          break;
        case 'PageDown':
        case 'f':
          this.scrollBy(this.pageSize() - 1);
          e.preventDefault();
          break;
        case 'PageUp':
        case 'b':
          this.scrollBy(-(this.pageSize() - 1));
          e.preventDefault();
          break;
        case 'g':
          this.offset = 0;
          this.render();
          e.preventDefault();
          break;
        case 'G':
          this.offset = Math.max(0, this.totalLogicalLines() - this.pageSize());
          this.render();
          e.preventDefault();
          break;
        case '/':
          this.showInput('search', '/');
          e.preventDefault();
          break;
        case 'n':
          this.nextMatch(1);
          e.preventDefault();
          break;
        case 'N':
          this.nextMatch(-1);
          e.preventDefault();
          break;
        case ':':
          this.showInput('goto', ':');
          e.preventDefault();
          break;
        case 'w':
          this.wrap = !this.wrap;
          this.render();
          e.preventDefault();
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', this._onKeyDown, true);
    this._onResize = () => { this.resize(); this.render(); };
    window.addEventListener('resize', this._onResize);
  }

  showInput(mode, prefix) {
    this.input.style.display = 'block';
    this.input.value = prefix || '';
    this.input.setSelectionRange(1, this.input.value.length);
    this.input.dataset.mode = mode;
    this.input.focus();
  }

  hideInput() {
    this.input.style.display = 'none';
    this.textLayer.focus();
  }

  resize() {
    const rect = this.textLayer.getBoundingClientRect();
    const lh = this.lineHeightPx();
    this.height = Math.max(1, Math.floor(rect.height / lh));
    const cw = this.charWidthPx();
    this.width = Math.max(10, Math.floor(rect.width / cw));
  }

  pageSize() { return Math.max(1, this.height); }

  totalLogicalLines() {
    if (this.wrap) {
      let total = 0;
      for (const line of this.lines) {
        total += Math.max(1, Math.ceil((line || '').length / this.width));
      }
      return total;
    }
    return this.lines.length;
  }

  scrollBy(delta) {
    const maxOffset = Math.max(0, this.totalLogicalLines() - this.pageSize());
    this.offset = Math.min(maxOffset, Math.max(0, this.offset + delta));
    this.render();
  }

  gotoLine(n1) { // 1-based
    const lineIndex = Math.max(0, Math.min(this.lines.length - 1, n1 - 1));
    if (!this.wrap) {
      this.offset = Math.min(Math.max(0, lineIndex), Math.max(0, this.lines.length - this.pageSize()));
    } else {
      // compute wrapped logical line index up to target line
      let logical = 0;
      for (let i = 0; i < lineIndex; i++) {
        logical += Math.max(1, Math.ceil((this.lines[i] || '').length / this.width));
      }
      this.offset = logical;
    }
    this.render();
  }

  search(query) {
    this.searchQuery = (query || '').replace(/^\//, '');
    this.matches = [];
    this.matchIndex = -1;
    if (!this.searchQuery) { this.render(); return; }
    const re = new RegExp(this.escapeRegex(this.searchQuery), 'i');
    for (let i = 0; i < this.lines.length; i++) {
      if (re.test(this.lines[i])) this.matches.push(i);
    }
    this.nextMatch(1);
  }

  nextMatch(direction) {
    if (!this.matches.length) return;
    if (this.matchIndex === -1) this.matchIndex = 0;
    else this.matchIndex = (this.matchIndex + (direction > 0 ? 1 : -1) + this.matches.length) % this.matches.length;
    this.gotoLine(this.matches[this.matchIndex] + 1);
  }

  render() {
    if (!this.container) return;
    const vis = [];
    if (!this.wrap) {
      const start = Math.max(0, Math.min(this.offset, Math.max(0, this.lines.length - this.pageSize())));
      const slice = this.lines.slice(start, start + this.pageSize());
      for (const ln of slice) vis.push(this.escape(ln));
    } else {
      let logical = 0;
      const want = this.pageSize();
      for (const src of this.lines) {
        const chunks = this.softWrap(src, this.width);
        for (const ch of chunks) {
          if (logical >= this.offset && vis.length < want) vis.push(this.escape(ch));
          logical++;
        }
        if (vis.length >= want) break;
      }
    }
    this.textLayer.innerHTML = vis.join('<br/>');
    const percent = Math.min(100, Math.floor((this.offset / Math.max(1, this.totalLogicalLines() - this.pageSize())) * 100));
    const wrapLbl = this.wrap ? 'WRAP' : 'NOWRAP';
    this.status.textContent = `${this.title} — ${percent}% • ${wrapLbl}`;
  }

  softWrap(s, width) {
    const out = [];
    if (!s) return [''];
    for (let i = 0; i < s.length; i += width) out.push(s.slice(i, i + width));
    return out;
  }

  lineHeightPx() { return 18; }
  charWidthPx() { return 8; }

  installStyles() {
    if (document.getElementById('less-overlay-style')) return;
    const style = document.createElement('style');
    style.id = 'less-overlay-style';
    style.textContent = `
      .less-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); color: #00ff00; z-index: 9999; display: flex; }
      .less-box { display: grid; grid-template-rows: 1fr auto auto; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; font-family: Consolas, "Courier New", monospace; }
      .less-text { overflow: hidden; outline: none; font-size: 14px; line-height: 18px; white-space: pre; }
      .less-status { border-top: 1px solid #0f0; margin-top: 6px; padding-top: 4px; color: #80ff80; font-size: 12px; }
      .less-input { margin-top: 6px; padding: 4px 6px; font-family: Consolas, "Courier New", monospace; font-size: 14px; background: #001900; color: #d0ffd0; border: 1px solid #0f0; width: 100%; box-sizing: border-box; }
    `;
    document.head.appendChild(style);
  }

  escape(s) { return (s || '').replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
}

