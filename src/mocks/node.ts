/**
 * MSW Node.js Integration for Astro Development
 * 
 * This file should be imported at the top of your entry point
 * (e.g., in astro.config.mjs or a top-level component) to enable
 * MSW during development mode.
 * 
 * Usage in astro.config.mjs:
 * 
 * if (process.env.NODE_ENV === 'development') {
 *   await import('./src/mocks/node.js');
 * }
 */

if (typeof window === 'undefined') {
  // Server-side only
  const { server } = await import('./server');
  
  server.listen({
    onUnhandledRequest: 'bypass', // Allow non-mocked requests to pass through
  });
  
  console.log('[MSW] Server-side mocking enabled for development');
  
  // Optionally log when requests are intercepted
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('twitter.com')) {
      console.log('[MSW] Intercepting:', request.method, request.url);
    }
  });
}

export {};
