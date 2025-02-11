let db;

// DOM
const categoryInput = document.getElementById("categoryName");
const addCategoryBtn = document.getElementById("addCategory");
const categoryList = document.getElementById("categoryList");

// Modal pour la suppresion
const deleteModal = document.getElementById("deleteModal");
const confirmDelete = document.getElementById("confirmDelete");
const cancelDelete = document.getElementById("cancelDelete");


// Modal pour la modification
const editModal = document.getElementById("editModal");
const editInput = document.getElementById("editInput");
const updateCategory = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");

// Modal pour ajouter une sous-catégorie
const addSubCategoryModal = document.getElementById("addSubCategoryModal");
const confirmAddSubCategory = document.getElementById("confirmAddSubCategory");
const cancelAddSubCategory = document.getElementById("cancelAddSubCategory");
const subCategoryNameInput = document.getElementById("subCategoryName");

// Modal pour ajouter un produit
const addProductModal = document.getElementById("addProductModal");
const productNameInput = document.getElementById("productName");
const productDescriptionInput = document.getElementById("productDescription");
const confirmAddProduct = document.getElementById("confirmAddProduct");
const cancelAddProduct = document.getElementById("cancelAddProduct");

// Modal pour modifier un produit
const editProductModal = document.getElementById("editProductModal");
const editProductNameInput = document.getElementById("editProductName");
const editProductDescriptionInput = document.getElementById("editProductDescription");
const saveEditProduct = document.getElementById("saveEditProduct");
const cancelEditProduct = document.getElementById("cancelEditProduct");

// Modal pour la suppression d'un produit
const deleteProductModal = document.getElementById("deleteProductModal");
const confirmDeleteProduct = document.getElementById("confirmDeleteProduct");
const cancelDeleteProduct = document.getElementById("cancelDeleteProduct");

// Les variables pour stocker les catégories à supprimer et à modifier
let categoryToDelete = null; // Pour la suppression
let categoryToEdit = null; // Pour la modification

//
let selectedCategoryId = null; // Pour ajouter un produit
let editingProductId = null; // Pour la modification d'un produit

