/* Estadísticas v7 · Buen Consejo 26/27 · local-first */
'use strict';

const APP_VERSION = 'v7';
const STORE = 'estadisticas_shared_v2';
const TEAM = 'BUEN CONSEJO';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, Number(n) || 0));
const num = (n, d = 1) => Number.isFinite(+n) ? (+n).toLocaleString('es-ES', {minimumFractionDigits:d, maximumFractionDigits:d}) : '—';
const pct = n => Number.isFinite(+n) ? `${num(n, 0)}%` : '—';
const signed = n => Number.isFinite(+n) ? `${+n > 0 ? '+' : ''}${num(n)}` : '—';
const today = () => new Date().toISOString().slice(0, 10);
const minutes = s => { if (typeof s === 'number') return s; const [m, x] = String(s || '0').split(':').map(Number); return (m || 0) + (x || 0) / 60; };
const formatMinutes = v => { const total = Math.max(0, Math.round((+v || 0) * 60)); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`; };
const parseAI = s => { const [m, a] = String(s || '0/0').split('/').map(Number); return {m:m || 0, a:a || 0}; };
const sum = (arr, getter) => arr.reduce((a, x) => a + (+getter(x) || 0), 0);
const mean = (arr, getter) => arr.length ? sum(arr, getter) / arr.length : null;
const deepSignature = x => JSON.stringify(x);

/* ── State, migration and persistence ───────────────────────────── */
function blank() {
  return {
    version: 7,
    team: {name:'Buen Consejo', season:'26/27'},
    roster: [], games: [], live: null,
    liveDraft: {rival:'', date:today(), selected:[]},
    ops: [], lastSeq: 0,
    settings: {api:'', token:'', role:'admin', shotSide:'auto', shotColor:'por confirmar', rivalColor:'por confirmar'}
  };
}

let state = load();
let view = 'team';
let modalContext = null;
let fileMode = 'games';
let installPrompt = null;
let toastTimer;
let syncing = false;
let syncTimer;
let renderAfterEdit = false;
let playerSort = 'pts';
let playerSortDir = -1;
let minutesScope = 'season';

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved) return sanitise(saved);
    for (const key of ['estadisticas_v1', 'estadisticas_app_v1', 'basket_stats_v1']) {
      const old = JSON.parse(localStorage.getItem(key) || 'null');
      if (old) return migrateV1(old);
    }
  } catch (error) { console.warn('No se pudo leer la copia local', error); }
  return blank();
}

function legacyPlayer(p = {}) {
  const p2 = parseAI(p.p2ai || p.twoAI || p.twoPoints || '0/0');
  const p3 = parseAI(p.p3ai || p.threeAI || p.threePoints || '0/0');
  const ft = parseAI(p.ftai || p.freeAI || p.freeThrows || '0/0');
  return {
    ...p,
    id: p.id || uid(), number: String(p.number ?? p.num ?? ''), name: String(p.name || '').trim(),
    min: Number.isFinite(+p.min) ? +p.min : minutes(p.minRaw || p.minutes), minRaw: p.minRaw || p.minutes || '',
    pts: +(p.pts ?? p.points) || 0,
    p2m: +(p.p2m ?? p.twoMade ?? p2.m) || 0, p2a: +(p.p2a ?? p.twoAttempted ?? p2.a) || 0,
    p3m: +(p.p3m ?? p.threeMade ?? p3.m) || 0, p3a: +(p.p3a ?? p.threeAttempted ?? p3.a) || 0,
    ftm: +(p.ftm ?? p.freeMade ?? ft.m) || 0, fta: +(p.fta ?? p.freeAttempted ?? ft.a) || 0,
    rebDef: +(p.rebDef ?? p.defReb) || 0, rebOff: +(p.rebOff ?? p.offReb) || 0,
    rebTot: +(p.rebTot ?? p.rebounds) || 0, ast: +(p.ast ?? p.assists) || 0,
    rec: +(p.rec ?? p.steals) || 0, per: +(p.per ?? p.turnovers) || 0,
    tapTc: +(p.tapTc ?? p.blocksMade) || 0, tapTr: +(p.tapTr ?? p.blocksReceived) || 0,
    fouls: +(p.fouls ?? p.fal ?? p.foulsCommitted) || 0,
    foulsDrawn: +(p.foulsDrawn ?? p.fr) || 0, val: +(p.val ?? p.rating) || 0, pm: +(p.pm ?? p.plusMinus) || 0,
    p2ai: `${+(p.p2m ?? p.twoMade ?? p2.m) || 0}/${+(p.p2a ?? p.twoAttempted ?? p2.a) || 0}`,
    p3ai: `${+(p.p3m ?? p.threeMade ?? p3.m) || 0}/${+(p.p3a ?? p.threeAttempted ?? p3.a) || 0}`,
    ftai: `${+(p.ftm ?? p.freeMade ?? ft.m) || 0}/${+(p.fta ?? p.freeAttempted ?? ft.a) || 0}`
  };
}

function hasLegacyFields(g) {
  return [...(g.players || []), ...(g.opponentPlayers || [])].some(p =>
    ['points','twoMade','threeMade','freeMade','minutes','fal','fr','rating','plusMinus'].some(k => Object.hasOwn(p, k))
  );
}

function sanitise(s) {
  const base = blank();
  const out = {...base, ...s, version:7, team:{...base.team, ...(s.team || {})}, settings:{...base.settings, ...(s.settings || {})}};
  out.roster = (s.roster || []).filter(p => p?.name).map(p => ({...p, id:p.id || uid(), number:String(p.number || '')}));
  out.games = (s.games || []).filter(g => g && !g.demo && !g.isDemo && !['DEMO','EJEMPLO'].some(x => norm(g.opponent).includes(x))).map(g => {
    const pair = splitLegacyShots(g);
    const players = (g.players || []).filter(p => p?.name).map(legacyPlayer);
    const opponentPlayers = (g.opponentPlayers || g.rivalPlayers || []).filter(p => p?.name).map(legacyPlayer);
    const needsReimport = g.source !== 'live-pending' && (!!g.needsReimport || !opponentPlayers.length || !g.teamTotals || !g.opponentTotals || hasLegacyFields(g));
    return {
      ...g, id:g.id || uid(), players, opponentPlayers,
      teamTotals:g.teamTotals ? legacyPlayer(g.teamTotals) : null,
      opponentTotals:g.opponentTotals ? legacyPlayer(g.opponentTotals) : null,
      events:(g.events || []).filter(e => !e.demo && !e.seed),
      shotsFor:pair.for, shotsAgainst:pair.against, shots:undefined,
      needsReimport,
      availability:{boxscore:players.length > 0, opponentBoxscore:opponentPlayers.length > 0, manual:!!(g.events || []).length, shotMap:!!(pair.for.length || pair.against.length), ...(g.availability || {})}
    };
  });
  out.liveDraft = {...base.liveDraft, ...(s.liveDraft || {})};
  if (!Array.isArray(out.liveDraft.selected)) out.liveDraft.selected = [];
  if (!out.liveDraft.date) out.liveDraft.date = today();
  return out;
}

function migrateV1(old) {
  const out = blank();
  out.roster = (old.roster || old.players || []).filter(p => p?.name).map(p => ({id:p.id || uid(), number:p.number || p.num || '', name:p.name}));
  out.games = (old.games || old.matches || []).filter(g => g?.imported || g?.source === 'fbm' || g?.actaHash).map(g => ({...g, id:g.id || uid(), source:'fbm', needsReimport:true}));
  localStorage.setItem(STORE, JSON.stringify(out));
  return sanitise(out);
}

function save() { state.version = 7; localStorage.setItem(STORE, JSON.stringify(state)); }
function record(type, payload) { state.ops.push({id:uid(), at:new Date().toISOString(), type, payload}); save(); paintSync(); scheduleSync(); }
function toast(message) { const t = $('#toast'); t.textContent = message; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }
function setView(next) { view = next; $$('[data-go]').forEach(b => b.setAttribute('aria-current', b.dataset.go === next ? 'page' : 'false')); render(); window.scrollTo(0, 0); }

function foldShots(points, mode = 'half', side = 'left') {
  return (points || []).map(p => {
    let x = +p.x, y = +p.y;
    if (mode === 'full' || p.fullCourt) {
      const shotSide = p.side || side || (x <= .5 ? 'left' : 'right');
      if (shotSide === 'right') return {x:clamp(1-y), y:clamp((1-x)*2), id:p.id || uid(), source:p.source || 'migrated'};
      return {x:clamp(y), y:clamp(x*2), id:p.id || uid(), source:p.source || 'migrated'};
    }
    return {x:clamp(x), y:clamp(y), id:p.id || uid(), source:p.source || 'manual'};
  });
}

function splitLegacyShots(g) {
  if (g.shotsFor || g.shotsAgainst) return {for:foldShots(g.shotsFor || []), against:foldShots(g.shotsAgainst || [])};
  const raw = g.shots || g.shotPoints || [], ownSide = g.sourceSide || 'left', mode = g.courtMode || 'half', own = [], against = [];
  raw.forEach(p => {
    const tag = String(p.team || p.kind || p.owner || '').toLowerCase();
    let mine = tag ? !(tag.includes('rival') || tag.includes('against') || tag.includes('opponent')) : true;
    if (mode === 'full' && !tag) mine = ownSide === 'left' ? +p.x <= .5 : +p.x >= .5;
    (mine ? own : against).push(p);
  });
  return {for:foldShots(own, mode, ownSide), against:foldShots(against, mode, ownSide === 'left' ? 'right' : 'left')};
}

/* ── FBM Excel import ───────────────────────────────────────────── */
async function readXlsx(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const text = async path => zip.file(path) ? zip.file(path).async('text') : '';
  const sharedDoc = new DOMParser().parseFromString(await text('xl/sharedStrings.xml'), 'application/xml');
  const shared = [...sharedDoc.querySelectorAll('si')].map(si => [...si.querySelectorAll('t')].map(t => t.textContent).join(''));
  const wbDoc = new DOMParser().parseFromString(await text('xl/workbook.xml'), 'application/xml');
  const relDoc = new DOMParser().parseFromString(await text('xl/_rels/workbook.xml.rels'), 'application/xml');
  const first = wbDoc.querySelector('sheet');
  const rid = first?.getAttribute('r:id') || first?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
  const rel = [...relDoc.querySelectorAll('Relationship')].find(x => x.getAttribute('Id') === rid);
  const target = rel?.getAttribute('Target') || 'worksheets/sheet1.xml';
  const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
  const doc = new DOMParser().parseFromString(await text(path), 'application/xml');
  const rows = [];
  [...doc.querySelectorAll('row')].forEach(r => {
    const arr = [];
    [...r.querySelectorAll('c')].forEach(c => {
      const ref = c.getAttribute('r') || 'A1';
      const letters = ref.match(/[A-Z]+/)[0];
      let col = 0; for (const ch of letters) col = col * 26 + ch.charCodeAt(0) - 64; col--;
      const typ = c.getAttribute('t'), value = c.querySelector('v')?.textContent ?? '';
      const inline = [...c.querySelectorAll('is t')].map(x => x.textContent).join('');
      arr[col] = typ === 's' ? shared[+value] : typ === 'inlineStr' ? inline : value;
    });
    rows.push(arr);
  });
  return rows;
}

function parseRoster(rows) {
  const i = rows.findIndex(r => norm(r[0]) === 'APELLIDOS Y NOMBRE');
  if (i < 0) throw Error('No encuentro la tabla de jugadoras.');
  return rows.slice(i + 1).filter(r => r[0]).map(r => ({id:uid(), name:String(r[0]).trim(), number:''}));
}

function parseBoxRow(x, id) {
  const p2 = parseAI(x[4]), p3 = parseAI(x[6]), ft = parseAI(x[8]);
  return legacyPlayer({
    id, number:String(x[0] ?? ''), name:String(x[1] ?? '').trim(), min:minutes(x[2]), minRaw:String(x[2] ?? ''),
    pts:+x[3] || 0, p2m:p2.m, p2a:p2.a, p3m:p3.m, p3a:p3.a, ftm:ft.m, fta:ft.a,
    rebDef:+x[10] || 0, rebOff:+x[11] || 0, rebTot:+x[12] || 0, ast:+x[13] || 0,
    rec:+x[14] || 0, per:+x[15] || 0, tapTc:+x[16] || 0, tapTr:+x[17] || 0,
    fouls:+x[18] || 0, foulsDrawn:+x[19] || 0, val:+x[20] || 0, pm:+x[21] || 0
  });
}

function sumBox(players) {
  const keys = ['min','pts','p2m','p2a','p3m','p3a','ftm','fta','rebDef','rebOff','rebTot','ast','rec','per','tapTc','tapTr','fouls','foulsDrawn','val','pm'];
  const out = {id:'sum', number:'', name:'TOTALES'};
  keys.forEach(k => out[k] = sum(players, p => p[k]));
  out.minRaw = formatMinutes(out.min); out.p2ai = `${out.p2m}/${out.p2a}`; out.p3ai = `${out.p3m}/${out.p3a}`; out.ftai = `${out.ftm}/${out.fta}`;
  return out;
}

function validateTotals(players, total) {
  if (!total) return ['Falta la fila TOTALES'];
  const calculated = sumBox(players);
  const labels = {pts:'PTS', p2m:'2P anotados', p2a:'2P intentados', p3m:'3P anotados', p3a:'3P intentados', ftm:'TL anotados', fta:'TL intentados', fouls:'FAL', foulsDrawn:'FR', val:'VAL'};
  return Object.entries(labels).filter(([k]) => (+calculated[k] || 0) !== (+total[k] || 0)).map(([k, label]) => `${label}: filas ${calculated[k] || 0}, TOTALES ${total[k] || 0}`);
}

function parseGame(rows, fileName) {
  const title = rows.flat().find(x => String(x || '').startsWith('Estadísticas - '));
  if (!title) throw Error('No parece un acta FBM.');
  const groups = [];
  rows.forEach((r, i) => {
    if (norm(r[4]) !== 'TC 2P') return;
    const team = String(rows[i - 1]?.[0] || '').trim(), players = [];
    let total = null;
    for (let j = i + 2; j < rows.length; j++) {
      const x = rows[j] || [];
      if (norm(x[1]) === 'TOTALES') { total = parseBoxRow(x, `total-${groups.length}`); break; }
      if (x[1] && x[0] !== undefined && String(x[1]).trim()) players.push(parseBoxRow(x, uid()));
    }
    if (total) groups.push({team, score:+total.pts || 0, players, total, warnings:validateTotals(players, total)});
  });
  if (groups.length < 2) throw Error('El acta no contiene los dos equipos.');
  const own = groups.find(g => norm(g.team).includes(norm(TEAM))), other = groups.find(g => g !== own);
  if (!own) throw Error('No encuentro a Buen Consejo en el acta.');
  return {
    id:uid(), opponent:other.team, home:groups[0] === own, us:own.score, them:other.score,
    players:own.players, opponentPlayers:other.players, teamTotals:own.total, opponentTotals:other.total,
    importWarnings:[...own.warnings.map(x => `Buen Consejo · ${x}`), ...other.warnings.map(x => `${other.team} · ${x}`)],
    events:[], shotsFor:[], shotsAgainst:[], source:'fbm', fileName, date:today(), importedAt:new Date().toISOString(), needsReimport:false,
    availability:{boxscore:true, opponentBoxscore:true, manual:false, shotMap:false}
  };
}

async function handleFiles(files) {
  try {
    if (fileMode === 'roster') {
      const roster = parseRoster(await readXlsx(files[0]));
      state.roster = mergeRoster(state.roster, roster);
      if (!state.liveDraft.selected.length) state.liveDraft.selected = state.roster.map(p => p.id);
      record('set-roster', {roster:state.roster});
      toast(`${roster.length} jugadoras importadas`); render(); return;
    }
    const parsed = [];
    for (const file of files) parsed.push(parseGame(await readXlsx(file), file.name));
    modalContext = {type:'import', games:parsed};
    openModal('Importación', `${parsed.length} acta${parsed.length > 1 ? 's' : ''}`, `
      ${parsed.map((g, i) => `<article class="import-card">
        <div><b>${esc(g.opponent)}</b><span>${g.us}–${g.them} · ${g.home ? 'Casa' : 'Fuera'} · ${g.players.length} + ${g.opponentPlayers.length} jugadoras</span></div>
        <label>Fecha<input type="date" data-import-date="${i}" value="${g.date}"></label>
        ${g.importWarnings.length ? `<div class="data-warning"><b>Revisar Excel</b>${g.importWarnings.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : `<div class="validation-ok">✓ Filas y totales coinciden</div>`}
      </article>`).join('')}
      <button class="btn primary wide" data-action="confirm-import">Guardar</button>`);
  } catch (error) { console.error(error); toast(error.message || 'No se pudo leer el Excel'); }
}

