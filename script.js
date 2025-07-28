
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("checkbox_competence").addEventListener("change", function () {
    document.getElementById("competence_detail_container").style.display = this.checked ? "block" : "none";
  });
});
