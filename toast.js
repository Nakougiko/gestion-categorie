// Créer un conteneur pour les toasts si il n'existe pas déjà
if (!document.getElementById("toast-container")) {
    const toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
}

function showToast(message, type = "info", duration = 3000) {
    const toastContainer = document.getElementById("toast-container");
    const toast = document.createElement("div");

    toast.classList.add("toast", `toast-${type}`);
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Supprimer le toast après la durée spécifiée
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// Rendre la fonction accessible globalement
window.showToast = showToast;
