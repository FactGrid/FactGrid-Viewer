# FactGrid-Viewer: Comprehensive Project Architecture

## Executive Summary

FactGrid-Viewer is a sophisticated Angular 21-based web application designed to browse and explore the FactGrid knowledge base (a Wikibase instance). The application provides an intuitive interface for searching, displaying, and navigating historical and genealogical data with advanced features including SPARQL queries, map visualization, multilingual support, and project-scoped searches.

---

## 1. Technical Architecture

### 1.1 Technology Stack

**Frontend Framework:**
- **Angular 21** (latest version with standalone components)
- **Angular Material 21** for UI components
- **TypeScript 5.9+** for type-safe development
- **RxJS** for reactive programming patterns
- **Angular CDK** for advanced UI patterns (overlays, layouts)

**Key Libraries:**
- **Leaflet** for map visualization
- **file-saver** for CSV/data downloads
- **Zone.js** for change detection

**Testing & Quality:**
- **Vitest 4.x** for unit testing (migrated from Karma/Jasmine)
- **Happy-DOM** for DOM simulation
- **ESLint + Prettier** for code quality
- **Compodoc** for documentation generation

**Build & Development:**
- **Angular CLI 21** with Vite-based build system
- **Node.js 18+ LTS** required
- **Standalone Components** architecture (no NgModules)

### 1.2 Project Structure

```
src/app/
├── display/                    # Main item display component & subsystems
│   ├── display.component.ts    # Primary view component (1307 lines)
│   ├── item-info/             # Info card component
│   ├── generic-list-display/  # Reusable list renderer
│   ├── sparql-display/        # SPARQL results visualization
│   ├── text-display/          # Text content display
│   ├── iframes-display/       # Embedded iframe viewer
│   ├── thematic-card/         # Themed content cards
│   ├── map/                   # Leaflet map integration
│   └── services/              # Display-specific services (19+ services)
│
├── search/                    # Search system
│   ├── search.component.ts    # Main search (1803 lines)
│   ├── advanced-search/       # Advanced query builder
│   └── services/              # Search-specific services
│
├── services/                  # Core application services (40+ services)
│   ├── request.service.ts     # API communication layer
│   ├── item-sparql.service.ts # SPARQL query generation
│   ├── search-cache.service.ts # Search result caching
│   ├── autocomplete-index.service.ts # Fast local search
│   ├── projects-list.service.ts # Project management
│   └── sparql/                # SPARQL-specific utilities
│
├── config/                    # Configuration files
│   ├── dispatcher.config.ts   # Display routing rules
│   ├── map.config.ts          # Map zoom/location configs
│   └── search.config.ts       # Search thresholds
│
├── models/                    # TypeScript interfaces
├── utils/                     # Utility functions
└── interfaces/                # Shared type definitions
```

---

## 2. Data Flow Architecture

### 2.1 Application Bootstrap Flow

```
1. User lands on app
   ↓
2. AppComponent initializes
   ↓
3. Router resolves route (home vs /item/:id)
   ↓
4. DisplayComponent or SearchComponent loads
   ↓
5. Services inject dependencies
   ↓
6. Language/Project preferences load from localStorage
   ↓
7. UI renders with reactive signals
```

### 2.2 Item Display Flow (Primary Use Case)

```
USER ACTION: Navigate to /item/Q12345
   ↓
[DisplayComponent Constructor]
   ├─→ Route params → toSignal() → itemIdSignal
   ├─→ effect() watches itemIdSignal changes
   └─→ triggers loadItem()
   
[loadItem() Effect]
   ↓
CreateCompleteItemService.completeItem(id, lang)
   ├─→ RequestService.getItem() → FactGrid API
   ├─→ ItemSparqlService.itemSparql() → SPARQL queries
   ├─→ ClaimsEnricherService.enrich() → Detect item type (person/place/org)
   └─→ ItemDisplayDispatcherService.dispatch() → Build display structure
   
[Display Structure Built]
   ├─→ target.mainList (primary properties)
   ├─→ target.lifeAndFamily (for persons)
   ├─→ target.placeDetail (for locations)
   ├─→ target.activityDetail (for activities)
   ├─→ target.infoList (header properties)
   └─→ DisplayFlags (isAddress, isPerson, isOrg, etc.)
   
[Component Renders]
   ├─→ ItemInfoComponent (header with picture/title)
   ├─→ GenericListDisplayComponent (property lists)
   ├─→ SparqlDisplayComponent (dynamic SPARQL cards)
   ├─→ MapComponent (if coordinates present)
   └─→ ThematicCardComponent (related items)
```

