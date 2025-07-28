document.addEventListener("DOMContentLoaded", function () {
  let adresses = [];

  fetch('adresses.json')
    .then(res => res.json())
    .then(data => adresses = data);

  const adresseInput = document.getElementById('adresse');
  const suggestionBox = document.getElementById('suggestions');

  adresseInput.addEventListener('input', function () {
    const value = this.value.toLowerCase();
    suggestionBox.innerHTML = '';
    if (!value) {
      suggestionBox.style.display = 'none';
      return;
    }
    const matches = adresses.filter(addr => addr.toLowerCase().includes(value)).slice(0, 10);
    matches.forEach(match => {
      const div = document.createElement('div');
      div.className = 'suggestion';
      div.textContent = match;
      div.addEventListener('click', () => {
        adresseInput.value = match;
        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'none';
      });
      suggestionBox.appendChild(div);
    });
    suggestionBox.style.display = matches.length ? 'block' : 'none';
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.autocomplete-wrapper')) {
      suggestionBox.style.display = 'none';
    }
  });

  // Gérer affichage de la zone "Autre"
  document.getElementById('lieu_contact').addEventListener('change', function () {
    const autreInput = document.getElementById('lieu_autre_container');
    autreInput.style.display = this.value === 'Autre' ? 'block' : 'none';
  });

  // Gérer affichage du formulaire selon réponse Oui / Non
  document.getElementsByName('accepte_info').forEach(radio => {
    radio.addEventListener('change', function () {
      const suite = document.getElementById('suiteForm');
      const confirmation = document.getElementById('messageConfirmation');
      const submitBtn = document.querySelector('button[type="submit"]');
      if (this.value === 'Oui') {
        suite.style.display = 'block';
        confirmation.style.display = 'none';
        submitBtn.style.display = 'inline-block';
        document.getElementById('date_contact').value = new Date().toLocaleString();
      } else {
        suite.style.display = 'none';
        confirmation.innerText = "Nous vous remercions de votre collaboration, à bientôt peut-être !";
        confirmation.style.display = 'block';
        submitBtn.style.display = 'none';
      }
    });
  });

  // Soumission du formulaire
  document.getElementById('psForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');

    const formData = new FormData(form);
    const data = {};

    data["HORODATAGE"] = new Date().toLocaleString();
    const lieuContact = formData.get("lieu_contact");
    const lieuAutre = formData.get("lieu_autre") || "";
    data["Lieu du contact"] = lieuContact === "Autre" && lieuAutre ? lieuAutre : lieuContact || "";

    data["PRENOM"] = formData.get("prenom") || "";
    data["NOM"] = formData.get("nom") || "";
    data["E-MAIL"] = formData.get("email") || "";
    data["TELEPHONE"] = formData.get("telephone") || "";
    data["ADRESSE COMPLETE (Auto-complétion)"] = formData.get("adresse") || "";
    data["Adresse autre"] = formData.get("adresse_autre") || "";

  // Rajout Quartier
    data["Quartier (si adresse non remplie)"] = formData.get("quartier") || "";
// Rajout Notes
    data["NOTES (motivation)"] = formData.get("NOTES") || "";

    
    const souhaits = formData.getAll("souhaits[]");
    data["Participer à des réunions"] = souhaits.includes("Participer à des réunions") ? "Oui" : "";
    data["Faire du porte à porte"] = souhaits.includes("Faire du porte à porte") ? "Oui" : "";
    data["Distribuer des documents"] = souhaits.includes("Distribution documents") ? "Oui" : "";
    data["Boîter des documents"] = souhaits.includes("Boitage documents") ? "Oui" : "";
    data["Apporter une compétence"] = souhaits.includes("Apporter une compétence") ? "Oui" : "";

    const interets = formData.getAll("interets[]");
    data["Le logement comme garantie du droit à bien vivre à paris"] = interets.includes("Le logement comme garantie du droit à bien vivre à Paris") ? "Oui" : "";
    data["Une école publique de qualité pour lutter contre les déterminismes sociaux"] = interets.includes("Une école publique de qualité pour lutter contre les déterminismes sociaux") ? "Oui" : "";
    data["Des services publics qui prennent soin de chacune et chacun"] = interets.includes("Des services publics qui prennent soin de chacune et chacun") ? "Oui" : "";
    data["La transformation écologique pour une ville vivable et désirable"] = interets.includes("La transformation écologique pour une ville vivable et désirable") ? "Oui" : "";
    data["Une ville apaisée pour une meilleure qualité de vie au quotidien"] = interets.includes("Une ville apaisée pour une meilleure qualité de vie au quotidien") ? "Oui" : "";
    data["La culture, levier d’émancipation et de partage"] = interets.includes("La culture, levier d’émancipation et de partage") ? "Oui" : "";
    data["Une capitale ouverte sur sa métropole, motrice de l’intérêt général"] = interets.includes("Une capitale ouverte sur sa métropole, motrice de l’intérêt général") ? "Oui" : "";
    data["Une ville du soin et de la solidarité"] = interets.includes("Une ville du soin et de la solidarité") ? "Oui" : "";
    data["Redonner du souffle au débat démocratique"] = interets.includes("Redonner du souffle au débat démocratique") ? "Oui" : "";
    data["Paris, capitale de l’égalité et de la lutte contre toutes les discriminations"] = interets.includes("Paris, capitale de l’égalité et de la lutte contre toutes les discriminations") ? "Oui" : "";

    data["Commentaires"] = formData.get("commentaire") || "";

    fetch('https://script.google.com/macros/s/AKfycbx2YPeAT6kzLwtomfvOCMijd9A_b32w4y5m0ICAkO_thVTs5jG2cN4no4ziFC2JYvglEg/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(() => {
      submitBtn.classList.remove('loading');
      document.getElementById('messageConfirmation').innerText = "Nous vous remercions de votre collaboration, à très vite !";
      document.getElementById('messageConfirmation').style.display = 'block';
      form.reset();
      document.getElementById('suiteForm').style.display = 'none';
    });
  });
});
