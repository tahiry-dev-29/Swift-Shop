C'est parti Tahiry ! Voici la **Feuille de route technique complète**, détaillée tâche par tâche, formatée exactement selon ton style.

C'est une "Checklist de Combat" pour un clone PrestaShop sérieux. Copie-colle ça dans ton Obsidian ou ton gestionnaire de tâches. 🚀

---

# #Backend (NestJS + Prisma)

### 🛠️ Setup & Infrastructure

- [x] Initialiser le Monorepo Nx (`npx create-nx-workspace`).
    
- [x] Configurer l'application NestJS `api-store`.
    
- [x] Créer la librairie partagée `libs/shared/db-schema`.
    
- [x] Installer et configurer Prisma avec PostgreSQL (`provider = "prisma-client-js"`).
    
- [ ] Configurer le Docker Compose pour la base de données PostgreSQL.
    
- [ ] Mettre en place le ConfigService (Gestion des variables d'environnement).
    

### 🔐 Auth & ACL (Employee & Customer)

- [x] Créer le modèle Prisma `Profile` (Rôles Admin) et `Employee`.
    
- [x] Créer le modèle Prisma `Customer` et `CustomerGroup`.
    
- [x] Créer la librairie NestJS `libs/api/auth`.
    
- [x] Implémenter le service de Hashage (Argon2).
    
- [x] Implémenter la stratégie JWT (Passport) pour `Employee` (Back-Office).
    
- [x] Implémenter la stratégie JWT pour `Customer` (Front-Office).
    
- [x] Créer les Guards : `JwtAuthGuard`, `RolesGuard`.
    
- [ ] Créer le Decorator `@CurrentUser()` pour récupérer l'utilisateur depuis le Request.
    
- [x] Endpoint: `auth/employee/login`.
    
- [x] Endpoint: `auth/customer/register` (avec assignation de groupe par défaut).
    
- [x] Endpoint: `auth/customer/login`.
    

### 📂 Catalog Structure (Categories & Features)

- [x] Modèle Prisma `Category` (Arborescence `parentId`).
    
- [ ] Modèle Prisma `Feature` et `FeatureValue` (ex: Matière -> Coton).
    
- [x] Modèle Prisma `AttributeGroup` et `AttributeValue` (ex: Taille -> L, XL).
    
- [x] Service CRUD `CategoryService` (avec gestion de l'arbre parent/enfant).
    
- [ ] Service CRUD `FeatureService`.
    
- [x] Service CRUD `AttributeService`.
    
- [x] Endpoints Admin pour gérer les catégories et attributs.
    

### 📦 Products Core (Le gros morceau) ✅ TERMINÉ

- [x] Modèle Prisma `Product` (Champs de base + dimensions: width, height, depth, weight).
    
- [x] Modèle Prisma `ProductCombination` (Variantes avec priceImpact, weightImpact).
    
- [x] Modèle Prisma `Stock` (Lié au produit OU à la combinaison).
    
- [x] Modèle Prisma `ProductImage` (Gestion des médias avec cover).
    
- [x] DTO `CreateProductInput` (Complexe: incluant toutes les infos de base).
    
- [x] Service `ProductService`: Création de produit simple.
    
- [x] Service `ProductService`: Gestion des combinaisons (avec attributs personnalisables).
    
- [x] Service `ProductService`: Gestion du stock (`updateStock`, `incrementStock`, `decrementStock`).
    
- [x] Endpoint GraphQL: `products` (avec filtres et pagination).
    
- [x] Endpoint GraphQL: `product(id)` (incluant images, combinaisons, stock, attributs).
    
- [x] Endpoint GraphQL: CRUD complet pour Products, Images, Combinations, Stock.
    
- [x] API Tester HTML avec interface améliorée (sections collapsibles, 35 opérations).
    
- [x] Tests automatiques (36/36 tests passés - 100% de réussite).
    

### 💰 Pricing Engine (Moteur de Prix) 🚀 EN COURS

- [ ] Modèle Prisma `SpecificPrice` (Règles de réduction).
    
- [ ] Modèle Prisma `TaxRule` (TVA par pays).
    
- [ ] Service `PriceCalculationService` (Le cerveau du prix).
    
    - [ ] Logique: Prix Base + Impact Combinaison.
        
    - [ ] Logique: Application de la réduction `CustomerGroup`.
        
    - [ ] Logique: Recherche de `SpecificPrice` (Date, Quantité, Pays).
        
    - [ ] Logique: Calcul TTC (Taxe).
        

### 🛒 Cart & Orders

- [ ] Modèle Prisma `Cart` et `CartItem`.
    
- [ ] Modèle Prisma `Order`, `OrderState`, `OrderAddress`.
    
- [ ] Service `CartService`: `addToCart` (Vérification Stock + Validation Combinaison).
    
- [ ] Service `OrderService`: Transformation Panier -> Commande.
    
- [ ] Endpoint: `POST /cart/add`.
    
- [ ] Endpoint: `GET /cart` (Retourne le panier complet calculé).
    
- [ ] Endpoint: `POST /order/create` (Tunnel de commande).
    

---

# #Frontend (Angular 21 - ZoneLess)

### 🏗️ Core & Architecture

- [ ] Configurer l'application `storefront`.
    
- [ ] Configurer le mode ZoneLess (`provideExperimentalZonelessChangeDetection`).
    
- [ ] Configurer le Router et le TitleStrategy.
    
- [ ] Créer les librairies Nx UI (`libs/storefront/ui-kit`).
    
- [ ] Configurer l'intercepteur HTTP (Injection du Token JWT).
    
- [ ] Créer le Service `SessionService` (Signal Store pour l'état User/Cart).
    

### 👤 User Identity

- [ ] Composant `LoginComponent` (Signal based form).
    
- [ ] Composant `RegisterComponent` (Formulaire réactif typé).
    
- [ ] Composant `MyAccountComponent` (Dashboard client).
    
- [ ] Composant `AddressBookComponent` (CRUD Adresses via `httpResource`).
    

### 🛍️ Product Catalog UI

- [ ] Composant `ProductListComponent` (Grille de produits).
    
- [ ] Composant `ProductFilterComponent` (Sidebar de facettes).
    
- [ ] Composant `ProductCardComponent` (Micro-composant réutilisable).
    
- [ ] Page `ProductDetailComponent`.
    
    - [ ] Intégration `httpResource` pour fetch le produit.
        
    - [ ] Composant `ProductGallery` (Images).
        
    - [ ] Composant `ProductAttributes` (Selecteur Taille/Couleur).
        
    - [ ] Signal `selectedCombination` (Calcul réactif du prix affiché et de l'image).
        
    - [ ] Bouton "Ajouter au panier" (State loading/success).
        

### 🛒 Checkout Experience

- [ ] Composant `CartModalComponent` (Offcanvas/Sidebar panier).
    
- [ ] Page `CartPageComponent` (Résumé détaillé).
    
- [ ] Page `CheckoutComponent` (Stepper).
    
    - [ ] Step 1: Informations Personnelles (ou Login).
        
    - [ ] Step 2: Adresses (Livraison/Facturation).
        
    - [ ] Step 3: Méthode de livraison.
        
    - [ ] Step 4: Paiement.
        

### 🎨 UI Kit (Design System)

- [ ] Composant `Button` (Variants: Primary, Secondary, Ghost).
    
- [ ] Composant `Input` (Text, Number, Password).
    
- [ ] Composant `Badge` (Pour les stocks/promos).
    
- [ ] Composant `Alert/Toast` (Notifications).
    
- [ ] Composant `Loader/Skeleton` (UX d'attente).
    

---

Voulez-vous que je génère le code du **Backend - Modèle Prisma `Product`** (la première case de la section Products Core) pour commencer ?