function mergeRoster(current, incoming) {
  const map = new Map(current.map(p => [norm(p.name), p]));
  incoming.forEach(p => { const old = map.get(norm(p.name)); map.set(norm(p.name), old ? {...old, number:old.number || p.number} : p); });
  return [...map.values()];
}

function findImportMatch(g) {
  return state.games.find(x => norm(x.opponent) === norm(g.opponent) && +x.us === +g.us && +x.them === +g.them)
    || state.games.find(x => x.source === 'live-pending' && norm(x.opponent).split(' ').some(w => w.length > 2 && norm(g.opponent).includes(w)) && (!x.date || !g.date || x.date === g.date));
}

function commitImport() {
  modalContext.games.forEach((g, i) => {
    const existing = findImportMatch(g);
    const chosenDate = $(`[data-import-date="${i}"]`)?.value || '';
    g.date = existing?.date && chosenDate === today() ? existing.date : chosenDate;
    if (existing) {
      Object.assign(existing, {...g, id:existing.id, date:g.date || existing.date, events:existing.events || [], shotsFor:existing.shotsFor || [], shotsAgainst:existing.shotsAgainst || [], needsReimport:false,
        availability:{...g.availability, manual:!!existing.events?.length, shotMap:!!(existing.shotsFor?.length || existing.shotsAgainst?.length)}});
    } else state.games.push(g);
    const saved = existing || g;
    state.roster = mergeRoster(state.roster, g.players.map(p => ({id:p.id, number:p.number, name:p.name})));
    record('replace-game', {game:saved});
  });
  save(); closeModal(); toast('Actas guardadas'); render();
}

/* ── Trusted statistics model ───────────────────────────────────── */
function effectiveTotals(g, side = 'own') {
  const players = side === 'own' ? (g.players || []) : (g.opponentPlayers || []);
  const total = side === 'own' ? g.teamTotals : g.opponentTotals;
  const calculated = sumBox(players);
  if (!total) return calculated;
  const out = {...calculated, ...total};
  for (const k of Object.keys(calculated)) if (out[k] === undefined || out[k] === null || out[k] === '') out[k] = calculated[k];
  return legacyPlayer(out);
}

function eventCounts(g, p) {
  const key = norm(p?.name);
  const events = (g.events || []).filter(e => !e.undone && (p ? (e.playerId === p.id || norm(e.playerName) === key) : true));
  return {steals:events.filter(e => e.type === 'steal').length, turnovers:events.filter(e => e.type === 'turnover').length, orb:events.filter(e => e.type === 'orbFor').length, rivalOrb:events.filter(e => e.type === 'orbAgainst').length};
}

function validGames() { return state.games.filter(g => Number.isFinite(+g.us) && Number.isFinite(+g.them)); }

function playerAgg() {
  const map = new Map();
  for (const g of validGames()) for (const p of g.players || []) {
    const k = norm(p.name);
    const x = map.get(k) || {id:p.id || k, name:p.name, number:p.number, gp:0, games:[]};
    x.gp++;
    ['min','pts','p2m','p2a','p3m','p3a','ftm','fta','fouls','foulsDrawn','val','pm','ast','rec','per','rebDef','rebOff','rebTot'].forEach(q => x[q] = (+x[q] || 0) + (+p[q] || 0));
    const ec = eventCounts(g, p); x.steals = (+x.steals || 0) + ec.steals; x.turnovers = (+x.turnovers || 0) + ec.turnovers; x.orbLive = (+x.orbLive || 0) + ec.orb;
    x.games.push({g, p}); map.set(k, x);
  }
  state.roster.forEach(p => { const k = norm(p.name); if (!map.has(k)) map.set(k, {...p, gp:0, games:[]}); });
  return [...map.values()].sort((a, b) => (b.gp ? b.pts / b.gp : -1) - (a.gp ? a.pts / a.gp : -1));
}

function teamStats() {
  const games = validGames();
  const own = games.map(g => effectiveTotals(g, 'own'));
  const opp = games.map(g => effectiveTotals(g, 'opp'));
  const played = games.length, wins = games.filter(g => g.us > g.them).length;
  const ev = games.flatMap(g => (g.events || []).filter(e => !e.undone));
  const agg = (rows, k) => sum(rows, p => p[k]);
  const ownPts = sum(games, g => g.us), oppPts = sum(games, g => g.them);
  const ftm = agg(own, 'ftm'), fta = agg(own, 'fta'), oftm = agg(opp, 'ftm'), ofta = agg(opp, 'fta');
  const p2 = agg(own, 'p2m'), p3 = agg(own, 'p3m'), op2 = agg(opp, 'p2m'), op3 = agg(opp, 'p3m');
  const playerTotals = playerAgg().filter(p => p.gp).sort((a, b) => b.pts - a.pts);
  const topScorer = playerTotals[0] || null;
  const topShare = ownPts && topScorer ? topScorer.pts / ownPts * 100 : null;
  const topThreePts = sum(playerTotals.slice(0, 3), p => p.pts);
  const topThreeShare = ownPts ? topThreePts / ownPts * 100 : null;
  const minuteSplit = games.map(g => {
    const ordered = [...(g.players || [])].sort((a, b) => b.min - a.min), first = ordered.slice(0, 5), rest = ordered.slice(5);
    return {first:sum(first, p => p.pts), rest:sum(rest, p => p.pts)};
  });
  const manualGames = games.filter(g => g.availability?.manual || g.events?.length);
  return {
    games, own, opp, played, wins, losses:played - wins, ownPts, oppPts,
    ppg:played ? ownPts / played : null, papg:played ? oppPts / played : null, margin:played ? (ownPts - oppPts) / played : null,
    p2, p3, ftm, fta, ftp:fta ? ftm / fta * 100 : null, op2, op3, oftm, ofta, oftp:ofta ? oftm / ofta * 100 : null,
    fouls:agg(own, 'fouls'), foulsDrawn:agg(opp, 'fouls'), oppFouls:agg(opp, 'fouls'), oppFoulsDrawn:agg(own, 'fouls'),
    ast:agg(own, 'ast'), rec:agg(own, 'rec'), per:agg(own, 'per'), rebOff:agg(own, 'rebOff'), oppRebOff:agg(opp, 'rebOff'),
    shotRate:(p2 + p3) ? fta / (p2 + p3) : null, oppShotRate:(op2 + op3) ? ofta / (op2 + op3) : null,
    playerTotals, topScorer, topShare, topThreePts, topThreeShare, firstFivePts:sum(minuteSplit, x => x.first), restPts:sum(minuteSplit, x => x.rest),
    shotsFor:games.flatMap(g => g.shotsFor || []), shotsAgainst:games.flatMap(g => g.shotsAgainst || []),
    manualGames:manualGames.length,
    steals:ev.filter(e => e.type === 'steal').length, turnovers:ev.filter(e => e.type === 'turnover').length,
    orbLive:ev.filter(e => e.type === 'orbFor').length, oppOrbLive:ev.filter(e => e.type === 'orbAgainst').length
  };
}

function firstName(name) {
  const parts = String(name || '').split(',');
  const source = parts[1] || parts[0] || '';
  const first = source.trim().split(/\s+/)[0] || '—';
  return first[0]?.toUpperCase() + first.slice(1).toLowerCase();
}
function namePretty(name) { const [last, first] = String(name || '').split(','); return first ? `${title(first)} ${title(last)}` : title(last); }
function title(s) { return String(s || '').trim().toLowerCase().replace(/(^|[\s-])\p{L}/gu, c => c.toUpperCase()); }
function shortName(name) { const [last, first] = String(name || '').split(','); return `${firstName(name)} ${title(String(last || '').split(/\s+/)[0])}`.trim(); }

function sparkline(values, tone = 'team', width = 150, height = 42) {
  const rows = values.map((value, index) => ({value:Number.isFinite(+value) ? +value : null, index}));
  const valid = rows.filter(row => row.value !== null);
  if (!valid.length) return '';
  const max = Math.max(...valid.map(row => row.value), 1);
  const min = Math.min(...valid.map(row => row.value), 0);
  const range = max - min || 1;
  const x = index => values.length === 1 ? width / 2 : index * width / (values.length - 1);
  const y = value => height - 5 - (value - min) / range * (height - 10);
  const segments = [];
  let segment = [];
  rows.forEach(row => {
    if (row.value === null) {
      if (segment.length) segments.push(segment);
      segment = [];
    } else segment.push(`${x(row.index)},${y(row.value)}`);
  });
  if (segment.length) segments.push(segment);
  return `<svg class="spark ${tone}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    ${segments.map(points => `<polyline points="${points.join(' ')}"/>`).join('')}
    ${valid.map(row => `<circle cx="${x(row.index)}" cy="${y(row.value)}" r="2.6"/>`).join('')}
    ${rows.filter(row => row.value === null).map(row => `<circle class="missing" cx="${x(row.index)}" cy="${height - 5}" r="2.6"/>`).join('')}
  </svg>`;
}

function scoreChart(games) {
  if (!games.length) return '';
  const ordered = [...games].sort((a,b) => String(a.date).localeCompare(String(b.date)));
  const all = ordered.flatMap(g => [+g.us, +g.them]);
  const max = Math.max(...all, 1), min = Math.min(...all, 0), w = 760, h = 240;
  const x = index => ordered.length === 1 ? w / 2 : 52 + index * (w - 104) / (ordered.length - 1);
  const y = value => h - 58 - (value - min) / (max - min || 1) * (h - 108);
  const line = key => ordered.map((g, index) => `${x(index)},${y(+g[key])}`).join(' ');
  return `<div class="chart-wrap"><svg class="score-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Marcador y diferencia por partido">
    <line class="grid-line" x1="26" y1="${h-58}" x2="${w-26}" y2="${h-58}"/>
    <polyline class="score-us" points="${line('us')}"/><polyline class="score-them" points="${line('them')}"/>
    ${ordered.map((g, index) => {
      const margin = +g.us - +g.them;
      return `<g data-detail="game:${g.id}" tabindex="0" role="button">
        <circle class="score-us" cx="${x(index)}" cy="${y(+g.us)}" r="6"/><circle class="score-them" cx="${x(index)}" cy="${y(+g.them)}" r="6"/>
        <text class="score-label us" x="${x(index)}" y="${Math.max(17,y(+g.us)-12)}" text-anchor="middle">${g.us}</text>
        <text class="score-label them" x="${x(index)}" y="${Math.min(h-64,y(+g.them)+21)}" text-anchor="middle">${g.them}</text>
        <text class="score-margin ${margin >= 0 ? 'positive' : 'negative'}" x="${x(index)}" y="${h-38}" text-anchor="middle">${margin > 0 ? '+' : ''}${margin}</text>
        <text class="game-label" x="${x(index)}" y="${h-19}" text-anchor="middle">${esc(String(g.opponent||'Rival').split(' ')[0].slice(0,10))}</text>
        <text class="date-label" x="${x(index)}" y="${h-5}" text-anchor="middle">${esc(String(g.date||'').slice(5))}</text>
        <title>${esc(g.opponent)}: ${g.us}–${g.them} · diferencia ${margin > 0 ? '+' : ''}${margin}</title>
      </g>`;
    }).join('')}
  </svg><div class="chart-legend"><span class="us">Buen Consejo</span><span class="them">Rival</span><span class="margin">Diferencia</span></div></div>`;
}

