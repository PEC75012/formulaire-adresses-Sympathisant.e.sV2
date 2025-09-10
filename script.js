
(function () {
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz2AOgp7RA-uTlLdCnHwrPPnr1gweENUjF2wHCsId4ypXSYc1PRUyEL_x7jT75cZWk/exec';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const state = { adresses: [], cursor: -1 };

  const debounce = (fn, delay = 120) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); }; };
  const setHidden = (el, hidden) => { el.hidden = !!hidden; if (!hidden) el.removeAttribute('hidden'); };

  document.addEventListener('DOMContentLoaded', () => {
    const adresseInput = $('#adresse');
    const suggestionBox = $('#suggestions');

    // Charger les adresses
    fetch('adresses.json').then(r => r.json()).then(list => { state.adresses = list; }).catch(() => { state.adresses = []; });

    // Autocomplete
    const renderSuggestions = (items) => {
      suggestionBox.innerHTML = '';
      state.cursor = -1;
      if (!items.length) { suggestionBox.style.display = 'none'; $('.autocomplete-wrapper').setAttribute('aria-expanded', 'false'); return; }
      for (const addr of items.slice(0, 12)) {
        const div = document.createElement('div');
        div.className = 'suggestion';
        div.setAttribute('role', 'option');
        div.tabIndex = 0;
        div.textContent = addr;
        div.addEventListener('mousedown', (e) => { e.preventDefault(); adresseInput.value = addr; suggestionBox.style.display = 'none'; $('.autocomplete-wrapper').setAttribute('aria-expanded', 'false'); });
        div.addEventListener('keydown', (e) => { if (e.key === 'Enter') { adresseInput.value = addr; suggestionBox.style.display = 'none'; } });
        suggestionBox.appendChild(div);
      }
      suggestionBox.style.display = 'block';
      $('.autocomplete-wrapper').setAttribute('aria-expanded', 'true');
    };

    const onType = debounce(() => {
      const q = adresseInput.value.trim().toLowerCase();
      if (!q) { suggestionBox.style.display = 'none'; $('.autocomplete-wrapper').setAttribute('aria-expanded', 'false'); return; }
      const m = state.adresses.filter(a => a.toLowerCase().includes(q));
      renderSuggestions(m);
    }, 120);

    adresseInput.addEventListener('input', onType);

    // Navigation clavier
    adresseInput.addEventListener('keydown', (e) => {
      const items = Array.from(suggestionBox.children);
      if (!items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); state.cursor = (state.cursor + 1) % items.length; items[state.cursor].focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); state.cursor = (state.cursor - 1 + items.length) % items.length; items[state.cursor].focus(); }
      if (e.key === 'Escape')    { suggestionBox.style.display = 'none'; $('.autocomplete-wrapper').setAttribute('aria-expanded', 'false'); }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-wrapper')) { suggestionBox.style.display = 'none'; $('.autocomplete-wrapper').setAttribute('aria-expanded', 'false'); }
    });

    // Affichage conditionnel « Autre »
    $('#lieu_contact').addEventListener('change', function () {
      setHidden($('#lieu_autre_container'), this.value !== 'Autre');
    });

    // Afficher/masquer la suite selon Oui/Non
    $$('input[name="accepte_info"]').forEach(radio => {
      radio.addEventListener('change', function () {
        const suite = $('#suiteForm');
        const confirmation = $('#messageConfirmation');
        const submitBtn = $('#submitBtn');
        if (this.value === 'Oui') {
          setHidden(suite, false);
          confirmation.textContent = '';
          submitBtn.style.display = 'inline-block';
          $('#date_contact').value = new Date().toLocaleString('fr-FR');
        } else {
          setHidden(suite, true);
          confirmation.textContent = 'Nous vous remercions de votre collaboration, à bientôt peut‑être !';
          submitBtn.style.display = 'none';
        }
      });
    });

    // Champ compétence: apparait si coché
    const cbCompetence = $('#cb_competence');
    cbCompetence.addEventListener('change', function () {
      setHidden($('#competence_container'), !this.checked);
      if (!this.checked) $('#competence_texte').value = '';
    });

    // Domaines: show/hide textarea per checkbox
    $$('.cb-domaine').forEach(cb => {
      const targetSel = cb.getAttribute('data-target');
      const target = document.querySelector(targetSel);
      cb.addEventListener('change', () => {
        setHidden(target, !cb.checked);
        if (!cb.checked) target.value = '';
      });
    });

    // Soumission
    $('#psForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const submitBtn = $('#submitBtn');
      submitBtn.classList.add('loading');

      if (!form.checkValidity()) { form.reportValidity(); submitBtn.classList.remove('loading'); return; }

      const fd = new FormData(form);
      const souhaits = fd.getAll('souhaits[]');
      const interets = fd.getAll('interets[]');
      const quartiers = fd.getAll('quartiers[]');
      const domaines = fd.getAll('domaines[]');

      // Build domaines details map
      const domainesDetails = {};
      domaines.forEach(d => {
        const name = 'domaines_detail_' + d;
        const v = fd.get(name);
        if (v) domainesDetails[d] = v;
      });

      const data = {
        HORODATAGE: new Date().toLocaleString('fr-FR'),
        'Lieu du contact': (fd.get('lieu_contact') === 'Autre' ? (fd.get('lieu_autre') || '') : (fd.get('lieu_contact') || '')),
        PRENOM: fd.get('prenom') || '',
        NOM: fd.get('nom') || '',
        'E-MAIL': fd.get('email') || '',
        TELEPHONE: fd.get('telephone') || '',
        'ADRESSE COMPLETE (Auto-complétion)': fd.get('adresse') || '',
        'Adresse autre': fd.get('adresse_autre') || '',
        'Participer à des réunions': souhaits.includes('Participer à des réunions') ? 'Oui' : '',
        'Faire du porte à porte': souhaits.includes('Faire du porte à porte') ? 'Oui' : '',
        'Distribuer des documents': souhaits.includes('Distribution documents') ? 'Oui' : '',
        'Boîter des documents': souhaits.includes('Boitage documents') ? 'Oui' : '',
        'Apporter une compétence': souhaits.includes('Apporter une compétence') ? 'Oui' : '',
        'Compétence (texte)': fd.get('competence_texte') || '',
        'Centres_interet': interets,   // garde aussi la liste brute si utile
        QUARTIER: quartiers,
        DOMAINES: domaines,
        DOMAINES_DETAILS: domainesDetails,
        Commentaires: fd.get('commentaire') || ''
      };

      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        $('#messageConfirmation').textContent = 'Nous vous remercions de votre collaboration, à très vite !';
        $('#messageConfirmation').style.display = 'block';
        form.reset();
        setHidden($('#suiteForm'), true);
        setHidden($('#lieu_autre_container'), true);
        setHidden($('#competence_container'), true);
        $$('.domain-detail').forEach(t => setHidden(t, true));
      } catch (err) {
        alert('Désolé, une erreur est survenue. Réessayez dans un instant.');
        console.error(err);
      } finally {
        submitBtn.classList.remove('loading');
      }
    });
  });
})();
