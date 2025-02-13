import {
    addProductModal,
    productNameInput,
    productDescriptionInput,
    confirmAddProduct,
    cancelAddProduct,
    editProductModal,
    editProductNameInput,
    editProductDescriptionInput,
    saveEditProduct,
    cancelEditProduct,
    deleteProductModal,
    confirmDeleteProduct,
    cancelDeleteProduct
} from "./dom.js";

import { getDatabase, addProduct, getProductsByCategory, deleteProduct } from "./db.js";
import { showToast } from "./toast.js";
import { openModal, closeModal } from "./modals.js";
import { enableDragAndDrop } from "./dragndrop.js";

let selectedCategoryId = null;
let editingProductId = null;

let clipboard = { type: null, data: null };

/**
 * 📌 Charge et affiche les produits d'une catégorie
 * @param {number} categoryId - ID de la catégorie
 */
export function loadProducts(categoryId) {
    let db = getDatabase();
    if (!db) return;

    let productContainer = document.getElementById(`product-list-${categoryId}`);
    if (!productContainer) {
        console.warn(`⚠️ Impossible de trouver le conteneur des produits pour la catégorie ${categoryId}`);
        return;
    }

    productContainer.innerHTML = "";

    getProductsByCategory(categoryId, (products) => {
        products.sort((a, b) => a.order - b.order);
        products.forEach(product => {
            let productElement = createProductElement(product);
            productContainer.appendChild(productElement);
        });
    });

    enableDragAndDrop(); // Active le Drag & Drop
}

/**
 * 📌 Crée un élément HTML pour un produit
 * @param {Object} product - Objet produit
 * @returns {HTMLElement} Élément HTML du produit
 */
function createProductElement(product) {
    let productItem = document.createElement("div");
    productItem.classList.add("product-item");
    productItem.setAttribute("data-product-id", product.id);

    productItem.innerHTML = `
        <div class="product-header">
            <span class="drag-handle">☰</span>
            <span class="product-name">${product.intitule}</span>
            <div class="product-actions">
            <button class="product-details">🔍</button>
                <button class="edit-product">✏️</button>
                <button class="delete-product">🗑️</button>
                <div class="copy-paste">
                    <button class="copy-product">📋</button>
                    <button class="paste-product" style="display: none;">📎</button>
                </div>
            </div>
        </div>
        <hr>
        <p class="product-description">${product.descriptif}</p>
        `;

    productItem.querySelector(".edit-product").addEventListener("click", () => editProduct(product));
    productItem.querySelector(".delete-product").addEventListener("click", () => confirmDeleteProductModal(product.id));

    // Copier le produit
    productItem.querySelector(".copy-product").addEventListener("click", () => {
        clipboard = { type: "product", data: {...product} };
        delete clipboard.data.id; // Supprimer l'ID pour éviter les doublons

        document.querySelectorAll(".paste-product").forEach(btn => btn.style.display = "inline"); // Afficher "Coller"
        showToast("Produit copié.", "success");
    });

    // Coller le produit dans une autre catégorie
    productItem.querySelector(".paste-product").addEventListener("click", () => {
        if (clipboard.type !== "product") {
            showToast("Aucun produit à coller ici.", "error");
            return;
        }

        let categoryElement = productItem.closest(".category-container");
        let targetCategoryId = Number(categoryElement.getAttribute("data-category-id"));

        if (!targetCategoryId) {
            showToast("Impossible de coller le produit ici.", "error");
            return;
        }

        let newProduct = {
            ...clipboard.data,
            intitule: `${clipboard.data.intitule} (copie)`,
            descriptif: `${clipboard.data.descriptif} (copie)`,
            category: targetCategoryId,
            order: clipboard.data.order + 1,
            created: new Date().toISOString().slice(0, 19).replace("T", " "),
            modified: new Date().toISOString().slice(0, 19).replace("T", " "),
         };

         delete newProduct.id; // Supprimer l'ID pour éviter les doublons

        addProduct(newProduct, () => {
            showToast("Produit collé avec succès.", "success");
            loadProducts(selectedCategoryId);
        });
        // Fin de la copie
    });

    return productItem;
}

