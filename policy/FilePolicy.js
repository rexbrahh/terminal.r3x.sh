// Simple terminal-first file policy: allow only text within a size limit
export class FilePolicy {
  constructor(options = {}) {
    this.maxTextSize = options.maxTextSize ?? 5 * 1024 * 1024; // 5MB
  }

  isTextMime(mime = '') {
    if (!mime || typeof mime !== 'string') return true; // default to text if unknown
    const lower = mime.toLowerCase();
    if (lower.startsWith('text/')) return true;
    // Known textual application types
    const textApps = [
      'application/json',
      'application/javascript',
      'application/x-javascript',
      'application/typescript',
      'application/xml',
      'application/xhtml+xml',
      'application/x-yaml',
      'application/yaml',
    ];
    return textApps.includes(lower);
  }

  analyze({ path, mime, size }) {
    const isText = this.isTextMime(mime);
    const tooLarge = typeof size === 'number' && size > this.maxTextSize;
    const allowed = isText && !tooLarge;
    let reason = '';
    if (!isText) {
      reason = 'binary file';
    } else if (tooLarge) {
      reason = 'file exceeds size limit';
    }
    return {
      allowed,
      isText,
      tooLarge,
      reason,
      mime,
      size,
      path,
    };
  }

  suggestForBlock({ isText, tooLarge }) {
    if (!isText) {
      return 'Try: xxd <file> | less, or download <file>';
    }
    if (tooLarge) {
      return 'Try: head/tail/grep for quick peeks';
    }
    return '';
  }
}

