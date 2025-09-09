// Wrapper to set Emscripten Module options before loading vim.js in the Worker.
// Ensures that auxiliary files like `vim.data` are resolved from the same folder.
/* global self, importScripts */
(function(){
  try {
    self.Module = self.Module || {};
    // Make sure the data (.data) and .wasm are loaded from this directory
    self.Module.locateFile = function(path, scriptDirectory){
      try {
        // scriptDirectory is empty in some builds; derive from this script URL
        var base = '';
        try {
          // new URL with import.meta is not available in Worker classic scripts; use location
          var here = (self.location && self.location.href) ? self.location.href : '';
          base = here.substring(0, here.lastIndexOf('/') + 1);
        } catch (_) {}
        if (!base) base = '/vendor/vim-wasm/';
        // If path is already absolute, return as-is
        if (/^\w+:\/\//.test(path) || path.startsWith('/')) return path;
        return base + path;
      } catch (_) {
        return '/vendor/vim-wasm/' + path;
      }
    };
  } catch (_) {}
  importScripts('/vendor/vim-wasm/vim.js');
})();