function pointShareChart(players, ownPts) {
  const shown = players.slice(0, 5), rest = Math.max(0, ownPts - sum(shown, p => p.pts));
  const max = Math.max(1, ...shown.map(p => p.pts), rest);
  const rows = [...shown.map(p => ({name:shortName(p.name), value:p.pts, key:norm(p.name)})), ...(rest ? [{name:'Resto', value:rest}] : [])];
  return `<div class="share-bars">${rows.map(row => `<button ${row.key ? `data-detail="player:${encodeURIComponent(row.key)}"` : ''}><span>${esc(row.name)}</span><i><b style="width:${row.value/max*100}%"></b></i><strong>${row.value} · ${pct(ownPts ? row.value/ownPts*100 : 0)}</strong></button>`).join('')}</div>`;
}

function minuteRows(players, scope = 'season') {
  if (scope.startsWith('game:')) {
    const game = validGames().find(item => item.id === scope.slice(5));
    return (game?.players || []).map(player => ({...player, display:+player.min || 0, gamesPlayed:1})).sort((a,b) => b.display-a.display);
  }
  return players.map(player => ({...player, display:scope === 'average' ? player.min / Math.max(1, player.gp) : player.min, gamesPlayed:player.gp})).sort((a,b) => b.display-a.display);
}

function minuteBars(players, scope = 'season', limit = 9) {
  const rows = minuteRows(players, scope).slice(0, limit), max = Math.max(1, ...rows.map(player => player.display));
  return `<div class="minute-bars">${rows.map(player => `<button data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span><i><b style="width:${player.display/max*100}%"></b></i><strong>${formatMinutes(player.display)}</strong></button>`).join('')}</div>`;
}

function stackedBar(items, label) {
  const total = sum(items, item => item.value) || 1;
  return `<div class="stacked-chart" role="img" aria-label="${esc(label)}"><div>${items.map(item => `<i class="${item.tone}" style="width:${item.value/total*100}%" title="${esc(item.label)}: ${item.value}"></i>`).join('')}</div><ul>${items.map(item => `<li><span class="dot ${item.tone}"></span><b>${esc(item.label)}</b><strong>${num(item.value/total*100,0)}%</strong></li>`).join('')}</ul></div>`;
}

function scoringMixCompare(own, opp) {
  const row = (label, totals, side) => {
    const parts = [{label:'2P', value:totals.p2m*2, tone:'two'}, {label:'3P', value:totals.p3m*3, tone:'three'}, {label:'TL', value:totals.ftm, tone:'free'}];
    return `<div class="mix-row"><div><b>${label}</b><span>${sum(parts, item => item.value)} pts</span></div>${stackedBar(parts, `Origen de puntos · ${label}`)}</div>`;
  };
  return `<div class="mix-compare">${row('Buen Consejo', own, 'own')}${row('Rival', opp, 'opp')}</div>`;
}

function compareBar(label, own, opp, formatter = num) {
  const max = Math.max(+own || 0, +opp || 0, 1);
  return `<div class="compare-row"><span>${label}</span><div class="compare-values"><b>${formatter(own)}</b><b>${formatter(opp)}</b></div><div class="compare-track"><i class="own" style="width:${(+own||0)/max*100}%"></i><i class="opp" style="width:${(+opp||0)/max*100}%"></i></div></div>`;
}

function donut(value, label, tone = 'team') {
  const v = clamp((+value || 0) / 100) * 100;
  return `<div class="donut ${tone}" style="--p:${v}" role="img" aria-label="${esc(label)}: ${num(v,0)} por ciento"><div><strong>${num(v,0)}%</strong><span>${esc(label)}</span></div></div>`;
}

const TEAM_METRICS = {
  points:{label:'Puntos', short:'PTS', player:'pts', compare:true, higherBetter:true, value:(game, totals, side) => side === 'own' ? +game.us : +game.them, note:'Marcador oficial.'},
  p2m:{label:'Canastas de 2', short:'2P', player:'p2m', compare:true, higherBetter:true, value:(game, totals) => +totals.p2m || 0, note:'Canastas anotadas; no porcentaje porque el acta no ofrece intentos de campo fiables.'},
  p3m:{label:'Canastas de 3', short:'3P', player:'p3m', compare:true, higherBetter:true, value:(game, totals) => +totals.p3m || 0, note:'Triples anotados; no porcentaje porque el acta no ofrece intentos de campo fiables.'},
  ftm:{label:'Tiros libres', short:'TL', player:'ftm', compare:true, higherBetter:true, value:(game, totals) => +totals.ftm || 0, note:'Tiros libres anotados.'},
  fta:{label:'TL intentados', short:'TLI', player:'fta', compare:true, higherBetter:true, value:(game, totals) => +totals.fta || 0, note:'Intentos de tiro libre.'},
  ftp:{label:'Porcentaje TL', short:'TL%', player:'ftp', compare:true, percent:true, higherBetter:true, value:(game, totals) => totals.fta ? totals.ftm/totals.fta*100 : null, note:'Los partidos sin intentos quedan ausentes: no cuentan como 0% ni entran en la media.'},
  fouls:{label:'Faltas', short:'FAL', player:'fouls', compare:true, lowerBetter:true, per40:true, value:(game, totals) => +totals.fouls || 0, note:'Faltas cometidas. Menos es mejor; las faltas del rival equivalen a faltas recibidas por Buen Consejo.'},
  val:{label:'Valoración por partido', short:'VAL/P', player:'val', compare:false, higherBetter:true, value:(game, totals) => +totals.val || 0, note:'Valoración publicada en el acta. La tarjeta principal se centra en Buen Consejo; el detalle conserva la comparación con el rival.'}
};

function teamMetricRows(key) {
  const metric = TEAM_METRICS[key];
  return validGames().sort((a,b) => String(a.date).localeCompare(String(b.date))).map(game => ({
    game,
    own:metric.value(game, effectiveTotals(game,'own'), 'own'),
    opp:metric.value(game, effectiveTotals(game,'opp'), 'opp')
  }));
}

function aggregateMetric(key, rows, side, mode = 'average') {
  if (key === 'ftp' && mode === 'total') {
    const totals = rows.reduce((out, row) => {
      const total = effectiveTotals(row.game, side === 'own' ? 'own' : 'opp');
      out.made += total.ftm || 0; out.attempted += total.fta || 0; return out;
    }, {made:0, attempted:0});
    return totals.attempted ? totals.made/totals.attempted*100 : null;
  }
  const values = rows.map(row => row[side]).filter(value => value !== null && Number.isFinite(+value));
  if (!values.length) return null;
  return mode === 'total' ? sum(values, value => value) : mean(values, value => value);
}

function metricValue(key, value, digits = 1) {
  return key === 'ftp' ? pct(value) : num(value, digits);
}

function lineSegments(rows, side, x, y) {
  const segments = []; let segment = [];
  rows.forEach((row,index) => {
    const value = row[side];
    if (value === null || !Number.isFinite(+value)) {
      if (segment.length) segments.push(segment); segment = [];
    } else segment.push(`${x(index)},${y(+value)}`);
  });
  if (segment.length) segments.push(segment);
  return segments;
}

function dualTrendSVG(rows, key, compact = false) {
  const valid = rows.flatMap(row => [row.own,row.opp]).filter(value => value !== null && Number.isFinite(+value));
  if (!valid.length) return '<div class="empty-chart">Sin datos</div>';
  const w=760, h=compact?116:270, left=compact?10:42, bottom=compact?12:42;
  const min=Math.min(0,...valid), max=Math.max(1,...valid);
  const x=index => rows.length===1?w/2:left+index*(w-left*2)/(rows.length-1);
  const y=value => h-bottom-(value-min)/(max-min||1)*(h-bottom-(compact?10:30));
  const lines = side => lineSegments(rows,side,x,y).map(points => `<polyline class="${side}" points="${points.join(' ')}"/>`).join('');
  const label=(TEAM_METRICS[key]||LIVE_METRICS[key]||{}).label||key;
  return `<svg class="dual-trend ${compact?'compact':''}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolución de ${esc(label)}">
    ${compact?'':`<line class="trend-axis" x1="${left-12}" y1="${h-bottom}" x2="${w-left+12}" y2="${h-bottom}"/>`}${lines('own')}${lines('opp')}
    ${rows.map((row,index) => `<g ${compact?'':`data-detail="game:${row.game.id}" tabindex="0" role="button"`}>
      ${row.own===null?'':`<circle class="own" cx="${x(index)}" cy="${y(row.own)}" r="${compact?4:7}"/>`}${row.opp===null?'':`<circle class="opp" cx="${x(index)}" cy="${y(row.opp)}" r="${compact?4:7}"/>`}
      ${compact?'':`<text x="${x(index)}" y="${h-13}" text-anchor="middle">P${index+1}</text><title>${esc(row.game.opponent)} · BC ${metricValue(key,row.own)} · Rival ${metricValue(key,row.opp)}</title>`}
    </g>`).join('')}
  </svg>`;
}

function pairedBarsVisual(key, rows) {
  const own=aggregateMetric(key,rows,'own'), opp=aggregateMetric(key,rows,'opp'), max=Math.max(+own||0,+opp||0,1);
  return `<div class="paired-bars"><div><span>BC</span><i><b class="own" style="width:${(+own||0)/max*100}%"></b></i></div><div><span>Rival</span><i><b class="opp" style="width:${(+opp||0)/max*100}%"></b></i></div></div>`;
}

function pairedRingsVisual(key, rows) {
  const own=aggregateMetric(key,rows,'own','total'), opp=aggregateMetric(key,rows,'opp','total');
  return `<div class="mini-rings"><i class="own" style="--p:${clamp((+own||0)/100)*100}"></i><i class="opp" style="--p:${clamp((+opp||0)/100)*100}"></i></div>`;
}

function metricMiniVisual(key, rows) {
  if (['points','val'].includes(key)) return dualTrendSVG(rows,key,true);
  if (key === 'ftp') return pairedRingsVisual(key,rows);
  if (['p2m','fouls'].includes(key)) return pairedBarsVisual(key,rows);
  const max=Math.max(1,...rows.flatMap(row=>[+row.own||0,+row.opp||0]));
  return `<div class="mini-columns">${rows.map(row=>`<span><i class="own" style="height:${(+row.own||0)/max*100}%"></i><i class="opp" style="height:${(+row.opp||0)/max*100}%"></i></span>`).join('')}</div>`;
}

function teamMetricCard(key) {
  const metric=TEAM_METRICS[key], rows=teamMetricRows(key);
  const ownAverage=aggregateMetric(key,rows,'own'), oppAverage=aggregateMetric(key,rows,'opp');
  const ownTotal=aggregateMetric(key,rows,'own','total'), oppTotal=aggregateMetric(key,rows,'opp','total');
  const detail = key === 'ftp' ? `Temporada ${metricValue(key,ownTotal)} / ${metricValue(key,oppTotal)}` : metric.compare ? `Total ${metricValue(key,ownTotal,0)} / ${metricValue(key,oppTotal,0)}` : `Total BC ${metricValue(key,ownTotal,0)}`;
  if (!metric.compare) return `<button class="stat-card stat-${key}" data-detail="metric:${key}"><header><span>${metric.label}</span><small>Buen Consejo</small></header><div class="stat-values own-only"><strong>${metricValue(key,ownAverage)}</strong><span>media por partido</span></div><div class="single-trend">${sparkline(rows.map(row=>row.own),'team',260,70)}</div><footer>${detail}<b>Ver todo →</b></footer></button>`;
  const hint=metric.lowerBetter?'BC / Rival · menos':'BC / Rival';
  return `<button class="stat-card stat-${key}" data-detail="metric:${key}"><header><span>${metric.label}</span><small>${hint}</small></header><div class="stat-values"><strong>${metricValue(key,ownAverage)}</strong><strong>${metricValue(key,oppAverage)}</strong></div>${metricMiniVisual(key,rows)}<footer>${detail}<b>Ver todo →</b></footer></button>`;
}

function head(cls, title, actions = '', meta = '') {
  return `<section class="${cls}"><header class="page-head"><div><h1>${title}</h1>${meta ? `<p>${meta}</p>` : ''}</div><div class="action-row">${actions}</div></header>`;
}

function reimportBanner() {
  const n = state.games.filter(g => g.needsReimport).length;
  return n ? `<div class="reimport-banner"><span class="warning-mark">!</span><div><b>Faltan datos del rival en ${n} partido${n > 1 ? 's' : ''}</b><span>Vuelve a importar ${n > 1 ? 'las actas' : 'el acta'}. Se conservan fecha, Directo y mapas.</span></div><button class="btn" data-action="import-games">Reimportar</button></div>` : '';
}

function renderMinutesCard(stats) {
  const options = [`<option value="season" ${minutesScope==='season'?'selected':''}>Temporada</option>`, `<option value="average" ${minutesScope==='average'?'selected':''}>Media por partido</option>`, ...stats.games.map((game,index)=>`<option value="game:${game.id}" ${minutesScope===`game:${game.id}`?'selected':''}>P${index+1} · ${esc(game.opponent)}</option>`)].join('');
  const label = minutesScope === 'season' ? 'Minutos totales' : minutesScope === 'average' ? 'Media por partido' : 'Partido concreto';
  return `<article class="card visual-card minutes-card"><div class="card-title"><div><h3>Minutos</h3><span>${label}</span></div><select id="minutesScope" aria-label="Vista de minutos">${options}</select></div><div class="minutes-open">${minuteBars(stats.playerTotals,minutesScope)}</div><button class="text-link" data-detail="minutes">Ver las ${playerAgg().length} jugadoras, mapa y evolución →</button></article>`;
}

