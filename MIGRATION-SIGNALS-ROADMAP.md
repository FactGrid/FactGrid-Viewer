# Migration Angular 21 Signals & Optimisations — Roadmap FactGrid-Viewer

**Date :** 10 décembre 2025  
**Branche :** `upgrade/angular-21`  
**État actuel :** Angular 21 opérationnel, 258 tests passent (Vitest)

---

## 📊 État des lieux technique

### ✅ Points forts acquis
- Angular 21.0.3 avec standalone components
- 258 tests unitaires passants (migration Karma → Vitest complétée)
- OnPush activé sur 4 composants stratégiques
- Lazy loading prévu pour `SparqlDisplayComponent` et `ItemInfoComponent`
- Architecture services/components/pipes claire et documentée

### 🔴 Points critiques à corriger

#### 1. **Absence totale de Signals** (priorité CRITIQUE)
- ❌ Aucun `signal()`, `computed()`, `effect()`, `toSignal()` dans le code
- ❌ 50+ `BehaviorSubject`/`Observable` utilisés pour état local
- ❌ 20+ `.subscribe()` manuels dans `display.component.ts` seul
- ❌ Pattern `Subscription[]` + `ngOnDestroy` partout (risque memory leaks)

**Impact performance estimé :** -40% vs adoption Signals optimale

#### 2. **Change Detection non optimisée** (priorité HAUTE)
- ⚠️ 80% des composants en mode `Default` (change detection à chaque cycle)
- ✅ Seulement 4/30+ composants avec `OnPush`

**Impact :** cycles CD inutiles, re-renders excessifs

#### 3. **Typage faible** (priorité MOYENNE)
- ❌ 50+ occurrences de `any` (display.component.ts lignes 123-179)
- ⚠️ Perte IntelliSense, erreurs runtime non détectées

#### 4. **Gestion RxJS obsolète** (priorité HAUTE)
- ❌ Subscriptions manuelles au lieu de `async pipe` ou `toSignal`
- ⚠️ 2 mentions `async pipe` seulement dans tout le projet
- ❌ Pattern `takeUntil` utilisé mais pas systématique

---

## 🎯 Plan de migration (4 phases — 4 semaines)

### **Phase 1 — Semaine 1 : SearchComponent (composant pilote)**

**Objectif :** Convertir le composant le plus critique en Signals + OnPush

**Fichier cible :** `src/app/search/search.component.ts`

**Actions concrètes :**

```typescript
// AVANT (lignes 157-197)
private researchFields$ = new BehaviorSubject<ResearchField[]>([]);
filteredResearchFields$: Observable<ResearchField[]>;
private items$ = new BehaviorSubject<EnrichedWikibaseEntity[]>([]);
filteredItems$: Observable<EnrichedWikibaseEntity[]>;
overlayOpen$: Observable<boolean>;
historyOverlayOpen$ = new BehaviorSubject<boolean>(false);
showInDescriptionSubject = new BehaviorSubject<boolean>(false);
private subscriptions: Subscription[] = [];

ngOnInit() {
  const sub = this.searchInput.valueChanges.subscribe(val => { /* logic */ });
  this.subscriptions.push(sub);
}

ngOnDestroy() {
  this.subscriptions.forEach(sub => sub.unsubscribe());
}

// APRÈS (Signals + computed)
import { signal, computed, effect, toSignal } from '@angular/core';

// État local en signals
readonly researchFields = signal<ResearchField[]>([]);
readonly items = signal<EnrichedWikibaseEntity[]>([]);
readonly historyOverlayOpen = signal(false);
readonly showInDescription = signal(false);

// Interop RxJS → Signal
readonly searchValue = toSignal(this.searchInput.valueChanges, { initialValue: '' });
readonly selectedProject = toSignal(this.selectedResearchField.selectedResearchField$);

// Computed dérivés
readonly filteredResearchFields = computed(() => 
  this.researchFields().filter(field => 
    this.matchesFilter(field, this.searchValue())
  )
);

readonly filteredItems = computed(() =>
  this.items().filter(item => 
    this.matchesAllTokens(item, this.buildTokens(this.searchValue()))
  )
);

readonly overlayOpen = computed(() => 
  this.filteredItems().length > 0 && this.searchValue().trim().length > 0
);

// Plus besoin de ngOnDestroy / subscriptions !
// Effect pour side-effects (localStorage, etc.)
private saveHistoryEffect = effect(() => {
  const estimate = this.overlayAttachLatencyEstimateMs;
  localStorage.setItem(this.OVERLAY_ESTIMATE_KEY, String(estimate));
});
```