### 2.3 Search Flow

```
USER TYPES: "Paris, rue Saint-Jacques, n° 35"
   ↓
[SearchComponent]
   ├─→ searchInput FormControl detects change
   ├─→ debounceTime(200ms) waits for user to stop typing
   └─→ switchMap to fetchAutocompleteEntities()
   
[fetchAutocompleteEntities()]
   ├─→ Check if input is QID (Q123) → direct fetch
   ├─→ normalizeSearchTerm (preserves n°, removes punctuation)
   ├─→ Check SearchCacheService for cached results
   └─→ If not cached:
       ├─→ PROJECT MODE: CirrusSearch with P131 filter
       └─→ HYBRID MODE: wbsearchentities → fallback to CirrusSearch
       
[Results Processing]
   ├─→ fetchEntities(ids) → batch wbgetentities calls (50 per batch)
   ├─→ Client-side token filtering (matchesAllTokens)
   ├─→ Phrase-priority sorting (exact matches first)
   └─→ Cache results → SearchCacheService
   
[UI Updates]
   ├─→ items$ Observable emits → filteredItems$ computed
   ├─→ CDK Overlay renders search panel
   └─→ User clicks item → navigate to /item/:id
```

### 2.4 SPARQL Integration Flow

```
[Item Loaded with P2 Instance Type]
   ↓
[ItemSparqlService.itemSparql()]
   ├─→ batchAskQuery() → Test item types (Q7=person, Q8=place, Q12=org)
   ├─→ sparql0$ → Superclass relationships
   ├─→ sparql1$ → Organization affiliations
   ├─→ sparql2$ → Query specific properties
   ├─→ sparql3$ → Address/location data
   └─→ sparql4$ → Related buildings/works
   
[SparqlDisplayService.buildAllCardsState()]
   ├─→ Transforms raw SPARQL results → UI-ready cards
   ├─→ Generates titles (localized)
   ├─→ Handles list ordering/filtering
   └─→ Returns SparqlAllCardsState Observable
   
[DisplayComponent loads SparqlDisplayComponent]
   ├─→ Dynamic import (lazy loading)
   ├─→ ViewContainerRef creates component instances (5 slots)
   ├─→ Passes sparqlData + config to each card
   └─→ Cards render with Angular Material styling
```

### 2.5 Project-Scoped Search Flow

```
[User Selects Project: "Paris to Download" (Q314208)]
   ↓
SelectedResearchFieldService.setSelectedResearchField(project)
   ↓
[SearchComponent watches selectedResearchField$ via signals]
   ├─→ projectNameSignal updates
   └─→ UI shows project badge
   
[Search Query: "rue Saint-Jacques"]
   ↓
buildSearchFilters(projectId, searchTerm)
   ├─→ haswbstatement:P131=Q314208 (scopes to project)
   ├─→ Tokenizes: +rue* +saint* +jacques*
   └─→ Combines into CirrusSearch query
   
RequestService.getQidsList(srsearch, limit)
   ├─→ FactGrid API: action=query&list=search
   ├─→ Returns Page: prefixed titles
   └─→ Extract QIDs → fetchEntities()
   
[Results Only Show Items in Selected Project]
```

---

## 3. Key Features & Components

### 3.1 Advanced Search System

