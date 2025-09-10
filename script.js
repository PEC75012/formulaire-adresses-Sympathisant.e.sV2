(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const state = { adresses: [] };

  // Charger adresses.json
  fetch('adresses.json')
    .then(r => r.json())
    .then(list => {
      if (Array.isArray(list)) {
        state.adresses = list;
        console.log(`[PS12] ${list.length} adresses chargées`);
      }
    });

  const input = $('#adresse');
  const box = $('#suggestions');

  function showSuggestions(items) {
    box.innerHTML = '';
    if (!items.length) { box.style.display = 'none'; return; }
    items.slice(0,12).forEach(addr => {
      const div = document.createElement('div');
      div.className = 'suggestion';
      div.textContent = addr;
      div.onclick = () => { input.value = addr; box.style.display='none'; };
      box.appendChild(div);
    });
    box.style.display = 'block';
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { box.style.display='none'; return; }
    const results = state.adresses.filter(a => a.toLowerCase().includes(q));
    showSuggestions(results);
  });

  // Champ "Autre" pour lieu
  $('#lieu_contact').addEventListener('change', e => {
    $('#lieu_autre_container').hidden = (e.target.value !== 'Autre');
  });

  // Champ compétence conditionnel
  $('#cb_competence').addEventListener('change', e => {
    $('#competence_container').hidden = !e.target.checked;
  });
})();
