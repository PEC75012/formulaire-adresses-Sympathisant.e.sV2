(function () {
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxclCD3YpT__pyUwUDCNHCK-WVrh_tDHVCU1z6ZcU9v1S0qOkWkrVJLJZfLRAu-jTE/exec";

  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const state = { adresses: [] };

  // ---------- ADRESSES (autocomplete)
  fetch('adresses.json', { cache: 'no-cache' })
    .then(r => r.json())
    .then(list => { if (Array.isArray(list)) state.adresses = list; });

  const input = $('#adresse');
  const box = $('#suggestions');

  function showSuggestions(items) {
    box.innerHTML = '';
    if (!items.length) { box.style.display = 'none'; return; }
    items.slice(0, 12).forEach(addr => {
      const div = document.createElement('div');
      div.className = 'suggestion';
      div.textContent = addr;
      div.onclick = () => { input.value = addr; box.style.display = 'none'; };
      box.appendChild(div);
    });
    box.style.display = 'block';
  }

  input?.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { box.style.display = 'none'; return; }
    showSuggestions(state.adresses.filter(a => a.toLowerCase().includes(q)));
  });

  // ---------- Afficher la suite si "Oui"
  $$('input[name="accepte_info"]').forEach(r => {
    r.addEventListener('change', function () {
      const suite = $('#suiteForm');
      const msg = $('#messageConfirmation');
      if (this.value === 'Oui') {
        suite.hidden = false; msg.textContent = '';
        $('#date_contact').value = new Date().toLocaleString('fr-FR');
      } else {
        suite.hidden = true;
        msg.textContent = "Nous vous remercions de votre collaboration, à bientôt peut-être !";
      }
    });
  });

  // ---------- Lieu : placeholder contextuel + affichage précision
  const placeholders = {
    'Marché':       "Indiquez le nom du marché…",
    'Métro':        "Indiquez la station de métro la plus proche…",
    'École':        "Indiquez le nom de l’établissement scolaire le plus proche…",
    'Supermarché':  "Indiquez le nom du supermarché…",
    'Autre':        "Précisez le lieu…"
  };
  $('#lieu_contact')?.addEventListener('change', function () {
    const v = this.value;
    const show = ['Marché','Métro','École','Supermarché','Autre'].includes(v);
    $('#lieu_precis_container').hidden = !show;
    if (show) $('#lieu_precis').placeholder = placeholders[v] || "Précisez le lieu…";
  });

  // ---------- Compétence conditionnelle
  $('#cb_competence')?.addEventListener('change', e => {
    $('#competence_container').hidden = !e.target.checked;
  });

  // ---------- Domaines: détail si coché
  $$('.cb-domaine').forEach(cb => {
    const target = document.querySelector(cb.getAttribute('data-target'));
    cb.addEventListener('change', () => {
      if (!target) return;
      target.hidden = !cb.checked;
      if (!cb.checked) target.value = '';
    });
  });

  // ---------- Soumission → Apps Script
  $('#psForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Lieu + précision concaténés
    const lieu = fd.get('lieu_contact') || '';
    const lieuPrec = (fd.get('lieu_precis') || '').trim();
    const lieuFinal = lieuPrec ? `${lieu} : ${lieuPrec}` : lieu;

    const souhaits = fd.getAll('souhaits[]');
    const interets = fd.getAll('interets[]');
    const quartiers = fd.getAll('quartiers[]');
    const domaines  = fd.getAll('domaines[]');

    // Détails domaines (clé = libellé domaine)
    const domainesDetails = {};
    domaines.forEach(d => {
      const name = 'domaines_detail_' + d;
      const v = (fd.get(name) || '').trim();
      // On envoie tout, la logique "Oui si vide / sinon détail" est faite côté Apps Script
      domainesDetails[d] = v;
    });

    const data = {
      HORODATAGE: new Date().toLocaleString('fr-FR'),
      'Lieu du contact': lieuFinal,
      PRENOM: fd.get('prenom') || '',
      NOM: fd.get('nom') || '',
      'E-MAIL': fd.get('email') || '',
      TELEPHONE: fd.get('telephone') || '',
      'ADRESSE COMPLETE (Auto-complétion)': fd.get('adresse') || '',
      'Adresse autre': fd.get('adresse_autre') || '',

      'Participer à des réunions': souhaits.includes('Participer à des réunions') ? 'Oui' : '',
      'Faire du porte à porte':   souhaits.includes('Faire du porte à porte')   ? 'Oui' : '',
      'Distribution de documents':souhaits.includes('Distribution de documents')? 'Oui' : '',
      'Boîtage documents':        souhaits.includes('Boîtage documents')        ? 'Oui' : '',
      'Apporter une compétence':  souhaits.includes('Apporter une compétence')  ? 'Oui' : '',
      'Compétence (texte)': fd.get('competence_texte') || '',

      QUARTIER: quartiers,               // liste, traité et joint côté Apps Script
      DOMAINES: domaines,                // liste de domaines cochés
      DOMAINES_DETAILS: domainesDetails, // texte saisi (ou vide)
      'Centres_interet': interets,       // liste, join côté Apps Script
      Commentaires: fd.get('commentaire') || ''
    };

    try {
      const submitBtn = $('#submitBtn'); submitBtn && submitBtn.classList.add('loading');
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Affichage du message final et masquage définitif du formulaire
      $('#psForm').hidden = true;
      $('#remerciementFinal').hidden = false;

    } catch (err) {
      console.error('[PS12] Erreur envoi', err);
      alert('Désolé, une erreur est survenue. Réessayez dans un instant.');
    } finally {
      const submitBtn = $('#submitBtn'); submitBtn && submitBtn.classList.remove('loading');
    }
  });
})();
