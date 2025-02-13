import { 
    recalculateCategoryOrder, 
    recalculateProductOrder, 
    updateCategoryParent, 
    updateProductCategory 
} from "./db.js";

import { loadCategories } from "./categories.js";
import { loadProducts } from "./products.js";

/**
 * 📌 Active le Drag & Drop sur toutes les catégories, sous-catégories et produits
 */
export function enableDragAndDrop() {
    enableCategorySorting();  // Catégories de niveau 1
    enableSubCategorySorting(); // Sous-catégories
    enableProductSorting();  // Produits
}

/**
 * 📌 Active le Drag & Drop pour les catégories de niveau 1 (changement d'ordre uniquement)
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
        onEnd: function (event) {
            if (event.from === event.to) {
                console.log("✅ Réorganisation des catégories !");
                updateCategoryOrder();
            }
        },
    });
}

/**
 * 📌 Active le Drag & Drop pour les sous-catégories (ordre + parent)
 */
function enableSubCategorySorting() {
    document.querySelectorAll(".sub-category-container").forEach(subCategoryContainer => {
        new Sortable(subCategoryContainer, {
            animation: 150,
            handle: ".drag-handle",
            ghostClass: "sortable-ghost",
            group: "sub-categories",
            onEnd: function (event) {
                if (event.from === event.to) {
                    console.log("✅ Réorganisation des sous-catégories !");
                    updateCategoryOrder();
                } else {
                    console.log("🔄 Changement de parent d'une sous-catégorie !");
                    updateSubCategoryParent(event);
                }
            },
        });
    });
}

/**
 * 📌 Active le Drag & Drop pour les produits (ordre + catégorie)
 */
function enableProductSorting() {
    document.querySelectorAll(".product-list").forEach(productContainer => {
        new Sortable(productContainer, {
            animation: 150,
            handle: ".drag-handle",
            ghostClass: "sortable-ghost",
            group: "products",
            onEnd: function (event) {
                if (event.from === event.to) {
                    console.log("✅ Réorganisation des produits !");
                    updateProductOrder(event);
                } else {
                    console.log("🔄 Changement de catégorie d'un produit !");
                    updateProductCategoryParent(event);
                }
            },
        });
    });
}

/**
 * 📌 Met à jour l'ordre des catégories après déplacement
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
        reloadCategoriesSafely();
    });
}

/**
 * 📌 Met à jour l'ordre des produits après un déplacement
 */
function updateProductOrder(event) {
    let productContainer = event.from;
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

/**
 * 📌 Met à jour le parent d'une sous-catégorie
 */
function updateSubCategoryParent(event) {
    let subCategory = event.item;
    let newParentContainer = event.to.closest(".category-container");

    if (!newParentContainer) return;

    let newParentId = Number(newParentContainer.getAttribute("data-category-id"));
    let subCategoryId = Number(subCategory.getAttribute("data-category-id"));

    console.log(`🔄 Changement de parent : Sous-catégorie ${subCategoryId} → Nouveau parent ${newParentId}`);

    updateCategoryParent(subCategoryId, newParentId, () => {
        console.log("✅ Parent de la sous-catégorie mis à jour !");
        reloadCategoriesSafely();
    });
}

/**
 * 📌 Met à jour la catégorie d'un produit
 */
function updateProductCategoryParent(event) {
    let product = event.item;
    let newCategoryContainer = event.to.closest(".category-container");

    if (!newCategoryContainer) return;

    let newCategoryId = Number(newCategoryContainer.getAttribute("data-category-id"));
    let productId = Number(product.getAttribute("data-product-id"));

    console.log(`🔄 Changement de catégorie : Produit ${productId} → Nouvelle catégorie ${newCategoryId}`);

    updateProductCategory(productId, newCategoryId, () => {
        console.log("✅ Produit déplacé !");
        reloadCategoriesSafely();
    });
}

/**
 * 📌 Recharge les catégories et produits après une mise à jour
 */
function reloadCategoriesSafely() {
    document.getElementById("categoryList").innerHTML = ""; // On vide l'affichage avant rechargement
    loadCategories();
}
