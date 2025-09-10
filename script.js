// 🧩 Renseigne l'URL de déploiement Apps Script ↓↓↓
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzbXdhebwttNBZC_a21KVP4WUGlVx-em24W5vZLI1Eub5MkZER2hGAM3Ytq4zxe8Hp5/exec';

// --- Google Places ---
window.initPlaces = function initPlaces(){
  const input = document.getElementById('autocomplete');
  if (!input) return;
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: ['fr'] }
  });
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (place && place.formatted_address) {
      input.value = place.formatted_address;
    }
  });
};

// --- UI : champs conditionnels ---
const skillToggle = document.getElementById('skill-toggle');
const skillWrap = document.getElementById('skill-detail-wrap');
const skillDetail = document.getElementById('skill-detail');

skillToggle?.addEventListener('change', () => {
  if (skillToggle.checked) {
    skillWrap.classList.remove('hidden');
    skillDetail.focus();
  } else {
    skillWrap.classList.add('hidden');
    skillDetail.value = '';
  }
});

// Domaines : afficher le champ libre associé quand coché
const domainsRoot = document.getElementById('domains');
if (domainsRoot){
  domainsRoot.querySelectorAll('input[type="checkbox"][data-free]').forEach(cb => {
    cb.addEventListener('change', () => {
      const free = document.getElementById(cb.dataset.free);
      if (!free) return;
      if (cb.checked) { free.classList.add('show'); } else { free.classList.remove('show'); free.value=''; }
    });
  });
}

// --- Soumission ---
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submit-btn');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = 'Envoi en cours…';
  submitBtn.disabled = true;

  try {
    const fd = new FormData(form);

    // Construire l’objet de données mappé aux entêtes Sheet
    const payload = {
      'Lieu du contact': fd.get('Lieu du contact')?.toString().trim() || '',
      'PRENOM': fd.get('PRENOM')?.toString().trim() || '',
      'NOM': fd.get('NOM')?.toString().trim() || '',
      'E-MAIL': fd.get('E-MAIL')?.toString().trim() || '',
      'TELEPHONE': fd.get('TELEPHONE')?.toString().trim() || '',
      'ADRESSE COMPLETE (Auto-complétion)': fd.get('ADRESSE COMPLETE (Auto-complétion)')?.toString().trim() || '',
      'Adresse autre': fd.get('Adresse autre')?.toString().trim() || '',
      'QUARTIER': fd.get('QUARTIER')?.toString() || '',
      'Notes': fd.get('Notes')?.toString().trim() || ''
    };

    // Domaines sélectionnés + précisions entre parenthèses
    const domainChecks = Array.from(domainsRoot?.querySelectorAll('input[type="checkbox"][data-free]') || []);
    const domainValues = domainChecks
      .filter(cb => cb.checked)
      .map(cb => {
        const free = document.getElementById(cb.dataset.free);
        const extra = free && free.value.trim() ? ` (${free.value.trim()})` : '';
        return `${cb.value}${extra}`;
      });
    // Le serveur éclatera cela en colonnes 1/0
    payload['DOMAINES D’ACTIVITÉ / D’ENGAGEMENT'] = domainValues.join(', ');

    // Apporter une compétence
    payload['Apporter une compétence'] = skillToggle?.checked ? 'oui' : 'non';
    if (skillToggle?.checked && skillDetail?.value.trim()) {
      payload['Apporter une compétence - détail'] = skillDetail.value.trim();
    }

    // POST JSON → Apps Script
    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let ok = res.ok;
    try {
      const data = await res.json();
      ok = data?.ok ?? ok;
    } catch(_) {}

    if (ok) {
      statusEl.textContent = '✅ Merci ! Votre réponse a bien été enregistrée.';
      form.reset();
      skillWrap.classList.add('hidden');
      domainsRoot?.querySelectorAll('.free').forEach(el => { el.classList.remove('show'); el.value=''; });
    } else {
      throw new Error('Réponse non confirmée par le serveur');
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = '❌ Échec de l’envoi. Vérifiez votre connexion et réessayez.';
  } finally {
    submitBtn.disabled = false;
  }
});
