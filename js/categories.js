import {
    categoryInput,
    addCategoryBtn,
    categoryList,
    editModal,
    editInput,
    updateCategory,
    cancelEdit,
    deleteModal,
    confirmDelete,
    cancelDelete,
    addSubCategoryModal,
    confirmAddSubCategory,
    cancelAddSubCategory,
    subCategoryNameInput
} from "./dom.js";

import {
    getDatabase,
    getAllCategories,
    addCategory,
    deleteCategory
} from "./db.js";

import { openAddProductModal, loadProducts } from "./products.js";

import { showToast } from "./toast.js";
import { openModal, closeModal } from "./modals.js";

import { enableDragAndDrop } from "./dragndrop.js";

let categoryToDelete = null;
let categoryToEdit = null;
let parentCategoryId = null;

let clipboard = { type: null, data: null, name: null }; // Stocke l'élément copié (catégorie ou produit)

/**
 * Charge et affiche les catégories et sous-catégories depuis IndexedDB (récursif)
 */
export function loadCategories() {
    categoryList.innerHTML = "";

    getAllCategories((categories) => {
        let rootCategories = categories.filter(category => category.parentId === null);

        rootCategories.forEach(category => {
            let categoryContainer = createCategoryElement(category, 0, categories);
            categoryList.appendChild(categoryContainer);
        });

        enableDragAndDrop(); // Active le Drag & Drop
    });
}

/**
 * Ajoute une catégorie à IndexedDB et recharge l'affichage
 */