/**
 * 📌 Ouvre le modal pour ajouter un produit à une catégorie
 * @param {number} categoryId - ID de la catégorie sélectionnée
 */
export function openAddProductModal(categoryId) {
    selectedCategoryId = categoryId;
    productNameInput.value = "";
    productDescriptionInput.value = "";
    openModal(addProductModal);
}

/**
 * Ajoute un produit à IndexedDB et recharge l'affichage
 */
confirmAddProduct.addEventListener("click", () => {
    let productName = productNameInput.value.trim();
    let productDescription = productDescriptionInput.value.trim();

    if (productName === "" || productDescription === "") {
        showToast("Veuillez entrer un nom et une description de produit.", "error");
        return;
    }

    let newProduct = {
        intitule: productName,
        descriptif: productDescription,
        category: selectedCategoryId,
        created: new Date().toISOString().slice(0, 19).replace("T", " "),
        modified: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    addProduct(newProduct, () => {
        showToast("Produit ajouté avec succès.", "success");
        closeModal(addProductModal);
        loadProducts(selectedCategoryId);
    });
});

/**
 * Annule l'ajout d'un produit
 */
cancelAddProduct.addEventListener("click", () => {
    closeModal(addProductModal);
});

/**
 * 📌 Ouvre le modal pour modifier un produit
 * @param {Object} product - Produit à modifier
 */
function editProduct(product) {
    editingProductId = product.id;
    editProductNameInput.value = product.intitule;
    editProductDescriptionInput.value = product.descriptif;
    openModal(editProductModal);
}

/**
 * Sauvegarde les modifications d'un produit
 */
saveEditProduct.addEventListener("click", () => {
    if (!editingProductId) {
        showToast("Erreur lors de la modification du produit.", "error");
        return;
    }

    let newName = editProductNameInput.value.trim();
    let newDescription = editProductDescriptionInput.value.trim();

    if (newName === "" || newDescription === "") {
        showToast("Veuillez entrer un nom et une description de produit.", "error");
        return;
    }

    let db = getDatabase();
    if (!db) {
        showToast("Erreur : La base de données n'est pas prête.", "error");
        return;
    }

    let transaction = db.transaction(["products"], "readwrite");
    let store = transaction.objectStore("products");

    let request = store.get(editingProductId);
    request.onsuccess = function () {
        let product = request.result;
        product.intitule = newName;
        product.descriptif = newDescription;
        product.modified = new Date().toISOString().slice(0, 19).replace("T", " ");

        let updateRequest = store.put(product);
        updateRequest.onsuccess = function () {
            showToast("Produit modifié avec succès.", "success");
            closeModal(editProductModal);
            loadProducts(product.category);
        };

        updateRequest.onerror = function (event) {
            console.error("Erreur lors de la mise à jour :", event.target.errorCode);
        };
    };
});

/**
 * Annule la modification d'un produit
 */
cancelEditProduct.addEventListener("click", () => {
    closeModal(editProductModal);
});

/**
 * 📌 Ouvre le modal de confirmation de suppression d'un produit
 * @param {number} productId - ID du produit à supprimer
 */
function confirmDeleteProductModal(productId) {
    editingProductId = productId;
    openModal(deleteProductModal);
}

/**
 * Supprime un produit et recharge l'affichage
 */
confirmDeleteProduct.addEventListener("click", () => {
    if (!editingProductId) {
        showToast("Erreur lors de la suppression du produit.", "error");
        return;
    }

    deleteProduct(editingProductId, () => {
        showToast("Produit supprimé avec succès.", "success");
        closeModal(deleteProductModal);
        loadProducts(selectedCategoryId);
    });
});

/**
 * Annule la suppression d'un produit
 */
cancelDeleteProduct.addEventListener("click", () => {
    closeModal(deleteProductModal);
});