**Tests à adapter :**
- `search.component.spec.ts` : remplacer `items$.next()` par `items.set()`
- Vérifier `overlayOpen()` au lieu de `overlayOpen$ | async`

**Critères de succès :**
- ✅ 37 tests de SearchComponent passent
- ✅ Performance : render time < 16ms (60fps)
- ✅ Memory leaks : 0 subscriptions actives après ngOnDestroy

---

### **Phase 2 — Semaine 2 : DisplayComponent + typage strict**

**Fichier cible :** `src/app/display/display.component.ts`

**Actions concrètes :**

#### A. Éliminer les `any` (lignes 123-179)

```typescript
// AVANT
item: any[] | ItemDisplayTuple | null = null;
claims: any;
main: any;
career: any;
sociability: any;
training: any;
other: any;
linkedItems: any[];
sources: any;

// APRÈS - créer src/app/models/display-data.model.ts
export interface DisplayClaims {
  [propertyId: string]: ClaimValue[];
}

export interface MainDisplayData {
  id: string;
  label: string;
  description?: string;
  image?: string;
  // ... autres propriétés typées
}

export interface LinkedItem {
  id: string;
  label: string;
  type?: string;
}

// Puis dans display.component.ts
item: WikibaseEntity[] | ItemDisplayTuple | null = null;
claims: DisplayClaims | null = null;
main: MainDisplayData | null = null;
career: CareerData | null = null;
sociability: SociabilityData | null = null;
training: TrainingData | null = null;
other: OtherData | null = null;
linkedItems: LinkedItem[] = [];
sources: SourceData[] = [];
```

#### B. Convertir subscriptions en signals

```typescript
// AVANT (lignes 337-388)
subscription0: Subscription;
subscription2: Subscription;
subscription3: Subscription;

ngOnInit() {
  this.subscription0 = this.route.paramMap.subscribe(params => {
    this.itemId = params.get('id') || '';
    this.loadItem();
  });
  
  this.selectedResearchFieldService.selectedResearchField$.subscribe(field => {
    this.currentProject = field;
  });
}

ngOnDestroy() {
  this.subscription0?.unsubscribe();
  this.subscription2?.unsubscribe();
  this.subscription3?.unsubscribe();
}

// APRÈS
readonly itemId = toSignal(
  this.route.paramMap.pipe(map(p => p.get('id') || '')),
  { initialValue: '' }
);

readonly currentProject = toSignal(
  this.selectedResearchFieldService.selectedResearchField$
);

// Effect pour déclencher chargement quand itemId change
private loadItemEffect = effect(() => {
  const id = this.itemId();
  if (id) {
    this.loadItem(id);
  }
});

// Plus de ngOnDestroy nécessaire !
```

**Tests à créer :**
- Test unitaire : vérifier que `itemId()` change quand route change
- Test unitaire : vérifier que `loadItemEffect` est appelé
- Test e2e : navigation entre items fonctionne

---

### **Phase 3 — Semaine 3 : Services partagés + async pipe**

**Fichiers cibles :**
- `src/app/services/selected-research-field.service.ts`
- `src/app/services/selected-item-list.service.ts`
- Tous les templates avec `.subscribe()`

#### A. Convertir services en signals

```typescript
// AVANT - selected-research-field.service.ts
@Injectable({ providedIn: 'root' })
export class SelectedResearchFieldService {
  private selectedResearchFieldSubject = new BehaviorSubject<ResearchField>(defaultField);
  selectedResearchField$ = this.selectedResearchFieldSubject.asObservable();
  
  setSelectedResearchField(field: ResearchField) {
    this.selectedResearchFieldSubject.next(field);
  }
  
  getSelectedResearchField(): ResearchField {
    return this.selectedResearchFieldSubject.getValue();
  }
}

// APRÈS
@Injectable({ providedIn: 'root' })
export class SelectedResearchFieldService {
  // Signal writable pour état interne
  private readonly _selectedResearchField = signal<ResearchField>(defaultField);
  
  // Signal readonly exposé publiquement
  readonly selectedResearchField = this._selectedResearchField.asReadonly();
  
  // Observable pour rétro-compatibilité (à supprimer progressivement)
  readonly selectedResearchField$ = toObservable(this.selectedResearchField);
  
  setSelectedResearchField(field: ResearchField) {
    this._selectedResearchField.set(field);
  }
  
  getSelectedResearchField(): ResearchField {
    return this._selectedResearchField();
  }
}
```

