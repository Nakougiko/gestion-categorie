import { loadCategories } from "./categories.js";
import { loadProducts } from "./products.js";
let db;

/**
 * 📌 Ouvre la base de données IndexedDB
 * @param {Function} callback - Fonction à exécuter une fois la BDD prête
 */
export function openDatabase(callback) {
    /*
    * La version 3 ajoute l'ordre des élements dans la catégorie et les produits
    */
    let request = indexedDB.open("categoriesDB", 3);

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains("categories")) {
            let categoryStore = db.createObjectStore("categories", { keyPath: "id", autoIncrement: true });
            categoryStore.createIndex("intitule", "intitule", { unique: false });
            categoryStore.createIndex("parentId", "parentId", { unique: false });
            categoryStore.createIndex("order", "order", { unique: false });
            categoryStore.createIndex("created", "created", { unique: false });
            categoryStore.createIndex("modified", "modified", { unique: false });
        }

        if (!db.objectStoreNames.contains("products")) {
            let productStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
            productStore.createIndex("intitule", "intitule", { unique: false });
            productStore.createIndex("descriptif", "descriptif", { unique: false });
            productStore.createIndex("category", "category", { unique: false });
            productStore.createIndex("order", "order", { unique: false });
            productStore.createIndex("created", "created", { unique: false });
            productStore.createIndex("modified", "modified", { unique: false });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("✅ Base de données ouverte.");
        if (callback) callback();
    };

    request.onerror = function (event) {
        console.error("❌ Erreur d'ouverture IndexedDB:", event.target.errorCode);
    };
}

/**
 * 📌 Retourne l'instance de la base de données
 * @returns {IDBDatabase} Base de données IndexedDB
 */
export function getDatabase() {
    if (!db) {
        console.error("❌ La base de données n'est pas encore prête !");
    }
    return db;
}

/**
 * 📌 Ajoute une catégorie à IndexedDB
 * @param {Object} category - Catégorie à ajouter
 * @param {Function} callback - Fonction exécutée après l'ajout
 */
export function addCategory(category, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["categories"], "readwrite");
    let store = transaction.objectStore("categories");

    let countRequest = store.count(); // Compte le nombre de catégories

    countRequest.onsuccess = function () {
        category.order = countRequest.result; // Definition de l'ordre
        let request = store.add(category);

        request.onsuccess = function () {
            console.log("✅ Catégorie ajoutée :", category);
            if (callback) callback();
        };

        request.onerror = function (event) {
            console.error("❌ Erreur lors de l'ajout de la catégorie :", event.target.errorCode);
        };
    }
}

/**
 * 📌 Récupère toutes les catégories
 * @param {Function} callback - Fonction exécutée après récupération
 */
export function getAllCategories(callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["categories"], "readonly");
    let store = transaction.objectStore("categories");
    let request = store.getAll();

    request.onsuccess = function () {
        let categories = request.result.sort((a, b) => a.order - b.order); // Tri par ordre
        console.log("📂 Catégories récupérées :", categories);
        if (callback) callback(categories);
    };

    request.onerror = function (event) {
        console.error("❌ Erreur lors de la récupération des catégories :", event.target.errorCode);
    };
}

/**
 * 📌 Supprime une catégorie et toutes ses sous-catégories + produits associés (en cascade)
 * @param {number} categoryId - ID de la catégorie à supprimer
 * @param {Function} callback - Fonction exécutée après suppression
 */