const LIVE_METRICS = {
  ball:{label:'Robos y pérdidas', ownLabel:'Robos BC', oppLabel:'Pérdidas BC', types:['steal','turnover'], note:'Compara nuestros robos con nuestras pérdidas. No es una estadística completa del rival ni una estimación de posesiones.'},
  orb:{label:'Rebote ofensivo', ownLabel:'REB O BC', oppLabel:'REB O rival', types:['orbFor','orbAgainst'], note:'Solo usa los rebotes ofensivos apuntados en Directo: los que cogemos frente a los que nos coge el rival.'}
};

function recordedLiveGames() {
  return validGames().filter(game=>(game.events||[]).some(event=>!event.undone));
}

function liveMetricRows(key) {
  const metric=LIVE_METRICS[key];
  return recordedLiveGames().sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(game=>{
    const events=(game.events||[]).filter(event=>!event.undone);
    return {game,own:events.filter(event=>event.type===metric.types[0]).length,opp:events.filter(event=>event.type===metric.types[1]).length};
  });
}

function liveMetricCard(key) {
  const metric=LIVE_METRICS[key],rows=liveMetricRows(key),own=mean(rows,row=>row.own),opp=mean(rows,row=>row.opp),max=Math.max(1,...rows.flatMap(row=>[row.own,row.opp]));
  return `<button class="stat-card live-stat-card" data-detail="live:${key}"><header><span>${metric.label}</span><small>Directo · por partido</small></header><div class="stat-values"><strong>${num(own)}</strong><strong>${num(opp)}</strong></div><div class="live-card-labels"><span>${metric.ownLabel}</span><span>${metric.oppLabel}</span></div><div class="mini-columns">${rows.map(row=>`<span><i class="own" style="height:${row.own/max*100}%"></i><i class="opp" style="height:${row.opp/max*100}%"></i></span>`).join('')}</div><footer>${rows.length} partido${rows.length===1?'':'s'} con registro<b>Ver todo →</b></footer></button>`;
}

function renderLiveMetrics() {
  const games=recordedLiveGames();
  if (!games.length) return '';
  return `<section class="live-data-block"><div class="section-title"><div><h2>Datos de Directo</h2><p>Solo partidos con registro manual; los demás no entran como ceros.</p></div></div><div class="stats-grid live-stats-grid">${liveMetricCard('ball')}${liveMetricCard('orb')}</div></section>`;
}

function renderTeam() {
  const stats = teamStats();
  if (!stats.played) return head('team-page','Equipo',`<button class="btn primary" data-action="import-games">Importar actas</button>`) + reimportBanner() + `<div class="empty card"><div class="empty-icon">▦</div><h2>Sin partidos</h2><button class="btn primary" data-action="import-games">Elegir Excel</button></div></section>`;
  const ownTotals=stats.own.reduce((out,row)=>{['p2m','p3m','ftm','fta','fouls','val'].forEach(key=>out[key]=(out[key]||0)+(+row[key]||0));return out;},{});
  const oppTotals=stats.opp.reduce((out,row)=>{['p2m','p3m','ftm','fta','fouls','val'].forEach(key=>out[key]=(out[key]||0)+(+row[key]||0));return out;},{});
  const current=currentStreak(stats.games);
  return head('team-page','Equipo',`<button class="btn" data-action="import-games">Importar acta</button>`,`${stats.played} partidos · ${state.team.season}`) + reimportBanner() + `
    <div class="summary-grid">
      <article class="score-summary card"><div><span>Balance</span><strong>${stats.wins}–${stats.losses}</strong><em>${pct(stats.wins/stats.played*100)}</em></div><div><span>Anota</span><strong>${num(stats.ppg)}</strong><em>por partido</em></div><div><span>Recibe</span><strong>${num(stats.papg)}</strong><em>por partido</em></div><div><span>Racha</span><strong>${current}</strong><em>${stats.games.at(-1)?.us>stats.games.at(-1)?.them?'victorias':'derrotas'} seguidas</em></div></article>
      <article class="card score-evolution"><div class="card-title"><div><h2>Marcador</h2><span>Puntos y diferencia en cada partido</span></div><small>Toca un punto</small></div>${scoreChart(stats.games)}</article>
    </div>
    <div class="section-title"><div><h2>Cómo anota el equipo</h2><p>Datos publicados por la FBM; sin porcentajes de campo.</p></div></div>
    <div class="analysis-grid feature-grid">
      <button class="card visual-card mix-card" data-detail="scoring-mix"><div class="card-title"><div><h3>Origen de los puntos</h3><span>2P · 3P · TL</span></div><small>BC / Rival</small></div>${scoringMixCompare(ownTotals,oppTotals)}</button>
      <article class="card visual-card point-share"><div class="card-title"><div><h3>Reparto de puntos</h3><span>Contribución de las jugadoras</span></div><small>Vista rápida</small></div>${pointShareChart(stats.playerTotals,stats.ownPts)}<button class="text-link" data-detail="point-share">Ver las ${playerAgg().length} jugadoras →</button></article>
      ${renderMinutesCard(stats)}
      ${renderLiveMetrics()}
    </div>
    <div class="section-title"><div><h2>Todas las estadísticas</h2><p>La cifra grande es la media por partido. Cada detalle incluye total, media y evolución BC–rival.</p></div></div>
    <div class="stats-grid">${Object.keys(TEAM_METRICS).map(teamMetricCard).join('')}</div>
    <div class="section-title"><div><h2>Mapas</h2><p>Solo partidos con mapa importado o editado.</p></div></div>
    <div class="analysis-grid maps-grid">
      <button class="card visual-card map-card" data-detail="heat-attack"><div class="card-title"><div><h3>Ataque</h3><span>${stats.shotsFor.length} canastas</span></div></div>${courtHTML(stats.shotsFor,[],true)}${zoneBars(stats.shotsFor,'attack')}</button>
      <button class="card visual-card map-card" data-detail="heat-defense"><div class="card-title"><div><h3>Defensa</h3><span>${stats.shotsAgainst.length} canastas</span></div></div>${courtHTML([],stats.shotsAgainst,true)}${zoneBars(stats.shotsAgainst,'defense')}</button>
    </div>
  </section>`;
}

function currentStreak(games) {
  let kind = '', n = 0;
  for (const g of [...games].sort((a, b) => String(a.date).localeCompare(String(b.date))).reverse()) {
    const next = g.us > g.them ? 'V' : 'D'; if (!kind) kind = next; if (next !== kind) break; n++;
  }
  return n ? `${kind}${n}` : '—';
}

/* ── Main views ─────────────────────────────────────────────────── */
function renderPlayers() {
  const players = playerAgg();
  if (!players.length) return head('players-page', 'Jugadoras', `<button class="btn primary" data-action="import-roster">Importar plantilla</button>`) + `<div class="empty card"><h2>Sin jugadoras</h2></div></section>`;
  const value=(p,key)=>p.gp ? (+p[key]||0)/p.gp : -Infinity;
  players.sort((a,b)=>(value(a,playerSort)-value(b,playerSort))*playerSortDir || namePretty(a.name).localeCompare(namePretty(b.name),'es'));
  const sortHead=(key,label)=>`<button data-action="sort-players" data-key="${key}" aria-sort="${playerSort===key?(playerSortDir===-1?'descending':'ascending'):'none'}">${label}${playerSort===key?(playerSortDir===-1?' ↓':' ↑'):''}</button>`;
  return head('players-page', 'Jugadoras', `<button class="btn" data-action="import-roster">Actualizar plantilla</button>`, `${players.length} jugadoras`) + reimportBanner() + `<div class="player-table-head"><span></span><span>Jugadora</span><span></span>${sortHead('pts','PTS/P')}${sortHead('min','MIN/P')}${sortHead('val','VAL/P')}<span></span></div><div class="player-ranking">${players.map(p => {
    const points = p.games.map(x => x.p.pts), ppg = p.gp ? p.pts / p.gp : null;
    return `<button class="player-rank" data-detail="player:${encodeURIComponent(norm(p.name))}"><span class="player-number">${esc(p.number || '—')}</span><span class="player-id"><b>${esc(namePretty(p.name))}</b><small>${p.gp ? `${p.gp} partidos` : 'Sin acta'}</small></span><span class="player-spark">${sparkline(points, 'player', 100, 30)}</span><span class="rank-metric" title="Puntos por partido"><b>${p.gp ? num(ppg) : '—'}</b><small>PTS/P</small></span><span class="rank-metric" title="Minutos por partido"><b>${p.gp ? num(p.min / p.gp) : '—'}</b><small>MIN/P</small></span><span class="rank-metric" title="Valoración por partido"><b>${p.gp ? num(p.val / p.gp) : '—'}</b><small>VAL/P</small></span><span class="rank-arrow">›</span></button>`;
  }).join('')}</div></section>`;
}

function renderGames() {
  const games = [...state.games].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return head('games-page', 'Partidos', `<button class="btn" data-action="import-games">Importar acta</button><button class="btn primary" data-action="open-shot">Añadir mapa</button>`, `${games.length} partidos`) + reimportBanner() + (!games.length ? `<div class="empty card"><h2>Sin partidos</h2><button class="btn primary" data-action="import-games">Elegir Excel</button></div>` : `<div class="games-list">${games.map(g => {
    const complete = !g.needsReimport && g.opponentPlayers?.length;
    return `<button class="game-row" data-detail="game:${g.id}"><span class="game-result ${g.us > g.them ? 'win' : 'loss'}">${g.us > g.them ? 'V' : 'D'}</span><span class="game-main"><b>${esc(g.opponent)}</b><small>${g.date || 'Sin fecha'} · ${g.home ? 'Casa' : 'Fuera'}</small></span><span class="game-score">${g.us ?? '—'}<i>–</i>${g.them ?? '—'}</span><span class="game-data"><i class="${complete ? 'ok' : 'warn'}"></i>${complete ? `${g.players.length} + ${g.opponentPlayers.length}` : 'Reimportar'}</span><span class="rank-arrow">›</span></button>`;
  }).join('')}</div>`) + `</section>`;
}

function ensureDraftSelection() {
  const ids = new Set(state.roster.map(p => p.id));
  state.liveDraft.selected = state.liveDraft.selected.filter(id => ids.has(id));
  if (!state.liveDraft.selected.length && state.roster.length) state.liveDraft.selected = state.roster.map(p => p.id);
}

function renderLive() {
  const L = state.live;
  if (!L) {
    ensureDraftSelection(); const d = state.liveDraft;
    return head('live-page', 'Directo', '', '') + `<div class="card live-setup"><div class="setup-fields"><label class="field">Rival<input id="rival" value="${esc(d.rival)}" placeholder="Nombre del rival" autocomplete="off"></label><label class="field">Fecha<input id="liveDate" type="date" value="${esc(d.date || today())}"></label></div><div class="roster-heading"><b>Convocadas</b><span id="selectedCount">${d.selected.length} convocadas</span></div>${state.roster.length ? `<div class="roster-grid">${state.roster.map(p => { const checked = d.selected.includes(p.id); return `<label class="roster-card ${checked ? 'selected' : ''}"><input type="checkbox" value="${p.id}" ${checked ? 'checked' : ''}><span class="check">${checked ? '✓' : ''}</span><strong>${esc(p.number || '—')}</strong><span class="roster-name">${esc(shortName(p.name))}</span></label>`; }).join('')}</div>` : `<div class="empty-inline">Importa la plantilla.</div>`}<div class="sticky-start"><button class="btn direct" data-action="start-live" ${state.settings.role === 'viewer' || !state.roster.length ? 'disabled' : ''}>Empezar</button><button class="btn" data-action="import-roster">Importar plantilla</button></div></div></section>`;
  }
  const count = type => L.events.filter(e => e.type === type && !e.undone).length;
  return `<section class="live-page"><div class="live-board"><div class="live-meta"><div><h1>${esc(L.opponent)}</h1><p>${L.players.length} convocadas · ${L.date}</p></div><span class="quarter-badge">Q${L.quarter}</span></div><div class="quarter" aria-label="Cuarto">${[1,2,3,4].map(q => `<button class="${q === L.quarter ? 'active' : ''}" data-action="quarter" data-q="${q}">${q}º</button>`).join('')}</div><div class="live-actions">${liveButton('steal','↗','Robo',count('steal'))}${liveButton('turnover','↘','Pérdida',count('turnover'))}${liveButton('orbFor','◎','Rebote ofensivo',count('orbFor'))}${liveButton('orbAgainst','◌','Rebote rival',count('orbAgainst'))}</div><div class="live-footer"><button class="btn" data-action="undo-live" ${L.events.some(e => !e.undone) ? '' : 'disabled'}>Deshacer</button><button class="btn danger" data-action="discard-live">Descartar</button><button class="btn direct" data-action="finish-live">Finalizar</button></div></div></section>`;
}

function liveButton(type, symbol, label, count) { return `<button class="live-action" data-action="add-live" data-type="${type}"><span class="symbol">${symbol}</span><b>${label}</b><strong>${count}</strong></button>`; }

function render() {
  $('#roleLabel').textContent = (state.settings.role || 'admin').toUpperCase();
  $('#view').innerHTML = view === 'team' ? renderTeam() : view === 'players' ? renderPlayers() : view === 'games' ? renderGames() : renderLive();
  document.body.dataset.view = view; document.body.dataset.role = state.settings.role || 'admin';
  document.body.classList.toggle('live-running', view === 'live' && !!state.live);
  applyTheme(document.documentElement.dataset.theme || 'light');
}

