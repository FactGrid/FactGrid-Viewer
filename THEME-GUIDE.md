# Guide des Thèmes FactGrid Viewer

## 🎨 Comment changer de palette de couleurs

Pour changer facilement de palette, éditez le fichier :
**`src/app/display/_theme-variables.scss`**

### Méthode simple :

1. Ouvrez `_theme-variables.scss`
2. Commentez la palette actuelle (lignes 8-12)
3. Décommentez une palette alternative (par exemple, lignes 16-20)
4. Sauvegardez le fichier
5. Le navigateur se rechargera automatiquement avec les nouvelles couleurs

---

## 📊 Palettes Disponibles

### **Palette Actuelle : Bleu Indigo / Rose**
```scss
$primary-color: #283593;    // Bleu indigo foncé
$primary-light: #3F51B5;    // Bleu indigo clair
$primary-dark: #1a237e;     // Bleu indigo très foncé
$accent-color: #AD1457;     // Rose profond
$accent-light: #c2185b;     // Rose clair
```
**Usage :** Interface académique classique, professionnelle et sobre

---

### **Palette 1 : Bleu Académique / Orange**
```scss
$primary-color: #1e3a8a;    // Bleu royal profond
$primary-light: #3b82f6;    // Bleu vif
$primary-dark: #1e40af;     // Bleu marine
$accent-color: #ea580c;     // Orange énergique
$accent-light: #f97316;     // Orange clair
```
**Usage :** Dynamique et moderne, contraste élevé pour la lisibilité

---

### **Palette 2 : Vert Forêt / Ambre**
```scss
$primary-color: #065f46;    // Vert émeraude foncé
$primary-light: #059669;    // Vert émeraude
$primary-dark: #064e3b;     // Vert forêt profond
$accent-color: #d97706;     // Ambre chaud
$accent-light: #f59e0b;     // Ambre clair
```
**Usage :** Naturel et apaisant, idéal pour les sciences environnementales

---

### **Palette 3 : Violet Profond / Cyan**
```scss
$primary-color: #5b21b6;    // Violet impérial
$primary-light: #7c3aed;    // Violet clair
$primary-dark: #4c1d95;     // Violet profond
$accent-color: #0891b2;     // Cyan vif
$accent-light: #06b6d4;     // Cyan clair
```
**Usage :** Créatif et innovant, excellent pour les projets technologiques

---

### **Palette 4 : Bleu Marine / Corail**
```scss
$primary-color: #0c4a6e;    // Bleu océan profond
$primary-light: #0284c7;    // Bleu ciel
$primary-dark: #075985;     // Bleu marine foncé
$accent-color: #dc2626;     // Rouge corail
$accent-light: #ef4444;     // Rouge vif
```
**Usage :** Maritime et élégant, fort contraste pour l'accessibilité

---

### **Palette 5 : Bordeaux / Or**
```scss
$primary-color: #7f1d1d;    // Bordeaux profond
$primary-light: #b91c1c;    // Rouge bordeaux
$primary-dark: #991b1b;     // Bordeaux très foncé
$accent-color: #ca8a04;     // Or antique
$accent-light: #eab308;     // Or brillant
```
**Usage :** Luxueux et traditionnel, parfait pour les institutions historiques

---

## 🛠️ Créer votre propre palette

Pour créer une palette personnalisée :

1. **Choisissez vos couleurs principales**
   - `$primary-color` : Couleur dominante (titres, liens, navigation)
   - `$primary-light` : Version plus claire de la primaire
   - `$primary-dark` : Version plus foncée de la primaire

2. **Choisissez votre couleur d'accent**
   - `$accent-color` : Couleur secondaire (boutons, éléments importants)
   - `$accent-light` : Version plus claire de l'accent

3. **Ajoutez votre palette dans `_theme-variables.scss`**
```scss
// PALETTE PERSONNALISÉE : Votre nom
// $primary-color: #XXXXXX;
// $primary-light: #XXXXXX;
// $primary-dark: #XXXXXX;
// $accent-color: #XXXXXX;
// $accent-light: #XXXXXX;
```

4. **Décommentez et testez !**

---

## 🎯 Outils Recommandés

Pour créer des palettes harmonieuses :

- **Coolors.co** : Générateur de palettes
- **Adobe Color** : Roue chromatique interactive
- **Material Design Color Tool** : Palettes Material Design
- **Contrast Checker** : Vérifier l'accessibilité WCAG

---

## ⚡ Variables Personnalisables Supplémentaires

Au-delà des couleurs, vous pouvez aussi personnaliser :

```scss
// Arrière-plans
$background-page: #f8f9fc;
$background-card: #ffffff;
$background-info: #fff8e1;

// Rayons de bordure
$radius-sm: 6px;
$radius-md: 12px;
$radius-lg: 16px;

// Espacements
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
```

---

## 📝 Notes Importantes

- ✅ Toutes les palettes sont optimisées pour l'accessibilité (contraste WCAG AA)
- ✅ Les changements sont instantanés en mode développement
- ✅ Pensez à tester sur différents écrans (desktop, tablette, mobile)
- ✅ Vérifiez le rendu avec les différents types de contenu

---

## 🔄 Retour à la palette par défaut

Si vous souhaitez revenir à la palette originale, utilisez simplement :

```scss
$primary-color: #283593;
$primary-light: #3F51B5;
$primary-dark: #1a237e;
$accent-color: #AD1457;
$accent-light: #c2185b;
```

---

Dernière mise à jour : 13 novembre 2025
