import { loadCategories } from "./categories.js";
import { searchInput } from "./dom.js";


// Écouteur d'événement pour la barre de recherche
searchInput.addEventListener("input", function () {
    filterCategoriesAndProducts(this.value);
});

/**
 * 📌 Recherche les catégories et produits, tout en affichant la bonne arborescence.
 * - Affiche les parents jusqu'à la racine.
 * - N'affiche pas les "frères" d'un élément recherché.
 * @param {string} searchTerm - Texte entré dans la barre de recherche
 */
export function filterCategoriesAndProducts(searchTerm) {
    if (!searchTerm.trim()) {
        loadCategories(); // Recharge l'arborescence complète si aucun texte n'est entré
        return;
    }

    let allCategories = document.querySelectorAll(".category-container");
    let allProducts = document.querySelectorAll(".product-item");

    let matchedCategories = new Set();
    let matchedProducts = new Set();
    let matchedParents = new Set();

    // Vérifier si une catégorie ou un produit correspond à la recherche
    allCategories.forEach(category => {
        let categoryName = category.querySelector(".category-name").textContent.toLowerCase();
        if (categoryName.includes(searchTerm.toLowerCase())) {
            matchedCategories.add(category);
            revealParents(category, matchedParents); // Révèle tous ses parents
            revealChildren(category, matchedCategories, matchedProducts); // Révèle uniquement ses enfants
        }
    });

    allProducts.forEach(product => {
        let productName = product.querySelector(".product-name").textContent.toLowerCase();
        if (productName.includes(searchTerm.toLowerCase())) {
            matchedProducts.add(product);
            revealProductParent(product, matchedCategories, matchedParents); // Révèle tous les parents
        }
    });

    // Afficher uniquement les catégories et produits trouvés
    allCategories.forEach(category => {
        let shouldShow = matchedCategories.has(category) || matchedParents.has(category);
        category.style.display = shouldShow ? "block" : "none";
    });

    allProducts.forEach(product => {
        let shouldShow = matchedProducts.has(product);
        product.style.display = shouldShow ? "flex" : "none";
    });

    // Masquer les "frères" d'un élément trouvé
    hideSiblingsNotInSet(matchedCategories, matchedProducts);
}

/**
 * 📌 Révèle tous les parents jusqu'à la racine d'un élément recherché.
 * @param {HTMLElement} element - Élément HTML (catégorie ou produit)
 * @param {Set} matchedParents - Ensemble des parents trouvés
 */
function revealParents(element, matchedParents) {
    let parentCategory = element.closest(".sub-category-container")?.closest(".category-container");
    if (parentCategory) {
        matchedParents.add(parentCategory);
        revealParents(parentCategory, matchedParents); // Récursion pour révéler toute la chaîne parentale
    }
}

/**
 * 📌 Révèle les enfants d'une catégorie trouvée (uniquement ses sous-catégories et produits).
 * @param {HTMLElement} category - Élément de la catégorie trouvée
 * @param {Set} matchedCategories - Ensemble des catégories trouvées
 * @param {Set} matchedProducts - Ensemble des produits trouvés
 */
function revealChildren(category, matchedCategories, matchedProducts) {
    let subCategories = category.querySelectorAll(".sub-category-container > .category-container");
    let products = category.querySelectorAll(".product-list .product-item");

    subCategories.forEach(subCategory => matchedCategories.add(subCategory));
    products.forEach(product => matchedProducts.add(product));
}

/**
 * 📌 Révèle les parents d'un produit trouvé pour afficher l'arborescence.
 * @param {HTMLElement} product - Élément du produit trouvé
 * @param {Set} matchedCategories - Ensemble des catégories trouvées
 * @param {Set} matchedParents - Ensemble des parents trouvés
 */
function revealProductParent(product, matchedCategories, matchedParents) {
    let parentCategory = product.closest(".product-list")?.closest(".category-container");
    if (parentCategory) {
        matchedCategories.add(parentCategory);
        revealParents(parentCategory, matchedParents); // Révèle toute la chaîne parentale
    }
}

/**
 * 📌 Masque les "frères" des éléments trouvés pour éviter d'afficher des éléments non recherchés.
 * @param {Set} matchedCategories - Ensemble des catégories trouvées
 * @param {Set} matchedProducts - Ensemble des produits trouvés
 */
function hideSiblingsNotInSet(matchedCategories, matchedProducts) {
    document.querySelectorAll(".sub-category-container").forEach(subCategoryContainer => {
        let subCategories = Array.from(subCategoryContainer.children);
        let hasMatch = subCategories.some(sub => matchedCategories.has(sub));

        subCategories.forEach(sub => {
            if (!matchedCategories.has(sub) && hasMatch) {
                sub.style.display = "none"; // Cache les frères
            }
        });
    });

    document.querySelectorAll(".product-list").forEach(productList => {
        let products = Array.from(productList.children);
        let hasMatch = products.some(product => matchedProducts.has(product));

        products.forEach(product => {
            if (!matchedProducts.has(product) && hasMatch) {
                product.style.display = "none"; // Cache les frères
            }
        });
    });
}
