# 🎨 Système de Thèmes FactGrid Viewer

## 📁 Fichiers Créés

Voici tous les fichiers créés pour le système de thèmes :

### 1. **Fichier Principal**
- 📄 `src/app/display/_theme-variables.scss` - Fichier de configuration des couleurs

### 2. **Documentation**
- 📖 `THEME-GUIDE.md` - Guide complet d'utilisation
- 📖 `CUSTOM-PALETTE-GUIDE.md` - Guide pour créer vos propres palettes
- 📖 `README.md` - Mis à jour avec la section thème

### 3. **Outils**
- 🎨 `theme-preview.html` - Prévisualisation visuelle des palettes
- 🛠️ `switch-palette.js` - Script Node.js pour changer de palette
- ⚙️ `package.json` - Mis à jour avec les commandes npm

---

## 🚀 Méthodes de Changement de Palette

### Méthode 1 : Édition Manuelle (Recommandée)
```bash
1. Ouvrir: src/app/display/_theme-variables.scss
2. Commenter la palette actuelle (lignes 8-12)
3. Décommenter une palette alternative
4. Sauvegarder
```

### Méthode 2 : Script Node.js
```bash
node switch-palette.js 2
```

### Méthode 3 : Commandes NPM
```bash
npm run theme:green-amber
npm run theme:violet-cyan
npm run theme:navy-coral
# etc.
```

### Méthode 4 : Prévisualisation Visuelle
```bash
npm run theme:preview
# Ou ouvrir directement: theme-preview.html
```

---

## 📊 Palettes Disponibles

| N° | Nom | Commande NPM | Description |
|----|-----|--------------|-------------|
| 0 | Bleu Indigo / Rose | `theme:default` | Palette actuelle, académique classique |
| 1 | Bleu Académique / Orange | `theme:blue-orange` | Dynamique et moderne |
| 2 | Vert Forêt / Ambre | `theme:green-amber` | Naturel et apaisant |
| 3 | Violet Profond / Cyan | `theme:violet-cyan` | Créatif et innovant |
| 4 | Bleu Marine / Corail | `theme:navy-coral` | Maritime et élégant |
| 5 | Bordeaux / Or | `theme:burgundy-gold` | Luxueux et traditionnel |

---

## 🎯 Variables Personnalisables

Dans `_theme-variables.scss`, vous pouvez personnaliser :

### Couleurs Principales
```scss
$primary-color: #283593;      // Couleur dominante
$primary-light: #3F51B5;      // Variante claire
$primary-dark: #1a237e;       // Variante foncée
$accent-color: #AD1457;       // Couleur d'accent
$accent-light: #c2185b;       // Accent clair
```

### Arrière-plans
```scss
$background-page: #f8f9fc;
$background-card: #ffffff;
$background-info: #fff8e1;
$background-drawer: #fafbfc;
$background-header-info: #e8eaf6;
```

### Texte
```scss
$text-primary: #1a2332;
$text-secondary: #5f6c7f;
$text-light: #ffffff;
$text-muted: #9ea8b8;
```

### Bordures
```scss
$border-color: #e3e8ef;
$border-color-strong: #cbd5e1;
```

### Rayons de Bordure
```scss
$radius-sm: 6px;
$radius-md: 12px;
$radius-lg: 16px;
```

### Espacements
```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
```

### Transitions
```scss
$transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## ✅ Avantages du Système

✨ **Simplicité** : Un seul fichier à éditer
🎨 **Flexibilité** : 6 palettes pré-configurées + possibilité de créer les vôtres
🔄 **Hot Reload** : Changements instantanés en développement
📱 **Responsive** : Toutes les palettes testées sur tous les écrans
♿ **Accessible** : Toutes les palettes respectent WCAG AA
🎯 **Cohérence** : Variables utilisées dans tous les composants

---

## 🛠️ Workflow de Développement

### Pour Tester Rapidement
```bash
# Terminal 1 : Démarrer le serveur
ng serve

# Terminal 2 : Changer de palette
npm run theme:green-amber

# Le navigateur se recharge automatiquement
```

### Pour Créer une Nouvelle Palette
```bash
# 1. Prévisualiser les palettes existantes
npm run theme:preview

# 2. Éditer _theme-variables.scss
# Ajouter votre palette en suivant le template

# 3. Tester
ng serve
```

---

## 📖 Documentation Complète

- **Guide d'utilisation** : `THEME-GUIDE.md`
- **Créer vos palettes** : `CUSTOM-PALETTE-GUIDE.md`
- **README général** : `README.md`

---

## 🔗 Ressources Utiles

### Outils de Couleurs
- [Coolors.co](https://coolors.co/) - Générateur de palettes
- [Adobe Color](https://color.adobe.com/) - Roue chromatique
- [Material Design Colors](https://material.io/design/color/)

### Accessibilité
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Inspiration
- [Dribbble Color Search](https://dribbble.com/colors/)
- [Behance](https://www.behance.net/)
- [Awwwards](https://www.awwwards.com/)

---

## 💡 Astuces

### Tester Plusieurs Palettes Rapidement
```bash
# Créer un script pour basculer entre palettes
for i in {0..5}; do
  npm run theme -- $i
  echo "Palette $i activée - Appuyez sur Entrée pour continuer..."
  read
done
```

### Revenir à la Palette par Défaut
```bash
npm run theme:default
```

### Créer une Palette à partir d'une Image
1. Utilisez [Adobe Color Extract](https://color.adobe.com/create/image)
2. Uploadez votre image
3. Extrayez les couleurs
4. Ajustez dans `_theme-variables.scss`

---

## 🎓 Exemples d'Utilisation

### Université / Institution Académique
→ Palette **Bleu Indigo / Rose** (défaut)

### Projet Écologique / Environnement
→ Palette **Vert Forêt / Ambre**

### Startup Tech / Innovation
→ Palette **Violet Profond / Cyan**

### Institution Historique / Patrimoine
→ Palette **Bordeaux / Or**

### Projet Maritime / Océanographie
→ Palette **Bleu Marine / Corail**

---

**Date de création** : 13 novembre 2025  
**Version** : 1.0  
**Auteur** : Assistant IA pour FactGrid Viewer
