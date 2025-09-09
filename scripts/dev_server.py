#!/usr/bin/env python3
import http.server
import socketserver
import socket
import argparse
import os
import sys
import mimetypes


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, isolated=False, coep_policy='credentialless', **kwargs):
        self.isolated = isolated
        self.coep_policy = coep_policy
        # Ensure proper MIME types
        mimetypes.add_type('application/wasm', '.wasm')
        mimetypes.add_type('application/octet-stream', '.data')
        super().__init__(*args, **kwargs)

    def end_headers(self):
        # Always good hygiene
        self.send_header('X-Content-Type-Options', 'nosniff')

        if self.isolated:
            # Cross-origin isolation headers for WASM/SharedArrayBuffer
            self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
            self.send_header('Cross-Origin-Embedder-Policy', self.coep_policy)
            # Mark same-origin assets as embeddable
            self.send_header('Cross-Origin-Resource-Policy', 'same-origin')

        # Basic CSP aligned with _headers (relaxed for localhost if needed)
        csp = (
            "default-src 'self'; "
            "connect-src 'self' https://*.supabase.co; "
            "img-src 'self' data:; "
            "script-src 'self' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "worker-src 'self' blob:; "
            "frame-ancestors 'none'"
        )
        self.send_header('Content-Security-Policy', csp)
        super().end_headers()

    # Use base implementation for content serving


class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def try_bind(host, port, handler_factory):
    try:
        httpd = ReuseTCPServer((host, port), handler_factory)
        return httpd, port
    except OSError as e:
        if e.errno == 48 or 'Address already in use' in str(e):
            return None, None
        raise


def main():
    parser = argparse.ArgumentParser(description='Dev server with COOP/COEP and WASM support')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--isolated', action='store_true', help='Enable COOP/COEP (crossOriginIsolated) headers')
    parser.add_argument('--coep', choices=['require-corp','credentialless'], default='credentialless', help='COEP policy when isolated')
    parser.add_argument('--root', default='.')
    args = parser.parse_args()

    os.chdir(args.root)
    handler_factory = lambda *h_args, **h_kwargs: Handler(*h_args, isolated=args.isolated, coep_policy=args.coep, **h_kwargs)

    # Try the requested port first, then search the next 20 ports.
    httpd, chosen_port = try_bind(args.host, args.port, handler_factory)
    if httpd is None:
        for p in range(args.port + 1, args.port + 21):
            httpd, chosen_port = try_bind(args.host, p, handler_factory)
            if httpd is not None:
                break

    # Fall back to OS-assigned port (0)
    if httpd is None:
        httpd, chosen_port = try_bind(args.host, 0, handler_factory)

    if httpd is None:
        print("Failed to bind any port. Is another server running?")
        sys.exit(2)

    print(f"Serving {os.getcwd()} on http://{args.host}:{chosen_port} (isolated={args.isolated})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")


if __name__ == '__main__':
    main()
