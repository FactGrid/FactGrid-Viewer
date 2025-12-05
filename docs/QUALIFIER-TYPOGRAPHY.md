## Modifier la typographie des qualifiers (labels & descriptions)

Résumé rapide
- J'ai réduit la taille des labels de qualifiers et ajouté une classe sémantique dédiée pour les descriptions des qualifiers.
- Fichiers modifiés : `src/styles/_typography.scss`, `src/app/display/generic-list-display/generic-list-display.component.html`, `src/app/display/header-display/header-display.component.html`.

Nouvelles classes / tokens disponibles
- `typo-qualifier-property-label` (déjà utilisée) — affiche le label du qualifier. Sa taille est maintenant définie par `--typo-qualifier-property-size` et par défaut réduite à `0.8rem`.
- `typo-qualifier-desc` (nouveau) — classe sémantique pour afficher la *description* d'un qualifier (taille réduite par la variable `--typo-qualifier-desc-size`, par défaut `0.75rem`).
 - `typo-qualifier-desc` (nouveau) — classe sémantique pour afficher la *description* d'un qualifier (taille réduite par la variable `--typo-qualifier-desc-size`, par défaut `0.75rem`).
 - `typo-qualifier-label` (nouveau) — classe sémantique pour les *labels* (valeurs) des qualifiers (p.ex. noms d'items listés dans un qualifier). Taille par défaut `--typo-qualifier-label-size` (0.85rem) — plus petite que l'`typo-item-label`.

Mode d'emploi pour la suite
1. Labels de qualifiers (propriétés) :
   - Déclarez dans vos templates la classe `typo-qualifier-property-label` sur l'élément contenant le nom du qualifier. Exemple :

     `<span class="typo-qualifier-property-label qualifierProperty">{{Q.label}}</span>`

2. Descriptions des qualifiers (valeurs liées) :
   - Utilisez `typo-qualifier-desc` au lieu de `typo-item-desc` si le texte appartient à un qualifier. Exemple :

     `<span class="typo-qualifier-desc generic-description-layout">{{ D.description }}</span>`

3. Labels des valeurs des qualifiers :
    - Pour les labels (valeur affichée) des qualifiers, utilisez `typo-qualifier-label` au lieu de `typo-item-label` pour conserver la hiérarchie visuelle. Exemple :

       `<a class="linkedItemText typo-link typo-qualifier-label" [routerLink]="['/item', D.id]">{{ D.label }}</a>`

3. Layout vs typographie :
   - Ne mettez pas des proprétés typographiques dans des classes locales de layout. Conservez `typo-*` pour la typographie et gardez des classes `*-description-layout` (ou autres helpers localisés) pour l'espacement / layout.

4. Pour régler les tailles globalement :
   - Ouvrez `src/styles/_typography.scss` et ajustez :
     - `--typo-qualifier-property-size` (label qualifiers)
     - `--typo-qualifier-desc-size` (qualifier descriptions)

5. Tests :
   - Après modification, lancez la suite de tests :

   ```powershell
   npm test
   ```

Notes et bonnes pratiques
- Préférez utiliser les classes sémantiques (`typo-*`) dans le markup plutôt que d'écrire des règles typographiques locales — cela facilite la cohérence et la maintenance.
- Si vous voulez des variantes visuelles (p.ex. dans les cards compactes), combinez la classe sémantique avec un helper layout local (`card-description-layout`, `header-description-layout`, etc.).

Si vous voulez, je peux maintenant :
- faire un sweep automatique pour remplacer les usages restants de `typo-item-desc` utilisés pour *qualifier descriptions* dans d'autres templates (docs/générés exclus), ou
- ajuster encore plus finement les valeurs par défaut (par ex. réduire davantage à `0.7rem`) et exécuter les tests avant commit.

