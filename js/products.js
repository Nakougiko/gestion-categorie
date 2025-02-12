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

let selectedCategoryId = null;
let editingProductId = null;

/**
 * 📌 Charge et affiche les produits d'une catégorie
 * @param {number} categoryId - ID de la catégorie
 */
export function loadProducts(categoryId) {
    let db = getDatabase();
    if (!db) return;

    let productContainer = document.getElementById(`product-list-${categoryId}`);
    if (!productContainer) {
        console.error(`⚠️ Impossible de trouver le conteneur des produits pour la catégorie ${categoryId}`);
        return;
    }

    productContainer.innerHTML = "";

    getProductsByCategory(categoryId, (products) => {
        products.forEach(product => {
            let productElement = createProductElement(product);
            productContainer.appendChild(productElement);
        });
    });
}

/**
 * 📌 Crée un élément HTML pour un produit
 * @param {Object} product - Objet produit
 * @returns {HTMLElement} Élément HTML du produit
 */
function createProductElement(product) {
    let productItem = document.createElement("div");
    productItem.classList.add("product-item");
    productItem.innerHTML = `
        <span>${product.intitule}</span> - <p>${product.descriptif}</p>
        <div class="product-actions">
            <button class="edit-product">✏️</button>
            <button class="delete-product">🗑️</button>
        </div>
    `;

    productItem.querySelector(".edit-product").addEventListener("click", () => editProduct(product));
    productItem.querySelector(".delete-product").addEventListener("click", () => confirmDeleteProductModal(product.id));

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