addCategoryBtn.addEventListener("click", () => {
    const categoryName = categoryInput.value.trim();
    if (categoryName === "") {
        showToast("Veuillez entrer un nom de catégorie.", "error");
        return;
    }

    let newCategory = {
        intitule: categoryName,
        parentId: null,
        created: new Date().toISOString().slice(0, 19).replace("T", " "),
        modified: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    addCategory(newCategory, () => {
        loadCategories();
        showToast("Catégorie ajoutée avec succès.", "success");
        categoryInput.value = "";
    });
});

/**
 * 📌 Crée un élément HTML pour une catégorie ou sous-catégorie (gestion récursive)
 * @param {Object} category - Objet catégorie
 * @param {number} level - Niveau de profondeur de la catégorie
 * @param {Array} allCategories - Liste de toutes les catégories pour rechercher les enfants
 * @returns {HTMLElement} Élément HTML de la catégorie
 */
function createCategoryElement(category, level = 0, allCategories = []) {
    let categoryContainer = document.createElement("div");
    categoryContainer.classList.add("category-container");
    categoryContainer.setAttribute("data-category-id", category.id); // Stocker l'ID de la catégorie

    // Ajout d'une classe pour masquer les enfants
    categoryContainer.dataset.hidden = "false";

    // Ajouter un léger décalage visuel pour les sous-catégories
    categoryContainer.style.marginLeft = `${level * 20}px`;

    let categoryNameClass = category.parentId === null ? "category-name category-lvl1" : "category-name category-sub";

    categoryContainer.innerHTML = `
        <div class="category-header">
            <button class="toggle-visibility">🔽</button>
            <button class="drag-handle">☰</button>
            <span class="${categoryNameClass}">${category.intitule}</span>
            <div class="category-actions">
                <div class="copy-paste">
                    <button class="copy-category">📋</button>
                    <button class="paste-category" style="display: none;">📎</button>
                </div>
                <button class="add-sub-category">➕</button>
                <button class="add-product">🛒</button>
                <button class="edit-category">✏️</button>
                <button class="delete-btn">🗑️</button>
                </div>
            </div>
            <div class="product-list" id="product-list-${category.id}"></div>
    `;

    // Ajout des événements
    categoryContainer.querySelector(".add-sub-category").addEventListener("click", () => addSubCategory(category.id));
    categoryContainer.querySelector(".add-product").addEventListener("click", () => openAddProductModal(category.id));
    categoryContainer.querySelector(".edit-category").addEventListener("click", () => editCategory(category.id, category.intitule));
    categoryContainer.querySelector(".delete-btn").addEventListener("click", () => confirmDeleteCategory(category.id));
    categoryContainer.querySelector(".toggle-visibility").addEventListener("click", () => { toggleCategoryVisibility(category.id, categoryContainer); });

    // Copie de catégorie
    categoryContainer.querySelector(".copy-category").addEventListener("click", () => {
        clipboard = { type: "category", data: { ...category }, name: category.intitule };
        delete clipboard.data.id; // Supprimer l'ID pour éviter les doublons

        document.querySelectorAll(".paste-category").forEach(btn => btn.style.display = "inline"); // Afficher "Coller"
        showToast("Catégorie copiée.", "info");
    });

    // Coller une catégorie
    categoryContainer.querySelector(".paste-category").addEventListener("click", () => {
        if (clipboard.type !== "category") {
            showToast("Aucune catégorie copiée à coller ici.", "error");
            return;
        }

        let newCategory = {
            ...clipboard.data,
            intitule: `${clipboard.name} (copie)`,
            parentId: category.id,
            order: category.order + 1,
            created: new Date().toISOString().slice(0, 19).replace("T", " "),
            modified: new Date().toISOString().slice(0, 19).replace("T", " ")
        };

        delete newCategory.id; // Supprimer l'ID pour éviter les doublons

        addCategory(newCategory, () => {
            loadCategories();
            showToast(`Catégorie "${newCategory.intitule}" collée sous "${category.intitule}"`, "success");
        });
        // Fin de la copie
    });

    document.getElementById("categoryList").appendChild(categoryContainer);

    // Charger les produits
    loadProducts(category.id);

    // Récupérer et afficher les sous-catégories (appel récursif)
    let subCategories = allCategories.filter(sub => sub.parentId === category.id);
    if (subCategories.length > 0) {
        let subCategoryContainer = document.createElement("div");
        subCategoryContainer.classList.add("sub-category-container");
        categoryContainer.appendChild(subCategoryContainer);

        subCategories.forEach(subCategory => {
            let subCategoryElement = createCategoryElement(subCategory, level + 1, allCategories);
            subCategoryContainer.appendChild(subCategoryElement);
        });
    }

    return categoryContainer;
}


/**
 * 📌 Ouvre le modal de modification pour une catégorie
 * @param {number} categoryId - ID de la catégorie
 * @param {string} currentName - Nom actuel de la catégorie
 */
function editCategory(categoryId, currentName) {
    categoryToEdit = categoryId;
    editInput.value = currentName;
    openModal(editModal);
}

/**
 * Sauvegarde la modification d'une catégorie
 */
updateCategory.addEventListener("click", () => {
    if (categoryToEdit !== null && editInput.value.trim() !== "") {
        let newName = editInput.value.trim();

        let db = getDatabase();
        if (!db) {
            showToast("Erreur : La base de données n'est pas prête.", "error");
            return;
        }

        let transaction = db.transaction(["categories"], "readwrite");
        let store = transaction.objectStore("categories");

        let request = store.get(categoryToEdit);
        request.onsuccess = function () {
            let category = request.result;
            category.intitule = newName;
            category.modified = new Date().toISOString().slice(0, 19).replace("T", " ");

            let updateRequest = store.put(category);
            updateRequest.onsuccess = function () {
                showToast("Catégorie modifiée avec succès.", "success");
                loadCategories();
            };

            updateRequest.onerror = function (event) {
                console.error("Erreur lors de la mise à jour :", event.target.errorCode);
            };

            closeModal(editModal);
        };
    } else {
        showToast("Veuillez entrer un nom de catégorie.", "error");
    }
});

/**
 * Annule la modification d'une catégorie
 */
cancelEdit.addEventListener("click", () => {
    closeModal(editModal);
});

/**
 * 📌 Affiche le modal de confirmation de suppression
 * @param {number} categoryId - ID de la catégorie à supprimer
 */
function confirmDeleteCategory(categoryId) {
    categoryToDelete = categoryId;
    openModal(deleteModal);
}

/**
 * Supprime une catégorie et recharge l'affichage
 */
confirmDelete.addEventListener("click", () => {
    if (categoryToDelete !== null) {
        deleteCategory(categoryToDelete, () => {
            loadCategories();
            showToast("Catégorie supprimée avec succès.", "success");
            closeModal(deleteModal);
        });
    }
});

/**
 * Annule la suppression d'une catégorie
 */
cancelDelete.addEventListener("click", () => {
    closeModal(deleteModal);
});

/**
 * 📌 Ouvre le modal pour l'ajout d'une sous-catégorie
 * @param {number} categoryId - ID de la catégorie parent
 */
function addSubCategory(categoryId) {
    parentCategoryId = categoryId;
    subCategoryNameInput.value = "";
    openModal(addSubCategoryModal);
}

/**
 * 📌 Ajoute une sous-catégorie à IndexedDB et recharge l'affichage
 */
confirmAddSubCategory.addEventListener("click", () => {
    const subCategoryName = subCategoryNameInput.value.trim();
    if (subCategoryName === "") {
        showToast("Veuillez entrer un nom de sous-catégorie.", "error");
        return;
    }

    let newCategory = {
        intitule: subCategoryName,
        parentId: parentCategoryId,
        created: new Date().toISOString().slice(0, 19).replace("T", " "),
        modified: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    addCategory(newCategory, () => {
        loadCategories();
        showToast("Sous-catégorie ajoutée avec succès.", "success");
        subCategoryNameInput.value = "";
        closeModal(addSubCategoryModal);
    });
});

/**
 * 📌 Annule l'ajout d'une sous-catégorie
 */
cancelAddSubCategory.addEventListener("click", () => {
    closeModal(addSubCategoryModal);
});

/**
 * 📌 Masque ou affiche les sous-catégories et produits d'une catégorie
 * @param {number} categoryId - ID de la catégorie
 * @param {HTMLElement} categoryContainer - Élément HTML de la catégorie
 */
function toggleCategoryVisibility(categoryId, categoryContainer) {
    let isHidden = categoryContainer.dataset.hidden === "true";
    let subCategoryContainer = categoryContainer.querySelector(".sub-category-container");
    let productList = categoryContainer.querySelector(".product-list");

    if (subCategoryContainer) {
        subCategoryContainer.style.display = isHidden ? "block" : "none";
    }

    if (productList) {
        productList.style.display = isHidden ? "block" : "none";
    }

    categoryContainer.dataset.hidden = isHidden ? "false" : "true";

    // Change l'icône du bouton
    let toggleBtn = categoryContainer.querySelector(".toggle-visibility");
    toggleBtn.textContent = isHidden ? "🔽" : "▶️"; // Icône différente quand c'est masqué
}