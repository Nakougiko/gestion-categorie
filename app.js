let db;

document.addEventListener("DOMContentLoaded", () => {
    // IndexedDB
    let request = indexedDB.open("categoriesDB", 1);

    request.onupgradeneeded = function(event) {
        let db = event.target.result;
        let store = db.createObjectStore("categories", { keyPath: "id", autoIncrement: true });

        store.createIndex("intitule", "intitule", { unique: false });
        store.createIndex("created", "created", { unique: false });
        store.createIndex("modified", "modified", { unique: false });
    }

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log("Success: " + db);
        loadCategories();
    }

    request.onerror = function(event) {
        console.log("Error: " + event.target.errorCode);
    }

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

        request.onsuccess = function(event) {
            console.log("Category added successfully");
            loadCategories();
        }

        request.onerror = function(event) {
            console.log("Error on add: " + event.target.errorCode);
        }
    });

    function loadCategories() {
        categoryList.innerHTML = "";

        let transaction = db.transaction(["categories"], "readonly");
        let store = transaction.objectStore("categories");
        let request = store.getAll();

        request.onsuccess = function() {
            let categories = request.result;
            categories.forEach(category => {
                let categoryItem = document.createElement("li");
                categoryItem.textContent = category.intitule;
                categoryList.appendChild(categoryItem);
            });
        }

        request.onerror = function(event) {
            console.log("Error on load: " + event.target.errorCode);
        }
    }
});
