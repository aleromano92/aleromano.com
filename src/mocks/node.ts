if (typeof window === 'undefined') {
  const { server } = await import('./server');
  
  server.listen({
    onUnhandledFrame: 'bypass',
  });
  
  console.log('[MSW] Server-side mocking enabled for development');
  
  server.events.on('request:start', ({ request }) => {
      console.log('[MSW] Intercepting:', request.method, request.url);
  });
}

export {};
