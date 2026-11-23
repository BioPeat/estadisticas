/* Estadísticas v12.3 · Cloudflare Worker + D1. Rutas y tablas w2 intactas. Binding: DB. */
const SCHEMA_VERSION=4;
const MAX_BODY_BYTES=2_000_000;
const ALLOWED_EVENTS=new Set(['set-team','set-roster','replace-game','merge-game','live-upsert','live-event','live-undo','shot-set']);
const schemaPromises=new WeakMap();
const token=()=>[...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join('');
const cleanClientId=req=>{const raw=String(req.headers.get('X-Client-Id')||'').trim();return /^[A-Za-z0-9_-]{8,80}$/.test(raw)?raw:'';};
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const now=()=>new Date().toISOString();
const integer=(value,fallback,min=1,max=100000)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):fallback};

function allowedOrigin(origin,env){
  if(!origin)return true;
  if(origin==='https://biopeat.github.io')return true;
  if(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))return true;
  return String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean).includes(origin);
}
function responseHeaders(req,env,requestId){
  const origin=req.headers.get('Origin')||'';
  const headers={'Access-Control-Allow-Headers':'Authorization,Content-Type,X-Client-Id','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Content-Type':'application/json;charset=UTF-8','Cache-Control':'no-store','Vary':'Origin','X-Request-Id':requestId};
  if(origin&&allowedOrigin(origin,env))headers['Access-Control-Allow-Origin']=origin;
  return headers;
}
const json=(data,status,ctx)=>new Response(JSON.stringify(data),{status:status||200,headers:responseHeaders(ctx.req,ctx.env,ctx.requestId)});

