export class HealthCommand {
  constructor(terminal) { this.terminal = terminal; }
  async execute() {
    const lines = [];
    // cross-origin isolation
    lines.push(`crossOriginIsolated: ${String(window.crossOriginIsolated)}`);
    // Supabase
    const hasSB = !!(window.supabase) && !!this.terminal.api?.client;
    lines.push(`supabase: ${hasSB ? 'ok' : 'missing'}`);
    // WASM shell assets
    try {
      const resp = await fetch('/wasm-shell/worker.js', { method: 'GET', cache: 'no-store' });
      lines.push(`shell worker: ${resp.ok ? 'ok' : 'missing'} (${resp.status})`);
    } catch (e) {
      lines.push(`shell worker: error (${e?.message || e})`);
    }
    try {
      const resp2 = await fetch('/wasm-shell/shell.js', { method: 'GET', cache: 'no-store' });
      lines.push(`shell module: ${resp2.ok ? 'present' : 'stub or missing'} (${resp2.status})`);
    } catch (_) {
      lines.push('shell module: error');
    }
    // Vim assets
    try {
      const rV = await fetch('/vendor/vim-wasm/vim.js', { method: 'GET', cache: 'no-store' });
      lines.push(`vim assets: ${rV.ok ? 'ok' : 'missing'} (${rV.status})`);
    } catch (e) {
      lines.push(`vim assets: error (${e?.message || e})`);
    }
    return lines.join('\r\n') + '\r\n';
  }
  getHelp() {
    return [
      'health - check environment (isolation, supabase, shell, vim assets)',
      'Usage: health',
    ].join('\r\n');
  }
}

