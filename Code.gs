
const SPREADSHEET_ID = '1WbboQM3r6PT1K-SYp8aKin7eUJTKdMklyA1ldfJYzTM';

// Options normalisées (tiennent lieu de vérité côté Sheet)
const QUARTIERS = ['Bel-Air','Picpus','Bercy','Quinze-Vingts'];
const DOMAINES  = ['Communication','Porte-à-porte','Tractage/boîtage','Organisation d’événements','Logistique','Numérique','Relations presse','Finances / fundraising','Graphisme','Juridique'];

// Colonnes fixes en tête
const FIXED_HEADERS = [
  'HORODATAGE',
  'Lieu du contact',
  'PRENOM','NOM','E-MAIL','TELEPHONE',
  'ADRESSE COMPLETE (Auto-complétion)','Adresse autre',
  'Participer à des réunions','Faire du porte à porte','Distribuer des documents','Boîter des documents','Apporter une compétence','Compétence (texte)'
];

// Colonnes dynamiques (1/0) + détails
const QUARTIER_HEADERS = QUARTIERS.map(q => `Q - ${q}`);
const DOMAINES_HEADERS = DOMAINES.map(d => `D - ${d}`);
const DOMAINES_DETAIL_HEADERS = DOMAINES.map(d => `D - ${d} (détails)`);

// Dernières colonnes
const TAIL_HEADERS = [
  'Commentaires'
];

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheets()[0];

    const payload = JSON.parse(e.postData.contents || '{}');

    const HEADERS = [...FIXED_HEADERS, ...QUARTIER_HEADERS, ...DOMAINES_HEADERS, ...DOMAINES_DETAIL_HEADERS, ...TAIL_HEADERS];

    ensureHeaders(sh, HEADERS);

    // Analyse des listes
    const selectedQuartiers = asArray(payload.QUARTIER);
    const selectedDomaines  = asArray(payload.DOMAINES);
    const domainesDetails   = payload.DOMAINES_DETAILS || {};

    // Construire la ligne
    const rowObj = Object.assign({}, payload); // pour accès direct aux champs fixes
    // 1/0 pour quartiers
    QUARTIERS.forEach(q => rowObj[`Q - ${q}`] = selectedQuartiers.includes(q) ? 1 : 0);
    // 1/0 pour domaines
    DOMAINES.forEach(d => rowObj[`D - ${d}`] = selectedDomaines.includes(d) ? 1 : 0);
    // Détails domaines
    DOMAINES.forEach(d => rowObj[`D - ${d} (détails)`] = selectedDomaines.includes(d) ? (domainesDetails[d] || '') : '');

    const row = HEADERS.map(h => (h in rowObj) ? rowObj[h] : '');
    sh.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureHeaders(sh, HEADERS) {
  const lastCol = sh.getLastColumn();
  if (lastCol === 0) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }
  const current = sh.getRange(1, 1, 1, Math.max(HEADERS.length, lastCol)).getDisplayValues()[0];
  const currentSlice = current.slice(0, HEADERS.length);
  if (currentSlice.join('\u0001') !== HEADERS.join('\u0001')) {
    sh.clear();
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function asArray(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  return [v];
}
