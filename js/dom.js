// Sélection des éléments du DOM
export const categoryInput = document.getElementById("categoryName");
export const addCategoryBtn = document.getElementById("addCategory");
export const categoryList = document.getElementById("categoryList");
export const searchInput = document.getElementById("searchInput");

// Modals Suppression
export const deleteModal = document.getElementById("deleteModal");
export const confirmDelete = document.getElementById("confirmDelete");
export const cancelDelete = document.getElementById("cancelDelete");

// Modals Modification
export const editModal = document.getElementById("editModal");
export const editInput = document.getElementById("editInput");
export const updateCategory = document.getElementById("saveEdit");
export const cancelEdit = document.getElementById("cancelEdit");

// Modals Ajout Sous-Catégorie
export const addSubCategoryModal = document.getElementById("addSubCategoryModal");
export const confirmAddSubCategory = document.getElementById("confirmAddSubCategory");
export const cancelAddSubCategory = document.getElementById("cancelAddSubCategory");
export const subCategoryNameInput = document.getElementById("subCategoryName");

// Modal Ajout Produit
export const addProductModal = document.getElementById("addProductModal");
export const productNameInput = document.getElementById("productName");
export const productDescriptionInput = document.getElementById("productDescription");
export const confirmAddProduct = document.getElementById("confirmAddProduct");
export const cancelAddProduct = document.getElementById("cancelAddProduct");

// Modal Modification Produit
export const editProductModal = document.getElementById("editProductModal");
export const editProductNameInput = document.getElementById("editProductName");
export const editProductDescriptionInput = document.getElementById("editProductDescription");
export const saveEditProduct = document.getElementById("saveEditProduct");
export const cancelEditProduct = document.getElementById("cancelEditProduct");

// Modal Suppression Produit
export const deleteProductModal = document.getElementById("deleteProductModal");
export const confirmDeleteProduct = document.getElementById("confirmDeleteProduct");
export const cancelDeleteProduct = document.getElementById("cancelDeleteProduct");

// Conteneur des toasts (créé si inexistant)
export let toastContainer = document.getElementById("toast-container");
if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
}