function openModal(kicker, titleText, body) {
  $('#modalKicker').textContent = kicker; $('#modalTitle').textContent = titleText; $('#modalBody').innerHTML = body;
  const modal = $('#modal'); modal.hidden = false; modal.setAttribute('aria-hidden', 'false'); setTimeout(() => $('.modal-sheet .icon-button')?.focus(), 0);
}
function closeModal() { const modal = $('#modal'); modal.hidden = true; modal.setAttribute('aria-hidden', 'true'); modalContext = null; }

const PLAYER_METRICS = {
  pts:{label:'Puntos', value:player=>player.pts, team:game=>mean(game.players||[],player=>player.pts)},
  min:{label:'Minutos', value:player=>player.min, team:game=>mean(game.players||[],player=>player.min)},
  p2m:{label:'Canastas de 2', value:player=>player.p2m, team:game=>mean(game.players||[],player=>player.p2m)},
  p3m:{label:'Canastas de 3', value:player=>player.p3m, team:game=>mean(game.players||[],player=>player.p3m)},
  ftm:{label:'Tiros libres', value:player=>player.ftm, team:game=>mean(game.players||[],player=>player.ftm)},
  ftp:{label:'Porcentaje TL', value:player=>player.fta ? player.ftm/player.fta*100 : null, team:game=>{const total=effectiveTotals(game,'own');return total.fta?total.ftm/total.fta*100:null;}},
  fouls:{label:'Faltas por partido', value:player=>player.fouls, team:game=>mean(game.players||[],player=>player.fouls)},
  fouls40:{label:'Faltas por 40 min', value:player=>player.min ? player.fouls/player.min*40 : null, team:game=>{const players=game.players||[],mins=sum(players,p=>p.min),fouls=sum(players,p=>p.fouls);return mins?fouls/mins*40:null;}},
  val:{label:'Valoración por partido', value:player=>player.val, team:game=>mean(game.players||[],player=>player.val)},
  pm:{label:'+/-', value:player=>player.pm, team:game=>mean(game.players||[],player=>player.pm)},
  liveSteals:{label:'Robos · Directo', live:true, value:(player,game)=>eventCounts(game,player).steals, team:game=>mean(game.players||[],player=>eventCounts(game,player).steals)},
  liveTurnovers:{label:'Pérdidas · Directo', live:true, value:(player,game)=>eventCounts(game,player).turnovers, team:game=>mean(game.players||[],player=>eventCounts(game,player).turnovers)},
  liveOrb:{label:'REB O · Directo', live:true, value:(player,game)=>eventCounts(game,player).orb, team:game=>mean(game.players||[],player=>eventCounts(game,player).orb)}
};

function availablePlayerMetrics() {
  const hasLive=validGames().some(game=>(game.events||[]).some(event=>!event.undone));
  return Object.entries(PLAYER_METRICS).filter(([,metric])=>!metric.live||hasLive);
}

function playerMetricRows(player,key) {
  const metric=PLAYER_METRICS[key]||PLAYER_METRICS.pts;
  return player.games.map(({g,p})=>({g,value:metric.value(p,g),team:metric.team(g)}));
}

function playerSeasonReference(key) {
  const metric=PLAYER_METRICS[key]||PLAYER_METRICS.pts;
  const games=validGames();
  if (key==='ftp') {
    const made=sum(games,game=>effectiveTotals(game,'own').ftm), attempted=sum(games,game=>effectiveTotals(game,'own').fta);
    return attempted?made/attempted*100:null;
  }
  const values=games.map(game=>metric.team(game)).filter(value=>value!==null&&Number.isFinite(+value));
  return values.length?mean(values,value=>value):null;
}

function playerTrendSVG(player,key) {
  const metric=PLAYER_METRICS[key]||PLAYER_METRICS.pts, rows=playerMetricRows(player,key), season=playerSeasonReference(key);
  if (!rows.length) return `<div class="empty-chart">Sin partidos</div>`;
  const valid=rows.flatMap(row=>[row.value,row.team,season]).filter(value=>value!==null&&Number.isFinite(+value));
  const min=Math.min(0,...valid), max=Math.max(1,...valid), w=780,h=285;
  const x=index=>rows.length===1?w/2:46+index*(w-92)/(rows.length-1), y=value=>h-46-(value-min)/(max-min||1)*(h-88);
  const buildSegments=field=>{const out=[];let current=[];rows.forEach((row,index)=>{const value=row[field];if(value===null||!Number.isFinite(+value)){if(current.length)out.push(current);current=[];}else current.push(`${x(index)},${y(value)}`)});if(current.length)out.push(current);return out;};
  return `<svg class="player-trend" viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolución de ${esc(metric.label)}">
    <line class="trend-axis" x1="28" y1="${h-46}" x2="${w-28}" y2="${h-46}"/>
    ${season===null?'':`<line class="team-season" x1="34" y1="${y(season)}" x2="${w-34}" y2="${y(season)}"/><text class="season-label" x="${w-36}" y="${Math.max(14,y(season)-7)}" text-anchor="end">Temporada ${metricValue(key,season)}</text>`}
    ${buildSegments('team').map(points=>`<polyline class="team-average" points="${points.join(' ')}"/>`).join('')}
    ${buildSegments('value').map(points=>`<polyline class="player-line" points="${points.join(' ')}"/>`).join('')}
    ${rows.map((row,index)=>`<g data-action="trend-game" data-id="${row.g.id}" tabindex="0" role="button">
      ${row.value===null?`<circle class="missing" cx="${x(index)}" cy="${h-46}" r="7"/><text class="missing-label" x="${x(index)}" y="${h-57}" text-anchor="middle">sin tiros</text>`:`<circle cx="${x(index)}" cy="${y(row.value)}" r="8"/><text x="${x(index)}" y="${Math.max(15,y(row.value)-14)}" text-anchor="middle">${metricValue(key,row.value)}</text>`}
      <text class="game-index" x="${x(index)}" y="${h-18}" text-anchor="middle">P${index+1}</text><title>${esc(row.g.opponent)} · ${metric.label} ${row.value===null?'sin tiros':metricValue(key,row.value)}</title>
    </g>`).join('')}
  </svg><div class="trend-legend"><span class="player">Jugadora</span><span class="average">Equipo · partido</span><span class="season">Equipo · temporada</span></div>`;
}

function openPlayerDetail(key,metricKey='pts') {
  const player=playerAgg().find(item=>norm(item.name)===key); if(!player)return;
  modalContext={type:'player',key,metric:metricKey};
  const metric=PLAYER_METRICS[metricKey]||PLAYER_METRICS.pts;
  const eligible=player.games.filter(({g,p})=>metric.value(p,g)!==null);
  const best=eligible.length?[...eligible].sort((a,b)=>(metric.value(b.p,b.g)||0)-(metric.value(a.p,a.g)||0))[0]:null;
  const teamPts=sum(validGames(),game=>game.us), teamMinutes=validGames().length*200;
  const averages=[['PTS/P',player.gp?num(player.pts/player.gp):'—'],['PTS/40',player.min?num(player.pts/player.min*40):'—'],['MIN/P',player.gp?num(player.min/player.gp):'—'],['VAL/P',player.gp?num(player.val/player.gp):'—'],['FAL/P',player.gp?num(player.fouls/player.gp):'—'],['FAL/40',player.min?num(player.fouls/player.min*40):'—'],['+/- /P',player.gp?signed(player.pm/player.gp):'—'],['2P/P',player.gp?num(player.p2m/player.gp):'—'],['3P/P',player.gp?num(player.p3m/player.gp):'—'],['TL/P',player.gp?num(player.ftm/player.gp):'—'],['TL%',player.fta?pct(player.ftm/player.fta*100):'Sin tiros']];
  const options=availablePlayerMetrics().map(([metricId,item])=>`<option value="${metricId}" ${metricId===metricKey?'selected':''}>${item.label}</option>`).join('');
  openModal('Jugadora',namePretty(player.name),`<div class="player-summary"><div class="player-number large">${esc(player.number||'—')}</div><div><b>${player.gp} partidos</b><span>${best?`Mejor ${metric.label}: ${esc(best.g.opponent)}`:'Sin dato válido'}</span></div></div><div class="player-overview"><div class="detail-stats">${averages.map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><div class="share-donuts">${donut(teamPts?player.pts/teamPts*100:0,'Cuota de puntos','player')}${donut(teamMinutes?player.min/teamMinutes*100:0,'Cuota de minutos','game')}</div></div><section class="trend-section"><div class="trend-head"><div><h3>Evolución</h3><p>Dos referencias: equipo en cada partido y temporada.</p></div><select id="playerMetric">${options}</select></div><div id="playerTrend">${playerTrendSVG(player,metricKey)}</div></section><section><h3>Partidos</h3><div class="player-games">${player.games.map(({g,p})=>`<button data-detail="game:${g.id}"><span><b>${esc(g.opponent)}</b><small>${g.date||'Sin fecha'} · ${formatMinutes(p.min)}</small></span><strong>${p.pts} PTS</strong><em>${signed(p.pm)}</em></button>`).join('')}</div></section>`);
}

/* ── Match report and shot maps ─────────────────────────────────── */
const BOX_GROUPS = [
  {label:'', cols:[['min','MIN'],['pts','PTS']]},
  {label:'TIRO', cols:[['p2ai','2P'],['p3ai','3P'],['ftai','TL']]},
  {label:'REBOTE', optional:true, cols:[['rebDef','DEF'],['rebOff','OF'],['rebTot','TOT']]},
  {label:'JUEGO', optional:true, cols:[['ast','AST'],['rec','REC'],['per','PER'],['tapTc','TAP'],['tapTr','TAP R']]},
  {label:'', cols:[['fouls','FAL'],['foulsDrawn','FR'],['val','VAL'],['pm','+/-']]},
  {label:'DIRECTO', live:true, cols:[['liveSteals','ROB'],['liveTurnovers','PER'],['liveOrb','REB O'],['liveRivalOrb','REB R']]}
];

function visibleBoxGroups(rows, total, own) {
  return BOX_GROUPS.map(group => ({...group, cols:group.cols.filter(([k]) => {
    if (group.live && !own) return false;
    if (k === 'foulsDrawn' && !rows.some(r => +r[k])) return false;
    if (!group.optional && !group.live) return true;
    return rows.some(r => +r[k]) || +total[k];
  })})).filter(g => g.cols.length);
}

function formatBox(r, key) {
  if (key === 'min') return r.minRaw || formatMinutes(r.min);
  if (['p2ai','p3ai','ftai'].includes(key)) return esc(r[key] || '0/0');
  if (key === 'pm') return signed(+r[key] || 0).replace(',0','');
  if (key.startsWith('live') && !r[key]) return '—';
  return Number.isFinite(+r[key]) ? +r[key] : '—';
}

function compareBox(a, b) {
  const ax = String(a ?? ''), bx = String(b ?? '');
  if (ax.includes('/') || bx.includes('/')) return parseAI(ax).m - parseAI(bx).m;
  const an = parseFloat(ax), bn = parseFloat(bx); return Number.isFinite(an) && Number.isFinite(bn) ? an - bn : ax.localeCompare(bx, 'es', {numeric:true});
}

function openGameDetail(gameId) {
  const g = state.games.find(x => x.id === gameId); if (!g) return;
  modalContext = {type:'game', gameId, side:'own', sort:'number', dir:1, map:'attack'};
  openModal('Partido', g.opponent, `<div id="gameDetail"></div>`); renderGameDetail();
}

function renderGameDetail() {
  if (modalContext?.type !== 'game') return;
  const g = state.games.find(x => x.id === modalContext.gameId); if (!g) return;
  const own = modalContext.side === 'own', players = own ? (g.players || []) : (g.opponentPlayers || []);
  const rows = players.map(p => { const ec = eventCounts(g,p); return {...p, liveSteals:own ? ec.steals : 0, liveTurnovers:own ? ec.turnovers : 0, liveOrb:own ? ec.orb : 0, liveRivalOrb:0}; });
  const ec = eventCounts(g), rawTotal = effectiveTotals(g, own ? 'own' : 'opp');
  const total = {...rawTotal, name:'TOTALES', liveSteals:own ? ec.steals : 0, liveTurnovers:own ? ec.turnovers : 0, liveOrb:own ? ec.orb : 0, liveRivalOrb:own ? ec.rivalOrb : 0};
  rows.sort((a,b) => compareBox(a[modalContext.sort], b[modalContext.sort]) * modalContext.dir);
  const groups = visibleBoxGroups(rows, total, own), columns = groups.flatMap(x => x.cols);
  const warning = g.needsReimport || (!own && !players.length) ? `<div class="reimport-inline"><b>Faltan datos del rival</b><span>Vuelve a importar el acta. La actualización conserva Directo y mapas.</span><button class="btn" data-action="import-games">Reimportar</button></div>` : '';
  $('#gameDetail').innerHTML = `<div class="score-hero"><div><span>${g.home ? 'Casa' : 'Fuera'} · ${g.date || 'Sin fecha'}</span><strong>${g.us}–${g.them}</strong></div><div class="result-pill ${g.us > g.them ? 'win' : 'loss'}">${g.us > g.them ? 'Victoria' : 'Derrota'}</div></div>${warning}<div class="team-tabs"><button class="${own ? 'active' : ''}" data-action="game-team" data-side="own">Buen Consejo · ${g.us}</button><button class="${!own ? 'active' : ''}" data-action="game-team" data-side="opp">${esc(g.opponent)} · ${g.them}</button></div><div class="box-hint">Desliza la tabla</div><div class="box-wrap"><table class="boxscore"><thead><tr><th class="identity" rowspan="2" data-action="sort-box" data-key="number">Nº · Nombre</th>${groups.map(group => `<th colspan="${group.cols.length}">${group.label}</th>`).join('')}</tr><tr>${groups.map(group => group.cols.map(([k,label]) => `<th data-action="sort-box" data-key="${k}">${label}${modalContext.sort === k ? (modalContext.dir === 1 ? ' ↑' : ' ↓') : ''}</th>`).join('')).join('')}</tr></thead><tbody>${rows.map(r => `<tr><td class="identity" title="${esc(namePretty(r.name))}"><b>${esc(r.number || '—')}</b><span>${esc(firstName(r.name))}</span></td>${columns.map(([k]) => `<td>${formatBox(r,k)}</td>`).join('')}</tr>`).join('')}<tr class="totals"><td class="identity"><b></b><span>TOTALES</span></td>${columns.map(([k]) => `<td>${formatBox(total,k)}</td>`).join('')}</tr></tbody></table></div><div class="game-map-block"><div class="map-switch"><button class="${modalContext.map === 'attack' ? 'active' : ''}" data-action="game-map" data-mode="attack">Ataque</button><button class="${modalContext.map === 'defense' ? 'active' : ''}" data-action="game-map" data-mode="defense">Defensa</button><button class="${modalContext.map === 'both' ? 'active' : ''}" data-action="game-map" data-mode="both">Juntos</button></div>${courtHTML(modalContext.map === 'defense' ? [] : g.shotsFor || [], modalContext.map === 'attack' ? [] : g.shotsAgainst || [], false)}<button class="btn" data-action="shot-for-game" data-id="${g.id}">Editar mapa</button></div>`;
}

