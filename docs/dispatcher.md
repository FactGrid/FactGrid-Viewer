# Mode d'emploi — ItemDisplay Dispatcher

Ce document explique comment fonctionne le dispatcher principal du projet (ItemDisplayDispatcherService), qui prend en entrée le payload d'un item FactGrid et construit les structures destinées à l'affichage (groupes / cartes / listes). Il décrit aussi comment ajouter un bloc de propriétés conditionnel (par exemple un bloc "activité").

---

## Fichiers-clés

- `src/app/display/services/item-display-dispatcher.service.ts`
  - Le service principal exposant `dispatch(item, target): DisplayFlags` — c'est la passerelle qui construit `target` (structures d'affichage) et renvoie les flags d'affichage.
  - La logique est maintenant morcelée en helpers privés (`processInfo`, `processPlace`, `processPerson`, `processOrg`, `processActivity`, `processDocument`, `processSources`, `processExternalLinks`, `processOthers`, `buildMainList`) pour faciliter la lecture et les tests.
- `src/app/display/services/claims-enricher.service.ts`
  - Normalise/détecte des formes P2.* (ex. Q7 => person) et ajoute des marqueurs de présence dans `claims.P2` (ex. `claims.P2.person`, `claims.P2.activity`, `claims.P2.org`, ...).
  - Le dispatcher s'appuie sur ces marqueurs pour prendre des décisions (plutôt que d'analyser brutement le payload).
- `src/app/display/services/block-display.service.ts`
  - Utilitaire utilisé par le dispatcher pour "peupler" des tableaux (ex. `setActivityDisplay`) et retirer les propriétés consommées de `item[1]` (liste des propriétés restantes).
- `src/app/config/dispatcher.config.ts`
  - Constantes listant quelles propriétés appartiennent à chaque bloc (ex. `ACTIVITY_DISPLAY_PROPERTIES`).

---

## Format attendu pour `dispatch()`

- Entrée `item` : tableau `[payload, indexList]` où `payload` est l'objet contenant `claims` et `infoList` le cas échéant, et `indexList` est un Array<string> des identifiants de propriétés non encore consommées.
- `target` : objet mutable où `dispatch()` crée des clés (ex. `target.activityDetail`, `target.lifeAndFamily`, `target.mainList`, etc.).

Exemple minimal d'item pour tests :

```ts
const item = [
  { claims: { P2: { activity: true }, P267: [{ /* ... */ }] } },
  ['P2', 'P267']
];
const target = {};
service.dispatch(item, target);
```

---

## Ajouter un bloc conditionnel (ex. bloc "activité") — checklist

1. Validation / détection :
   - Si votre critère repose sur P2 (instance type), ajoutez le Q-id à `ClaimsEnricherService` pour que `claims.P2.activity = true` soit créé automatiquement.
   - Exemple : si `Q146602` représente une activité, ajoutez-le dans la liste `activityIds`.

2. Définir les propriétés du bloc :
   - Modifier `src/app/config/dispatcher.config.ts` → ajouter / ajuster `ACTIVITY_DISPLAY_PROPERTIES` avec les `property: 'Pxxx'` pertinents.

3. BlockDisplayService :
   - `BlockDisplayService.populateDisplay` fonctionne avec les listes de `dispatcher.config` ; rien à faire si la constante est présente.
   - Si tu as besoin d'un comportement particulier (ex. transformation de claim avant push), implémente une méthode dédiée dans `BlockDisplayService` ou crée une méthode utilitaire appelée par `setActivityDisplay`.

4. Dispatcher / helpers :
   - `item-display-dispatcher.service.ts` contient déjà `processActivity(item, target)` : il initialise `target.activityDetail` et appelle `blockDisplay.setActivityDisplay(item, target.activityDetail)`.
   - Ajoute toute logique additionnelle (titre, fuseau, flags) si nécessaire dans `processActivity` ou dans un nouveau helper privé (`buildActivityCard` par ex.).

5. Tests unitaires :
   - Écris un test (Jasmine) dans `item-display-dispatcher.service.spec.ts`.
   - Pattern de test : créer `item` (avec `P2.activity=true` et `P267` claims), appeler `service.dispatch(item, target)`, assert `flags.isActivity === true`, `target.activityDetail` rempli et `item[1]` n'inclut plus `P267`.

6. UI / template :
   - Si une modification d'affichage est nécessaire, mets à jour le composant HTML/TS qui consomme `target.activityDetail` ou `DisplayFlags.isActivity`.

---

## Exemples de tests (Jasmine)

Ajoute un cas minimal dans `item-display-dispatcher.service.spec.ts` :

```ts
it('should populate activityDetail when item is activity', () => {
  const item = [
    { claims: { P2: { activity: true }, P267: [{ foo: 'bar' }] } },
    ['P2', 'P267']
  ];
  const target: any = {};
  const flags = service.dispatch(item, target);
  expect(flags.isActivity).toBeTrue();
  expect(Array.isArray(target.activityDetail)).toBeTrue();
  expect(target.activityDetail.length).toBeGreaterThan(0);
  expect(item[1].includes('P267')).toBeFalse();
});
```

---

## Bonnes pratiques

- Place la détection métier dans `ClaimsEnricherService` (single-responsibility). Le dispatcher doit simplement consommer les marqueurs et orchestrer les affichages.
- Préfère modifier les listes dans `dispatcher.config.ts` et laisser `BlockDisplayService` gérer la mécanique d'extraction depuis `item`.
- Tests-first : commence par écrire un spec qui décrit le comportement attendu, puis code la fonctionnalité.

---

Si tu veux, je peux :
- implémenter un exemple complet (ajouter un Q-id dans `ClaimsEnricherService`, ajouter la propriété dans `dispatcher.config.ts` et écrire le test), et pousser le tout dans une PR draft.
- ou améliorer la doc en l'intégrant dans le README principal ou en ajoutant un diagramme simple.

Dis‑moi quelle option tu préfères, je m’en occupe. ✅