export function deleteCategory(categoryId, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["categories", "products"], "readwrite");
    let categoryStore = transaction.objectStore("categories");
    let productStore = transaction.objectStore("products");

    // Récupérer toutes les catégories pour trouver les sous-catégories
    let request = categoryStore.getAll();
    request.onsuccess = function () {
        let allCategories = request.result || [];
        let categoriesToDelete = [categoryId];
        let productsToDelete = [];

        // Fonction récursive pour récupérer toutes les sous-catégories en cascade
        function collectSubCategories(parentId) {
            let subCategories = allCategories.filter(c => c.parentId === parentId);
            subCategories.forEach(sub => {
                categoriesToDelete.push(sub.id);
                collectSubCategories(sub.id); // Récursion pour récupérer les sous-catégories
            });
        }

        collectSubCategories(categoryId);
        console.log("🚮 Catégories à supprimer :", categoriesToDelete);
         // Récupérer tous les produits liés aux catégories à supprimer
        let productRequest = productStore.getAll();
        productRequest.onsuccess = function () {
            let allProducts = productRequest.result || [];
            productsToDelete = allProducts.filter(p => categoriesToDelete.includes(p.category)).map(p => p.id);
            console.log("🚮 Produits à supprimer :", productsToDelete);
            categoriesToDelete.forEach(catId => categoryStore.delete(catId)); // suppression des catégories
            productsToDelete.forEach(prodId => productStore.delete(prodId)); // suppresion des produits

            transaction.oncomplete = function () {
                console.log("✅ Suppression en cascade terminée.");
                
                // Utiliser une nouvelle transaction après suppression
                let newTransaction = db.transaction(["categories"], "readonly");
                let newCategoryStore = newTransaction.objectStore("categories");
                let newRequest = newCategoryStore.getAll();

                newRequest.onsuccess = function () {
                    let remainingCategories = newRequest.result || [];
                    if (remainingCategories.length > 0) {
                        recalculateCategoryOrder(remainingCategories, callback);
                    } else {
                        console.log("✅ Plus aucune catégorie restante après suppression.");
                        if (callback) callback();
                    }
                };

                newRequest.onerror = function (event) {
                    console.error("❌ Erreur lors de la récupération des catégories après suppression :", event.target.errorCode);
                };
            };

            transaction.onerror = function (event) {
                console.error("❌ Erreur lors de la suppression :", event.target.errorCode);
            };
        };
    };
}

/**
 * 📌 Ajoute un produit à IndexedDB
 * @param {Object} product - Produit à ajouter
 * @param {Function} callback - Fonction exécutée après l'ajout
 */
export function addProduct(product, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["products"], "readwrite");
    let store = transaction.objectStore("products");

    let countRequest = store.count(); // Compte le nombre de produits

    countRequest.onsuccess = function () {
        product.order = countRequest.result; // Definition de l'ordre
        let request = store.add(product);

        request.onsuccess = function () {
            console.log("✅ Produit ajouté :", product);
            if (callback) callback();
        };

        request.onerror = function (event) {
            console.error("❌ Erreur lors de l'ajout du produit :", event.target.errorCode);
        };
    }
}

/**
 * 📌 Récupère tous les produits d'une catégorie
 * @param {number} categoryId - ID de la catégorie
 * @param {Function} callback - Fonction exécutée après récupération
 */
export function getProductsByCategory(categoryId, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["products"], "readonly");
    let store = transaction.objectStore("products");
    let index = store.index("category");
    let request = index.getAll(categoryId);

    request.onsuccess = function () {
        let products = request.result.sort((a, b) => a.order - b.order); // Tri par ordre
        console.log("📂 Produits récupérés pour la catégorie", categoryId, ":", products);
        if (callback) callback(products);
    };

    request.onerror = function (event) {
        console.error("❌ Erreur lors de la récupération des produits :", event.target.errorCode);
    };
}

/**
 * 📌 Supprime un produit de IndexedDB et met à jour l'affichage
 * @param {number} productId - ID du produit à supprimer
 * @param {Function} callback - Fonction exécutée après suppression
 */