**Capabilities:**
- **Hybrid Search Strategy**: Combines MediaWiki wbsearchentities API with CirrusSearch for optimal results
- **French Address Support**: Preserves special characters like `n°` for accurate French address matching
- **Project-Scoped Queries**: Filter results by research projects using P131 property statements
- **Client-Side Token Filtering**: Multi-word queries require all tokens to be present
- **Phrase-Priority Ranking**: Exact phrase matches appear before token-based matches
- **QID Direct Access**: Detect and immediately resolve Q123, Item:Q123, wd:Q123 formats
- **Autocomplete Index**: Local JSON index (37KB) for instant suggestions without network calls
- **Result Caching**: SearchCacheService caches entity details and search results (TTL: 2min)
- **Relevance Expansion**: Automatically expands project searches with related items via P248 property

**Search Components:**
- `search.component.ts` (1803 lines) - Main search orchestrator
- `advanced-search/` - Complex query builder with property/statement filters
- `autocomplete-index.service.ts` - Prefix-based local search
- `search-cache.service.ts` - LRU cache with TTL and prefix matching

### 3.2 Item Display System

**Display Dispatcher Architecture:**

The `ItemDisplayDispatcherService` is the brain of the display system. It analyzes an item's claims and instance types (P2) to determine optimal display layout:

```typescript
// Simplified flow:
dispatch(item, target): DisplayFlags {
  enrich(item)  // Add P2.person, P2.place, P2.org flags
  
  if (P2.person) {
    processLifeAndFamily()
    processCareer()
    processEducation()
    processSociability()
  }
  
  if (P2.place) {
    processPlace()
    processCoordinates()
  }
  
  if (P2.org) {
    processOrganization()
  }
  
  if (P2.activity) {
    processActivity()
  }
  
  processInfo()        // Header properties
  processDocument()    // P58, P59 document claims
  processSources()     // P236, P320 external links
  buildMainList()      // Remaining uncategorized properties
  
  return {
    isPerson, isOrg, isPlace, isActivity, isAddress,
    isDocument, isSource, isExternal, isInfo, isOther
  }
}
```

**Display Features:**
- **Type-Specific Cards**: Different layouts for persons, places, organizations, documents
- **Lazy-Loaded Components**: SparqlDisplayComponent and ItemInfoComponent load on-demand
- **Responsive Design**: Mobile vs desktop layouts using Angular CDK BreakpointObserver
- **Address On-Demand**: Fetches reverse geocoding data for addresses when requested
- **Image Gallery**: Commons image integration with caption fetching and lightbox view
- **Map Visualization**: Leaflet maps with dynamic zoom based on P2 instance type (Q16200=address → zoom 18)
- **Transcription Display**: Fetches and cleans transcriptions from P251 properties
- **Linked Pages**: Thematic cards showing related items and navigation history

**Display Components:**
- `display.component.ts` (1307 lines) - Main orchestrator with Angular signals/effects
- `item-info/` - Header card with title, subtitle, image, and badges
- `generic-list-display/` - Reusable property list renderer with qualifiers support
- `sparql-display/` - Dynamic SPARQL result cards (5 configurable slots)
- `map/` - Leaflet integration with P625 coordinate display
- `text-display/` - Long-form text content renderer
- `iframes-display/` - Embedded content viewer with viewport adjustments

### 3.3 SPARQL Integration

**ItemSparqlService Architecture:**

The service generates up to 5 SPARQL queries per item based on instance type detection:

```typescript
itemSparql(item, lang): Observable<SparqlTuple[]> {
  return forkJoin({
    tests: batchAskQuery([
      'Q7Test',      // Is person?
      'Q8Test',      // Is place?
      'Q12Test',     // Is organization?
      'isAddress'    // Has P48 (located on street)?
    ])
  }).pipe(
    switchMap(tests => {
      const queries = [];
      
      if (tests.Q7Test) queries.push(sparql0$); // Superclasses
      if (tests.Q12Test) queries.push(sparql1$); // Organizations
      // Always add sparql2$
      queries.push(sparql2$);
      
      if (tests.isAddress) {
        queries.push(sparql3$); // Current address with geocoding
      }
      
      queries.push(sparql4$); // Buildings/works
      
      return forkJoin(queries);
    })
  );
}
```

**SPARQL Strategies:**
- `ItemTypeResolverService` registers strategies with predicates and priorities
- Strategies determine which queries to execute based on item type
- Results are transformed into UI-ready tuples with localized labels
- Caching prevents redundant SPARQL endpoint calls

