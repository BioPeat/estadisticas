/* Estadísticas v11 · Cloudflare Worker + D1. Compatible con rutas y tablas v2. Binding: DB. */
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Content-Type':'application/json;charset=UTF-8'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:CORS});
const token=()=>[...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join('');
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function schema(db){await db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS access_tokens (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, role TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL, revoked_at TEXT)'),
 db.prepare('CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, at TEXT NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL, actor TEXT NOT NULL)'),
 db.prepare('CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, name TEXT NOT NULL, season TEXT, created_at TEXT NOT NULL)'),
 db.prepare('CREATE TABLE IF NOT EXISTS team_access_tokens (id TEXT PRIMARY KEY, team_id TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, role TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL, revoked_at TEXT, FOREIGN KEY(team_id) REFERENCES teams(id))'),
 db.prepare('CREATE INDEX IF NOT EXISTS idx_team_access ON team_access_tokens(team_id,token_hash)'),
 db.prepare('CREATE TABLE IF NOT EXISTS team_events (seq INTEGER PRIMARY KEY AUTOINCREMENT, team_id TEXT NOT NULL, id TEXT NOT NULL, at TEXT NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL, actor TEXT NOT NULL, UNIQUE(team_id,id), FOREIGN KEY(team_id) REFERENCES teams(id))'),
 db.prepare('CREATE INDEX IF NOT EXISTS idx_team_events ON team_events(team_id,seq)')
])}
async function auth(req,env){const raw=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return null;return await env.DB.prepare('SELECT id,role,label FROM access_tokens WHERE token_hash=? AND revoked_at IS NULL').bind(await hash(raw)).first()||null}
async function teamAuth(req,env,teamId){const raw=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return null;return await env.DB.prepare('SELECT id,team_id,role,label FROM team_access_tokens WHERE team_id=? AND token_hash=? AND revoked_at IS NULL').bind(teamId,await hash(raw)).first()||null}
async function makeAccess(env,role,label=''){const raw=token(),id=crypto.randomUUID();await env.DB.prepare('INSERT INTO access_tokens(id,token_hash,role,label,created_at) VALUES(?,?,?,?,?)').bind(id,await hash(raw),role,label,new Date().toISOString()).run();return {id,role,label,token:raw}}
async function makeTeamAccess(env,teamId,role,label=''){const raw=token(),id=crypto.randomUUID();await env.DB.prepare('INSERT INTO team_access_tokens(id,team_id,token_hash,role,label,created_at) VALUES(?,?,?,?,?,?)').bind(id,teamId,await hash(raw),role,label,new Date().toISOString()).run();return {id,role,label,token:raw}}
function teamPath(path){const match=path.match(/^\/api\/v3\/teams\/([^/]+)(?:\/(events|invites))?(?:\/([^/]+))?$/);return match?{teamId:decodeURIComponent(match[1]),part:match[2]||'',item:match[3]?decodeURIComponent(match[3]):''}:null}
export default {async fetch(req,env){
 if(req.method==='OPTIONS')return new Response(null,{headers:CORS});
 if(!env.DB)return json({error:'Falta el binding D1 llamado DB'},500);
 await schema(env.DB);const url=new URL(req.url),path=url.pathname;
 try{
  if(path==='/health')return json({ok:true,version:'w3',legacy:'w2-compatible',multiteam:true});
  if(path==='/api/v3/teams'&&req.method==='POST'){
   if(String(env.PUBLIC_TEAM_CREATION||'true').toLowerCase()==='false')return json({error:'La creación pública de equipos está desactivada'},403);
   const body=await req.json(),name=String(body.name||'').trim().slice(0,100),season=String(body.season||'').trim().slice(0,40);if(!name)return json({error:'Falta el nombre del equipo'},400);
   const id=crypto.randomUUID(),createdAt=new Date().toISOString();await env.DB.prepare('INSERT INTO teams(id,name,season,created_at) VALUES(?,?,?,?)').bind(id,name,season,createdAt).run();
   return json({team:{id,name,season,createdAt},admin:await makeTeamAccess(env,id,'admin','Propietario')},201);
  }
  const scoped=teamPath(path);
  if(scoped){
   const user=await teamAuth(req,env,scoped.teamId);if(!user)return json({error:'Enlace no válido, revocado o de otro equipo'},401);
   if(!scoped.part&&req.method==='GET'){const team=await env.DB.prepare('SELECT id,name,season,created_at FROM teams WHERE id=?').bind(scoped.teamId).first();return team?json({team,role:user.role}):json({error:'Equipo no encontrado'},404)}
   if(scoped.part==='events'&&req.method==='GET'){
    const since=Math.max(0,Number(url.searchParams.get('since')||0));const {results}=await env.DB.prepare('SELECT seq,id,at,type,payload,actor FROM team_events WHERE team_id=? AND seq>? ORDER BY seq ASC LIMIT 1000').bind(scoped.teamId,since).all();const events=results.map(r=>({seq:r.seq,event:{id:r.id,at:r.at,type:r.type,payload:JSON.parse(r.payload)},actor:r.actor}));return json({events,lastSeq:events.at(-1)?.seq||since});
   }
   if(scoped.part==='events'&&req.method==='POST'){
    if(user.role==='viewer')return json({error:'Este enlace es de solo lectura'},403);const body=await req.json(),events=Array.isArray(body.events)?body.events:[];const stmts=events.slice(0,300).map(e=>env.DB.prepare('INSERT OR IGNORE INTO team_events(team_id,id,at,type,payload,actor) VALUES(?,?,?,?,?,?)').bind(scoped.teamId,String(e.id),String(e.at||new Date().toISOString()),String(e.type),JSON.stringify(e.payload||{}),user.id));if(stmts.length)await env.DB.batch(stmts);return json({ok:true,accepted:stmts.length});
   }
   if(scoped.part==='invites'&&!scoped.item&&req.method==='GET'){
    if(user.role!=='admin')return json({error:'Solo administrador'},403);const {results}=await env.DB.prepare('SELECT id,role,label,created_at,revoked_at FROM team_access_tokens WHERE team_id=? ORDER BY created_at DESC').bind(scoped.teamId).all();return json({invites:results});
   }
   if(scoped.part==='invites'&&!scoped.item&&req.method==='POST'){
    if(user.role!=='admin')return json({error:'Solo administrador'},403);const body=await req.json(),role=['editor','viewer'].includes(body.role)?body.role:'viewer';return json(await makeTeamAccess(env,scoped.teamId,role,String(body.label||'').slice(0,100)),201);
   }
   if(scoped.part==='invites'&&scoped.item&&req.method==='DELETE'){
    if(user.role!=='admin')return json({error:'Solo administrador'},403);await env.DB.prepare('UPDATE team_access_tokens SET revoked_at=? WHERE team_id=? AND id=? AND id<>?').bind(new Date().toISOString(),scoped.teamId,scoped.item,user.id).run();return json({ok:true});
   }
   return json({error:'Ruta de equipo no encontrada'},404);
  }
  /* v2 se conserva: no se cambian datos, tokens ni enlaces existentes. */
  if(path==='/api/setup'&&req.method==='POST'){
   const count=(await env.DB.prepare('SELECT COUNT(*) n FROM access_tokens').first()).n;if(count>0)return json({error:'La configuración inicial ya se hizo'},409);const body=await req.json();if(!env.SETUP_SECRET||body.secret!==env.SETUP_SECRET)return json({error:'Secreto de configuración incorrecto'},403);return json({admin:await makeAccess(env,'admin','Administrador inicial'),editor:await makeAccess(env,'editor','Enlace de edición'),viewer:await makeAccess(env,'viewer','Enlace de lectura')});
  }
  const user=await auth(req,env);if(!user)return json({error:'Enlace no válido o revocado'},401);
  if(path==='/api/events'&&req.method==='GET'){
   const since=Math.max(0,Number(url.searchParams.get('since')||0));const {results}=await env.DB.prepare('SELECT seq,id,at,type,payload,actor FROM events WHERE seq>? ORDER BY seq ASC LIMIT 1000').bind(since).all();const events=results.map(r=>({seq:r.seq,event:{id:r.id,at:r.at,type:r.type,payload:JSON.parse(r.payload)},actor:r.actor}));return json({events,lastSeq:events.at(-1)?.seq||since});
  }
  if(path==='/api/events'&&req.method==='POST'){
   if(user.role==='viewer')return json({error:'Este enlace es de solo lectura'},403);const body=await req.json(),events=Array.isArray(body.events)?body.events:[];const stmts=events.slice(0,300).map(e=>env.DB.prepare('INSERT OR IGNORE INTO events(id,at,type,payload,actor) VALUES(?,?,?,?,?)').bind(String(e.id),String(e.at||new Date().toISOString()),String(e.type),JSON.stringify(e.payload||{}),user.id));if(stmts.length)await env.DB.batch(stmts);return json({ok:true,accepted:stmts.length});
  }
  if(path==='/api/invites'&&req.method==='GET'){if(user.role!=='admin')return json({error:'Solo administrador'},403);const {results}=await env.DB.prepare('SELECT id,role,label,created_at,revoked_at FROM access_tokens ORDER BY created_at DESC').all();return json({invites:results})}
  if(path==='/api/invites'&&req.method==='POST'){if(user.role!=='admin')return json({error:'Solo administrador'},403);const body=await req.json(),role=['editor','viewer'].includes(body.role)?body.role:'viewer';return json(await makeAccess(env,role,String(body.label||'')),201)}
  if(path.startsWith('/api/invites/')&&req.method==='DELETE'){if(user.role!=='admin')return json({error:'Solo administrador'},403);await env.DB.prepare('UPDATE access_tokens SET revoked_at=? WHERE id=? AND id<>?').bind(new Date().toISOString(),decodeURIComponent(path.split('/').pop()),user.id).run();return json({ok:true})}
  return json({error:'Ruta no encontrada'},404);
 }catch(e){return json({error:'Error del servidor',detail:String(e.message||e)},500)}
}};
