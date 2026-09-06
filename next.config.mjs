const nextConfig = {
  reactStrictMode: true,

  /**
   * Where the build is written.
   *
   * A build normally replaces .next, which is also what `next dev` is serving
   * from, so verifying a change used to mean breaking whatever was running.
   * Setting NEXT_DIST_DIR sends a verification build somewhere else and leaves
   * the dev server alone.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',

  /**
   * Report pages carry a token in their address (audit item B3), so the
   * response says so in its headers rather than only in a meta tag. A meta tag
   * is read by a browser that renders the page; a header is read by a crawler,
   * a proxy and a cache that never do.
   */
  async headers() {
    const privatePage = [
      // The address is a secret, so it is never handed to a site the reader
      // clicks through to, and never to a subresource.
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
      // Nothing between the reader and the server keeps a copy.
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
    ];
    return [
      { source: '/r/:path*', headers: privatePage },
      { source: '/api/report-link/:path*', headers: privatePage },
    ];
  }
};

export default nextConfig;
