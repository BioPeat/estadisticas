#!/usr/bin/env node
/* D1 simulado: compatibilidad w2, CORS, stream, límites, caducidad y borrado. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const source=readFileSync(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const sha=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const flat=sql=>sql.replace(/\s+/g,' ').trim();
class Statement{
  constructor(db,sql,args=[]){this.db=db;this.sql=flat(sql);this.args=args}
  bind(...args){return new Statement(this.db,this.sql,args)}
  async run(){const s=this.sql,a=this.args,d=this.db.data;
    if(/^CREATE |^ALTER /.test(s))return {success:true};
    if(s.startsWith("INSERT INTO schema_meta")){d.schema=Number(a[0]);return {success:true};}
    if(s.startsWith('UPDATE access_tokens SET last_used_at')){const row=d.access.find(x=>x.id===a[1]);if(row)row.last_used_at=a[0];return {success:true};}
    if(s.startsWith('UPDATE team_access_tokens SET last_used_at')){const row=d.teamAccess.find(x=>x.id===a[1]);if(row)row.last_used_at=a[0];return {success:true};}
    if(s.startsWith('INSERT OR IGNORE INTO events')){if(!d.events.some(x=>x.id===a[0]))d.events.push({seq:d.events.length+1,id:a[0],at:a[1],type:a[2],payload:a[3],actor:a[4]});return {success:true};}
    if(s.startsWith('INSERT OR IGNORE INTO team_events')){if(!d.teamEvents.some(x=>x.team_id===a[0]&&x.id===a[1]))d.teamEvents.push({seq:d.teamEvents.length+1,team_id:a[0],id:a[1],at:a[2],type:a[3],payload:a[4],actor:a[5]});return {success:true};}
    if(s.startsWith('DELETE FROM team_events')){d.teamEvents=d.teamEvents.filter(x=>x.team_id!==a[0]);return {success:true};}
    if(s.startsWith('DELETE FROM team_access_tokens')){d.teamAccess=d.teamAccess.filter(x=>x.team_id!==a[0]);return {success:true};}
    if(s.startsWith('DELETE FROM teams')){d.teams=d.teams.filter(x=>x.id!==a[0]);return {success:true};}
    if(s.startsWith('DELETE FROM rate_limits'))return {success:true};
    if(s.startsWith('UPDATE team_access_tokens SET revoked_at')){const row=d.teamAccess.find(x=>x.team_id===a[1]&&x.id===a[2]&&x.id!==a[3]);if(row)row.revoked_at=a[0];return {success:true};}
    if(s.startsWith('UPDATE access_tokens SET revoked_at')){const row=d.access.find(x=>x.id===a[1]&&x.id!==a[2]);if(row)row.revoked_at=a[0];return {success:true};}
    throw Error(`run no simulado: ${s}`);
  }
  async first(){const s=this.sql,a=this.args,d=this.db.data;
    if(s.includes("FROM schema_meta WHERE key='version'"))return d.schema?{value:String(d.schema)}:null;
    if(s.startsWith('INSERT INTO rate_limits')){const [key,bucket,amount,updated_at]=a,row=d.rates.get(key);const next=!row||row.bucket!==bucket?{bucket,count:amount,updated_at}:{bucket,count:row.count+amount,updated_at};d.rates.set(key,next);return {...next};}
    if(s.includes('FROM access_tokens WHERE token_hash=')){const [digest,stamp]=a;return d.access.find(x=>x.token_hash===digest&&!x.revoked_at&&(!x.expires_at||x.expires_at>stamp))||null;}
    if(s.includes('FROM team_access_tokens WHERE team_id=')){const [team,digest,stamp]=a;return d.teamAccess.find(x=>x.team_id===team&&x.token_hash===digest&&!x.revoked_at&&(!x.expires_at||x.expires_at>stamp))||null;}
    if(s.startsWith('SELECT id,name,season,created_at,updated_at FROM teams'))return d.teams.find(x=>x.id===a[0])||null;
    if(s.startsWith('SELECT COUNT(*) n FROM access_tokens'))return {n:d.access.length};
    throw Error(`first no simulado: ${s}`);
  }
  async all(){const s=this.sql,a=this.args,d=this.db.data;
    if(s.includes('FROM events WHERE seq>'))return {results:d.events.filter(x=>x.seq>a[0]).slice(0,1000)};
    if(s.includes('FROM team_events WHERE team_id='))return {results:d.teamEvents.filter(x=>x.team_id===a[0]&&x.seq>a[1]).slice(0,1000)};
    if(s.includes('FROM team_access_tokens WHERE team_id='))return {results:d.teamAccess.filter(x=>x.team_id===a[0])};
    if(s.includes('FROM access_tokens ORDER BY'))return {results:d.access};
    throw Error(`all no simulado: ${s}`);
  }
}
class FakeD1{
  constructor(data){this.data={schema:3,access:[],events:[],teams:[],teamAccess:[],teamEvents:[],rates:new Map(),...data};}
  prepare(sql){return new Statement(this,sql)}
  async batch(statements){for(const statement of statements)await statement.run();return statements.map(()=>({success:true}));}
}
const legacyToken='legacy-test-token',adminToken='team-admin-token',expiredToken='expired-team-token';
const DB=new FakeD1({
  access:[{id:'legacy-admin',token_hash:await sha(legacyToken),role:'admin',label:'w2',expires_at:null,revoked_at:null}],
  events:[{seq:1,id:'old-event',at:'2026-11-17T10:00:00Z',type:'set-team',payload:'{"team":{"name":"Buen Consejo"}}',actor:'legacy-admin'}],
  teams:[{id:'team-1',name:'Equipo Uno',season:'26/27',created_at:'2026-01-01T00:00:00Z',updated_at:null},{id:'team-expired',name:'Caducado',season:'',created_at:'2026-01-01T00:00:00Z',updated_at:null}],
  teamAccess:[{id:'admin-1',team_id:'team-1',token_hash:await sha(adminToken),role:'admin',label:'Propietario',expires_at:null,revoked_at:null},{id:'expired-1',team_id:'team-expired',token_hash:await sha(expiredToken),role:'admin',label:'Viejo',expires_at:'2026-01-01T00:00:00Z',revoked_at:null}],
  teamEvents:[{seq:1,team_id:'team-1',id:'t-old',at:'2026-11-17T10:00:00Z',type:'set-team',payload:'{}',actor:'admin-1'}]
});
const env={DB,EVENT_REQUESTS_PER_MINUTE:'1',EVENTS_PER_HOUR:'3'};
const call=(path,{method='GET',origin='https://biopeat.github.io',token='',body,headers={}}={})=>worker.fetch(new Request(`https://worker.test${path}`,{method,headers:{...(origin?{Origin:origin}:{}),...(token?{Authorization:`Bearer ${token}`}:{ }),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body}),env);
let response=await call('/health');assert.equal(response.status,200);assert.equal((await response.json()).version,'w5-v12.3');assert.equal(response.headers.get('access-control-allow-origin'),'https://biopeat.github.io');
response=await call('/health',{origin:'https://evil.example'});assert.equal(response.status,403);assert.equal(response.headers.get('access-control-allow-origin'),null);
response=await call('/api/events?since=0',{token:legacyToken});assert.equal(response.status,200);assert.equal((await response.json()).events[0].event.payload.team.name,'Buen Consejo');
response=await call('/api/events',{method:'POST',token:legacyToken,body:JSON.stringify({events:[{id:'new-1',type:'set-team',payload:{team:{name:'BC'}}}]})});assert.equal(response.status,200);
response=await call('/api/events',{method:'POST',token:legacyToken,body:JSON.stringify({events:[{id:'new-2',type:'set-team',payload:{}}]})});assert.equal(response.status,429,'límite atómico por token/ruta');
response=await call('/api/v3/teams/team-expired',{token:expiredToken});assert.equal(response.status,401,'token caducado');
const huge=JSON.stringify({events:[],pad:'x'.repeat(2_000_100)});response=await call('/api/events',{method:'POST',token:legacyToken,body:huge});assert.equal(response.status,413,'límite real leyendo el stream');
response=await call('/api/events?since=abc',{token:legacyToken});assert.equal(response.status,200);assert.ok(Array.isArray((await response.json()).events),'since no numérico');
response=await call('/api/v3/teams/%E0%A4%A',{token:adminToken});assert.equal(response.status,400,'URI malformada devuelve 400');
response=await call('/api/v3/teams/team-1/typo',{method:'DELETE',token:adminToken});assert.notEqual(response.status,200,'ruta inválida no borra equipo');assert.equal(DB.data.teams.some(x=>x.id==='team-1'),true);
response=await call('/api/v3/teams/team-1/events/extra',{method:'GET',token:adminToken});assert.equal(response.status,404,'ruta events con item devuelve 404');
response=await call('/api/v3/teams/team-1',{method:'DELETE',token:adminToken});assert.equal(response.status,200);assert.equal(DB.data.teams.some(x=>x.id==='team-1'),false);assert.equal(DB.data.teamAccess.some(x=>x.team_id==='team-1'),false);assert.equal(DB.data.teamEvents.some(x=>x.team_id==='team-1'),false);
console.log('OK · Worker v12.3: w2, CORS, stream, rate limit, caducidad y borrado');
