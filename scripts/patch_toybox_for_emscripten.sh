#!/usr/bin/env bash
set -euo pipefail

# Apply tiny compatibility stubs so Toybox compiles under Emscripten.
# - Stub xgetmountlist()/xnotify* for __EMSCRIPTEN__

FILE="$1"
if grep -q "__EMSCRIPTEN__ compatibility stubs" "$FILE" 2>/dev/null; then
  echo "patch: already applied"
  exit 0
fi

tmp=$(mktemp)
awk '
  BEGIN { patched=0 }
  { print }
  $0 ~ /^#if defined\(__APPLE__\) \|\| defined\(__FreeBSD__\) \|\| defined\(__OpenBSD__\)/ && !patched {
    print "\n#ifdef __EMSCRIPTEN__\n/* __EMSCRIPTEN__ compatibility stubs — injected by patch script */\n/* xgetmountlist: return empty list; mountlist_istype always true */\nstruct mtab_list *xgetmountlist(char *path) { (void)path; return 0; }\nint mountlist_istype(struct mtab_list *ml, char *typelist) { (void)ml; (void)typelist; return 1; }\n/* xnotify API: no-op stubs */\nstruct xnotify *xnotify_init(int max) { struct xnotify *not = xzalloc(sizeof(struct xnotify)); not->max = max; not->paths = xmalloc(max * sizeof(char *)); not->fds = xmalloc(max * sizeof(int)); not->count = 0; not->kq = -1; return not; }\nint xnotify_add(struct xnotify *not, int fd, char *path) { (void)not; (void)fd; (void)path; return 0; }\nint xnotify_wait(struct xnotify *not, char **path) { (void)not; (void)path; errno = ENOSYS; return -1; }\n#else";
    patched=1
  }
  END { if(!patched) exit 2 }
' "$FILE" > "$tmp"
mv "$tmp" "$FILE"
echo "patch: applied to $FILE"