**SPARQL Features:**
- **Batch ASK Queries**: Single request tests multiple conditions
- **Query Builder**: `SparqlQueryBuilderService` provides fluent API
- **Reverse Geocoding**: Nominatim integration for address display_name
- **Template System**: SPARQL templates with placeholder replacement
- **Pagination Support**: Handles large result sets with RxJS expand()
- **Error Resilience**: Retry logic with exponential backoff

### 3.4 Multilingual Support

**Language System:**

```typescript
SelectedLangService
  ├─→ selectedLang$ (Observable<'en'|'fr'|'de'>)
  ├─→ getTranslation(key, lang) → Localized UI strings
  └─→ localStorage persistence ('userSelectedLang')

SetLanguageService
  ├─→ item(entity, lang) → Extracts label/desc in preferred language
  ├─→ Fallback chain: userLang → 'en' → 'de' → 'fr' → first available
  └─→ External link generation for P236 external IDs
```

**Localization Features:**
- **Dynamic UI Translations**: All interface text localized (English, French, German)
- **Entity Label Fallbacks**: Smart fallback when preferred language unavailable
- **Project Caching**: ProjectsListService caches project names in all languages
- **SPARQL Label Resolution**: Queries request labels in user's language with fallback

### 3.5 Performance Optimizations

**Bundle Optimization:**
- **Lazy Loading**: SparqlDisplayComponent, ItemInfoComponent loaded on-demand
- **Tree Shaking**: Standalone components enable aggressive tree-shaking
- **Code Splitting**: Route-based chunks separate home/display/search
- **Material Icons**: Only imported icons are bundled

**Caching Layers:**
- **SearchCacheService**: LRU cache (100 entries, 2min TTL) for search results
- **Entity Cache**: Per-entity caching in fetchEntities() to avoid duplicate API calls
- **Project Cache**: Research fields cached per language to avoid refetching
- **Commons Metadata Cache**: In-memory Map for image metadata
- **SPARQL Result Cache**: DisplayComponentLoaderService caches loaded SPARQL cards

**Network Optimization:**
- **Batched Requests**: wbgetentities fetches 50 entities per request
- **Request Deduplication**: shareReplay() prevents duplicate HTTP calls
- **Retry Logic**: Exponential backoff for transient failures
- **Connection Pooling**: HttpClient reuses connections

**Change Detection Optimization:**
- **OnPush Strategy**: SearchComponent uses ChangeDetectionStrategy.OnPush
- **Signals**: Angular 21 signals reduce unnecessary change detection cycles
- **Computed Values**: `computed()` for derived state (no manual subscriptions)
- **Effects**: `effect()` replaces subscriptions with automatic cleanup

### 3.6 Testing Infrastructure

**Test Coverage:**
- **358 Passing Tests** (16 skipped)
- **86 Test Suites**
- **Vitest**: Modern test runner with instant feedback
- **Happy-DOM**: Fast DOM simulation (no browser required)
- **Test Types**:
  - Unit tests for services (40+ services)
  - Component tests with TestBed
  - Integration tests (SparqlDisplayService → ItemSparqlService)
  - Pipe tests for custom transformations

**Key Test Patterns:**
```typescript
// Service test with mocking
it('should fetch entity and cache it', async () => {
  const spy = vi.spyOn(http, 'get').mockReturnValue(of(mockData));
  const result = await service.getItem('Q123', 'en').toPromise();
  expect(result).toBeDefined();
  expect(spy).toHaveBeenCalledTimes(1);
});

// Component test with signals
it('should update itemSignal when route changes', () => {
  component.itemIdSignal.set('Q456');
  expect(component.itemId).toBe('Q456');
});

// Integration test
it('should produce SPARQL tuples and build UI state', async () => {
  const tuples = await itemSparql.itemSparql(mockItem, 'en').toPromise();
  const cards = await sparqlDisplay.buildAllCardsState(of(tuples), 'en').toPromise();
  expect(cards.sparql0.list.length).toBeGreaterThan(0);
});
```

