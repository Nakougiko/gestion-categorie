# 📂 Gestion de Catégories et Produits - IndexedDB

## 🚀 Description du projet
Ce projet permet de gérer des **catégories et des produits** en local à l’aide d’`IndexedDB`, sans besoin de serveur.  
L’interface permet d’ajouter, organiser et manipuler les catégories et produits **via le Drag & Drop**, ainsi que **copier/coller** des éléments dans l’arborescence.

---

## 📌 Fonctionnalités principales

✔️ **Ajout de catégories de niveau 1**  
✔️ **Ajout illimité de sous-catégories**  
✔️ **Ajout de produits dans chaque catégorie**  
✔️ **Modification des catégories et produits**  
✔️ **Suppression avec confirmation**  
✔️ **Réorganisation avec Drag & Drop** (Catégories, sous-catégories, produits)  
✔️ **Déplacement de sous-catégories d’un parent à un autre**  
✔️ **Déplacement de produits d’une catégorie à une autre**  
✔️ **Copier-coller de catégories et produits**  
✔️ **Masquer/Afficher une catégorie et ses enfants**  
✔️ **Recherche avancée avec affichage dynamique des parents**  
✔️ **Animations fluides et transitions pour une meilleure UX**  

---

## 🖼️ Aperçu du projet
![image](https://github.com/user-attachments/assets/d67f1ffe-e6d5-4946-afe2-0be06ae3179a)

---

## 🛠️ Installation et exécution

### 🔹 1. Cloner le projet
```bash
git clone https://github.com/Nakougiko/gestion-categorie.git
cd gestion-categorie
```

### 🔹 2. Lancer le projet
> Ouvrir le fichier `index.html` dans votre navigateur (Google Chrome recommandé).

Aucune installation requise. Tout fonctionne en local grâce à `IndexedDB`.

---

## 🔧 Technologies utilisées
- **HTML5** / **CSS3**
- **JavaScript (ES6)**
- **IndexedDB** pour le stockage local
- **SortableJS** pour le **Drag & Drop**
- **Vanilla JS** (sans framework)

---

## 🧪 Scénarios de test

### ➜ **Gestion des catégories**
✅ Ajouter plusieurs catégories et sous-catégories  
✅ Modifier le nom d’une catégorie  
✅ Supprimer une catégorie et vérifier la suppression de ses enfants  

### ➜ **Gestion des produits**
✅ Ajouter un produit à une catégorie  
✅ Modifier un produit et vérifier la mise à jour  
✅ Supprimer un produit et vérifier la mise à jour  

### ➜ **Drag & Drop**
✅ Changer l’ordre des catégories de niveau 1  
✅ Déplacer une sous-catégorie sous un autre parent  
✅ Réorganiser les produits dans une catégorie  

### ➜ **Copier-Coller**
✅ Copier une catégorie et la coller sous une autre  
✅ Copier un produit et le coller dans une autre catégorie  

### ➜ **Recherche avancée**
✅ Rechercher un produit et afficher son arborescence complète  
✅ Rechercher une sous-catégorie et cacher les autres sous-catégories non concernées  

---

## 🔥 Améliorations futures
- Ajout d’une option **Exporter/Importer la base IndexedDB**
- Possibilité de **sauvegarder les données en JSON**
- Ajout d’une **interface plus moderne** (avec Tailwind ou Bootstrap)
- Ajout d'un menu contextuelle (clic droit), pour certaines actions (suppression, copie, ...)

---

## 🏆 Auteur
👨‍💻 **Développé par** : [Lukas Goulois](https://github.com/Nakougiko)  
📆 **Date** : Février 2025  
📩 **Contact** : goulois.lukas@gmail.com  

---