#### B. Remplacer .subscribe() par async pipe dans templates

```html
<!-- AVANT -->
<!-- display.component.ts -->
sparqlCards: SparqlTuple[] = [];
ngOnInit() {
  this.sparqlCards$.subscribe(cards => {
    this.sparqlCards = cards;
    this.cdr.markForCheck();
  });
}

<!-- display.component.html -->
<div *ngFor="let card of sparqlCards">...</div>

<!-- APRÈS -->
<!-- display.component.ts -->
readonly sparqlCards$ = this.sparqlDisplayService.getSparqlCards(this.item);

<!-- display.component.html -->
<div *ngIf="sparqlCards$ | async as cards">
  <div *ngFor="let card of cards">...</div>
</div>

<!-- OU MIEUX avec signals -->
readonly sparqlCards = toSignal(
  this.sparqlDisplayService.getSparqlCards(this.item),
  { initialValue: [] }
);

<!-- Template -->
<div *ngFor="let card of sparqlCards()">...</div>
```

**Migration systématique :**
1. Identifier tous les `.subscribe()` : `git grep "\.subscribe(" src/app/**/*.ts`
2. Pour chaque occurrence :
   - Si état local → signal + `toSignal`
   - Si affichage direct → `async pipe`
   - Si side-effect → `effect()`

---

### **Phase 4 — Semaine 4 : OnPush généralisé + optimisation bundle**

#### A. Activer OnPush sur tous les composants

**Script de migration automatique :**

```bash
# Trouver tous les composants sans OnPush
git grep -L "ChangeDetectionStrategy.OnPush" src/app/**/*.component.ts

# Pour chaque fichier, ajouter :
# 1. Import
import { ChangeDetectionStrategy } from '@angular/core';

# 2. Dans @Component decorator
changeDetection: ChangeDetectionStrategy.OnPush,
```

**Composants prioritaires :**
1. `advanced-search.component.ts`
2. `paris-search.component.ts`
3. `thematic-card.component.ts`
4. `generic-list-display.component.ts`
5. Tous les composants de `display/` non encore convertis

**Checklist par composant :**
- ✅ `changeDetection: OnPush` ajouté
- ✅ Tous les `@Input()` sont immutables ou signals
- ✅ `markForCheck()` appelé uniquement si mutation externe
- ✅ Tests passent (pas de régression affichage)

#### B. Lazy loading des routes

```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: '',
    component: DisplayComponent, // Garder en eager (landing page)
  },
  {
    path: 'advanced-search',
    loadComponent: () => import('./search/advanced-search/advanced-search.component')
      .then(m => m.AdvancedSearchComponent),
  },
  {
    path: 'paris-search',
    loadComponent: () => import('./paris-search/paris-search.component')
      .then(m => m.ParisSearchComponent),
  },
  // ... autres routes lazy
];
```

#### C. Optimiser imports Material

```typescript
// AVANT (mauvais pattern)
import * as Material from '@angular/material';

// APRÈS (tree-shakable)
// Créer src/app/shared/material.module.ts
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
// ... seulement les modules utilisés

export const MATERIAL_MODULES = [
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  // ...
] as const;
```

#### D. Analyser et réduire bundle

```bash
# Build avec stats
npm run build -- --stats-json

# Analyser
npx webpack-bundle-analyzer dist/factgrid/stats.json

# Objectifs budgets :
# - Initial bundle : < 1.5 MB (actuellement warning à 2 MB)
# - Component styles : < 50 KB (actuellement warning à 60 KB)
```

