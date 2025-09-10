(function () {
  // ← Remplace ici si tu redéploies l’Apps Script et que l’URL change
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyh7ibo_mq5oCEZnkNHQduVfkTJPBaE1PDsGG8Sn6rOSdrpr61uPtUMdVTtk-iwbFl2/exec";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const state = { adresses: [] };

  // ------- Auto-complétion d'adresses (adresses.json au même niveau que index.html)
  fetch('adresses.json', { cache: 'no-cache' })
    .then(r => r.json())
    .then(list => {
      if (Array.isArray(list)) {
        state.adresses = list;
        console.log(`[PS12] ${list.length} adresses chargées`);
      }
    })
    .catch(err => console.warn('[PS12] Échec chargement adresses.json', err));

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
    const results = state.adresses.filter(a => a.toLowerCase().includes(q));
    showSuggestions(results);
  });

  // ------- Afficher/masquer la suite du formulaire selon Oui/Non
  $$('input[name="accepte_info"]').forEach(r => {
    r.addEventListener('change', function () {
      const suite = $('#suiteForm');
      const msg = $('#messageConfirmation');
      const submitBtn = $('#submitBtn');
      if (this.value === 'Oui') {
        suite.hidden = false;
        msg.textContent = '';
        if (submitBtn) submitBtn.style.display = 'inline-block';
        $('#date_contact').value = new Date().toLocaleString('fr-FR');
      } else {
        suite.hidden = true;
        msg.textContent = "Nous vous remercions de votre collaboration, à bientôt peut-être !";
        if (submitBtn) submitBtn.style.display = 'none';
      }
    });
  });

  // ------- Lieu → champ précision (Marché, Métro, École, Supermarché, Autre)
  $('#lieu_contact')?.addEventListener('change', function () {
    const doitMontrer = ['Autre', 'Marché', 'Métro', 'École', 'Supermarché'].includes(this.value);
    $('#lieu_precis_container').hidden = !doitMontrer;
  });

  // ------- Compétence conditionnelle
  $('#cb_competence')?.addEventListener('change', e => {
    $('#competence_container').hidden = !e.target.checked;
  });

  // ------- Domaines : afficher le textarea de détail quand la case est cochée
  $$('.cb-domaine').forEach(cb => {
    const targetSel = cb.getAttribute('data-target');
    const target = targetSel ? document.querySelector(targetSel) : null;
    cb.addEventListener('change', () => {
      if (!target) return;
      target.hidden = !cb.checked;
      if (!cb.checked) target.value = '';
    });
  });

  // ------- Soumission : envoi à Google Sheets (Apps Script)
  $('#psForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const fd = new FormData(form);

    // Concaténation Lieu + précision
    const lieu = fd.get('lieu_contact') || '';
    const lieuPrec = (fd.get('lieu_precis') || '').trim();
    const lieuFinal = lieuPrec ? `${lieu} : ${lieuPrec}` : lieu;

    // Listes
    const souhaits = fd.getAll('souhaits[]');
    const interets = fd.getAll('interets[]');
    const quartiers = fd.getAll('quartiers[]');
    const domaines = fd.getAll('domaines[]');

    // Détails des domaines (si textarea rempli)
    const domainesDetails = {};
    domaines.forEach(d => {
      const name = 'domaines_detail_' + d;
      const v = fd.get(name);
      if (v) domainesDetails[d] = v;
    });

    // Objet de données conforme aux colonnes attendues côté Apps Script/Sheet
    const data = {
      HORODATAGE: new Date().toLocaleString('fr-FR'),
      'Lieu du contact': lieuFinal,
      PRENOM: fd.get('prenom') || '',
      NOM: fd.get('nom') || '',
      'E-MAIL': fd.get('email') || '',
      TELEPHONE: fd.get('telephone') || '',
      'ADRESSE COMPLETE (Auto-complétion)': fd.get('adresse') || '',
      'Adresse autre': fd.get('adresse_autre') || '',

      // Souhaits (Oui / vide)
      'Participer à des réunions': souhaits.includes('Participer à des réunions') ? 'Oui' : '',
      'Faire du porte à porte': souhaits.includes('Faire du porte à porte') ? 'Oui' : '',
      'Distribution de documents': souhaits.includes('Distribution de documents') ? 'Oui' : '',
      'Boîtage documents': souhaits.includes('Boîtage documents') ? 'Oui' : '',
      'Apporter une compétence': souhaits.includes('Apporter une compétence') ? 'Oui' : '',
      'Compétence (texte)': fd.get('competence_texte') || '',

      // Listes (gardées telles quelles pour le traitement côté Apps Script)
      'Centres_interet': interets,
      QUARTIER: quartiers,
      DOMAINES: domaines,
      DOMAINES_DETAILS: domainesDetails,

      Commentaires: fd.get('commentaire') || ''
    };

    // Envoi
    try {
      const submitBtn = $('#submitBtn');
      submitBtn && submitBtn.classList.add('loading');

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',            // requis avec Apps Script côté client
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Feedback utilisateur + reset
      $('#messageConfirmation').textContent = 'Nous vous remercions de votre collaboration, à très vite !';
      $('#messageConfirmation').style.display = 'block';
      form.reset();
      $('#suiteForm').hidden = true;
      $('#lieu_precis_container').hidden = true;
      $$('.domain-detail').forEach(t => t.hidden = true);
    } catch (err) {
      console.error('[PS12] Erreur envoi', err);
      alert('Désolé, une erreur est survenue lors de l’envoi. Réessayez dans un instant.');
    } finally {
      const submitBtn = $('#submitBtn');
      submitBtn && submitBtn.classList.remove('loading');
    }
  });
})();
