const CACHE='estadisticas-v7-1-20261112-logo-aro-vector';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json','./configurar.html','./actualizar.html','./assets/jszip.min.js','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);

  // La sincronización y cualquier origen remoto son siempre red pura. Nunca
  // reciben HTML de la app ni una respuesta antigua de la caché.
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;

  if(request.mode==='navigate'){
    event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{
      if(response.ok)caches.open(CACHE).then(cache=>cache.put('./index.html',response.clone()));
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }

  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok&&response.type==='basic')caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
    return response;
  })));
});