**Actions selon analyse :**
1. Lazy load routes non-critiques
2. Déplacer Material prebuilt theme en CDN (si applicable)
3. Tree-shake Leaflet (importer seulement modules nécessaires)
4. Vérifier polyfills (moment, leaflet dans `allowedCommonJsDependencies`)

---

## 🧪 Stratégie de tests

### Tests à créer/adapter par phase

**Phase 1 (SearchComponent) :**
```typescript
// search.component.spec.ts
it('should update filteredItems when search value changes (signals)', () => {
  component.items.set([
    { id: 'Q1', label: 'Test', description: '' },
    { id: 'Q2', label: 'Other', description: '' },
  ]);
  component.searchInput.setValue('Test');
  
  expect(component.filteredItems()).toEqual([
    { id: 'Q1', label: 'Test', description: '' },
  ]);
});

it('should toggle overlay when items match (computed)', () => {
  component.items.set([{ id: 'Q1', label: 'Test', description: '' }]);
  component.searchInput.setValue('Test');
  
  expect(component.overlayOpen()).toBe(true);
  
  component.searchInput.setValue('');
  expect(component.overlayOpen()).toBe(false);
});
```

**Phase 2 (DisplayComponent) :**
```typescript
// display.component.spec.ts
it('should load item when itemId signal changes', fakeAsync(() => {
  const loadSpy = vi.spyOn(component as any, 'loadItem');
  
  // Simuler changement de route
  routerMock.paramMap.next({ id: 'Q123' });
  tick(100);
  
  expect(component.itemId()).toBe('Q123');
  expect(loadSpy).toHaveBeenCalledWith('Q123');
}));

it('should type check claims correctly', () => {
  component.claims = { P31: [{ value: 'Q5' }] };
  
  // Doit compiler (typage strict)
  const instanceOf = component.claims['P31'];
  expect(instanceOf).toBeDefined();
});
```

**Phase 3 (Services) :**
```typescript
// selected-research-field.service.spec.ts
it('should update signal when setSelectedResearchField is called', () => {
  const field: ResearchField = { id: 'Q10', name: 'Test' };
  
  service.setSelectedResearchField(field);
  
  expect(service.selectedResearchField()).toEqual(field);
  expect(service.getSelectedResearchField()).toEqual(field);
});

it('should emit to observable for backwards compatibility', (done) => {
  const field: ResearchField = { id: 'Q20', name: 'Compat' };
  
  service.selectedResearchField$.subscribe(f => {
    expect(f).toEqual(field);
    done();
  });
  
  service.setSelectedResearchField(field);
});
```

**Phase 4 (OnPush) :**
```typescript
// Tous les tests de composants OnPush
beforeEach(() => {
  // Forcer detectChanges() après chaque modification
  fixture.detectChanges();
});

it('should render updated input with OnPush', () => {
  component.title = signal('New Title');
  fixture.detectChanges(); // CRUCIAL avec OnPush
  
  const title = fixture.nativeElement.querySelector('h1');
  expect(title.textContent).toContain('New Title');
});
```

### Critères de succès globaux

**Performance :**
- ✅ Render time < 16ms (60fps) sur composants critiques
- ✅ Memory leaks : 0 subscriptions actives après destroy
- ✅ Bundle initial < 1.5 MB (vs 2 MB actuel)
- ✅ Time to Interactive < 3s (Lighthouse)

**Tests :**
- ✅ 258 tests passent (minimum maintenu)
- ✅ +50 tests ajoutés pour couvrir signals
- ✅ Coverage > 80% sur composants critiques

**Code Quality :**
- ✅ 0 `any` dans display.component.ts
- ✅ 0 `.subscribe()` manuel sauf cas justifiés (side-effects réseau)
- ✅ 100% composants avec `OnPush`
- ✅ 0 warning ESLint sur typage

---

## 📚 Ressources & références

