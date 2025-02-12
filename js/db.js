let db;

/**
 * 📌 Ouvre la base de données IndexedDB
 * @param {Function} callback - Fonction à exécuter une fois la BDD prête
 */
export function openDatabase(callback) {
    let request = indexedDB.open("categoriesDB", 2);

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains("categories")) {
            let categoryStore = db.createObjectStore("categories", { keyPath: "id", autoIncrement: true });
            categoryStore.createIndex("intitule", "intitule", { unique: false });
            categoryStore.createIndex("parentId", "parentId", { unique: false });
            categoryStore.createIndex("created", "created", { unique: false });
            categoryStore.createIndex("modified", "modified", { unique: false });
        }

        if (!db.objectStoreNames.contains("products")) {
            let productStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
            productStore.createIndex("intitule", "intitule", { unique: false });
            productStore.createIndex("descriptif", "descriptif", { unique: false });
            productStore.createIndex("category", "category", { unique: false });
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
    let request = store.add(category);

    request.onsuccess = function () {
        console.log("✅ Catégorie ajoutée :", category);
        if (callback) callback();
    };

    request.onerror = function (event) {
        console.error("❌ Erreur lors de l'ajout de la catégorie :", event.target.errorCode);
    };
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
        console.log("📂 Catégories récupérées :", request.result);
        if (callback) callback(request.result);
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
        let allCategories = request.result;
        let categoriesToDelete = [categoryId]; // Liste des catégories à supprimer (inclut la catégorie parent)
        let productsToDelete = []; // Liste des produits à supprimer

        // Fonction récursive pour récupérer toutes les sous-catégories en cascade
        function collectSubCategories(parentId) {
            let subCategories = allCategories.filter(c => c.parentId === parentId);
            subCategories.forEach(sub => {
                categoriesToDelete.push(sub.id);
                collectSubCategories(sub.id); // Récursion pour récupérer les sous-catégories
            });
        }

        collectSubCategories(categoryId); // Récupère toutes les sous-catégories en cascade
        console.log("🚮 Catégories à supprimer :", categoriesToDelete);

        // Récupérer tous les produits liés aux catégories à supprimer
        let productRequest = productStore.getAll();
        productRequest.onsuccess = function () {
            let allProducts = productRequest.result;
            productsToDelete = allProducts.filter(p => categoriesToDelete.includes(p.category)).map(p => p.id);
            console.log("🚮 Produits à supprimer :", productsToDelete);

            // Suppression des catégories
            categoriesToDelete.forEach(catId => categoryStore.delete(catId));

            // Suppression des produits
            productsToDelete.forEach(prodId => productStore.delete(prodId));

            transaction.oncomplete = function () {
                console.log("✅ Suppression en cascade terminée.");
                if (callback) callback();
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
    let request = store.add(product);

    request.onsuccess = function () {
        console.log("✅ Produit ajouté :", product);
        if (callback) callback();
    };

    request.onerror = function (event) {
        console.error("❌ Erreur lors de l'ajout du produit :", event.target.errorCode);
    };
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
        console.log("📂 Produits récupérés pour la catégorie", categoryId, ":", request.result);
        if (callback) callback(request.result);
    };

    request.onerror = function (event) {
        console.error("❌ Erreur lors de la récupération des produits :", event.target.errorCode);
    };
}

/**
 * 📌 Supprime un produit de IndexedDB
 * @param {number} productId - ID du produit à supprimer
 * @param {Function} callback - Fonction exécutée après suppression
 */
export function deleteProduct(productId, callback) {
    let db = getDatabase();
    if (!db) return;

    let transaction = db.transaction(["products"], "readwrite");
    let store = transaction.objectStore("products");
    let request = store.delete(productId);

    request.onsuccess = function () {
        console.log("✅ Produit supprimé :", productId);
        if (callback) callback();
    };

    request.onerror = function (event) {
        console.error("❌ Erreur lors de la suppression du produit :", event.target.errorCode);
    };
}
