let db;

// Les modals
const deleteModal = document.getElementById("deleteModal");
const confirmDelete = document.getElementById("confirmDelete");
const cancelDelete = document.getElementById("cancelDelete");

// Les boutons des modals
const editModal = document.getElementById("editModal");
const editInput = document.getElementById("editInput");
const updateCategory = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");

// Les variables pour stocker les catégories à supprimer et à modifier
let categoryToDelete = null;
let categoryToEdit = null;

document.addEventListener("DOMContentLoaded", () => {
    // IndexedDB
    let request = indexedDB.open("categoriesDB", 2); // on met la version en 2

    request.onupgradeneeded = function (event) {
        let db = event.target.result;

        if (!db.objectStoreNames.contains("categories")) {
            let store = db.createObjectStore("categories", {
                keyPath: "id",
                autoIncrement: true,
            });

            // Création des index
            store.createIndex("intitule", "intitule", { unique: false });
            store.createIndex("parentId", "parentId", { unique: false });
            store.createIndex("created", "created", { unique: false });
            store.createIndex("modified", "modified", { unique: false });
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

    // DOM
    const categoryInput = document.getElementById("categoryName");
    const addCategoryBtn = document.getElementById("addCategory");
    const categoryList = document.getElementById("categoryList");

    // Ajouter une catégorie
    addCategoryBtn.addEventListener("click", () => {
        const categoryName = categoryInput.value.trim();
        if (categoryName === "") {
            alert("Veuillez entrer un nom de catégorie.");
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
                        <button class="edit-category">✏️</button>
                        <button class="delete-btn">🗑️</button>
                    </div>
                </div>
                <div class="sub-category-container"></div> 
            `;

                let subCategoryContainer = categoryContainer.querySelector(".sub-category-container");
                loadCategories(category.id, subCategoryContainer, level + 1);

                container.appendChild(categoryContainer);

                categoryContainer.querySelector(".add-sub-category").addEventListener("click", () => addSubCategory(category.id));
                categoryContainer.querySelector(".edit-category").addEventListener("click", () => editCategory(category.id, category.intitule));
                categoryContainer.querySelector(".delete-btn").addEventListener("click", () => deleteCategory(category.id));
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
                    loadCategories();
                };

                updateRequest.onerror = function (event) {
                    console.log("Error on update: " + event.target.errorCode);
                };

                editModal.style.display = "none";
            }
        }
    }

    // Bouton d'annulation modal
    cancelEdit.onclick = function () {
        editModal.style.display = "none";
    }

    // Fontion ajouter une sous-catégorie
    function addSubCategory(parentId) {
        let subCategoryName = prompt("Entrez le nom de la sous-catégorie :").trim();
        if (subCategoryName === "") {
            alert("Veuillez entrer un nom de sous-catégorie.");
            return;
        }

        let newSubCategory = {
            intitule: subCategoryName,
            parentId: parentId,
            created: new Date().toISOString().slice(0, 19).replace("T", " "),
            modified: new Date().toISOString().slice(0, 19).replace("T", " "),
        };

        let transaction = db.transaction(["categories"], "readwrite");
        let store = transaction.objectStore("categories");
        let request = store.add(newSubCategory);

        request.onsuccess = function () {
            console.log("Sub-category added successfully");
            loadCategories();
        };

        request.onerror = function (event) {
            console.log("Error on add sub-category: " + event.target.error);
        };
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