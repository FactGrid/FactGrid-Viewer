# How to Add a New SPARQL Card in FactGrid Viewer

This guide explains how to add a new SPARQL query card to display related items in the FactGrid Viewer. The application supports displaying SPARQL results in up to 5 card slots (sparql0-4) in the display component.

**Last updated**: December 10, 2025  
**Applies to**: Angular 21 refactored architecture with Strategy pattern

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Step-by-Step Tutorial](#step-by-step-tutorial)
4. [Adding a New Card Slot](#adding-a-new-card-slot)
5. [Testing Your Implementation](#testing-your-implementation)
6. [Troubleshooting](#troubleshooting)
7. [Examples](#examples)

---

## Architecture Overview

### SPARQL Card System

The FactGrid Viewer displays SPARQL query results in collapsible cards. Each card shows a list of related items based on specific criteria.

**Components involved**:
- `DisplayComponent` (`src/app/display/display.component.ts`) - Main container that orchestrates SPARQL cards
- `SparqlDisplayComponent` (`src/app/display/sparql-display/sparql-display.component.ts`) - Individual card rendering
- `ItemSparqlService` (`src/app/services/item-sparql.service.ts`) - Orchestrates SPARQL queries
- **Strategy classes** (`src/app/services/sparql/sparql-strategies.ts`) - Individual query implementations
- `SparqlQueryBuilderService` - Constructs SPARQL queries with fluent API
- `ItemTypeResolverService` - Routes items to appropriate strategies

### Data Flow

```
Item loaded → ItemSparqlService.itemSparql()
    ↓
batchAskQuery() - Determines item type (Q12, Q8, Q37073, etc.)
    ↓
Strategies executed based on flags (sparql0$ - sparql4$)
    ↓
Results combined via forkJoin
    ↓
DisplayComponent receives item.sparql Observable<SparqlTuple[]>
    ↓
SPARQL effect creates SparqlDisplayComponent instances
    ↓
Cards rendered in UI
```

### Current Card Slots

| Slot | Typical Content | Priority Logic |
|------|----------------|----------------|
| **sparql0** | Superclass/Superclass1 | Superclass (P3+) > Superclass1 (P3) |
| **sparql1** | Organization/Career/Creator/FamilyName/Address/FactGridClass | Address (Q16200) > Organisation (Q12) > Career (Q37073) > Creator (Q456376) > FamilyName (Q24499) > FactGridClass (Q77457) |
| **sparql2** | Health Practitioner | HealthPractitioner (Q140759) |
| **sparql3** | Master/List/Set/CurrentAddress | Master > List (Q172192) > Set (Q945258) > CurrentAddress |
| **sparql4** | Location/GOV | Location (Q8) > GOV |

---

## Quick Start Guide

**To add a new SPARQL query type**:

1. Create a strategy class in `sparql-strategies.ts`
2. Register the strategy in `ItemSparqlService.constructor()`
3. Add the strategy to appropriate `sparqlX$` slot in `ItemSparqlService.itemSparql()`
4. (Optional) Add a batch ASK test flag in `batchAskQuery()`
5. Test with real FactGrid items

**Estimated time**: 30-60 minutes

---

## Step-by-Step Tutorial

### Example: Adding a "Birthplace" SPARQL Card

Let's add a card that shows all people born in a specific location.

#### Step 1: Create the Strategy Class

**File**: `src/app/services/sparql/sparql-strategies.ts`

Add this class at the end of the file (before `ALL_SPARQL_STRATEGIES`):

```typescript
/**
 * Strategy for Birthplace - shows people born in this location.
 * Queries items with P1376 (place of birth) pointing to the current item.
 */
@Injectable({ providedIn: 'root' })
export class BirthplaceStrategy extends BaseSparqlStrategy {
  readonly id = 'BIRTHPLACE';
  readonly priority = 55; // Between HealthPractitioner (50) and Creator (60)

  test(flags: BatchAskResult, item: any): boolean {
    // Only show for locations (Q8)
    return flags.Q8Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription', 'birthDate'], true)
      .where([
        '?item wdt:P82 wd:{{itemId}}',  // P1376 = place of birth
      ])
      .optional([
        '?item wdt:P77 ?birthDate'  // P222 = date of birth (optional)
      ])
      .orderBy('itemLabel')
      .limit(500)  // Limit results for performance
      .build({ itemId: item.id });

    return this.executeSparql(url, 'BIRTHPLACE');
  }
}
```

**Key points**:
- **id**: Unique identifier for your strategy
- **priority**: Higher = selected first when multiple strategies match (0-100 scale)
- **test()**: Determines if this strategy applies to the current item
- **query()**: Builds and executes the SPARQL query

#### Step 2: Register the Strategy

**File**: `src/app/services/sparql/sparql-strategies.ts`

Update the `ALL_SPARQL_STRATEGIES` array:

```typescript
export const ALL_SPARQL_STRATEGIES = [
  AddressStrategy,
  OrganisationStrategy,
  CareerStrategy,
  FamilyNameStrategy,
  CreatorStrategy,
  LocationStrategy,
  HealthPractitionerStrategy,
  MasterStrategy,
  FactGridPropertyClassStrategy,
  ListStrategy,
  SetStrategy,
  GOVStrategy,
  SuperclassStrategy,
  Superclass1Strategy,
  BirthplaceStrategy,  // ← Add your new strategy here
];
```

**File**: `src/app/services/item-sparql.service.ts`

Add the injection and registration:

```typescript
export class ItemSparqlService {
  // ... existing injections ...
  private birthplaceStrategy = inject(BirthplaceStrategy);  // ← Add injection

  constructor() {
    this.registerAllStrategies();
  }

  private registerAllStrategies(): void {
    this.resolver.registerStrategies([
      this.addressStrategy,
      // ... existing strategies ...
      this.superclass1Strategy,
      this.birthplaceStrategy,  // ← Add to registration
    ]);
  }
}
```

#### Step 3: Add to SPARQL Slot

Choose which card slot (sparql0-4) should display your new query. For birthplace, let's use **sparql2** (currently shows HealthPractitioner).

**File**: `src/app/services/item-sparql.service.ts`

Modify the `itemSparql()` method:

```typescript
// sparql2: HealthPractitioner OR Birthplace (new)
this.sparql2$ = forkJoin([this.Q140759Test, this.Q8Test]).pipe(
  switchMap(([q140759, q8]) => {
    if (q140759) return this.healthPractitionerStrategy.query(item);
    if (q8) return this.birthplaceStrategy.query(item);  // ← Add this
    return this.noResult();
  }),
  startWith<SparqlTuple>([undefined, []])
);
```

**Alternative**: If you want birthplace to have its own dedicated slot, see [Adding a New Card Slot](#adding-a-new-card-slot).

#### Step 4: (Optional) Add Batch ASK Flag

If you need a specific test that's expensive to run (requires SPARQL ASK), add it to `batchAskQuery()`.

**File**: `src/app/services/item-sparql.service.ts`

```typescript
batchAskQuery(itemId: string): Observable<BatchAskResult> {
  const sparql = `
    SELECT ?isLocality ?isOrganisation ... ?isBirthplace WHERE {
      BIND(EXISTS { wd:${itemId} wdt:P2/wdt:P3* wd:Q8 } AS ?isLocality)
      ...
      BIND(EXISTS { ?person wdt:P82 wd:${itemId} } AS ?isBirthplace)
    }
  `;
  
  return this.request.getList(url).pipe(
    map((res: SparqlResults) => {
      const b = res.results?.bindings?.[0];
      return {
        Q8Test: b?.isLocality?.value === 'true',
        ...
        birthplaceTest: b?.isBirthplace?.value === 'true',  // ← Add flag
      };
    }),
    shareReplay(1)
  );
}
```

Update the `BatchAskResult` interface in `src/app/services/sparql-types.ts`:

```typescript
export interface BatchAskResult {
  Q8Test: boolean;
  Q12Test: boolean;
  // ... existing flags ...
  birthplaceTest?: boolean;  // ← Add new flag
}
```

Then use in your strategy:

```typescript
test(flags: BatchAskResult, item: any): boolean {
  return flags.birthplaceTest === true;
}
```

#### Step 5: Build and Test

```bash
# Build the project
npx ng build --output-hashing=all

# Serve locally
ng serve

# Navigate to an item that should trigger your card
# Example: A location like Q8 (place)
http://localhost:4200/display/Q12345
```

---

## Adding a New Card Slot

If you need more than 5 SPARQL cards, you can add a new slot (`sparql5$`, `sparql6$`, etc.).

### Step 1: Add Observable in ItemSparqlService

**File**: `src/app/services/item-sparql.service.ts`

```typescript
export class ItemSparqlService {
  // ... existing observables ...
  sparql5$: Observable<SparqlTuple>;  // ← Add new slot
}
```

### Step 2: Populate the Observable

In `itemSparql()` method:

```typescript
itemSparql(item: { id: string; [k: string]: any }): Observable<SparqlEnabledItem> {
  return this.batchAskQuery(item.id).pipe(
    switchMap((batch) => {
      // ... existing sparql0-4 setup ...

      // New slot for birthplace
      this.sparql5$ = this.birthplaceStrategy.query(item).pipe(
        startWith<SparqlTuple>([undefined, []])
      );

      // Add to forkJoin
      item.sparql = forkJoin([
        this.sparql0$,
        this.sparql1$,
        this.sparql2$,
        this.sparql3$,
        this.sparql4$,
        this.sparql5$,  // ← Add to array
      ]);

      return of(item);
    })
  );
}
```

### Step 3: Update DisplayComponent

**File**: `src/app/display/display.component.ts`

Find the SPARQL effect (search for `effect(() => {` with `currentItem` and `sparql`):

```typescript
effect(() => {
  const currentItem = this.itemSignal();
  
  if (!currentItem || !Array.isArray(currentItem) || currentItem.length === 0) {
    return;
  }

  const item = currentItem[0];
  
  if (item?.sparql) {
    item.sparql.subscribe({
      next: (sparqlResults: SparqlTuple[]) => {
        // ... existing sparql0-4 processing ...
        
        // Add sparql5
        if (sparqlResults[5] && sparqlResults[5][1]?.length > 0) {
          this.createSparqlCard(sparqlResults[5], 'birthplace-card');  // ← Add new card
        }
      },
      error: (err) => console.error('SPARQL subscription error:', err)
    });
  }
});
```

### Step 4: Add Container in Template

**File**: `src/app/display/display.component.html`

Find the SPARQL card containers (search for `#sparql-card-0`):

```html
<!-- Existing cards -->
<div #sparqlContainer0 id="sparql-card-0"></div>
<div #sparqlContainer1 id="sparql-card-1"></div>
<div #sparqlContainer2 id="sparql-card-2"></div>
<div #sparqlContainer3 id="sparql-card-3"></div>
<div #sparqlContainer4 id="sparql-card-4"></div>

<!-- New card -->
<div #sparqlContainer5 id="birthplace-card"></div>  <!-- ← Add new container -->
```

**Note**: The ID must match the second parameter in `createSparqlCard()`.

---

## Testing Your Implementation

### 1. Unit Tests (Optional but Recommended)

Create a test file for your strategy:

**File**: `src/app/services/sparql/birthplace-strategy.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BirthplaceStrategy } from './sparql-strategies';
import { SparqlQueryBuilderService } from './sparql-query-builder.service';
import { RequestService } from '../request.service';

describe('BirthplaceStrategy', () => {
  let strategy: BirthplaceStrategy;
  let mockBuilder: jasmine.SpyObj<SparqlQueryBuilderService>;
  let mockRequest: jasmine.SpyObj<RequestService>;

  beforeEach(() => {
    mockBuilder = jasmine.createSpyObj('SparqlQueryBuilderService', [
      'select', 'where', 'optional', 'orderBy', 'limit', 'build'
    ]);
    mockRequest = jasmine.createSpyObj('RequestService', ['getList']);

    // Mock fluent API
    mockBuilder.select.and.returnValue(mockBuilder as any);
    mockBuilder.where.and.returnValue(mockBuilder as any);
    mockBuilder.optional.and.returnValue(mockBuilder as any);
    mockBuilder.orderBy.and.returnValue(mockBuilder as any);
    mockBuilder.limit.and.returnValue(mockBuilder as any);
    mockBuilder.build.and.returnValue('http://mock-url');

    TestBed.configureTestingModule({
      providers: [
        BirthplaceStrategy,
        { provide: SparqlQueryBuilderService, useValue: mockBuilder },
        { provide: RequestService, useValue: mockRequest }
      ]
    });

    strategy = TestBed.inject(BirthplaceStrategy);
  });

  it('should only test true for location items', () => {
    const flags = {
      Q8Test: true,
      Q12Test: false,
      // ... other flags
    } as any;

    expect(strategy.test(flags, {})).toBeTrue();
  });

  it('should build correct SPARQL query', () => {
    mockRequest.getList.and.returnValue(of({
      results: { bindings: [] }
    }));

    const item = { id: 'Q380472' };
    strategy.query(item).subscribe();

    expect(mockBuilder.select).toHaveBeenCalledWith(
      ['item', 'itemLabel', 'itemDescription', 'birthDate'],
      true
    );
    expect(mockBuilder.where).toHaveBeenCalled();
    expect(mockBuilder.build).toHaveBeenCalledWith({ itemId: 'Q12345' });
  });
});
```

### 2. Manual Testing

**Test with real FactGrid items**:

1. Find an item that should trigger your card (e.g., Q8 for locations)
2. Navigate to `http://localhost:4200/display/Q<item-id>`
3. Check the browser console for debug logs (if `DEBUG_ITEM` is enabled)
4. Verify the card appears with correct data

**Debugging tips**:

```typescript
// In item-sparql.service.ts, temporarily enable debug for your item
private readonly DEBUG_ITEM: string = 'Q380472'; // Or '*' for all items

// In your strategy's query() method
query(item: any): Observable<SparqlTuple> {
  console.log('[BirthplaceStrategy] Executing for', item.id);
  const url = this.builder...
  console.log('[BirthplaceStrategy] Query URL:', url);
  return this.executeSparql(url, 'BIRTHPLACE');
}
```

### 3. Browser DevTools

Check the **Network** tab:
- Look for requests to `database.factgrid.de/sparql`
- Verify the query parameters are correct
- Check response data structure

Check the **Console** tab:
- Look for `[ItemSparql]` or `[SPARQL DEBUG]` logs
- Check for errors in SPARQL query parsing

---

## Troubleshooting

### Card Not Appearing

**Symptom**: Your SPARQL card doesn't render in the UI.

**Possible causes**:
1. **Strategy test() returns false** → Check your test conditions and batch ASK flags
2. **Query returns no results** → Test your SPARQL query directly on [FactGrid Query Service](https://database.factgrid.de/query/)
3. **Slot priority conflict** → Another strategy with higher priority is taking the slot
4. **Container not in template** → Verify the `<div #sparqlContainerX>` exists in HTML

**Debug steps**:
```typescript
// Add console.logs in your strategy
test(flags: BatchAskResult, item: any): boolean {
  console.log('[MyStrategy] test() called', { flags, item });
  const result = flags.myTest === true;
  console.log('[MyStrategy] test() result:', result);
  return result;
}
```

### Wrong Data Displayed

**Symptom**: Card shows data but it's incorrect or incomplete.

**Possible causes**:
1. **SPARQL query syntax error** → Test query on FactGrid directly
2. **Property IDs wrong** → Verify Wikibase property IDs (P1376, P222, etc.)
3. **Item type mismatch** → Check if `test()` logic is too broad/narrow
4. **Sorting issues** → `executeSparql()` applies French alphabetical sort by default

**Debug steps**:
```typescript
// Log the raw SPARQL URL
const url = this.builder.select(...).build({ itemId: item.id });
console.log('Copy this URL and test:', decodeURIComponent(url));
```

### Performance Issues

**Symptom**: Page loads slowly when your card is displayed.

**Possible causes**:
1. **Too many results** → Add `.limit()` to your query builder chain
2. **Complex UNION queries** → Simplify or split into multiple strategies
3. **No cache** → The `batchAskQuery` cache doesn't apply to individual strategy queries

**Solutions**:
```typescript
// Add limit
.limit(500)  // Reasonable default

// Add more specific WHERE clauses
.where([
  '?item wdt:P82 wd:{{itemId}}',
  '?item wdt:P2/wdt:P3* wd:Q8'  // Only humans
])

// Consider pagination (advanced)
// Split large result sets into multiple queries with OFFSET
```

### Card Appears in Wrong Slot

**Symptom**: Your card appears in sparql1 when you wanted sparql3.

**Solution**: Check which `sparqlX$` observable you added your strategy to in `itemSparql()`. Move it to the correct slot:

```typescript
// Move from sparql1$ to sparql3$
this.sparql3$ = forkJoin([...]).pipe(
  switchMap(([test1, test2]) => {
    if (test1) return this.masterStrategy.query(item);
    if (test2) return this.myNewStrategy.query(item);  // ← Add here
    return this.noResult();
  }),
  startWith<SparqlTuple>([undefined, []])
);
```

---

## Examples

### Example 1: Simple Property-Based Query

Show all items that have the current item as their "employer" (P91):

```typescript
@Injectable({ providedIn: 'root' })
export class EmployeeStrategy extends BaseSparqlStrategy {
  readonly id = 'EMPLOYEES';
  readonly priority = 60;

  test(flags: BatchAskResult, item: any): boolean {
    // Show for organizations
    return flags.Q12Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'])
      .where(['?item wdt:P91 wd:{{itemId}}'])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'EMPLOYEES');
  }
}
```

### Example 2: Multi-Property UNION Query

Show students of a master (multiple possible relationships):

```typescript
@Injectable({ providedIn: 'root' })
export class StudentStrategy extends BaseSparqlStrategy {
  readonly id = 'STUDENTS';
  readonly priority = 70;

  test(flags: BatchAskResult, item: any): boolean {
    // Custom test: check if item has P165 (activity) claims
    return item?.claims?.P165?.length > 0;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'familyNameLabel'], true)
      .union(
        ['?item wdt:P161 wd:{{itemId}}'],  // P161 = student of
        ['?item wdt:P160 wd:{{itemId}}']    // P69 = educated at
      )
      .optional(['?item wdt:P247 ?familyName'])
      .orderBy('familyNameLabel')
      .limit(1000)
      .build({ itemId: item.id });

    return this.executeSparql(url, 'STUDENTS');
  }
}
```

### Example 3: Query with Date Filtering

Show recent publications (within last 10 years):

```typescript
@Injectable({ providedIn: 'root' })
export class RecentPublicationsStrategy extends BaseSparqlStrategy {
  readonly id = 'RECENT_PUBS';
  readonly priority = 65;

  test(flags: BatchAskResult, item: any): boolean {
    // Show for authors/creators
    return flags.Q456376Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    // Note: For complex queries, you can build raw SPARQL
    const currentYear = new Date().getFullYear();
    const tenYearsAgo = currentYear - 10;

    const rawSparql = `
      SELECT DISTINCT ?item ?itemLabel ?pubDate WHERE {
        ?item (wdt:P21 | wdt:P552) wd:${item.id} .
        ?item wdt:P222 ?pubDate .
        FILTER(YEAR(?pubDate) >= ${tenYearsAgo})
        SERVICE wikibase:label { 
          bd:serviceParam wikibase:language "en","fr" . 
        }
      }
      ORDER BY DESC(?pubDate)
      LIMIT 100
    `;

    const url = 'https://database.factgrid.de/sparql?query=' + 
                encodeURIComponent(rawSparql);

    return this.request.getList(url).pipe(
      map((res: any) => {
        const bindings = res?.results?.bindings || [];
        bindings.forEach((b: any) => {
          if (b.item?.value) {
            b.item.id = b.item.value.replace(
              'https://database.factgrid.de/entity/', ''
            );
            b.item.entity = b.item.id.startsWith('P') ? 'property' : 'item';
          }
        });
        return ['RECENT_PUBS', bindings] as SparqlTuple;
      })
    );
  }
}
```

### Example 4: Conditional Query Based on Item Properties

Show different queries depending on item subclass:

```typescript
@Injectable({ providedIn: 'root' })
export class AdaptiveStrategy extends BaseSparqlStrategy {
  readonly id = 'ADAPTIVE';
  readonly priority = 75;

  test(flags: BatchAskResult, item: any): boolean {
    // Test multiple conditions
    return flags.Q12Test || flags.Q8Test || flags.Q37073Test;
  }

  query(item: any): Observable<SparqlTuple> {
    // Adapt query based on item type
    const itemType = this.detectItemType(item);
    
    let whereClause: string[];
    let label: string;

    switch (itemType) {
      case 'organization':
        whereClause = ['?item wdt:P91 wd:{{itemId}}'];
        label = 'MEMBERS';
        break;
      case 'location':
        whereClause = ['?item wdt:P1376 wd:{{itemId}}'];
        label = 'BORN_HERE';
        break;
      case 'career':
        whereClause = ['?item wdt:P165 wd:{{itemId}}'];
        label = 'HOLDERS';
        break;
      default:
        return this.noResult();
    }

    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'], true)
      .where(whereClause)
      .orderBy('itemLabel')
      .limit(500)
      .build({ itemId: item.id });

    return this.executeSparql(url, label);
  }

  private detectItemType(item: any): string {
    const instanceOf = item?.claims?.P2?.[0]?.mainsnak?.datavalue?.value?.id;
    
    if (!instanceOf) return 'unknown';
    
    // Check against known Q-IDs
    if (instanceOf === 'Q12') return 'organization';
    if (instanceOf === 'Q8') return 'location';
    if (instanceOf === 'Q37073') return 'career';
    
    return 'unknown';
  }
}
```

---

## Best Practices

### 1. Strategy Design

✅ **DO**:
- Use descriptive strategy IDs (e.g., `'BIRTHPLACE'` not `'STR1'`)
- Set appropriate priorities (0-100, where higher = more important)
- Keep `test()` logic simple and fast
- Use `builder` API for clean, maintainable queries
- Add JSDoc comments explaining what the strategy does

❌ **DON'T**:
- Make `test()` execute expensive operations (use batch ASK flags instead)
- Hardcode language in queries (let the builder add the label service)
- Forget to call `executeSparql()` (handles ID normalization and sorting)
- Return raw query results (always return `[label, bindings]` tuple)

### 2. Query Optimization

✅ **DO**:
- Add `.limit()` for queries that might return many results
- Use DISTINCT when appropriate
- Use OPTIONAL for properties that might not exist
- Test queries directly on FactGrid before implementing

❌ **DON'T**:
- Create Cartesian products (multiple unconnected UNION clauses)
- Query without limits (can cause timeouts)
- Use complex nested OPTIONAL chains (hard to debug)

### 3. Testing

✅ **DO**:
- Test with multiple real FactGrid items
- Check edge cases (items with no results, items with 1000+ results)
- Verify sorting is correct for different languages
- Check performance on slow connections

❌ **DON'T**:
- Only test with one item
- Assume your query will always return data
- Skip checking the browser network tab

### 4. Maintenance

✅ **DO**:
- Document complex SPARQL patterns with comments
- Use consistent naming (if you add `FooStrategy`, use `fooStrategy` for injection)
- Keep strategies focused (one responsibility each)
- Add your strategy to `ALL_SPARQL_STRATEGIES` array

❌ **DON'T**:
- Mix multiple unrelated queries in one strategy
- Forget to inject your strategy in `ItemSparqlService`
- Leave debug logs in production code

---

## Reference: Common FactGrid Properties

| Property | ID | Example Use |
|----------|-----|-------------|
| Instance of | P2 | Item type/class |
| Subclass of | P3 | Class hierarchy |
| Place of birth | P82 | Birthplace queries |
| Date of birth | P77 | Temporal filtering |
| Family name | P247 | Sorting people |
| Activity/Occupation | P165 | Career/profession |
| Employer | P91 | Employment relationships |
| Student of | P161 | Educational relationships |
| Located in | P47 | Geographic relationships |
| Coordinates | P48 | Map display |

**Full property list**: [FactGrid Properties](https://database.factgrid.de/wiki/Special:ListProperties)

---

## Additional Resources

- **FactGrid SPARQL Endpoint**: https://database.factgrid.de/sparql
- **Query Examples**: https://database.factgrid.de/wiki/FactGrid:SPARQL_query_examples
- **Wikibase Data Model**: https://www.mediawiki.org/wiki/Wikibase/DataModel
- **Angular Signals Guide**: https://angular.dev/guide/signals
- **RxJS Operators**: https://rxjs.dev/api

---

**Questions or issues?** Check the troubleshooting section or review existing strategies in `sparql-strategies.ts` for working examples.

**Last updated**: December 10, 2025
