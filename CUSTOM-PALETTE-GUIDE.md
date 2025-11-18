# Créer Votre Palette Personnalisée

## 🎨 Guide Étape par Étape

### 1. Choisir vos couleurs

Utilisez un de ces outils pour créer une palette harmonieuse :

#### Outils Recommandés
- **[Coolors.co](https://coolors.co/)** - Générateur de palettes aléatoires
- **[Adobe Color](https://color.adobe.com/)** - Roue chromatique professionnelle
- **[Material Design Color Tool](https://material.io/resources/color/)** - Palettes Material Design
- **[Paletton](https://paletton.com/)** - Schémas de couleurs complémentaires

#### Conseils pour Choisir
1. **Couleur Primaire** : Choisissez une couleur qui représente votre projet/institution
2. **Couleur d'Accent** : Choisissez une couleur contrastante mais harmonieuse
3. **Vérifiez le contraste** : Utilisez [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 2. Générer les Variantes

Pour chaque couleur principale, vous avez besoin de 3 variantes :

```
Couleur de base (primary-color)
    ↓
Variante claire (+20-30% luminosité) → primary-light
Variante foncée (-20-30% luminosité) → primary-dark
```

#### Méthode Facile avec HSL

Si votre couleur primaire est `#283593` (HSL: 233°, 54%, 37%) :

```scss
// Couleur de base
$primary-color: hsl(233, 54%, 37%);     // #283593

// Variante claire (+15% luminosité)
$primary-light: hsl(233, 54%, 52%);     // ≈ #3F51B5

// Variante foncée (-15% luminosité)
$primary-dark: hsl(233, 54%, 22%);      // ≈ #1a237e
```

**Astuce** : Gardez la teinte (H) et la saturation (S) identiques, modifiez uniquement la luminosité (L).

### 3. Template de Palette

Copiez ce template dans `_theme-variables.scss` :

```scss
// ====== PALETTE PERSONNALISÉE : [VOTRE NOM] ======
// Description : [Décrivez l'ambiance de votre palette]

// Couleurs principales (utilisées pour titres, navigation, liens)
$primary-color: #XXXXXX;      // Couleur de base
$primary-light: #XXXXXX;      // +15% à +25% luminosité
$primary-dark: #XXXXXX;       // -15% à -25% luminosité

// Couleurs d'accent (utilisées pour boutons, éléments importants)
$accent-color: #XXXXXX;       // Couleur de base
$accent-light: #XXXXXX;       // +15% à +25% luminosité

// Optionnel : personnaliser les arrière-plans
// $background-page: #f8f9fc;
// $background-header-info: #e8eaf6;
```

### 4. Exemples Détaillés

#### Exemple 1 : Palette "Océan Pacifique"

```scss
// ====== PALETTE : OCÉAN PACIFIQUE ======
// Description : Inspiration marine avec touches de sable doré

// Couleurs principales - Bleu océan profond
$primary-color: #006994;      // Bleu océan
$primary-light: #0088bd;      // Bleu ciel
$primary-dark: #004d6e;       // Bleu profond

// Couleurs d'accent - Sable doré
$accent-color: #d4a574;       // Or sable
$accent-light: #e6c199;       // Beige clair

// Personnalisation des arrière-plans
$background-page: #f0f7fa;
$background-header-info: #d6ebf5;
```

#### Exemple 2 : Palette "Forêt d'Automne"

```scss
// ====== PALETTE : FORÊT D'AUTOMNE ======
// Description : Tons naturels de forêt automnale

// Couleurs principales - Vert forêt
$primary-color: #2d5016;      // Vert mousse foncé
$primary-light: #4a7c2c;      // Vert feuillage
$primary-dark: #1e3810;       // Vert forêt profond

// Couleurs d'accent - Orange automnal
$accent-color: #c65d21;       // Orange brûlé
$accent-light: #e07d3f;       // Orange citrouille

// Personnalisation des arrière-plans
$background-page: #f8faf7;
$background-header-info: #e8f0e3;
```

#### Exemple 3 : Palette "Nuit Étoilée"

```scss
// ====== PALETTE : NUIT ÉTOILÉE ======
// Description : Tons nocturnes avec touches lumineuses

// Couleurs principales - Bleu nuit
$primary-color: #1a1f3a;      // Bleu nuit
$primary-light: #2c3e6f;      // Bleu crépuscule
$primary-dark: #0f1425;       // Bleu nuit profonde

// Couleurs d'accent - Jaune étoile
$accent-color: #ffd700;       // Or brillant
$accent-light: #ffe44d;       // Jaune lumineux

// Personnalisation des arrière-plans
$background-page: #f5f6fa;
$background-header-info: #e3e5f0;
```

### 5. Tester Votre Palette

#### Checklist de Vérification

- [ ] **Contraste des textes** : Les textes sont-ils lisibles sur tous les fonds ?
- [ ] **Accessibilité WCAG AA** : Ratio de contraste ≥ 4.5:1 pour le texte normal
- [ ] **Harmonie visuelle** : Les couleurs s'accordent-elles bien ensemble ?
- [ ] **Distinction claire** : La couleur primaire et d'accent sont-elles bien différenciées ?
- [ ] **Test multi-écrans** : Vérifiez sur desktop, tablette et mobile
- [ ] **Test de contenu** : Testez avec différents types de pages (listes, détails, etc.)

#### Outils de Test

```bash
# Lancer le serveur de développement
ng serve

# Ouvrir dans le navigateur
# http://localhost:4200
```

### 6. Formules Utiles

#### Conversion RGB → HSL

```javascript
// Utilisez la console du navigateur
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Exemple d'utilisation
rgbToHsl(40, 53, 147); // [233, 54, 37] = hsl(233°, 54%, 37%)
```

#### Générer Variantes de Luminosité

```scss
// Dans SCSS, vous pouvez utiliser les fonctions intégrées :

$base-color: #283593;

$light-variant: lighten($base-color, 15%);  // Plus clair de 15%
$dark-variant: darken($base-color, 15%);    // Plus foncé de 15%

// Ou pour plus de contrôle avec HSL
$primary-hue: 233;
$primary-saturation: 54%;

$primary-color: hsl($primary-hue, $primary-saturation, 37%);
$primary-light: hsl($primary-hue, $primary-saturation, 52%);
$primary-dark: hsl($primary-hue, $primary-saturation, 22%);
```

### 7. Palettes par Domaine

#### Sciences Naturelles
```scss
$primary-color: #1e7e34;   // Vert botanique
$accent-color: #8b4513;    // Brun terre
```

#### Histoire / Patrimoine
```scss
$primary-color: #6b4423;   // Brun parchemin
$accent-color: #b8860b;    // Or antique
```

#### Technologie / Innovation
```scss
$primary-color: #0066cc;   // Bleu tech
$accent-color: #00e5ff;    // Cyan néon
```

#### Arts / Culture
```scss
$primary-color: #8e24aa;   // Violet artistique
$accent-color: #ff6f00;    // Orange créatif
```

#### Médecine / Santé
```scss
$primary-color: #0277bd;   // Bleu médical
$accent-color: #00897b;    // Vert santé
```

### 8. Partager Votre Palette

Si vous créez une belle palette, partagez-la !

```scss
// Ajoutez votre palette dans _theme-variables.scss
// avec un commentaire descriptif :

// ====== PALETTE : [VOTRE NOM] ======
// Créée par : [Votre nom]
// Date : [Date]
// Description : [Description]
// Usage recommandé : [Type de projet]
// $primary-color: #XXXXXX;
// $primary-light: #XXXXXX;
// $primary-dark: #XXXXXX;
// $accent-color: #XXXXXX;
// $accent-light: #XXXXXX;
```

---

## 🎓 Ressources Supplémentaires

- [Color Theory Basics](https://www.interaction-design.org/literature/topics/color-theory)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Color System](https://material.io/design/color/the-color-system.html)
- [Adobe Color Trends](https://color.adobe.com/trends)

---

**Besoin d'aide ?** Consultez le [`THEME-GUIDE.md`](./THEME-GUIDE.md) ou les exemples dans `_theme-variables.scss`.
