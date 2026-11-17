const CACHE='estadisticas-v12-20261117b';
const ASSETS=['./','./index.html','./styles.css?v=12','./app.js?v=12','./config.js?v=12','./manifest.json?v=12','./configurar.html','./actualizar.html','./instalar.html','./landing/equipo.webp','./landing/directo.webp','./landing/jugadora.webp','./landing/compartir.webp','./assets/jszip.min.js','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{for(const asset of ASSETS){try{await cache.add(asset)}catch(error){/* assets se conservan en GitHub aunque no viajen en el ZIP */}}}).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 const fallback=request.mode==='navigate'?'./index.html':request;
 event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response.ok&&response.type==='basic')caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response}).catch(async()=>await caches.match(request)||await caches.match(fallback)||Response.error()));
});
