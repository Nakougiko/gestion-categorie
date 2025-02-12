import { 
    deleteModal, editModal, addProductModal, 
    editProductModal, deleteProductModal, addSubCategoryModal 
} from "./dom.js";

/**
 * 📌 Ouvre un modal
 * @param {HTMLElement} modal - L'élément modal à afficher
 */
export function openModal(modal) {
    modal.style.display = "flex";
}

/**
 * 📌 Ferme un modal
 * @param {HTMLElement} modal - L'élément modal à cacher
 */
export function closeModal(modal) {
    modal.style.display = "none";
}

/**
 * Ferme un modal quand l'utilisateur clique à l'extérieur
 */
window.addEventListener("click", (event) => {
    if (event.target === deleteModal) closeModal(deleteModal);
    if (event.target === editModal) closeModal(editModal);
    if (event.target === addSubCategoryModal) closeModal(addSubCategoryModal);
    if (event.target === addProductModal) closeModal(addProductModal);
    if (event.target === editProductModal) closeModal(editProductModal);
    if (event.target === deleteProductModal) closeModal(deleteProductModal);
});
