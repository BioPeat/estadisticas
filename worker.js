/* Estadísticas v2 · Cloudflare Worker + D1. Binding requerido: DB. Variable: SETUP_SECRET. */
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Content-Type':'application/json;charset=UTF-8'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:CORS});
const token=()=>[...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join('');
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function schema(db){await db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS access_tokens (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, role TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL, revoked_at TEXT)'),
 db.prepare('CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, at TEXT NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL, actor TEXT NOT NULL)')
])}
async function auth(req,env){const raw=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return null;const row=await env.DB.prepare('SELECT id,role,label FROM access_tokens WHERE token_hash=? AND revoked_at IS NULL').bind(await hash(raw)).first();return row||null}
async function makeAccess(env,role,label=''){const raw=token(),id=crypto.randomUUID();await env.DB.prepare('INSERT INTO access_tokens(id,token_hash,role,label,created_at) VALUES(?,?,?,?,?)').bind(id,await hash(raw),role,label,new Date().toISOString()).run();return {id,role,label,token:raw}}
export default {async fetch(req,env){
 if(req.method==='OPTIONS')return new Response(null,{headers:CORS});
 if(!env.DB)return json({error:'Falta el binding D1 llamado DB'},500);
 await schema(env.DB);const url=new URL(req.url),path=url.pathname;
 try{
  if(path==='/health')return json({ok:true,version:'w2'});
  if(path==='/api/setup'&&req.method==='POST'){
   const count=(await env.DB.prepare('SELECT COUNT(*) n FROM access_tokens').first()).n;if(count>0)return json({error:'La configuración inicial ya se hizo'},409);
   const body=await req.json();if(!env.SETUP_SECRET||body.secret!==env.SETUP_SECRET)return json({error:'Secreto de configuración incorrecto'},403);
   return json({admin:await makeAccess(env,'admin','Administrador inicial'),editor:await makeAccess(env,'editor','Enlace de edición'),viewer:await makeAccess(env,'viewer','Enlace de lectura')});
  }
  const user=await auth(req,env);if(!user)return json({error:'Enlace no válido o revocado'},401);
  if(path==='/api/events'&&req.method==='GET'){
   const since=Math.max(0,Number(url.searchParams.get('since')||0));const {results}=await env.DB.prepare('SELECT seq,id,at,type,payload,actor FROM events WHERE seq>? ORDER BY seq ASC LIMIT 1000').bind(since).all();const events=results.map(r=>({seq:r.seq,event:{id:r.id,at:r.at,type:r.type,payload:JSON.parse(r.payload)},actor:r.actor}));return json({events,lastSeq:events.at(-1)?.seq||since});
  }
  if(path==='/api/events'&&req.method==='POST'){
   if(user.role==='viewer')return json({error:'Este enlace es de solo lectura'},403);const body=await req.json(),events=Array.isArray(body.events)?body.events:[];
   const stmts=events.slice(0,300).map(e=>env.DB.prepare('INSERT OR IGNORE INTO events(id,at,type,payload,actor) VALUES(?,?,?,?,?)').bind(String(e.id),String(e.at||new Date().toISOString()),String(e.type),JSON.stringify(e.payload||{}),user.id));if(stmts.length)await env.DB.batch(stmts);return json({ok:true,accepted:stmts.length});
  }
  if(path==='/api/invites'&&req.method==='GET'){
   if(user.role!=='admin')return json({error:'Solo administrador'},403);const {results}=await env.DB.prepare('SELECT id,role,label,created_at,revoked_at FROM access_tokens ORDER BY created_at DESC').all();return json({invites:results});
  }
  if(path==='/api/invites'&&req.method==='POST'){
   if(user.role!=='admin')return json({error:'Solo administrador'},403);const body=await req.json(),role=['editor','viewer'].includes(body.role)?body.role:'viewer';return json(await makeAccess(env,role,String(body.label||'')),201);
  }
  if(path.startsWith('/api/invites/')&&req.method==='DELETE'){
   if(user.role!=='admin')return json({error:'Solo administrador'},403);await env.DB.prepare('UPDATE access_tokens SET revoked_at=? WHERE id=? AND id<>?').bind(new Date().toISOString(),decodeURIComponent(path.split('/').pop()),user.id).run();return json({ok:true});
  }
  return json({error:'Ruta no encontrada'},404);
 }catch(e){return json({error:'Error del servidor',detail:String(e.message||e)},500)}
}};