---

## 4. External Integrations

### 4.1 FactGrid API

**Base URL**: `https://database.factgrid.de/w/api.php`

**Used Endpoints:**
- `action=wbsearchentities` - Full-text entity search
- `action=wbgetentities` - Fetch entity details by ID
- `action=query&list=search` - CirrusSearch (project-scoped)
- `action=sparql` - SPARQL endpoint for complex queries

**CORS Handling**: All requests include `origin=*` parameter

### 4.2 Wikimedia Commons

**Integration**: DisplayMediaService fetches image metadata
- **Endpoint**: `https://commons.wikimedia.org/w/api.php`
- **Features**: ExtMetadata (description, artist, license)
- **Preloading**: Link preload tags for thumbnail performance

### 4.3 Nominatim (OpenStreetMap)

**Reverse Geocoding**: ItemSparqlService uses Nominatim for address resolution
- Converts P625 coordinates to human-readable addresses
- Provides display_name for current address cards
- Caches results to respect rate limits

---

## 5. State Management

### 5.1 Reactive Patterns

**Signal-Based State (Angular 21):**
```typescript
// Display Component State
private itemIdSignal = signal<string | null>(null);
private itemSignal = signal<ItemDisplayTuple | null>(null);

// Computed derived state
readonly itemName = computed(() => {
  const item = this.itemSignal();
  return item?.[0]?.labels?.en || item?.[0]?.id || '';
});

// Effects for side effects
effect(() => {
  const id = this.itemIdSignal();
  if (id) this.loadItem();
});
```

**Observable Streams:**
- `items$` - Search results stream
- `sparqlCards$` - SPARQL card state stream
- `overlayOpen$` - Search overlay visibility
- `selectedResearchField$` - Active project stream

**Service-Based State:**
- `SelectedLangService` - Global language state
- `SelectedResearchFieldService` - Active research project
- `BackListService` - Navigation history
- `SetDataService` - Current display data

### 5.2 Persistence

**LocalStorage Keys:**
- `userSelectedLang` - User language preference
- `selectedItems` - Visited items history
- `userSelectedResearchField` - Last selected project
- `search-overlay-attach-estimate-ms` - Overlay timing calibration

---

## 6. UI/UX Features

### 6.1 Responsive Design

**Breakpoints:**
- **Mobile** (Handset): `<= 700px` width
- **Desktop**: `> 700px` width

**Adaptive Behaviors:**
- Search widget transforms from centered (home) to top-right (item view)
- Mobile shows project title above search (centered)
- Desktop shows project badge next to search
- SPARQL cards collapse on mobile with scroll
- Map adjusts size based on viewport
- Overlay panels use full-screen on mobile

### 6.2 Animations

**Home Header Animation:**
```typescript
trigger('homeHeader', [
  state('home', style({ transform: 'scaleY(1)', opacity: 1 })),
  state('closed', style({ transform: 'scaleY(0)', opacity: 0, height: 0 })),
  transition('home => closed', [animate('320ms 60ms ease-out')]),
  transition('closed => home', [animate('280ms ease-in')])
])
```

**Search Move Animation:**
- Smooth transform/scale when transitioning home → item view
- Subtle opacity changes for polish

### 6.3 Accessibility

**Features:**
- Semantic HTML (header, nav, main, section)
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in overlays
- High contrast mode compatible
- Screen reader friendly (mat-tooltip, aria-describedby)

---

## 7. Development Workflow

### 7.1 Key Commands

```bash
# Development
npm ci                  # Clean install
ng serve               # Dev server (port 4200)
npm run test:watch     # Watch mode testing

# Production
npm run build          # Production build
npm start              # Start server.js (Node Express)

# Quality
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix linting issues
npm run format         # Prettier formatting
npm run compodoc       # Generate documentation

# Theming
npm run theme          # Interactive theme picker
npm run theme:blue-orange  # Apply specific palette
```

### 7.2 Architecture Patterns

**Standalone Components:**
- No NgModules required
- Direct imports in component metadata
- Better tree-shaking and lazy loading

