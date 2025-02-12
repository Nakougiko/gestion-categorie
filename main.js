import { openDatabase } from "./js/db.js";
import { loadCategories } from "./js/categories.js";

/**
 * 📌 Initialise l'application après le chargement du DOM
 */
document.addEventListener("DOMContentLoaded", () => {
    openDatabase(() => {
        loadCategories();
    });

    console.log("🚀 Application initialisée avec succès !");
});