### Documentation Angular 21 Signals
- [Angular Signals Guide](https://angular.io/guide/signals)
- [Signal inputs](https://angular.io/guide/signal-inputs)
- [Signal queries](https://angular.io/guide/signal-queries)
- [RxJS interop (toSignal/toObservable)](https://angular.io/guide/rxjs-interop)

### Patterns recommandés
```typescript
// 1. État local → signal
readonly count = signal(0);

// 2. État dérivé → computed
readonly double = computed(() => this.count() * 2);

// 3. Side-effect → effect
private logEffect = effect(() => {
  console.log('Count changed:', this.count());
});

// 4. Interop Observable → toSignal
readonly data = toSignal(this.http.get('/api/data'), { initialValue: [] });

// 5. Interop Signal → toObservable (rétro-compatibilité)
readonly data$ = toObservable(this.dataSignal);
```

### Outils de migration
```bash
# Trouver BehaviorSubjects à convertir
git grep "BehaviorSubject" src/app/**/*.ts

# Trouver .subscribe() manuels
git grep "\.subscribe(" src/app/**/*.ts | grep -v "spec.ts"

# Trouver composants sans OnPush
git grep -L "ChangeDetectionStrategy.OnPush" src/app/**/*.component.ts

# Vérifier utilisation any
git grep ": any" src/app/**/*.ts | wc -l
```

### Checklist de validation par PR

**Avant merge :**
- [ ] Tests passent (`npm run test`)
- [ ] Lint OK (`npm run lint`)
- [ ] Build OK (`npm run build`)
- [ ] Pas de régression visuelle (test manuel)
- [ ] Performance équivalente ou meilleure (DevTools)
- [ ] Memory profiling OK (pas de leaks)

**Code review :**
- [ ] Pas de `any` ajouté
- [ ] Signals utilisés correctement (pas de mutation directe)
- [ ] `OnPush` compatible (inputs immutables)
- [ ] Tests couvrent les nouveaux signals/computed

---

## 🚨 Pièges courants à éviter

### 1. Mutation directe de signals
```typescript
// ❌ MAUVAIS
readonly items = signal<Item[]>([]);
addItem(item: Item) {
  this.items().push(item); // Mutation ! Ne déclenche pas update
}

// ✅ BON
addItem(item: Item) {
  this.items.update(current => [...current, item]);
}
```

### 2. Effect avec dépendances cachées
```typescript
// ❌ MAUVAIS
private myEffect = effect(() => {
  // Lit this.count() mais modifie aussi un signal
  // → risque de boucle infinie
  if (this.count() > 10) {
    this.otherSignal.set(0); // Danger !
  }
});

// ✅ BON
private myEffect = effect(() => {
  const count = this.count();
  // Utiliser untracked() pour mutations
  untracked(() => {
    if (count > 10) {
      this.otherSignal.set(0);
    }
  });
});
```

### 3. OnPush sans immutabilité
```typescript
// ❌ MAUVAIS
@Input() items: Item[] = [];

addItem(item: Item) {
  this.items.push(item); // Mutation → OnPush ne détecte pas
}

// ✅ BON (signal input Angular 21)
readonly items = input<Item[]>([]);

// Ou Input classique immutable
@Input() set items(value: Item[]) {
  this._items = [...value]; // Copie immutable
}
```

### 4. Memory leak avec effect
```typescript
// ❌ MAUVAIS
private myEffect = effect(() => {
  // Effect non nettoyé si composant détruit
  this.http.get('/api/data').subscribe(data => {
    this.data.set(data);
  });
});

// ✅ BON
readonly data = toSignal(this.http.get('/api/data'));

// Ou si vraiment besoin d'effect
private readonly destroyRef = inject(DestroyRef);

constructor() {
  effect((onCleanup) => {
    const sub = this.http.get('/api/data').subscribe(/* ... */);
    onCleanup(() => sub.unsubscribe());
  });
}
```

---

## 📊 Métriques de suivi

### KPIs à mesurer avant/après migration

| Métrique | Avant (baseline) | Objectif | Phase |
|----------|-----------------|----------|-------|
| **Bundle initial** | 2.0 MB | < 1.5 MB | Phase 4 |
| **Time to Interactive** | ~4s | < 3s | Phase 4 |
| **Render time (SearchComponent)** | ~25ms | < 16ms | Phase 1 |
| **Memory leaks** | ~5 subscriptions actives | 0 | Phase 1-3 |
| **Tests passing** | 258 | ≥ 308 (+50) | Toutes |
| **TypeScript `any`** | ~50 | < 10 | Phase 2 |
| **OnPush components** | 4/30+ | 30/30 | Phase 4 |
| **Manual `.subscribe()`** | ~40+ | < 10 | Phase 3 |

### Commandes de mesure

```bash
# Bundle size
npm run build -- --configuration production
du -sh dist/factgrid/*.js

# Performance (Lighthouse)
npm run build
npx http-server dist/factgrid -p 4200
npx lighthouse http://localhost:4200 --view

# Memory profiling
# → Chrome DevTools Memory Profiler
# → Heap snapshot avant/après navigation

# Test coverage
npx vitest run --coverage
```

---

## 🔄 Rétro-compatibilité & rollback

### Stratégie de déploiement progressif

**Approche feature-flag (optionnelle) :**
```typescript
// environment.ts
export const environment = {
  useSignals: true, // Toggle pour rollback rapide
};

// component.ts
readonly items = environment.useSignals 
  ? signal<Item[]>([])
  : new BehaviorSubject<Item[]>([]);
```

**Branches Git :**
```bash
# Développement
git checkout -b feature/signals-phase-1
git checkout -b feature/signals-phase-2
git checkout -b feature/signals-phase-3
git checkout -b feature/signals-phase-4

# Merge progressif dans main
git checkout upgrade/angular-21
git merge feature/signals-phase-1
# Test, validation, puis phase suivante
```

**Plan de rollback :**
1. Si tests échouent → revert commit + analyser
2. Si régression prod → feature-flag OFF + hotfix
3. Si performance dégradée → rollback phase concernée

---

## ✅ Checklist finale (Phase 4 complétée)

- [ ] **SearchComponent** : 100% signals, OnPush, 37 tests OK
- [ ] **DisplayComponent** : Typé strict (0 `any`), signals, OnPush
- [ ] **Services partagés** : Signals exposés, Observable rétro-compatible
- [ ] **Templates** : async pipe partout, 0 `.subscribe()` manuel inutile
- [ ] **Tous composants** : OnPush activé, tests adaptés
- [ ] **Bundle** : < 1.5 MB initial, lazy loading routes
- [ ] **Tests** : 308+ passants, coverage > 80%
- [ ] **Performance** : < 16ms render, < 3s TTI
- [ ] **Memory** : 0 leaks, profiler OK
- [ ] **Documentation** : README + COPILOT_CUSTOM_INSTRUCTION mis à jour

---

## 📝 Notes pour les agents AI

### Prompts recommandés pour chaque phase

**Phase 1 :**
```
"Convertis SearchComponent en signals Angular 21 : remplace BehaviorSubject par signal(), 
crée computed() pour filteredItems, utilise toSignal() pour searchInput.valueChanges. 
Fournis le diff complet + tests unitaires adaptés."
```

**Phase 2 :**
```
"Élimine tous les `any` de display.component.ts (lignes 123-179). Crée les interfaces 
TypeScript dans models/display-data.model.ts. Fournis le diff + validation TypeScript stricte."
```

**Phase 3 :**
```
"Convertis SelectedResearchFieldService en signal() avec asReadonly() exposé publiquement 
et toObservable() pour rétro-compatibilité. Adapte les composants consommateurs pour 
utiliser le signal. Tests de migration inclus."
```

**Phase 4 :**
```
"Active OnPush sur tous les composants de src/app/display/. Vérifie immutabilité des inputs, 
ajoute markForCheck() si nécessaire. Fournis script de migration batch + checklist de validation."
```

### Contexte à fournir aux agents

**Toujours inclure :**
1. Fichier(s) source complet(s)
2. Tests existants à adapter
3. Version Angular (21.0.3) et dépendances
4. Contraintes (rétro-compatibilité, performance)

**Exemple de prompt optimal :**
```
Contexte : Angular 21.0.3, projet FactGrid-Viewer, 258 tests Vitest passants.
Fichier : src/app/search/search.component.ts (lignes 150-350 attachées).
Objectif : Migrer les 5 BehaviorSubject en signals + computed, conserver OnPush existant.
Contraintes : Tests doivent passer sans modification majeure, rétro-compatibilité services.
Livrable : Diff minimal + 3 tests unitaires couvrant signals.
```

---

**Dernière mise à jour :** 10 décembre 2025  
**Auteur :** Migration roadmap générée par analyse automatisée  
**Maintenance :** Mettre à jour après chaque phase complétée