**Dependency Injection:**
- `inject()` function for service injection
- Constructor injection for ChangeDetectorRef
- Hierarchical injectors for scoped services

**Signals & Effects:**
- Replace manual RxJS subscriptions
- Automatic cleanup (no OnDestroy boilerplate)
- Fine-grained reactivity

**Service Organization:**
- Feature-specific services in subdirectories
- Core services in `src/app/services/`
- Config-driven behavior (dispatcher.config.ts)

---

## 8. Deployment

**Hosting**: Configured for Heroku deployment
- `Procfile.txt` - Process definition
- `server.js` - Node Express server for SPA routing
- `heroku-postbuild` - Automatic production build

**Build Output:**
- `dist/factgrid/browser/` - Production artifacts
- Hashed filenames for cache busting
- Compressed assets (gzip ready)

**Environment Management:**
- `src/environments/environment.ts` - Development config
- `src/environments/environment.prod.ts` - Production config

---

## 9. Key Innovations

1. **Hybrid Search Architecture**: Combines speed of wbsearchentities with power of CirrusSearch
2. **French Address Preservation**: Unique handling of `n°` character for accurate French address matching
3. **Signal-Based Reactivity**: Early adoption of Angular 21 signals for better performance
4. **Adaptive SPARQL**: Dynamic query generation based on item type detection
5. **Multi-Layer Caching**: Aggressive caching at search, entity, and SPARQL levels
6. **Lazy Component Loading**: On-demand loading of heavy components (SPARQL display)
7. **Client-Side Token Filtering**: Smart filtering to improve CirrusSearch results accuracy
8. **Phrase-Priority Ranking**: Novel sorting algorithm for better search relevance
9. **Project-Scoped Searches**: Unique ability to limit searches to specific research projects
10. **Autocomplete Index**: 37KB local JSON index for instant suggestions

---

## 10. Documentation Resources

**Key Documentation Files:**
- `README.md` - Quick start guide
- `llms.txt` - LLM/AI agent context file
- `docs/dispatcher.md` - Display dispatcher guide
- `COPILOT_CUSTOM_INSTRUCTION.md` - GitHub Copilot instructions
- `MIGRATION-SIGNALS-ROADMAP.md` - Signal migration roadmap
- `DESIGN-TOKENS-GUIDE.md` - Design system guide
- `THEME-GUIDE.md` - Theming system documentation
- `REFACTORING-ITEMSPARQL.md` - SPARQL refactoring notes

**Code Documentation:**
- Generated via Compodoc: `npm run compodoc:serve`
- Inline JSDoc comments throughout codebase
- Type definitions in `models/` and `interfaces/`

---

## 11. Future Enhancements

**Documented Roadmap:**
- Complete migration to signals throughout codebase
- Implement design token system for consistent theming
- Refactor SPARQL card system for better modularity
- Add additional theme palettes (6 palettes available, extensible)
- Improve mobile experience for complex SPARQL visualizations
- Enhanced accessibility features (WCAG 2.1 AA compliance)
- Performance monitoring and optimization
- Progressive Web App (PWA) capabilities

---

## Conclusion

FactGrid-Viewer is a mature, well-architected Angular application demonstrating modern best practices in reactive programming, performance optimization, and user experience design. Its hybrid search architecture, intelligent caching, and adaptive display system make it a robust tool for exploring complex historical and genealogical data from the FactGrid Wikibase instance.

The codebase is maintainable, testable, and extensible, with clear separation of concerns and comprehensive documentation. The adoption of Angular 21 features (signals, standalone components) positions the project at the cutting edge of Angular development while maintaining backward compatibility through thoughtful migration strategies.

**Project Statistics:**
- **Lines of Code**: ~50,000+ (TypeScript, HTML, SCSS)
- **Components**: 20+ standalone components
- **Services**: 40+ injectable services
- **Test Coverage**: 358 passing tests across 86 test suites
- **Build Size**: Optimized production bundle with lazy loading
- **Performance**: OnPush change detection, signal-based reactivity, multi-layer caching

**Contact & Contributions:**
See the main repository for contribution guidelines and issue tracking.
