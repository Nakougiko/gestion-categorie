import { toastContainer } from "./dom.js";

/**
 * 📌 Affiche une notification (toast)
 * @param {string} message - Le message à afficher
 * @param {string} type - Type de notification ("success", "error", "info")
 * @param {number} duration - Durée d'affichage en millisecondes (par défaut 3000ms)
 */
export function showToast(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.classList.add("toast", `toast-${type}`);
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Supprimer le toast après la durée spécifiée
    setTimeout(() => {
        toast.remove();
    }, duration);
}
