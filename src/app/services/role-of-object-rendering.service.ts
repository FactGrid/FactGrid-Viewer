// service to change the rendering of some statements with a qualifier "role of object"

import { Injectable } from '@angular/core';
import { Entity, ClaimArray, Claim } from '../interfaces/claims';

@Injectable({
  providedIn: 'root',
})
export class RoleOfObjectRenderingService {
  constructor() {}

  // kept fields for backward compatibility (not actively used here)
  label: string;
  id: string;
  datatype: string;
  mainsnak: any;
  u: any;
  R1: any[];
  R2: any[];
  R3: any[];
  R4: any[];

  transformProperties(re: Entity) {
    this.roleOfObject(re);
    // this.transformP248(re);
  }

  /**
   * Move values from P247/P208 into role properties when a P820 qualifier is present.
   * This matches legacy behaviour but uses the shared Claim/Entity types and applies
   * small safe-casts when accessing datavalue.value shapes.
   */
  roleOfObject(re: Entity) {
    const roleConfig = [
      { id: 'Q468366' }, // Married name
      { id: 'Q266694' }, // Birth name
      { id: 'Q28006' }, // Name variant
      { id: 'Q10387' }, // Replacement name
    ];

    // Make sure role properties exist and are ClaimArray typed
    for (const { id } of roleConfig) {
      if (!Array.isArray(re.claims[id])) re.claims[id] = [] as ClaimArray;
    }

    for (const prop of ['P247', 'P208']) {
      const claimsArray = re.claims[prop] as ClaimArray | undefined;
      if (!Array.isArray(claimsArray)) continue;

      for (let i = 0; i < claimsArray.length; i++) {
        const snak = claimsArray[i] as Claim;
        let processed = false;

        if (!snak.qualifiers2) continue;

        for (const qualif2 of snak.qualifiers2) {
          if (qualif2.id !== 'P820' || !Array.isArray(qualif2.display)) continue;

          for (const role of qualif2.display) {
            if (!roleConfig.some((r) => r.id === role.id)) continue;

            const roleClaims = re.claims[role.id] as ClaimArray;
            const roleMeta = roleClaims as any;
            if (!roleMeta.id) roleMeta.id = role.id;
            if (!roleMeta.label) roleMeta.label = role.label;
            if (!roleMeta.description) roleMeta.description = role.description;

            roleClaims.push({
              mainsnak: {
                property: role.id,
                datatype: snak.mainsnak.datatype,
                label: snak.mainsnak.label,
                description: snak.mainsnak.description,
                datavalue: {
                  value: {
                    id: (snak.mainsnak.datavalue?.value as any)?.id,
                    label: snak.mainsnak.label,
                    description: snak.mainsnak.description,
                  } as any,
                },
              },
              id: role.id,
              label: role.label,
              description: role.description,
            } as any);

            processed = true;
          }

          // empty out display for processed qualifiers
          qualif2.display = [];
        }

        // remove P820 qualifier from qualifiers2 and qualifiers map
        snak.qualifiers2 = Array.isArray(snak.qualifiers2)
          ? snak.qualifiers2.filter((q) => q.id !== 'P820')
          : snak.qualifiers2;

        if (snak.qualifiers && snak.qualifiers['P820']) delete snak.qualifiers['P820'];

        const hasQualifiers =
          (snak.qualifiers && Object.keys(snak.qualifiers).length > 0) ||
          (snak.qualifiers2 && snak.qualifiers2.length > 0);

        if (!hasQualifiers && processed) {
          claimsArray.splice(i, 1);
          i--;
        }
      }
    }
  }

  private transformP248(re: Entity) {
    const statements = re.claims['P248'] as ClaimArray | undefined;
    if (!Array.isArray(statements) || statements.length === 0) return;

    const values: { label: string; id: string; order: number; extra: string }[] = [];

    for (const statement of statements as ClaimArray) {
      const mainsnak: any = statement.mainsnak || {};
      const datavalue: any = mainsnak.datavalue || {};
      const value: any = datavalue.value || {};

      const label = mainsnak.label || (value as any).label || '';
      const id = (value as any).id;
      let order = Number.MAX_SAFE_INTEGER;
      let extra = '';

      // P499 = ordre
      if (statement.qualifiers?.['P499']?.[0]?.datavalue?.value) {
        order = parseInt((statement.qualifiers['P499'][0].datavalue.value as any).amount, 10);
      }

      // autres qualifiers -> extra
      if (statement.qualifiers) {
        for (const qid in statement.qualifiers) {
          if (qid === 'P499') continue;
          const q = statement.qualifiers[qid][0];
          if (q?.datavalue?.value) extra += ` (${(q.datavalue.value as any)})`;
        }
      }

      values.push({ label, id, order, extra });
    }

    // tri selon order
    values.sort((a, b) => a.order - b.order);

    // label combiné, ex : "Jacques, Louis"
    const combinedLabel = values.map((v) => v.label).filter(Boolean).join(', ');

    const first = statements[0];

    const alignedStatement = {
      ...first,
      mainsnak: {
        ...first.mainsnak,
        label: combinedLabel,
        datavalue: { value: values },
      },
      label: combinedLabel,
    };

    re.claims['P248'] = [alignedStatement];
  }
}
