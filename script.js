document.addEventListener("DOMContentLoaded", function () {
  let adresses = [];

  fetch("adresses.json")
    .then((res) => res.json())
    .then((data) => (adresses = data));

  const adresseInput = document.getElementById("adresse");
  const suggestionBox = document.getElementById("suggestions");

  adresseInput.addEventListener("input", function () {
    const value = this.value.toLowerCase();
    suggestionBox.innerHTML = "";
    if (!value) {
      suggestionBox.style.display = "none";
      return;
    }
    const matches = adresses
      .filter((addr) => addr.toLowerCase().includes(value))
      .slice(0, 10);
    matches.forEach((match) => {
      const div = document.createElement("div");
      div.className = "suggestion";
      div.textContent = match;
      div.addEventListener("click", () => {
        adresseInput.value = match;
        suggestionBox.innerHTML = "";
        suggestionBox.style.display = "none";
      });
      suggestionBox.appendChild(div);
    });
    suggestionBox.style.display = matches.length ? "block" : "none";
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".autocomplete-wrapper")) {
      suggestionBox.style.display = "none";
    }
  });

  document.getElementById("lieu_contact").addEventListener("change", function () {
    const autreInput = document.getElementById("lieu_autre_container");
    autreInput.style.display = this.value === "Autre" ? "block" : "none";
  });

  document.getElementsByName("accepte_info").forEach((radio) => {
    radio.addEventListener("change", function () {
      const suite = document.getElementById("suiteForm");
      const confirmation = document.getElementById("messageConfirmation");
      const submitBtn = document.querySelector("button[type='submit']");
      if (this.value === "Oui") {
        suite.style.display = "block";
        confirmation.style.display = "none";
        submitBtn.style.display = "inline-block";
        document.getElementById("date_contact").value = new Date().toLocaleString();
      } else {
        suite.style.display = "none";
        confirmation.innerText = "Nous vous remercions de votre collaboration, à bientôt peut-être !";
        confirmation.style.display = "block";
        confirmation.style.color = "green";
        submitBtn.style.display = "none";
      }
    });
  });

  // Affichage champ "Apporter une compétence"
  const checkboxCompetence = document.getElementById("checkbox_competence");
  const competenceDetailContainer = document.getElementById("competence_detail_container");

  if (checkboxCompetence) {
    checkboxCompetence.addEventListener("change", function () {
      competenceDetailContainer.style.display = this.checked ? "block" : "none";
    });
  }

  // Soumission du formulaire
  const form = document.getElementById("psForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();

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
    data["QUARTIER"] = formData.get("quartier") || "";
    data["Notes"] = formData.get("Notes") || "";

    const souhaits = formData.getAll("souhaits[]");
    data["Participer à des réunions"] = souhaits.includes("Participer à des réunions") ? "Oui" : "";
    data["Faire du porte à porte"] = souhaits.includes("Faire du porte à porte") ? "Oui" : "";
    data["Distribuer des documents"] = souhaits.includes("Distribution documents") ? "Oui" : "";
    data["Boîter des documents"] = souhaits.includes("Boitage documents") ? "Oui" : "";
    data["Apporter une compétence"] = souhaits.includes("Apporter une compétence") ? "Oui" : "";
    data["Apporter une compétence - Détail"] = formData.get("competence_detail") || "";

    const interets = formData.getAll("interets[]");
    const interetLabels = [
      "Le logement comme garantie du droit à bien vivre à Paris",
      "Une école publique de qualité pour lutter contre les déterminismes sociaux",
      "Des services publics qui prennent soin de chacune et chacun",
      "La transformation écologique pour une ville vivable et désirable",
      "Une ville apaisée pour une meilleure qualité de vie au quotidien",
      "La culture, levier d’émancipation et de partage",
      "Une capitale ouverte sur sa métropole, motrice de l’intérêt général",
      "Une ville du soin et de la solidarité",
      "Redonner du souffle au débat démocratique",
      "Paris, capitale de l’égalité et de la lutte contre toutes les discriminations"
    ];
    interetLabels.forEach(label => {
      data[label] = interets.includes(label) ? "Oui" : "";
    });

    data["Commentaires"] = formData.get("commentaire") || "";

    fetch("https://script.google.com/macros/s/YOUR_SCRIPT_URL/exec", {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(() => {
      document.querySelector("button[type='submit']").classList.remove("loading");
      const confirmation = document.getElementById("messageConfirmation");
      confirmation.innerText = "Nous vous remercions de votre collaboration, à très vite !";
      confirmation.style.display = "block";
      confirmation.style.color = "green";
      form.reset();
      document.getElementById("suiteForm").style.display = "none";
      document.getElementById("competence_detail_container").style.display = "none";
    });
  });
});
