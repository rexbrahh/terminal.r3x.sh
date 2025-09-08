export class EditorCommand {
  constructor(terminal) {
    this.terminal = terminal;
  }

  async execute(args) {
    const key = 'editorEngine';
    const show = () => {
      const pref = (localStorage.getItem(key) || 'vim').toLowerCase();
      const effective = pref === 'cm' || pref === 'codemirror' ? 'cm' : 'vim';
      return [
        `Current editor engine: ${effective}`,
        'Usage: editor [vim|cm|default]',
        '  vim      Use real Vim (WASM) when available',
        '  cm       Use CodeMirror with Vim keybindings (fallback)',
        '  default  Clear preference (uses app default)',
        '',
      ].join('\r\n');
    };

    if (!args || args.length === 0) return show();
    const val = (args[0] || '').toLowerCase();
    if (val === 'vim') {
      localStorage.setItem(key, 'vim');
      return 'Editor engine set to: vim\r\n';
    }
    if (val === 'cm' || val === 'codemirror') {
      localStorage.setItem(key, 'cm');
      return 'Editor engine set to: cm\r\n';
    }
    if (val === 'default' || val === 'reset' || val === 'clear') {
      localStorage.removeItem(key);
      return 'Editor engine preference cleared (using app default)\r\n';
    }
    return `editor: unknown option '${args[0]}'. Try: editor [vim|cm|default]\r\n`;
  }

  getHelp() {
    return [
      'editor - set preferred editor engine (vim or cm)',
      'Usage: editor [vim|cm|default]',
      'Description:',
      '  Controls whether file editing uses real Vim (WASM) or the',
      '  CodeMirror fallback with Vim keybindings. Preference is stored',
      '  in localStorage and affects view/vim commands.',
    ].join('\r\n');
  }
}

