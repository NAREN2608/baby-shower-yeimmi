/* Google Apps Script para la lista de regalos. Configura SPREADSHEET_ID antes de ejecutar inicializar(). */
const SPREADSHEET_ID = 'PEGA_AQUI_EL_ID_DE_TU_HOJA';
const SHEET_ELECCIONES = 'Elecciones';
const SHEET_OPERACIONES = 'Operaciones';
const CATALOG = Object.freeze({
  tina: 'unico', 'kit-aseo': 'unico', 'cuna-moises': 'unico', monitor: 'unico', termometro: 'unico',
  'organizador-panales': 'unico', 'aspirador-nasal': 'unico', 'extractor-leche': 'unico', paseador: 'unico', 'silla-comer': 'unico',
  'ropa-3-6': 'varios', 'ropa-6-9': 'varios', 'ropa-9-12': 'varios', 'ropa-12-18': 'varios', mamelucos: 'varios', pijamas: 'varios',
  'panales-3-4': 'varios', cobija: 'varios', toallas: 'varios', juguetes: 'varios', 'regalo-libre': 'varios'
});

function inicializar() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf('PEGA_AQUI') === 0) throw new Error('Configura SPREADSHEET_ID antes de inicializar.');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ensureSheet_(ss, SHEET_ELECCIONES, ['requestId', 'giftId', 'fecha']);
  ensureSheet_(ss, SHEET_OPERACIONES, ['requestId', 'estado', 'detalle', 'fecha']);
}

function doGet(e) {
  const p = (e && e.parameter) || {}; let response;
  try { response = p.action === 'state' ? getState_() : p.action === 'request' ? getRequest_(p.requestId) : { ok: false, error: 'Acción de solo lectura no válida.' }; }
  catch (err) { response = { ok: false, error: 'No se pudo consultar la lista.' }; }
  return jsonp_(p.callback, response);
}

function doPost(e) {
  let result;
  try { result = register_(parsePost_(e)); } catch (err) { result = { ok: false, error: 'Solicitud no válida.' }; }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function register_(data) {
  validateRequest_(data);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const ss = spreadsheet_(), operations = ss.getSheetByName(SHEET_OPERACIONES), choices = ss.getSheetByName(SHEET_ELECCIONES);
    if (findOperation_(operations, data.requestId)) return { ok: true, duplicate: true };
    const n = Math.max(choices.getLastRow() - 1, 0), rows = n ? choices.getRange(2, 1, n, 3).getValues() : [];
    const selected = new Set(rows.filter(row => CATALOG[row[1]] === 'unico').map(row => String(row[1])));
    const unavailable = data.giftIds.filter(id => CATALOG[id] === 'unico' && selected.has(id)), now = new Date();
    if (unavailable.length) { operations.appendRow([data.requestId, 'rejected', JSON.stringify({ error: 'Uno o más regalos únicos ya fueron elegidos.', unavailable: unavailable }), now]); return { ok: true, rejected: true }; }
    choices.getRange(choices.getLastRow() + 1, 1, data.giftIds.length, 3).setValues(data.giftIds.map(id => [data.requestId, id, now]));
    operations.appendRow([data.requestId, 'success', '', now]); return { ok: true, accepted: true };
  } finally { if (lock.hasLock()) lock.releaseLock(); }
}

function getState_() {
  const choices = spreadsheet_().getSheetByName(SHEET_ELECCIONES), n = Math.max(choices.getLastRow() - 1, 0);
  const rows = n ? choices.getRange(2, 1, n, 3).getValues() : [], unicosElegidos = [], conteos = {};
  rows.forEach(row => { const id = String(row[1]); if (CATALOG[id] === 'unico') unicosElegidos.push(id); else if (CATALOG[id] === 'varios') conteos[id] = (conteos[id] || 0) + 1; });
  return { ok: true, unicosElegidos: [...new Set(unicosElegidos)], conteos: conteos };
}

function getRequest_(requestId) {
  if (!validRequestId_(requestId)) return { ok: false, error: 'requestId no válido.' };
  const found = findOperation_(spreadsheet_().getSheetByName(SHEET_OPERACIONES), requestId);
  if (!found) return { ok: true, encontrada: false };
  const detail = found[2] ? JSON.parse(found[2]) : {};
  return { ok: true, encontrada: true, exito: found[1] === 'success', error: detail.error || '' };
}

function parsePost_(e) { return { requestId: e && e.parameter && e.parameter.requestId, giftIds: JSON.parse((e && e.parameter && e.parameter.giftIds) || 'null') }; }
function validateRequest_(data) { if (!data || !validRequestId_(data.requestId) || !Array.isArray(data.giftIds) || !data.giftIds.length || data.giftIds.length > Object.keys(CATALOG).length) throw new Error('Solicitud no válida.'); const unique = new Set(data.giftIds); if (unique.size !== data.giftIds.length || data.giftIds.some(id => typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(CATALOG, id))) throw new Error('Regalo no válido.'); }
function validRequestId_(value) { return typeof value === 'string' && /^[A-Za-z0-9-]{16,80}$/.test(value); }
function spreadsheet_() { if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf('PEGA_AQUI') === 0) throw new Error('SPREADSHEET_ID no configurado.'); return SpreadsheetApp.openById(SPREADSHEET_ID); }
function ensureSheet_(ss, name, headers) { const sheet = ss.getSheetByName(name) || ss.insertSheet(name); if (sheet.getLastRow() === 0) sheet.appendRow(headers); return sheet; }
function findOperation_(sheet, requestId) { const n = Math.max(sheet.getLastRow() - 1, 0); if (!n) return null; return sheet.getRange(2, 1, n, 4).getValues().find(row => String(row[0]) === requestId) || null; }
function jsonp_(callback, data) { if (typeof callback !== 'string' || !/^[A-Za-z_$][0-9A-Za-z_$]{0,80}$/.test(callback)) return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); return ContentService.createTextOutput(`${callback}(${JSON.stringify(data)});`).setMimeType(ContentService.MimeType.JAVASCRIPT); }
