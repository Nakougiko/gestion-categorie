let db;

const deleteModal = document.getElementById("deleteModal");
const confirmDelete = document.getElementById("confirmDelete");
const cancelDelete = document.getElementById("cancelDelete");

const editModal = document.getElementById("editModal");
const editInput = document.getElementById("editInput");
const updateCategory = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");

let categoryToDelete = null;
let categoryToEdit = null;

document.addEventListener("DOMContentLoaded", () => {
    // IndexedDB
    let request = indexedDB.open("categoriesDB", 1);

    request.onupgradeneeded = function (event) {
        let db = event.target.result;
        let store = db.createObjectStore("categories", {
            keyPath: "id",
            autoIncrement: true,
        });

        store.createIndex("intitule", "intitule", { unique: false });
        store.createIndex("created", "created", { unique: false });
        store.createIndex("modified", "modified", { unique: false });
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

    addCategoryBtn.addEventListener("click", () => {
        const categoryName = categoryInput.value.trim();
        if (categoryName === "") {
            alert("Veuillez entrer un nom de catégorie.");
            return;
        }

        let newCategory = {
            intitule: categoryName,
            created: new Date().toISOString().slice(0, 19).replace("T", " "),
            modified: new Date().toISOString().slice(0, 19).replace("T", " "),
        };

        let transaction = db.transaction(["categories"], "readwrite");
        let store = transaction.objectStore("categories");
        let request = store.add(newCategory);

        request.onsuccess = function (event) {
            console.log("Category added successfully");
            loadCategories();
        };

        request.onerror = function (event) {
            console.log("Error on add: " + event.target.errorCode);
        };
    });

    function loadCategories() {
        categoryList.innerHTML = "";

        let transaction = db.transaction(["categories"], "readonly");
        let store = transaction.objectStore("categories");
        let request = store.getAll();

        request.onsuccess = function () {
            let categories = request.result;
            categories.forEach((category) => {
                let categoryItem = document.createElement("li");
                categoryItem.classList.add("category-item");

                categoryItem.innerHTML = `
                    <span>${category.intitule}</span>
                    <div class="category-actions">
                    <button class="add-sub-category">➕</button>
                    <button class="edit-category">✏️</button>
                    <button class="delete-btn">🗑️</button>
                </div>
            `;

                categoryItem
                    .querySelector(".delete-btn")
                    .addEventListener("click", () => {
                        deleteCategory(category.id);
                    });

                categoryItem
                    .querySelector(".edit-category")
                    .addEventListener("click", () => {
                        editCategory(category.id, category.intitule);
                    });

                categoryList.appendChild(categoryItem);
            });
        };

        request.onerror = function (event) {
            console.log("Error on load: " + event.target.errorCode);
        };
    }

    function deleteCategory(categoryId) {
        categoryToDelete = categoryId;
        deleteModal.style.display = "flex";
    }

    confirmDelete.onclick = function () {
        if (categoryToDelete !== null) {
            let transaction = db.transaction(["categories"], "readwrite");
            let store = transaction.objectStore("categories");
            let request = store.delete(categoryToDelete);

            request.onsuccess = function () {
                console.log("Category deleted successfully");
                loadCategories();
            }
        }

        request.onerror = function (event) {
            console.log("Error on delete: " + event.target.errorCode);
        };

        deleteModal.style.display = "none";
    }

    cancelDelete.onclick = function () {
        deleteModal.style.display = "none";
    }


    function editCategory(categoryId, currentName) {
        categoryToEdit = categoryId;
        editInput.value = currentName;
        editModal.style.display = "flex";
    }

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

    cancelEdit.onclick = function () {
        editModal.style.display = "none";
    }
});