function openScoringMixDetail() {
  const games = validGames().sort((a,b) => String(a.date).localeCompare(String(b.date)));
  const add = (out, total) => {
    ['p2m','p3m','ftm'].forEach(key => out[key] = (out[key] || 0) + (+total[key] || 0));
    return out;
  };
  const own = games.reduce((out,game) => add(out,effectiveTotals(game,'own')),{});
  const opp = games.reduce((out,game) => add(out,effectiveTotals(game,'opp')),{});
  modalContext = {type:'scoring-mix'};
  openModal('Estadística','Origen de los puntos',`<p class="metric-explain">Reparte los puntos entre canastas de 2, triples y tiros libres. Son anotaciones, no porcentajes de tiro.</p><section class="detail-block"><div class="card-title"><div><h3>Temporada</h3><span>Buen Consejo y rival</span></div></div>${scoringMixCompare(own,opp)}</section><section class="detail-block"><h3>Partido a partido</h3><div class="mix-games">${games.map((game,index)=>`<button data-detail="game:${game.id}"><header><span>P${index+1} · ${esc(game.opponent)}</span><strong>${game.us}–${game.them}</strong></header>${scoringMixCompare(effectiveTotals(game,'own'),effectiveTotals(game,'opp'))}</button>`).join('')}</div></section>`);
}

function metricPlayerBreakdown(key) {
  const metric=TEAM_METRICS[key], players=playerAgg().filter(player=>player.gp);
  if (!metric?.player || key==='ftp') return '';
  const total=player=>+player[metric.player]||0;
  if (key==='fouls') {
    const rate=player=>player.min?player.fouls/player.min*40:0,max=Math.max(1,...players.map(rate));
    return `<section class="detail-block"><h3>Faltas por jugadora</h3><p class="metric-explain">FAL/40 permite comparar cargas distintas de minutos. Menos es mejor.</p><div class="breakdown-bars">${[...players].sort((a,b)=>rate(a)-rate(b)).map(player=>`<button data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span><i><b style="width:${rate(player)/max*100}%"></b></i><strong>${num(rate(player))} /40 · ${total(player)} total</strong></button>`).join('')}</div></section>`;
  }
  const max=Math.max(1,...players.map(total));
  return `<section class="detail-block"><h3>Reparto por jugadora</h3><div class="breakdown-bars">${[...players].sort((a,b)=>total(b)-total(a)).map(player=>`<button data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span><i><b style="width:${total(player)/max*100}%"></b></i><strong>${metricValue(key,total(player),0)}</strong></button>`).join('')}</div></section>`;
}

function openTeamMetricDetail(key) {
  const metric=TEAM_METRICS[key]; if(!metric)return;
  const rows=teamMetricRows(key), ownTotal=aggregateMetric(key,rows,'own','total'), oppTotal=aggregateMetric(key,rows,'opp','total'), ownAvg=aggregateMetric(key,rows,'own'), oppAvg=aggregateMetric(key,rows,'opp');
  const ownValid=rows.filter(row=>row.own!==null&&Number.isFinite(+row.own));
  const ordered=[...ownValid].sort((a,b)=>metric.lowerBetter?a.own-b.own:b.own-a.own),best=ordered[0]||null,worst=ordered.at(-1)||null;
  const ftpExtra=key==='ftp'?`<div class="attempt-summary"><b>Buen Consejo</b><span>${sum(rows,row=>effectiveTotals(row.game,'own').ftm)}/${sum(rows,row=>effectiveTotals(row.game,'own').fta)} TL</span><b>Rival</b><span>${sum(rows,row=>effectiveTotals(row.game,'opp').ftm)}/${sum(rows,row=>effectiveTotals(row.game,'opp').fta)} TL</span></div>`:'';
  const per40=metric.per40?(()=>{const ownMinutes=sum(rows,row=>effectiveTotals(row.game,'own').min),oppMinutes=sum(rows,row=>effectiveTotals(row.game,'opp').min);return `<div class="metric-summary per40-summary"><div><span>Faltas BC / 40 min</span><strong>${ownMinutes?num(ownTotal/ownMinutes*40):'—'}</strong></div><div><span>Faltas rival / 40 min</span><strong>${oppMinutes?num(oppTotal/oppMinutes*40):'—'}</strong></div></div>`;})():'';
  modalContext={type:'metric',key};
  openModal('Estadística',metric.label,`<p class="metric-explain">${metric.note} En el detalle, rojo es Buen Consejo y azul el rival.</p><div class="metric-summary"><div><span>Total BC</span><strong>${metricValue(key,ownTotal,0)}</strong></div><div><span>Total rival</span><strong>${metricValue(key,oppTotal,0)}</strong></div><div><span>Media BC / partido</span><strong>${metricValue(key,ownAvg)}</strong></div><div><span>Media rival / partido</span><strong>${metricValue(key,oppAvg)}</strong></div></div>${per40}${ftpExtra}<section class="detail-block"><div class="card-title"><div><h3>Evolución por partido</h3><span>Toca un punto para abrir el acta</span></div></div>${dualTrendSVG(rows,key,false)}<div class="chart-legend"><span class="us">Buen Consejo</span><span class="them">Rival</span></div></section><div class="best-worst"><div><span>${metric.lowerBetter?'Mejor BC · menos':'Mejor BC'}</span><b>${best?metricValue(key,best.own):'—'}</b><small>${best?esc(best.game.opponent):''}</small></div><div><span>${metric.lowerBetter?'Peor BC · más':'Menor BC'}</span><b>${worst?metricValue(key,worst.own):'—'}</b><small>${worst?esc(worst.game.opponent):''}</small></div></div>${metricPlayerBreakdown(key)}<section class="detail-block"><h3>Partido a partido</h3><div class="player-games">${rows.map(row=>`<button data-detail="game:${row.game.id}"><span><b>${esc(row.game.opponent)}</b><small>${row.game.date||'Sin fecha'}</small></span><strong>${metricValue(key,row.own)} / ${metricValue(key,row.opp)}</strong><em>${row.game.us}–${row.game.them}</em></button>`).join('')}</div></section>`);
}

function openPointShareDetail() {
  const players=playerAgg().sort((a,b)=>(b.pts||0)-(a.pts||0)||namePretty(a.name).localeCompare(namePretty(b.name),'es'));
  const total=sum(validGames(),game=>game.us),max=Math.max(1,...players.map(player=>player.pts||0));
  modalContext={type:'point-share'};
  openModal('Puntos','Reparto completo',`<p class="metric-explain">Las ${players.length} jugadoras de la plantilla. Una jugadora sin acta aparece con 0, no se elimina de la lista.</p><div class="breakdown-bars full-roster">${players.map(player=>`<button data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span><i><b style="width:${(+player.pts||0)/max*100}%"></b></i><strong>${+player.pts||0} · ${pct(total?(+player.pts||0)/total*100:0)}</strong></button>`).join('')}</div>`);
}

function liveEventPlayerName(event) {
  if (event.playerName) return event.playerName;
  const roster=state.roster.find(player=>player.id===event.playerId);
  return roster?.name||'Equipo (sin jugadora)';
}

function openLiveMetricDetail(key) {
  const metric=LIVE_METRICS[key]; if(!metric)return;
  const rows=liveMetricRows(key),ownTotal=sum(rows,row=>row.own),oppTotal=sum(rows,row=>row.opp),ownAvg=mean(rows,row=>row.own),oppAvg=mean(rows,row=>row.opp),games=recordedLiveGames();
  const quarters=[1,2,3,4].map(quarter=>{const events=games.flatMap(game=>(game.events||[]).filter(event=>!event.undone&&(+event.quarter||1)===quarter));return {quarter,own:events.filter(event=>event.type===metric.types[0]).length,opp:events.filter(event=>event.type===metric.types[1]).length};});
  const people=new Map();
  games.flatMap(game=>(game.events||[]).filter(event=>!event.undone&&event.type===metric.types[0])).forEach(event=>{const name=liveEventPlayerName(event);people.set(name,(people.get(name)||0)+1)});
  const playerRows=[...people.entries()].sort((a,b)=>b[1]-a[1]);
  modalContext={type:'live-metric',key};
  openModal('Directo',metric.label,`<p class="metric-explain">${metric.note} Los partidos sin registro manual quedan fuera de las medias.</p><div class="metric-summary"><div><span>Total · ${metric.ownLabel}</span><strong>${ownTotal}</strong></div><div><span>Total · ${metric.oppLabel}</span><strong>${oppTotal}</strong></div><div><span>Media · ${metric.ownLabel}</span><strong>${num(ownAvg)}</strong></div><div><span>Media · ${metric.oppLabel}</span><strong>${num(oppAvg)}</strong></div></div><section class="detail-block"><h3>Evolución por partido</h3>${dualTrendSVG(rows,key,false)}<div class="chart-legend"><span class="us">${metric.ownLabel}</span><span class="them">${metric.oppLabel}</span></div></section><section class="detail-block"><h3>Por cuarto</h3><div class="quarter-breakdown">${quarters.map(row=>compareBar(`Q${row.quarter}`,row.own,row.opp,value=>num(value,0))).join('')}</div></section><section class="detail-block"><h3>${key==='orb'?'REB O BC por jugadora':'Primer dato por jugadora'}</h3>${playerRows.length?`<div class="breakdown-bars">${playerRows.map(([name,value])=>`<div class="breakdown-static"><span>${esc(name==='Equipo (sin jugadora)'?name:shortName(name))}</span><i><b style="width:${value/Math.max(1,...playerRows.map(row=>row[1]))*100}%"></b></i><strong>${value}</strong></div>`).join('')}</div>`:'<div class="empty-inline">Sin asignaciones individuales.</div>'}</section><section class="detail-block"><h3>Partido a partido</h3><div class="player-games">${rows.map(row=>`<button data-detail="game:${row.game.id}"><span><b>${esc(row.game.opponent)}</b><small>${row.game.date||'Sin fecha'}</small></span><strong>${row.own} / ${row.opp}</strong><em>${metric.ownLabel} / ${metric.oppLabel}</em></button>`).join('')}</div></section>`);
}

function minutesHeatmap(players,games) {
  const values=players.flatMap(player=>games.map(game=>(game.players||[]).find(item=>norm(item.name)===norm(player.name))?.min||0)), max=Math.max(40,...values);
  return `<div class="minutes-heatmap" style="--games:${games.length}"><div class="heat-head"><span>Jugadora</span>${games.map((game,index)=>`<b title="${esc(game.opponent)}">P${index+1}</b>`).join('')}<b>Media</b><b>Cuota</b></div>${players.map(player=>{const perGame=games.map(game=>(game.players||[]).find(item=>norm(item.name)===norm(player.name))?.min??null), avg=player.gp?player.min/player.gp:0, share=games.length?player.min/(games.length*200)*100:0;return `<button class="heat-row" data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span>${perGame.map(value=>value===null?`<i class="heat-empty" title="No jugó">—</i>`:`<i style="--heat:${clamp(value/max)}" title="${formatMinutes(value)}">${Math.round(value)}</i>`).join('')}<b>${formatMinutes(avg)}</b><b>${num(share,0)}%</b></button>`;}).join('')}</div>`;
}

function openMinutesDetail() {
  const games=validGames().sort((a,b)=>String(a.date).localeCompare(String(b.date))), players=playerAgg().sort((a,b)=>(b.min||0)-(a.min||0)||namePretty(a.name).localeCompare(namePretty(b.name),'es'));
  const appearances=sum(players,player=>player.gp), teamPlayerAverage=appearances?sum(players,player=>player.min)/appearances:0;
  modalContext={type:'minutes'};
  openModal('Minutos','Carga y evolución',`<p class="metric-explain">Minutos de acta. La cuota compara los minutos de cada jugadora con los ${games.length*200} minutos de equipo disponibles.</p><div class="metric-summary three"><div><span>Partidos</span><strong>${games.length}</strong></div><div><span>Minutos equipo</span><strong>${formatMinutes(games.length*200)}</strong></div><div><span>Media jugadora-acta</span><strong>${formatMinutes(teamPlayerAverage)}</strong></div></div><section class="detail-block"><div class="card-title"><div><h3>Mapa de minutos</h3><span>Desliza lateralmente · toca una fila</span></div></div><div class="minutes-scroll" tabindex="0" aria-label="Tabla de minutos; desliza a derecha e izquierda">${minutesHeatmap(players,games)}</div></section><section class="detail-block"><div class="card-title"><div><h3>Evolución individual</h3><span>Mini gráfico, media y cuota de temporada</span></div></div><div class="minutes-evolution">${players.map(player=>{const series=games.map(game=>(game.players||[]).find(item=>norm(item.name)===norm(player.name))?.min??null),avg=player.gp?player.min/player.gp:0,share=games.length?player.min/(games.length*200)*100:0;return `<button data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span>${sparkline(series,'player',180,40)}<b>${formatMinutes(avg)} /P</b><strong>${num(share,0)}%</strong></button>`;}).join('')}</div></section>`);
}