async function readJson(req,limit=MAX_BODY_BYTES){
  const declared=Number(req.headers.get('Content-Length')||0);
  if(declared>limit)throw Object.assign(Error('Petición demasiado grande'),{status:413});
  if(!req.body)return {};
  const reader=req.body.getReader();let total=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){try{await reader.cancel()}catch(_){}throw Object.assign(Error('Petición demasiado grande'),{status:413});}chunks.push(value);}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  if(!total)return {};
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch(_){throw Object.assign(Error('JSON no válido'),{status:400});}
}
async function addColumn(db,sql){try{await db.prepare(sql).run()}catch(error){if(!/duplicate column|already exists/i.test(String(error?.message||error)))throw error;}}
async function runSchema(db){
  await db.prepare('CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)').run();
  const row=await db.prepare("SELECT value FROM schema_meta WHERE key='version'").first();
  if(Number(row?.value||0)>=SCHEMA_VERSION)return;
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS access_tokens (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, role TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL, revoked_at TEXT)'),
    db.prepare('CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, at TEXT NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL, actor TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, name TEXT NOT NULL, season TEXT, created_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS team_access_tokens (id TEXT PRIMARY KEY, team_id TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, role TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL, revoked_at TEXT, FOREIGN KEY(team_id) REFERENCES teams(id))'),
    db.prepare('CREATE TABLE IF NOT EXISTS team_events (seq INTEGER PRIMARY KEY AUTOINCREMENT, team_id TEXT NOT NULL, id TEXT NOT NULL, at TEXT NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL, actor TEXT NOT NULL, UNIQUE(team_id,id), FOREIGN KEY(team_id) REFERENCES teams(id))'),
    db.prepare('CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, bucket INTEGER NOT NULL, count INTEGER NOT NULL)')
  ]);
  await addColumn(db,'ALTER TABLE access_tokens ADD COLUMN last_used_at TEXT');
  await addColumn(db,'ALTER TABLE access_tokens ADD COLUMN expires_at TEXT');
  await addColumn(db,'ALTER TABLE team_access_tokens ADD COLUMN last_used_at TEXT');
  await addColumn(db,'ALTER TABLE team_access_tokens ADD COLUMN expires_at TEXT');
  await addColumn(db,'ALTER TABLE team_access_tokens ADD COLUMN bound_client_id TEXT');
  await addColumn(db,'ALTER TABLE team_access_tokens ADD COLUMN bound_at TEXT');
  await addColumn(db,'ALTER TABLE teams ADD COLUMN updated_at TEXT');
  await addColumn(db,'ALTER TABLE rate_limits ADD COLUMN updated_at TEXT');
  await db.batch([
    db.prepare('CREATE INDEX IF NOT EXISTS idx_team_access ON team_access_tokens(team_id,token_hash)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_team_events ON team_events(team_id,seq)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_rate_limits_updated ON rate_limits(updated_at)')
  ]);
  await db.prepare("INSERT INTO schema_meta(key,value,updated_at) VALUES('version',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(String(SCHEMA_VERSION),now()).run();
}
function ensureSchema(db){if(!schemaPromises.has(db))schemaPromises.set(db,runSchema(db).catch(error=>{schemaPromises.delete(db);throw error}));return schemaPromises.get(db);}
function expiry(env){const days=Number(env.TOKEN_TTL_DAYS||0);return Number.isFinite(days)&&days>0?new Date(Date.now()+days*86400000).toISOString():null;}
async function atomicLimit(env,key,max,seconds,amount=1){
  const bucket=Math.floor(Date.now()/1000/seconds),stamp=now(),id=await hash(key);
  const row=await env.DB.prepare('INSERT INTO rate_limits(key,bucket,count,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET bucket=excluded.bucket,count=CASE WHEN rate_limits.bucket=excluded.bucket THEN rate_limits.count+excluded.count ELSE excluded.count END,updated_at=excluded.updated_at RETURNING bucket,count').bind(id,bucket,amount,stamp).first();
  if(Math.random()<.02){const cutoff=new Date(Date.now()-7*86400000).toISOString();await env.DB.prepare('DELETE FROM rate_limits WHERE updated_at IS NOT NULL AND updated_at<?').bind(cutoff).run();}
  return Number(row?.count||amount)<=max;
}
async function auth(req,env){
  const raw=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return null;
  const digest=await hash(raw),stamp=now();
  const user=await env.DB.prepare('SELECT id,role,label,expires_at FROM access_tokens WHERE token_hash=? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>?)').bind(digest,stamp).first();
  if(user)await env.DB.prepare('UPDATE access_tokens SET last_used_at=? WHERE id=?').bind(stamp,user.id).run();
  return user||null;
}
async function teamAuth(req,env,teamId){
  const raw=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return null;
  const digest=await hash(raw),stamp=now();
  const user=await env.DB.prepare('SELECT id,team_id,role,label,expires_at,bound_client_id,bound_at FROM team_access_tokens WHERE team_id=? AND token_hash=? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>?)').bind(teamId,digest,stamp).first();
  if(!user)return null;
  if(user.role==='editor'){
    const cid=cleanClientId(req);
    if(user.bound_client_id){
      if(!cid||user.bound_client_id!==cid)throw Object.assign(Error('Este enlace de edición es individual y ya está en uso en otro dispositivo. Pide un enlace nuevo al propietario.'),{status:403});
    }else if(cid){
      await env.DB.prepare('UPDATE team_access_tokens SET bound_client_id=?, bound_at=? WHERE id=? AND bound_client_id IS NULL').bind(cid,stamp,user.id).run();
      const check=await env.DB.prepare('SELECT bound_client_id,bound_at FROM team_access_tokens WHERE id=?').bind(user.id).first();
      if(check?.bound_client_id&&check.bound_client_id!==cid)throw Object.assign(Error('Este enlace de edición es individual y ya está en uso en otro dispositivo. Pide un enlace nuevo al propietario.'),{status:403});
      user.bound_client_id=cid;
      user.bound_at=check?.bound_at||stamp;
    }
  }
  await env.DB.prepare('UPDATE team_access_tokens SET last_used_at=? WHERE id=?').bind(stamp,user.id).run();
  return user;
}
async function makeAccess(env,role,label=''){const raw=token(),id=crypto.randomUUID(),createdAt=now();await env.DB.prepare('INSERT INTO access_tokens(id,token_hash,role,label,created_at,expires_at) VALUES(?,?,?,?,?,?)').bind(id,await hash(raw),role,label.slice(0,100),createdAt,expiry(env)).run();return {id,role,label:label.slice(0,100),token:raw};}
async function makeTeamAccess(env,teamId,role,label=''){const raw=token(),id=crypto.randomUUID(),createdAt=now();await env.DB.prepare('INSERT INTO team_access_tokens(id,team_id,token_hash,role,label,created_at,expires_at) VALUES(?,?,?,?,?,?,?)').bind(id,teamId,await hash(raw),role,label.slice(0,100),createdAt,expiry(env)).run();return {id,role,label:label.slice(0,100),token:raw};}
function safeDecode(value){try{return decodeURIComponent(value);}catch(_){throw Object.assign(Error('Ruta no válida'),{status:400});}}
function teamPath(path){const match=path.match(/^\/api\/v3\/teams\/([^/]+)(?:\/(events|invites)(?:\/([^/]+))?)?$/);return match?{teamId:safeDecode(match[1]),part:match[2]||'',item:match[3]?safeDecode(match[3]):''}:null;}
function validEvents(body){
  if(!Array.isArray(body.events))throw Object.assign(Error('Falta la lista de eventos'),{status:400});
  if(body.events.length>300)throw Object.assign(Error('Máximo 300 eventos por petición'),{status:413});
  return body.events.map(event=>{if(!event||typeof event.id!=='string'||!event.id||event.id.length>120||!ALLOWED_EVENTS.has(String(event.type)))throw Object.assign(Error('Evento no válido'),{status:400});const payload=JSON.stringify(event.payload||{});if(payload.length>250000)throw Object.assign(Error('Evento demasiado grande'),{status:413});return {...event,payload};});
}
async function eventLimits(env,user,scope,count){
  const requests=integer(env.EVENT_REQUESTS_PER_MINUTE,90,1,10000),quota=integer(env.EVENTS_PER_HOUR,5000,1,100000);
  if(!await atomicLimit(env,`events:req:${scope}:${user.id}`,requests,60,1))throw Object.assign(Error('Demasiadas peticiones de eventos. Inténtalo en un minuto.'),{status:429});
  if(!await atomicLimit(env,`events:quota:${scope}:${user.id}`,quota,3600,Math.max(1,count)))throw Object.assign(Error('Cuota temporal de eventos superada. Espera antes de sincronizar de nuevo.'),{status:429});
}
async function postEvents(ctx,user,scope,table,teamId=''){
  if(user.role==='viewer')return json({error:'Este enlace es de solo lectura'},403,ctx);
  const events=validEvents(await readJson(ctx.req));await eventLimits(ctx.env,user,scope,events.length);
  const statements=events.map(event=>teamId?ctx.env.DB.prepare('INSERT OR IGNORE INTO team_events(team_id,id,at,type,payload,actor) VALUES(?,?,?,?,?,?)').bind(teamId,event.id,String(event.at||now()),String(event.type),event.payload,user.id):ctx.env.DB.prepare('INSERT OR IGNORE INTO events(id,at,type,payload,actor) VALUES(?,?,?,?,?)').bind(event.id,String(event.at||now()),String(event.type),event.payload,user.id));
  if(statements.length)await ctx.env.DB.batch(statements);return json({ok:true,accepted:statements.length},200,ctx);
}
async function handle(ctx){
  const {req,env}=ctx,url=new URL(req.url),path=url.pathname;
  if(!allowedOrigin(req.headers.get('Origin')||'',env))return json({error:'Origen no permitido'},403,ctx);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:responseHeaders(req,env,ctx.requestId)});
  if(!env.DB)return json({error:'Falta el binding D1 llamado DB'},500,ctx);
  await ensureSchema(env.DB);
  if(path==='/health')return json({ok:true,version:'w5-v12.3',legacy:'w2-compatible',multiteam:true,setupRequired:false,schemaVersion:SCHEMA_VERSION,editorBinding:true},200,ctx);
  if(path==='/api/v3/teams'&&req.method==='POST'){
    if(String(env.PUBLIC_TEAM_CREATION||'true').toLowerCase()==='false')return json({error:'La creación pública de equipos está desactivada'},403,ctx);
    const ip=req.headers.get('CF-Connecting-IP')||'unknown';if(!await atomicLimit(env,`create-team:${ip}`,integer(env.TEAMS_PER_HOUR,20),3600))return json({error:'Demasiados equipos creados desde esta conexión. Inténtalo más tarde.'},429,ctx);
    const body=await readJson(req),name=String(body.name||'').trim().slice(0,100),season=String(body.season||'').trim().slice(0,40);if(!name)return json({error:'Falta el nombre del equipo'},400,ctx);
    const id=crypto.randomUUID(),createdAt=now();await env.DB.prepare('INSERT INTO teams(id,name,season,created_at,updated_at) VALUES(?,?,?,?,?)').bind(id,name,season,createdAt,createdAt).run();
    return json({team:{id,name,season,createdAt},admin:await makeTeamAccess(env,id,'admin','Propietario')},201,ctx);
  }
  const scoped=teamPath(path);
  if(scoped){
    const user=await teamAuth(req,env,scoped.teamId);if(!user)return json({error:'Enlace no válido, caducado, revocado o de otro equipo'},401,ctx);
    if(!scoped.part&&!scoped.item&&req.method==='GET'){const team=await env.DB.prepare('SELECT id,name,season,created_at,updated_at FROM teams WHERE id=?').bind(scoped.teamId).first();return team?json({team,role:user.role},200,ctx):json({error:'Equipo no encontrado'},404,ctx);}
    if(!scoped.part&&!scoped.item&&req.method==='DELETE'){
      if(user.role!=='admin')return json({error:'Solo el propietario puede borrar el equipo'},403,ctx);
      await env.DB.batch([env.DB.prepare('DELETE FROM team_events WHERE team_id=?').bind(scoped.teamId),env.DB.prepare('DELETE FROM team_access_tokens WHERE team_id=?').bind(scoped.teamId),env.DB.prepare('DELETE FROM teams WHERE id=?').bind(scoped.teamId)]);
      return json({ok:true,deleted:true},200,ctx);
    }
    if(scoped.part==='events'&&!scoped.item&&req.method==='GET'){const since=integer(url.searchParams.get('since'),0,0,Number.MAX_SAFE_INTEGER);const {results}=await env.DB.prepare('SELECT seq,id,at,type,payload,actor FROM team_events WHERE team_id=? AND seq>? ORDER BY seq ASC LIMIT 1000').bind(scoped.teamId,since).all();const events=results.map(row=>({seq:row.seq,event:{id:row.id,at:row.at,type:row.type,payload:JSON.parse(row.payload)},actor:row.actor}));return json({events,lastSeq:events.at(-1)?.seq||since},200,ctx);}
    if(scoped.part==='events'&&!scoped.item&&req.method==='POST')return postEvents(ctx,user,`team:${scoped.teamId}`,'team_events',scoped.teamId);
    if(scoped.part==='invites'&&!scoped.item&&req.method==='GET'){if(user.role!=='admin')return json({error:'Solo administrador'},403,ctx);const {results}=await env.DB.prepare('SELECT id,role,label,created_at,last_used_at,expires_at,revoked_at,bound_at FROM team_access_tokens WHERE team_id=? ORDER BY created_at DESC').bind(scoped.teamId).all();return json({invites:results},200,ctx);}
    if(scoped.part==='invites'&&!scoped.item&&req.method==='POST'){if(user.role!=='admin')return json({error:'Solo administrador'},403,ctx);if(!await atomicLimit(env,`invite:${scoped.teamId}:${user.id}`,integer(env.INVITES_PER_HOUR,100),3600))return json({error:'Demasiados enlaces. Inténtalo más tarde.'},429,ctx);const body=await readJson(req),role=['editor','viewer'].includes(body.role)?body.role:'viewer';return json(await makeTeamAccess(env,scoped.teamId,role,String(body.label||'')),201,ctx);}
    if(scoped.part==='invites'&&scoped.item&&req.method==='DELETE'){if(user.role!=='admin')return json({error:'Solo administrador'},403,ctx);await env.DB.prepare('UPDATE team_access_tokens SET revoked_at=? WHERE team_id=? AND id=? AND id<>?').bind(now(),scoped.teamId,scoped.item,user.id).run();return json({ok:true},200,ctx);}
    return json({error:'Ruta de equipo no encontrada'},404,ctx);
  }
  /* w2 intacto: conserva datos, tokens y enlaces existentes. No hace falta usar /api/setup al actualizar. */
  if(path==='/api/setup'&&req.method==='POST'){const count=(await env.DB.prepare('SELECT COUNT(*) n FROM access_tokens').first()).n;if(count>0)return json({error:'La configuración inicial ya se hizo'},409,ctx);const body=await readJson(req);if(!env.SETUP_SECRET||body.secret!==env.SETUP_SECRET)return json({error:'Secreto de configuración incorrecto'},403,ctx);return json({admin:await makeAccess(env,'admin','Administrador inicial'),editor:await makeAccess(env,'editor','Enlace de edición'),viewer:await makeAccess(env,'viewer','Enlace de lectura')},200,ctx);}
  const user=await auth(req,env);if(!user)return json({error:'Enlace no válido, caducado o revocado'},401,ctx);
  if(path==='/api/events'&&req.method==='GET'){const since=integer(url.searchParams.get('since'),0,0,Number.MAX_SAFE_INTEGER);const {results}=await env.DB.prepare('SELECT seq,id,at,type,payload,actor FROM events WHERE seq>? ORDER BY seq ASC LIMIT 1000').bind(since).all();const events=results.map(row=>({seq:row.seq,event:{id:row.id,at:row.at,type:row.type,payload:JSON.parse(row.payload)},actor:row.actor}));return json({events,lastSeq:events.at(-1)?.seq||since},200,ctx);}
  if(path==='/api/events'&&req.method==='POST')return postEvents(ctx,user,'legacy:w2','events');
  if(path==='/api/invites'&&req.method==='GET'){if(user.role!=='admin')return json({error:'Solo administrador'},403,ctx);const {results}=await env.DB.prepare('SELECT id,role,label,created_at,last_used_at,expires_at,revoked_at FROM access_tokens ORDER BY created_at DESC').all();return json({invites:results},200,ctx);}
  if(path==='/api/invites'&&req.method==='POST'){if(user.role!=='admin')return json({error:'Solo administrador'},403,ctx);const body=await readJson(req),role=['editor','viewer'].includes(body.role)?body.role:'viewer';return json(await makeAccess(env,role,String(body.label||'')),201,ctx);}
  if(path.startsWith('/api/invites/')&&req.method==='DELETE'){if(user.role!=='admin')return json({error:'Solo administrador'},403,ctx);await env.DB.prepare('UPDATE access_tokens SET revoked_at=? WHERE id=? AND id<>?').bind(now(),safeDecode(path.split('/').pop()),user.id).run();return json({ok:true},200,ctx);}
  return json({error:'Ruta no encontrada'},404,ctx);
}
export default {async fetch(req,env){
  const requestId=crypto.randomUUID(),started=Date.now(),ctx={req,env,requestId};let response;
  try{response=await handle(ctx);}catch(error){const status=integer(error?.status,500,400,599);console.error(JSON.stringify({requestId,method:req.method,path:new URL(req.url).pathname,status,error:String(error?.message||error)}));response=json({error:status===500?'Error del servidor':String(error?.message||'Error')},status,ctx);}
  console.log(JSON.stringify({requestId,method:req.method,path:new URL(req.url).pathname,status:response.status,durationMs:Date.now()-started}));return response;
}};
