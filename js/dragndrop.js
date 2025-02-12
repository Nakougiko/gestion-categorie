import { 
    recalculateCategoryOrder, 
    recalculateProductOrder, 
    getDatabase 
} from "./db.js";

import { loadCategories } from "./categories.js";
import { loadProducts } from "./products.js";

/**
 * 📌 Active le Drag & Drop sur toutes les catégories et produits
 * - Les catégories de niveau 1 peuvent être réorganisées
 * - Les sous-catégories peuvent être réorganisées entre elles
 * - Les produits peuvent être réorganisés à l'intérieur de leur catégorie
 */
export function enableDragAndDrop() {
    enableCategorySorting();  // Active le tri des catégories de niveau 1
    enableSubCategorySorting(); // Active le tri des sous-catégories
    enableProductSorting();  // Active le tri des produits
}

/**
 * 📌 Active le Drag & Drop pour les catégories de niveau 1
 * - Permet uniquement de réorganiser l'ordre des catégories de même niveau
 */
function enableCategorySorting() {
    let categoryList = document.getElementById("categoryList");

    if (!categoryList) {
        console.error("⚠️ Impossible de trouver le conteneur des catégories !");
        return;
    }

    new Sortable(categoryList, {
        animation: 150,
        handle: ".drag-handle",
        ghostClass: "sortable-ghost",
        group: "categories",
        onEnd: function () {
            console.log("✅ Ordre des catégories de niveau 1 mis à jour !");
            updateCategoryOrder();
        },
    });
}

/**
 * 📌 Active le Drag & Drop pour les sous-catégories
 * - Permet de réorganiser l'ordre des sous-catégories d'un même parent
 */
function enableSubCategorySorting() {
    document.querySelectorAll(".sub-category-container").forEach(subCategoryContainer => {
        new Sortable(subCategoryContainer, {
            animation: 150,
            handle: ".drag-handle",
            ghostClass: "sortable-ghost",
            group: "sub-categories",
            onEnd: function () {
                console.log("✅ Ordre des sous-catégories mis à jour !");
                updateCategoryOrder();
            },
        });
    });
}

/**
 * 📌 Active le Drag & Drop pour les produits
 * - Permet de réorganiser l'ordre des produits dans une catégorie
 */
function enableProductSorting() {
    document.querySelectorAll(".product-list").forEach(productContainer => {
        new Sortable(productContainer, {
            animation: 150,
            handle: ".drag-handle",
            ghostClass: "sortable-ghost",
            group: "products",
            onEnd: function (event) {
                console.log("✅ Ordre des produits mis à jour !");
                updateProductOrder(event);
            },
        });
    });
}

/**
 * 📌 Met à jour l'ordre des catégories de niveau 1 après un déplacement
 */
function updateCategoryOrder() {
    let categoryContainers = document.querySelectorAll("#categoryList .category-container");

    let updatedCategories = Array.from(categoryContainers).map((category, index) => ({
        id: Number(category.getAttribute("data-category-id")),
        order: index
    }));

    console.log("🔁 Nouvelle organisation des catégories : ", updatedCategories);

    recalculateCategoryOrder(updatedCategories, () => {
        console.log("✅ Ordre des catégories mis à jour !");
        loadCategories();
    });
}

/**
 * 📌 Met à jour l'ordre des produits après un déplacement
 * @param {Object} event - Événement `onEnd` de SortableJS
 */
function updateProductOrder(event) {
    let productContainer = event.from; // Conteneur du produit déplacé
    let categoryId = Number(productContainer.getAttribute("id").replace("product-list-", ""));

    let updatedProducts = Array.from(productContainer.children).map((product, index) => ({
        id: Number(product.dataset.productId),
        order: index
    }));

    console.log("🔄 Nouvelle organisation des produits pour la catégorie", categoryId, ":", updatedProducts);

    recalculateProductOrder(updatedProducts, () => {
        console.log("✅ Ordre des produits mis à jour !");
        loadProducts(categoryId);
    });
}