function detail(id) {
  if (id==='heat-attack'||id==='heat-defense'||id==='heat-compare') return openHeatAnalysis(id);
  if (id==='minutes') return openMinutesDetail();
  if (id==='point-share') return openPointShareDetail();
  if (id==='scoring-mix') return openScoringMixDetail();
  if (id.startsWith('live:')) return openLiveMetricDetail(id.slice(5));
  if (id.startsWith('metric:')) return openTeamMetricDetail(id.slice(7));
  if (id.startsWith('player:')) return openPlayerDetail(decodeURIComponent(id.slice(7)));
  if (id.startsWith('game:')) return openGameDetail(id.slice(5));
}


function courtHTML(own = [], against = [], heat = false, selected = '') {
  const dots = (own || []).map((s,i) => shotSVG(s,'for',i,heat,selected)).join('') + (against || []).map((s,i) => shotSVG(s,'against',i,heat,selected)).join('');
  return `<div class="court ${heat ? 'read-only' : ''}" aria-label="Media pista FIBA"><svg viewBox="0 0 1500 1400" role="img"><rect class="court-floor" x="1" y="1" width="1498" height="1398"/><path class="court-line" d="M505 0V580H995V0M570 580a180 180 0 1 0 360 0a180 180 0 1 0-360 0M90 0V299A675 675 0 0 0 1410 299V0M625 157.5a125 125 0 0 0 250 0M660 120H840"/><circle class="rim-svg" cx="750" cy="157.5" r="22.5"/><line class="half-line" x1="0" y1="1399" x2="1500" y2="1399"/>${dots}</svg><div class="court-key"><span class="own-dot"></span>Ataque <span class="against-dot"></span>Defensa</div></div>`;
}
function shotSVG(s, kind, i, heat, selected) { const x = clamp(s.x)*1500, y = clamp(s.y)*1400, sel = selected === `${kind}:${i}`; return `<circle class="shot-svg ${kind === 'against' ? 'against ' : ''}${heat ? 'heat ' : ''}${sel ? 'selected' : ''}" data-kind="${kind}" data-index="${i}" cx="${x}" cy="${y}" r="${heat ? 56 : 17}"/>`; }
const ZONE_NAMES = ['Pintura','Media distancia','Triple de esquina','Triple'];
function zoneOf(p) { const xm=clamp(p.x)*15, ym=clamp(p.y)*14, dx=xm-7.5, dy=ym-1.575; if (ym<=5.8 && Math.abs(dx)<=2.45) return 'Pintura'; if ((xm<=.9 || xm>=14.1) && ym<=2.99) return 'Triple de esquina'; if (Math.hypot(dx,dy)>=6.75) return 'Triple'; return 'Media distancia'; }
function zoneCounts(points) { const out=Object.fromEntries(ZONE_NAMES.map(x=>[x,0])); (points||[]).forEach(p=>out[zoneOf(p)]++); return out; }
function zoneBars(points, tone='attack') { const c=zoneCounts(points), n=Math.max(1,points.length); return `<div class="zone-list ${tone}">${ZONE_NAMES.map(z=>`<div class="zone-bar"><span>${z}</span><i><b style="width:${c[z]/n*100}%"></b></i><strong>${c[z]}</strong></div>`).join('')}</div>`; }

function openHeatAnalysis(id) {
  const mode = id === 'heat-defense' ? 'defense' : id === 'heat-compare' ? 'both' : 'attack';
  modalContext = {type:'heat', mode};
  openModal('Mapa', mode === 'defense' ? 'Defensa' : mode === 'both' ? 'Ataque y defensa' : 'Ataque', `<div class="map-switch"><button class="${mode==='attack'?'active':''}" data-action="heat-mode" data-mode="attack">Ataque</button><button class="${mode==='defense'?'active':''}" data-action="heat-mode" data-mode="defense">Defensa</button><button class="${mode==='both'?'active':''}" data-action="heat-mode" data-mode="both">Juntos</button></div><div class="filter-row"><label class="field">Partido<select id="heatOpponent"><option value="">Temporada</option>${validGames().filter(g=>g.shotsFor?.length||g.shotsAgainst?.length).map(g=>`<option value="${g.id}">${esc(g.opponent)}</option>`).join('')}</select></label><label class="field">Condición<select id="heatHome"><option value="all">Casa y fuera</option><option value="home">Casa</option><option value="away">Fuera</option></select></label></div><div id="heatContent"></div>`);
  renderHeatFiltered();
}
function renderHeatFiltered() {
  if (modalContext?.type !== 'heat') return;
  const opponent = $('#heatOpponent')?.value || '', home = $('#heatHome')?.value || 'all';
  const games = validGames().filter(g => (!opponent || g.id === opponent) && (home === 'all' || (home === 'home') === !!g.home));
  const own = games.flatMap(g=>g.shotsFor||[]), against = games.flatMap(g=>g.shotsAgainst||[]), mode=modalContext.mode;
  $('#heatContent').innerHTML = `<div class="heat-grid"><div>${courtHTML(mode==='defense'?[]:own,mode==='attack'?[]:against,true)}</div><div>${mode==='both'?`<h3>Ataque</h3>${zoneBars(own,'attack')}<h3>Defensa</h3>${zoneBars(against,'defense')}`:zoneBars(mode==='defense'?against:own,mode==='defense'?'defense':'attack')}</div></div>`;
}

function openShotDetail(gameId='') {
  const games=validGames(); if(!games.length) return openModal('Mapa','Sin partido','<p>Importa un acta.</p>');
  const g=games.find(x=>x.id===gameId)||games[0]; modalContext={type:'shot',gameId:g.id,shotsFor:[...(g.shotsFor||[])],shotsAgainst:[...(g.shotsAgainst||[])],kind:'for',selected:''};
  openModal('Mapa', 'Editar', `<label class="field">Partido<select id="shotGame">${games.map(x=>`<option value="${x.id}" ${x.id===g.id?'selected':''}>${esc(x.opponent)}</option>`).join('')}</select></label><section class="shot-ai-workflow"><div><h3>1 · Lleva la captura a la IA</h3><p>La cabecera manda: equipo de arriba = mitad izquierda; equipo de abajo = mitad derecha. La IA debe confirmar cabecera, color y lista.</p><button class="btn" data-action="copy-shot-prompt">Copiar instrucciones para la IA</button></div><div><h3>2 · Pega aquí su respuesta</h3><label class="field" for="shotJson">JSON de la IA<textarea id="shotJson" rows="7" placeholder='Pega el bloque que empieza por { y termina por }'></textarea></label><button class="btn primary" data-action="apply-shot-json">Leer y colocar puntos</button><div id="shotAssignment" class="shot-assignment" aria-live="polite"></div></div></section><div class="court-wrap"><div id="shotCourt">${courtHTML(modalContext.shotsFor,modalContext.shotsAgainst,false,modalContext.selected)}</div><div><div class="shot-kind"><button class="active" data-action="shot-kind" data-kind="for">Ataque</button><button data-action="shot-kind" data-kind="against">Defensa</button></div><p class="muted">Toca para añadir. Arrastra para mover.</p><div class="action-row"><button class="btn" data-action="swap-shot-teams">Intercambiar</button><button class="btn danger" data-action="delete-selected-shot">Borrar punto</button><button class="btn danger" data-action="clear-shots">Vaciar</button></div><button class="btn primary wide" data-action="save-shots">Guardar mapa</button></div></div>`); bindShotCourt();
}

function shotPrompt() {
  return `Analiza una captura del mapa de tiro de Afición FBM del partido de BUEN CONSEJO. Identifica los equipos por la cabecera: el equipo de arriba corresponde siempre a la mitad izquierda y el de abajo a la mitad derecha. Antes de asignar puntos, cruza tres señales: nombre en cabecera, color y lista de jugadoras; si no coinciden, pon checksAgree=false y explica conflict. Separa ownShots (BUEN CONSEJO) y opponentShots (rival). Convierte ambas mitades a una media pista con x e y entre 0 y 1 y la canasta arriba. No inventes lanzamientos. Responde solo JSON válido: {"court":"half","ownIdentification":{"team":"BUEN CONSEJO","side":"left|right","color":"nombre","checksAgree":true,"conflict":""},"opponentIdentification":{"team":"RIVAL","side":"left|right","color":"nombre","checksAgree":true,"conflict":""},"ownShots":[{"x":0.42,"y":0.18}],"opponentShots":[{"x":0.55,"y":0.22}]}.`;
}
function repaintShotCourt() {
  const wrap = $('#shotCourt');
  if (!wrap) return;
  wrap.innerHTML = courtHTML(modalContext.shotsFor, modalContext.shotsAgainst, false, modalContext.selected);
  bindShotCourt();
}

function bindShotCourt() {
  const court = $('#shotCourt .court');
  if (!court) return;
  let dragging = null, moved = false;
  court.addEventListener('pointerdown', event => {
    const dot = event.target.closest('.shot-svg');
    if (!dot) return;
    dragging = {kind:dot.dataset.kind, index:+dot.dataset.index};
    modalContext.selected = `${dragging.kind}:${dragging.index}`;
    moved = false;
    dot.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  court.addEventListener('pointermove', event => {
    if (!dragging) return;
    moved = true;
    const rect = court.getBoundingClientRect();
    const points = dragging.kind === 'for' ? modalContext.shotsFor : modalContext.shotsAgainst;
    const point = points[dragging.index];
    point.x = clamp((event.clientX - rect.left) / rect.width);
    point.y = clamp((event.clientY - rect.top) / rect.height);
    const dot = event.target.closest('.shot-svg');
    if (dot) {
      dot.setAttribute('cx', point.x * 1500);
      dot.setAttribute('cy', point.y * 1400);
    }
  });
  court.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = null;
    repaintShotCourt();
  });
  court.addEventListener('click', event => {
    const dot = event.target.closest('.shot-svg');
    if (dot) {
      modalContext.selected = `${dot.dataset.kind}:${dot.dataset.index}`;
      return repaintShotCourt();
    }
    if (moved) return;
    const rect = court.getBoundingClientRect();
    const point = {id:uid(), x:clamp((event.clientX-rect.left)/rect.width), y:clamp((event.clientY-rect.top)/rect.height), source:'manual'};
    const points = modalContext.kind === 'for' ? modalContext.shotsFor : modalContext.shotsAgainst;
    points.push(point);
    modalContext.selected = `${modalContext.kind}:${points.length-1}`;
    repaintShotCourt();
  });
}

/* ── Live game, sync and app actions ────────────────────────────── */
function startLive() {
  const rival = (state.liveDraft.rival || '').trim();
  if (!rival) return toast('Escribe el rival');
  const ids = state.liveDraft.selected;
  if (!ids.length) return toast('Selecciona al menos una jugadora');
  state.live = {id:uid(), opponent:rival, date:state.liveDraft.date || today(), quarter:1, players:state.roster.filter(player => ids.includes(player.id)), events:[], startedAt:new Date().toISOString()};
  save();
  record('live-upsert', {live:state.live});
  render();
}

function addLive(type) {
  if (type === 'orbAgainst') return commitLiveEvent(type, null);
  const label = type === 'steal' ? 'Robo' : type === 'turnover' ? 'Pérdida' : 'Rebote ofensivo';
  openModal('Directo', label, `<button class="team-choice" data-action="pick-live-player" data-id="" data-type="${type}"><strong>Equipo</strong><span>Sin jugadora</span></button><div class="player-grid">${state.live.players.map(player => `<button class="player-choice" data-action="pick-live-player" data-id="${player.id}" data-type="${type}"><strong>${esc(player.number||'—')}</strong><span>${esc(namePretty(player.name))}</span></button>`).join('')}</div>`);
}

function commitLiveEvent(type, playerId) {
  const player = state.live.players.find(item => item.id === playerId);
  const event = {id:uid(), type, quarter:state.live.quarter, playerId:playerId || null, playerName:player?.name || null, at:new Date().toISOString(), provenance:'recorded'};
  state.live.events.push(event);
  save();
  record('live-event', {liveId:state.live.id, event});
  closeModal();
  render();
  toast('Apuntado');
}

function undoLive() {
  const event = [...state.live.events].reverse().find(item => !item.undone);
  if (!event) return;
  event.undone = true;
  save();
  record('live-undo', {liveId:state.live.id, eventId:event.id});
  render();
}

function requestDiscardLive() {
  openModal('Directo', 'Descartar partido', '<p class="metric-explain">Se borrarán los eventos de este Directo en todos los dispositivos sincronizados. No se guardará ningún dato del partido.</p><div class="confirm-actions"><button class="btn" data-action="close-modal">Seguir apuntando</button><button class="btn danger" data-action="confirm-discard-live">Descartar partido</button></div>');
}

function discardLive() {
  if (!state.live) return;
  state.live.events = [];
  state.live = null;
  save();
  record('live-upsert', {live:null, discarded:true});
  closeModal();
  render();
  toast('Partido descartado');
}

function bestGameMatch(live) {
  const words = new Set(norm(live.opponent).split(' '));
  let best = null, score = 0;
  state.games.forEach(game => {
    const gameWords = norm(game.opponent).split(' ');
    const next = gameWords.filter(word => words.has(word)).length / Math.max(words.size, gameWords.length) + (game.date === live.date ? .5 : 0);
    if (next > score) { score = next; best = game; }
  });
  return score > .35 ? best : null;
}

function finishLive() {
  const live = state.live, match = bestGameMatch(live);
  if (!match) return openModal('Directo', 'Guardar pendiente', '<p>Se unirá al importar el acta.</p><button class="btn primary" data-action="keep-live-pending">Guardar</button>');
  match.events = [...(match.events || []), ...live.events.filter(event => !event.undone)];
  match.availability = {...(match.availability || {}), manual:true};
  record('replace-game', {game:match});
  state.live = null;
  save();
  record('live-upsert', {live:null});
  toast('Directo unido al acta');
  setView('games');
}