export function deleteProduct(productId, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["products"], "readwrite");
    let store = transaction.objectStore("products");

    // Récupérer le produit pour connaître sa catégorie
    let request = store.get(productId);
    request.onsuccess = function () {
        let product = request.result;
        if (!product) {
            console.warn(`⚠ Produit avec ID ${productId} non trouvé.`);
            if (callback) callback();
            return;
        }

        let categoryId = product.category; // On récupère la catégorie du produit avant suppression

        // Supprimer le produit
        let deleteRequest = store.delete(productId);
        deleteRequest.onsuccess = function () {
            console.log("✅ Produit supprimé :", productId);

            // Vérifier s'il reste des produits dans cette catégorie
            let getRemainingProducts = store.index("category").getAll(categoryId);
            getRemainingProducts.onsuccess = function () {
                let remainingProducts = getRemainingProducts.result || [];

                if (remainingProducts.length > 0) {
                    recalculateProductOrder(remainingProducts, () => {
                        loadProducts(categoryId);
                        loadCategories(); // 🔥 Recharger les catégories pour éviter tout bug d'affichage
                        if (callback) callback();
                    });
                } else {
                    console.warn(`⚠ Plus aucun produit dans la catégorie ${categoryId}.`);
                    loadCategories(); // 🔥 Recharger pour éviter un affichage corrompu
                    if (callback) callback();
                }
            };
        };

        deleteRequest.onerror = function (event) {
            console.error("❌ Erreur lors de la suppression du produit :", event.target.errorCode);
        };
    };

    request.onerror = function (event) {
        console.error("❌ Erreur lors de la récupération du produit à supprimer :", event.target.errorCode);
    };
}

/**
 * 📌 Met à jour l'ordre des catégories dans IndexedDB
 * @param {Array} updatedCategories - Liste des catégories avec leur nouvel ordre
 * @param {Function} callback - Fonction appelée après la mise à jour
 */
export function recalculateCategoryOrder(updatedCategories, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["categories"], "readwrite");
    let store = transaction.objectStore("categories");

    if(!updatedCategories || updatedCategories.length === 0) {
        console.warn("⚠️ Aucune catégorie à mettre à jour, recalcul annulé.");
        if (callback) callback();
        return;
    }

    updatedCategories.forEach((category, index) => {
        let request = store.get(category.id);
        request.onsuccess = function () {
            let updatedCategories = request.result;
    
            if (updatedCategories) {
                updatedCategories.order = index;
                store.put(updatedCategories);
            }
        }
    });

    transaction.oncomplete = function () {
        console.log("✅ Recalcul de l'ordre des catégories terminé !");
        if (callback) callback();
    };
}

/**
 * 📌 Met à jour l'ordre des produits dans IndexedDB
 * @param {Array} updatedProducts - Liste des produits avec leur nouvel ordre
 * @param {Function} callback - Fonction appelée après la mise à jour
 */
export function recalculateProductOrder(updatedProducts, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["products"], "readwrite");
    let store = transaction.objectStore("products");

    updatedProducts.forEach(product => {
        let request = store.get(product.id);
        request.onsuccess = function () {
            let updatedProduct = request.result;
            if (updatedProduct) {
                updatedProduct.order = product.order;
                store.put(updatedProduct);
            }
        };
    });

    transaction.oncomplete = function () {
        console.log("✅ Recalcul de l'ordre des produits terminé !");
        if (callback) callback();
    };
}

/**
 * 📌 Met à jour le parent d'une catégorie (changement de parent via le dragndrop)
 * @param {number} categoryId - ID de la catégorie deplacer
 * @param {number} newParentId - ID de la nouvelle catégorie parent
 * @param {Function} callback - Fonction appelée après la mise à jour
 */
export function updateCategoryParent(categoryId, newParentId, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["categories"], "readwrite");
    let store = transaction.objectStore("categories");

    let request = store.get(categoryId);
    request.onsuccess = function () {
        let category = request.result;
        category.parentId = newParentId

        let updateRequest = store.put(category);
        updateRequest.onsuccess = function () {
            console.log(`✅ Catégorie ${categoryId} déplacée sous ${newParentId}`);
            if (callback) callback();
        }
    }
}

/**
 * 📌 Met à jour le parent d'une catégorie (changement de parent via le dragndrop)
 * @param {number} productId - ID du produit à déplacer
 * @param {number} newCategoryId - ID de la nouvelle catégorie parent
 * @param {Function} callback - Fonction appelée après la mise à jour
 */
export function updateProductCategory(productId, newCategoryId, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["products"], "readwrite");
    let store = transaction.objectStore("products");

    let request = store.get(productId);
    request.onsuccess = function () {
        let product = request.result;
        product.category = newCategoryId;

        let updateRequest = store.put(product);
        updateRequest.onsuccess = function () {
            console.log(`✅ Produit ${productId} déplacé dans la catégorie ${newCategoryId}`);
            if (callback) callback();
        }
    }
}