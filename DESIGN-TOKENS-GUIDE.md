# Guide d’utilisation des Design Tokens (Angular Material 3)

## Qu’est-ce qu’un design token ?
Un design token est une variable CSS centralisée qui définit une valeur de style réutilisable (couleur, espacement, rayon, etc.).

## Où sont-ils définis ?
Les tokens sont déclarés dans le bloc `:root` du fichier `src/styles.scss`.

Exemple :
```css
:root {
  --thematic-card-padding: 24px;
  --thematic-card-margin: 16px;
  --thematic-card-width: 100%;
  --thematic-card-max-width: 600px;
  --thematic-card-radius: 14px;
  --sparql-display-padding: 20px;
  --sparql-display-margin: 12px;
  --md-sys-color-primary: #6c7a89;
  /* ...autres tokens... */
}
```

## Comment les utiliser ?
Dans vos fichiers SCSS de composants, utilisez la fonction CSS `var()` :

```scss
.thematic-card {
  padding: var(--thematic-card-padding);
  margin: var(--thematic-card-margin);
  border-radius: var(--thematic-card-radius);
}

.cardBackground {
  padding: var(--sparql-display-padding);
  margin: var(--sparql-display-margin);
}
```

## Avantages
- Centralisation : modifiez la valeur dans `:root`, tout le projet est mis à jour.
- Cohérence : tous les composants partagent la même base visuelle.
- Facile à surcharger pour un mode sombre ou une personnalisation par projet.

## Bonnes pratiques
- Ajoutez tout nouveau token dans `:root` de `styles.scss`.
- Utilisez toujours `var(--nom-du-token)` dans vos SCSS de composants.
- Documentez chaque token si besoin (commentaire à côté).

## Pour aller plus loin
- Les tokens Angular Material natifs (ex : `--md-sys-color-primary`) peuvent aussi être surchargés dans `:root`.
- Pour des thèmes dynamiques, modifiez les tokens via JavaScript ou ajoutez un sélecteur CSS (ex : `body.dark { ... }`).

---

**Ce guide est à destination des développeurs.**

Pour toute question, consultez la documentation officielle Angular Material 3 ou ce fichier.
