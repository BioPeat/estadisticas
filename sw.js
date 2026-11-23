const CACHE='estadisticas-v12.3-20261123a';
const CORE=['./','./index.html','./styles.css?v=12.3','./app.js?v=12.3','./config.js?v=12.3','./manifest.json?v=12.3','./assets/jszip.min.js'];
const OPTIONAL=['./configurar.html','./actualizar.html','./instalar.html','./landing/equipo.webp','./landing/directo.webp','./landing/jugadora.webp','./landing/compartir.webp','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{await cache.addAll(CORE);for(const asset of OPTIONAL){try{await cache.add(asset)}catch(error){console.warn('Recurso opcional no cacheado',asset)}}}).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('estadisticas-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 const fallback=request.mode==='navigate'?'./index.html':request;
 event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response.ok&&response.type==='basic'&&!url.searchParams.has('token')){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(async()=>await caches.match(request)||await caches.match(fallback)||Response.error()));
});
