self.addEventListener('install', () => {
    // Skip over the "waiting" lifecycle state, curving the service worker to activate immediately.
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    // Unregister this service worker immediately to clean up any zombie SWs
    // that might be lingering from previous projects on localhost.
    self.registration.unregister().then(() => {
        return self.clients.matchAll();
    }).then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
    });
});