document.addEventListener("DOMContentLoaded", () => {
    // IndexedDB
    let request = indexedDB.open("categoriesDB", 2); // on met la version en 2

    request.onupgradeneeded = function (event) {
        let db = event.target.result;

        if (!db.objectStoreNames.contains("categories")) {
            let categoryStore = db.createObjectStore("categories", {
                keyPath: "id",
                autoIncrement: true,
            });

            // Création des index
            categoryStore.createIndex("intitule", "intitule", { unique: false });
            categoryStore.createIndex("parentId", "parentId", { unique: false });
            categoryStore.createIndex("created", "created", { unique: false });
            categoryStore.createIndex("modified", "modified", { unique: false });   
        }

        if (!db.objectStoreNames.contains("products")) {
            let productStore = db.createObjectStore("products", {
                keyPath: "id",
                autoIncrement: true,
            });

            // Création des index
            productStore.createIndex("intitule", "intitule", { unique: false });
            productStore.createIndex("descriptif", "descriptif", { unique: false });
            productStore.createIndex("category", "category", { unique: false });
            productStore.createIndex("created", "created", { unique: false });
            productStore.createIndex("modified", "modified", { unique: false });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("Success: " + db);
        loadCategories();
    };

    request.onerror = function (event) {
        console.log("Error: " + event.target.errorCode);
    };

    // Ajouter une catégorie
    addCategoryBtn.addEventListener("click", () => {
        const categoryName = categoryInput.value.trim();
        if (categoryName === "") {
            showToast("Veuillez entrer un nom de catégorie.", "error");
            return;
        }

        let newCategory = {
            intitule: categoryName,
            parentId: null, // null pour les catégories de niveau 1
            created: new Date().toISOString().slice(0, 19).replace("T", " "),
            modified: new Date().toISOString().slice(0, 19).replace("T", " "),
        };

        let transaction = db.transaction(["categories"], "readwrite");
        let store = transaction.objectStore("categories");
        let request = store.add(newCategory);

        request.onsuccess = function (event) {
            console.log("Category added successfully: ", newCategory);
            //debugCategories();
            loadCategories();
            showToast("Catégorie ajoutée avec succès.", "success");
            categoryInput.value = "";
        };

        request.onerror = function (event) {
            console.log("Error on add: " + event.target.errorCode);
        };
    });

    // Charger les catégories
    function loadCategories(parentId = null, container = categoryList, level = 0) {
        //console.log(`Loading categories with parentId: ${parentId}`);
        container.innerHTML = "";

        let transaction = db.transaction(["categories"], "readonly");
        let store = transaction.objectStore("categories");

        if (!store.indexNames.contains("parentId")) {
            console.error("Index not found: parentId");
            return;
        }

        let request = store.getAll();

        request.onsuccess = function () {
            let allCategories = request.result;
            //console.log("all categories", allCategories);
            let categories = allCategories.filter((category) => category.parentId === parentId);
            //console.log(`categories claim with parentId: ${parentId}`, categories);

            /*if (categories.length === 0) {
                console.warn("No categories found with parentId: " + parentId);
            }*/

            categories.forEach((category) => {
                //console.log("load category", category.intitule);

                let categoryContainer = document.createElement("div");
                categoryContainer.classList.add("category-container");
                categoryContainer.style.marginLeft = `${level * 20}px`;

                // pour mettre en bleue les catégories 1
                let categoryNameClass = parentId === null ? "category-name category-lvl1" : "category-name";

                categoryContainer.innerHTML = `
                <div class="category-header">
                    <span class="${categoryNameClass}">${category.intitule}</span>
                    <div class="category-actions">
                        <button class="add-sub-category">➕</button>
                        <button class="add-product">🛒</button>
                        <button class="edit-category">✏️</button>
                        <button class="delete-btn">🗑️</button>
                    </div>
                </div>
                <div class="product-list" id="product-list-${category.id}"></div>
                <div class="sub-category-container"></div> 
            `;

                let subCategoryContainer = categoryContainer.querySelector(".sub-category-container");
                loadCategories(category.id, subCategoryContainer, level + 1);
                loadProducts(category.id);              

                container.appendChild(categoryContainer);

                categoryContainer.querySelector(".add-sub-category").addEventListener("click", () => addSubCategory(category.id));
                categoryContainer.querySelector(".edit-category").addEventListener("click", () => editCategory(category.id, category.intitule));
                categoryContainer.querySelector(".delete-btn").addEventListener("click", () => deleteCategory(category.id));
                categoryContainer.querySelector(".add-product").addEventListener("click", () => addProduct(category.id));
            });
        };

        request.onerror = function (event) {
            console.log("Error on load: " + event.target.errorCode);
        };
    }

    // Supprimer une catégorie et ses sous-catégories
    function deleteCategory(categoryId) {
        categoryToDelete = categoryId;
        deleteModal.style.display = "flex";
    }

    // Bouton de suppression modal
    confirmDelete.onclick = function () {
        if (categoryToDelete !== null) {
            let transaction = db.transaction(["categories"], "readonly");
            let store = transaction.objectStore("categories");
            let index = store.index("parentId");

            let allToDelete = [categoryToDelete];

            function collectSubCategories(parentId) {
                return new Promise((resolve) => {
                    let request = index.getAll(parentId);
                    request.onsuccess = function () {
                        let subCategories = request.result || [];
                        let subPromises = subCategories.map((subCategory) => {
                            allToDelete.push(subCategory.id);
                            return collectSubCategories(subCategory.id);
                        });

                        Promise.all(subPromises).then(() => resolve()); // Attend que toutes les suppressions soient terminées
                    };
                });
            }

            collectSubCategories(categoryToDelete).then(() => {
                console.log("All categories to delete: ", allToDelete);

                let deleteTransaction = db.transaction(["categories"], "readwrite");
                let deleteStore = deleteTransaction.objectStore("categories");

                let deletePromises = allToDelete.map((categoryId) => {
                    return new Promise((resolve) => {
                        let request = deleteStore.delete(categoryId);
                        request.onsuccess = () => resolve();
                    });
                });

                Promise.all(deletePromises).then(() => {
                    console.log("Categories deleted successfully");
                    document.getElementById("categoryList").innerHTML = "";
                    
                    loadCategories();
                    showToast("Catégorie supprimée avec succès.", "success");
                    deleteModal.style.display = "none";
                }).catch((error) => {
                    console.error("Error on delete:", error);
                });
            });
        }
    };

    // Bouton d'annulation de suppression
    cancelDelete.onclick = function () {
        deleteModal.style.display = "none";
    };

    // Modifier une catégorie
    function editCategory(categoryId, currentName) {
        categoryToEdit = categoryId;
        editInput.value = currentName;
        editModal.style.display = "flex";
    }

    // Bouton de modification modal
    updateCategory.onclick = function () {
        if (categoryToEdit !== null && editInput.value.trim() !== "") {
            let transaction = db.transaction(["categories"], "readwrite");
            let store = transaction.objectStore("categories");

            let request = store.get(categoryToEdit);
            request.onsuccess = function () {
                let category = request.result;
                category.intitule = editInput.value.trim();
                category.modified = new Date().toISOString().slice(0, 19).replace("T", " ");

                let updateRequest = store.put(category);
                updateRequest.onsuccess = function () {
                    console.log("Category updated successfully");
                    showToast("Catégorie modifiée avec succès.", "success");
                    loadCategories();
                };

                updateRequest.onerror = function (event) {
                    console.log("Error on update: " + event.target.errorCode);
                };

                editModal.style.display = "none";
            }
        } else {
            showToast("Veuillez entrer un nom de catégorie.", "error");
        }
    }

    // Bouton d'annulation modal
    cancelEdit.onclick = function () {
        editModal.style.display = "none";
    }

    // Fontion ajouter une sous-catégorie
    function addSubCategory(parentId) {
        parentCategoryId = parentId;
        subCategoryNameInput.value = "";
        addSubCategoryModal.style.display = "flex";
    }

    // Click sur le bouton de confirmation pour ajouter une sous-catégorie
    confirmAddSubCategory.onclick = function () {
        let subCategoryName = subCategoryNameInput.value.trim();
        if (subCategoryName === "") {
            showToast("Veuillez entrer un nom de sous-catégorie.", "error");
            return;
        }

        let newSubCategory = {
            intitule: subCategoryName,
            parentId: parentCategoryId,
            created: new Date().toISOString().slice(0, 19).replace("T", " "),
            modified: new Date().toISOString().slice(0, 19).replace("T", " "),
        };

        let transaction = db.transaction(["categories"], "readwrite");
        let store = transaction.objectStore("categories");
        let request = store.add(newSubCategory);

        request.onsuccess = function (event) {
            console.log("Sub-category added successfully: ", newSubCategory);
            loadCategories();
            showToast("Sous-catégorie ajoutée avec succès.", "success");
            subCategoryNameInput.value = "";
            addSubCategoryModal.style.display = "none";
        };

        request.onerror = function (event) {
            console.log("Error on add: " + event.target.errorCode);
        };
    }

    // Bouton d'annulation pour ajouter une sous-catégorie
    cancelAddSubCategory.onclick = function () {
        addSubCategoryModal.style.display = "none";
    }

    // Fonction pour ajouter un produit
    function addProduct(categoryId) {
        selectedCategoryId = categoryId;
        productNameInput.value = "";
        productDescriptionInput.value = "";
        addProductModal.style.display = "flex";
    }

    // Click sur le bouton de confirmation pour ajouter un produit
    confirmAddProduct.onclick = function () {
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

        let transaction = db.transaction(["products"], "readwrite");
        let store = transaction.objectStore("products");
        let request = store.add(newProduct);

        request.onsuccess = function (event) {
            console.log("Product added successfully: ", newProduct);
            showToast("Produit ajouté avec succès.", "success");
            productNameInput.value = "";
            productDescriptionInput.value = "";
            addProductModal.style.display = "none";
            loadProducts(selectedCategoryId);
        };

        request.onerror = function (event) {
            console.log("Error on add: " + event.target.errorCode);
        };
    }

    // Bouton d'annulation pour ajouter un produit
    cancelAddProduct.onclick = function () {
        addProductModal.style.display = "none";
    }

    // Charger les produits
    function loadProducts(categoryId) {
        let transaction = db.transaction(["products"], "readonly");
        let store = transaction.objectStore("products");

        if (!store.indexNames.contains("category")) {
            console.error("Index not found: category");
            return;
        }

        let index = store.index("category");
        let request = index.getAll(categoryId);

        request.onsuccess = function () {
            let products = request.result || [];

            if (products.length === 0) {
                console.warn("No products found for category: " + categoryId);
            }

            console.log("Products for category " + categoryId + ":", products);

            // Container pour les produits
            let productContainer = document.getElementById(`product-list-${categoryId}`);
            if (!productContainer) {
                let categoryContainer = document.querySelector(`[data-category-id='${categoryId}']`);
                if (!categoryContainer) {
                    console.error("Category container not found for category: " + categoryId);
                    return;
                }

                productContainer = document.createElement("div");
                productContainer.id = `product-list-${categoryId}`;
                productContainer.classList.add("product-list");
                categoryContainer.appendChild(productContainer);
            }

            productContainer.innerHTML = "";

            products.forEach((product) => {
                let productItem = document.createElement("div");
                productItem.classList.add("product-item");
                productItem.innerHTML = `
                <span>${product.intitule}</span> - <p>${product.descriptif}</p>
                <div class="product-actions">
                    <button class="edit-product">✏️</button>
                    <button class="delete-product">🗑️</button>
                </div>
                `;

                productItem.querySelector(".edit-product").addEventListener("click", () => editProduct(product.id, product.intitule, product.descriptif));
                productItem.querySelector(".delete-product").addEventListener("click", () => deleteProduct(product.id));

                productContainer.appendChild(productItem);
            });
        };

        request.onerror = function (event) {
            console.log("Error on load: " + event.target.errorCode);
        };
    }

    // supprimer un produits
    function deleteProduct(productId) {
        editingProductId = productId;
        deleteProductModal.style.display = "flex";
    }

    // Bouton de confirmation pour supprimer un produit
    confirmDeleteProduct.onclick = function () {
        if (!editingProductId) {
            showToast("Erreur lors de la suppression du produit.", "error");
            return;
        }

        let transaction = db.transaction(["products"], "readwrite");
        let store = transaction.objectStore("products");

        let request = store.delete(editingProductId);
        request.onsuccess = function () {
            console.log("Product deleted successfully");
            showToast("Produit supprimé avec succès.", "success");
            console.log(editingProductId);
            loadCategories();
        };

        request.onerror = function (event) {
            console.log("Error on delete: " + event.target.errorCode);
        };

        deleteProductModal.style.display = "none";
    }

    // Bouton d'annulation pour supprimer un produit
    cancelDeleteProduct.onclick = function () {
        deleteProductModal.style.display = "none";
    }

    // Modifier un produit
    function editProduct(productId, currentName, currentDescription) {
        editingProductId = productId;
        editProductNameInput.value = currentName;
        editProductDescriptionInput.value = currentDescription;
        editProductModal.style.display = "flex";
    }

    // Bouton de sauvegarde pour modifier un produit
    saveEditProduct.onclick = function () {
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
                console.log("Product updated successfully");
                showToast("Produit modifié avec succès.", "success");
                loadProducts(selectedCategoryId);
            };

            updateRequest.onerror = function (event) {
                console.log("Error on update: " + event.target.errorCode);
            };

            editProductModal.style.display = "none";
        };
    }

    // Bouton d'annulation pour modifier un produit
    cancelEditProduct.onclick = function () {
        editProductModal.style.display = "none";
    }

    // Fermer les fenetres des modals en cliquant ailleurs
    window.onclick = function (event) {
        if (event.target === deleteModal) {
            deleteModal.style.display = "none";
        }

        if (event.target === editModal) {
            editModal.style.display = "none";
        }

        if (event.target === addSubCategoryModal) {
            addSubCategoryModal.style.display = "none";
        }

        if (event.target === addProductModal) {
            addProductModal.style.display = "none";
        }

        if (event.target === editProductModal) {
            editProductModal.style.display = "none";
        }

        if (event.target === deleteProductModal) {
            deleteProductModal.style.display = "none";
        }
    }

    /*function debugCategories() {
        let transaction = db.transaction(["categories"], "readonly");
        let store = transaction.objectStore("categories");
        let request = store.getAll();

        request.onsuccess = function () {
            console.log("All Categories: ", request.result);
        };

        request.onerror = function (event) {
            console.log("Error on debug: " + event.target.errorCode);
        }
    }*/
});