function keepLivePending() {
  state.games.push({id:uid(), opponent:state.live.opponent, date:state.live.date, home:true, us:null, them:null, players:[], opponentPlayers:[], events:state.live.events.filter(event => !event.undone), shotsFor:[], shotsAgainst:[], source:'live-pending', availability:{manual:true, boxscore:false, opponentBoxscore:false, shotMap:false}});
  record('replace-game', {game:state.games.at(-1)});
  state.live = null;
  save();
  record('live-upsert', {live:null});
  closeModal();
  setView('games');
}

function openSettings(){openModal('Aplicación','Ajustes',`<label class="field">URL del Worker<input id="apiUrl" value="${esc(state.settings.api)}" placeholder="https://…workers.dev"></label><label class="field">Token<input id="apiToken" value="${esc(state.settings.token)}"></label><label class="field">Permiso<select id="apiRole"><option value="admin" ${state.settings.role==='admin'?'selected':''}>Administrador</option><option value="editor" ${state.settings.role==='editor'?'selected':''}>Editor</option><option value="viewer" ${state.settings.role==='viewer'?'selected':''}>Solo lectura</option></select></label><div class="action-row"><button class="btn primary" data-action="save-settings">Guardar</button><button class="btn" data-action="export-json">Exportar copia</button></div>${state.settings.role==='admin'&&state.settings.api?`<article class="settings-block"><h3>Compartir</h3><label class="field">Nombre<input id="inviteLabel"></label><div class="action-row"><button class="btn" data-action="create-invite" data-role="editor">Enlace de edición</button><button class="btn" data-action="create-invite" data-role="viewer">Enlace de lectura</button></div><div id="inviteResult"></div></article>`:''}`);}
function saveSettings(){state.settings.api=$('#apiUrl').value.trim().replace(/\/$/,'');state.settings.token=$('#apiToken').value.trim();state.settings.role=$('#apiRole').value;save();closeModal();syncNow();render();}
async function createInvite(role){try{const response=await fetch(`${state.settings.api}/api/invites`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${state.settings.token}`},body:JSON.stringify({role,label:$('#inviteLabel')?.value||''})}),json=await response.json();if(!response.ok)throw Error(json.error||'No se pudo crear');const link=`${location.origin}${location.pathname}?api=${encodeURIComponent(state.settings.api)}&token=${encodeURIComponent(json.token)}&role=${role}`;$('#inviteResult').innerHTML=`<label class="field">Enlace<textarea id="inviteLink" rows="3" readonly>${esc(link)}</textarea></label><button class="btn" data-action="copy-invite">Copiar</button>`;}catch(error){toast(error.message);}}
function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(syncNow,700);}
function applyRemote(row){const event=row.event||row;if(state.ops.some(x=>x.id===event.id))return false;const p=event.payload||{};if(event.type==='set-roster')state.roster=mergeRoster(state.roster,p.roster||[]);if(event.type==='replace-game'){const i=state.games.findIndex(g=>g.id===p.game.id);i<0?state.games.push(sanitise({...blank(),games:[p.game]}).games[0]):state.games[i]=sanitise({...blank(),games:[p.game]}).games[0];}if(event.type==='live-upsert')state.live=p.live;if(event.type==='live-event'&&state.live?.id===p.liveId&&!state.live.events.some(e=>e.id===p.event.id))state.live.events.push(p.event);if(event.type==='live-undo'&&state.live?.id===p.liveId){const e=state.live.events.find(e=>e.id===p.eventId);if(e)e.undone=true;}if(event.type==='shot-set'){const g=state.games.find(g=>g.id===p.gameId);if(g){g.shotsFor=p.shotsFor||[];g.shotsAgainst=p.shotsAgainst||[];}}return true;}
async function syncNow(){if(syncing||!state.settings.api||!state.settings.token)return;syncing=true;paintSync(true);try{if(state.ops.length&&state.settings.role!=='viewer'){const response=await fetch(`${state.settings.api}/api/events`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${state.settings.token}`},body:JSON.stringify({events:state.ops})});if(!response.ok)throw Error('No se pudo enviar');state.ops=[];}const before=deepSignature({roster:state.roster,games:state.games,live:state.live});const response=await fetch(`${state.settings.api}/api/events?since=${state.lastSeq}`,{headers:{'Authorization':`Bearer ${state.settings.token}`}});if(!response.ok)throw Error('No se pudo leer');const json=await response.json();(json.events||[]).forEach(applyRemote);state.lastSeq=json.lastSeq||state.lastSeq;save();$('#syncStatus').classList.add('online');const changed=before!==deepSignature({roster:state.roster,games:state.games,live:state.live});const editing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);if(changed&&!editing)render();else if(changed)renderAfterEdit=true;}catch(error){console.warn(error);$('#syncStatus').classList.remove('online');}finally{syncing=false;paintSync();}}
function paintSync(busy=false){const s=$('#syncStatus');if(!s)return;s.querySelector('b').textContent=busy?'Sincronizando':state.settings.api?'Conectado':'Local';s.classList.toggle('online',!!state.settings.api&&!busy);}

async function copyText(text){try{await navigator.clipboard.writeText(text);}catch(error){const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();if(!document.execCommand('copy'))throw error;area.remove();}toast('Copiado');}
function exportJSON(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download=`estadisticas-${today()}.json`;a.click();URL.revokeObjectURL(a.href);}
function install(){if(installPrompt){installPrompt.prompt();installPrompt=null;}else openModal('Instalar','Instalar aplicación','<p>En Chrome abre el menú y pulsa «Instalar aplicación».</p>');}
function applyTheme(theme){theme=theme==='dark'?'dark':'light';document.documentElement.dataset.theme=theme;const color=theme==='dark'?'#0b0f16':'#f3f5f8',meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=color;document.documentElement.style.backgroundColor=color;document.body.style.backgroundColor=color;}

function updateDraftFromInput(target){if(target.id==='rival')state.liveDraft.rival=target.value;if(target.id==='liveDate')state.liveDraft.date=target.value;if(target.matches('.roster-card input')){const set=new Set(state.liveDraft.selected);target.checked?set.add(target.value):set.delete(target.value);state.liveDraft.selected=[...set];const card=target.closest('.roster-card');card.classList.toggle('selected',target.checked);card.querySelector('.check').textContent=target.checked?'✓':'';$('#selectedCount').textContent=`${set.size} convocadas`;}save();}

document.addEventListener('input',e=>{if(view==='live'&&!state.live&&(e.target.id==='rival'||e.target.id==='liveDate'))updateDraftFromInput(e.target);});
document.addEventListener('change',e=>{if(view==='live'&&!state.live&&(e.target.id==='liveDate'||e.target.matches('.roster-card input')))updateDraftFromInput(e.target);if(e.target.matches('#heatOpponent,#heatHome'))renderHeatFiltered();if(e.target.id==='playerMetric'&&modalContext?.type==='player')openPlayerDetail(modalContext.key,e.target.value);if(e.target.id==='minutesScope'){minutesScope=e.target.value;render();}});
document.addEventListener('click',async e=>{
  const go=e.target.closest('[data-go]');if(go)return setView(go.dataset.go);
  const d=e.target.closest('[data-detail]');if(d)return detail(d.dataset.detail);
  const a=e.target.closest('[data-action]');if(!a)return;const act=a.dataset.action;
  const write=new Set(['import-games','import-roster','confirm-import','start-live','quarter','add-live','pick-live-player','undo-live','discard-live','confirm-discard-live','finish-live','keep-live-pending','open-shot','shot-for-game','shot-kind','swap-shot-teams','delete-selected-shot','clear-shots','apply-shot-json','save-shots']);
  if(state.settings.role==='viewer'&&write.has(act))return toast('Enlace de solo lectura');
  if(act==='close-modal')return closeModal();if(act==='toggle-theme'){const th=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(th);localStorage.setItem('estadisticas_theme',th);return;}if(act==='install')return install();if(act==='open-settings'||act==='open-sync')return openSettings();if(act==='save-settings')return saveSettings();if(act==='export-json')return exportJSON();if(act==='create-invite')return createInvite(a.dataset.role);if(act==='copy-invite')return copyText($('#inviteLink').value);
  if(act==='import-games'||act==='import-roster'){fileMode=act==='import-roster'?'roster':'games';$('#fileInput').value='';return $('#fileInput').click();}if(act==='confirm-import')return commitImport();
  if(act==='start-live')return startLive();if(act==='quarter'){state.live.quarter=+a.dataset.q;record('live-upsert',{live:state.live});return render();}if(act==='add-live')return addLive(a.dataset.type);if(act==='pick-live-player')return commitLiveEvent(a.dataset.type,a.dataset.id||null);if(act==='undo-live')return undoLive();if(act==='discard-live')return requestDiscardLive();if(act==='confirm-discard-live')return discardLive();if(act==='finish-live')return finishLive();if(act==='keep-live-pending')return keepLivePending();
  if(act==='sort-players'){const key=a.dataset.key;if(playerSort===key)playerSortDir*=-1;else{playerSort=key;playerSortDir=-1;}return render();}
  if(act==='trend-game')return openGameDetail(a.dataset.id);if(act==='game-team'){modalContext.side=a.dataset.side;return renderGameDetail();}if(act==='sort-box'){const k=a.dataset.key;if(modalContext.sort===k)modalContext.dir*=-1;else{modalContext.sort=k;modalContext.dir=k==='number'?1:-1;}return renderGameDetail();}if(act==='game-map'){modalContext.map=a.dataset.mode;return renderGameDetail();}
  if(act==='heat-mode')return openHeatAnalysis(`heat-${a.dataset.mode==='both'?'compare':a.dataset.mode}`);
  if(act==='open-shot')return openShotDetail();if(act==='shot-for-game')return openShotDetail(a.dataset.id);if(act==='copy-shot-prompt')return copyText(shotPrompt());if(act==='shot-kind'){modalContext.kind=a.dataset.kind;$$('.shot-kind button').forEach(b=>b.classList.toggle('active',b===a));return;}if(act==='swap-shot-teams'){[modalContext.shotsFor,modalContext.shotsAgainst]=[modalContext.shotsAgainst,modalContext.shotsFor];modalContext.selected='';repaintShotCourt();return;}if(act==='delete-selected-shot'){if(!modalContext.selected)return toast('Selecciona un punto');const[k,i]=modalContext.selected.split(':'),arr=k==='for'?modalContext.shotsFor:modalContext.shotsAgainst;arr.splice(+i,1);modalContext.selected='';repaintShotCourt();return;}if(act==='clear-shots'){modalContext.shotsFor=[];modalContext.shotsAgainst=[];modalContext.selected='';repaintShotCourt();return;}
  if(act==='apply-shot-json'){try{const raw=$('#shotJson').value.replace(/```(?:json)?|```/g,'').trim(),j=JSON.parse(raw);if(!Array.isArray(j.ownShots)||!Array.isArray(j.opponentShots))throw Error('Faltan ownShots u opponentShots');const all=[...j.ownShots,...j.opponentShots];if(all.some(point=>!Number.isFinite(+point.x)||!Number.isFinite(+point.y)||+point.x<0||+point.x>1||+point.y<0||+point.y>1))throw Error('Hay coordenadas fuera de 0–1');const own=j.ownIdentification||{},opp=j.opponentIdentification||{};if(own.checksAgree===false||opp.checksAgree===false||own.conflict||opp.conflict)throw Error(`La IA detectó un conflicto: ${own.conflict||opp.conflict||'revisa cabecera, color y lista'}`);modalContext.shotsFor=foldShots(j.ownShots,j.court||'half',own.side||'left');modalContext.shotsAgainst=foldShots(j.opponentShots,j.court||'half',opp.side||'right');modalContext.selected='';repaintShotCourt();const assignment=$('#shotAssignment');if(assignment)assignment.textContent=`✓ ${modalContext.shotsFor.length} ataque · ${modalContext.shotsAgainst.length} defensa · revisa la pista antes de guardar`;toast('Puntos colocados');}catch(error){const assignment=$('#shotAssignment');if(assignment)assignment.textContent=error.message||'JSON no válido';toast(error.message||'JSON no válido');}return;}
  if(act==='save-shots'){const g=state.games.find(x=>x.id===$('#shotGame').value);g.shotsFor=modalContext.shotsFor;g.shotsAgainst=modalContext.shotsAgainst;g.availability={...(g.availability||{}),shotMap:!!(g.shotsFor.length||g.shotsAgainst.length)};save();record('shot-set',{gameId:g.id,shotsFor:g.shotsFor,shotsAgainst:g.shotsAgainst});closeModal();render();}
});

$('#fileInput').addEventListener('change',e=>handleFiles([...e.target.files]));
document.addEventListener('focusout',()=>setTimeout(()=>{if(renderAfterEdit&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){renderAfterEdit=false;render();}},0));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)closeModal();if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-detail],[data-action="trend-game"]'))e.target.click();});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(console.warn);
const query=new URLSearchParams(location.search);if(query.get('api')&&query.get('token')){state.settings.api=query.get('api');state.settings.token=query.get('token');state.settings.role=query.get('role')||'viewer';save();history.replaceState({},'',location.pathname);}
paintSync();render();if(state.settings.api){syncNow();setInterval(syncNow,5000);}
window.__ESTADISTICAS__={getState:()=>state,setState:s=>{state=sanitise(s);save();render();},foldShots,splitLegacyShots,parseGame,validateTotals,effectiveTotals,teamStats,playerAgg,teamMetricRows,aggregateMetric,playerMetricRows,playerSeasonReference,liveMetricRows,PLAYER_METRICS,TEAM_METRICS,LIVE_METRICS,APP_VERSION,STORE};
