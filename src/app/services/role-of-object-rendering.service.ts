// service to change the rendering of some statements with a qualifier "role of object"

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RoleOfObjectRenderingService {
  constructor() {}

  label: string;
  id: string;
  datatype: string;
  mainsnak: any;
  u: any;
  R1: any[];
  R2: any[];
  R3: any[];
  R4: any[];

  transformProperties(re) {
    this.roleOfObject(re);
    //   this.transformP248(re);
  }

  roleOfObject(re) {
    // List of supported roles
    const roleConfig = [
      { id: 'Q468366' }, // Married name
      { id: 'Q266694' }, // Birth name
      { id: 'Q28006' }, // Name variant
      { id: 'Q10387' }, // Replacement name
      // Add more roles here if needed
    ];

    // Initialize arrays for each role
    for (const { id } of roleConfig) {
      if (!Array.isArray(re.claims[id])) {
        re.claims[id] = [];
      }
    }

    // Process claims for target properties
    for (const prop of ['P247', 'P208']) {
      const claimsArray = re.claims[prop];
      if (!Array.isArray(claimsArray)) continue;

      for (let i = 0; i < claimsArray.length; i++) {
        const snak = claimsArray[i];
        let processed = false;

        if (snak.qualifiers2) {
          for (const qualif2 of snak.qualifiers2) {
            if (qualif2.id === 'P820' && Array.isArray(qualif2.display)) {
              for (const role of qualif2.display) {
                // Only process supported roles
                if (roleConfig.some((r) => r.id === role.id)) {
                  // Set property metadata (label/description) if not already set
                  if (!re.claims[role.id].id) re.claims[role.id].id = role.id;
                  if (!re.claims[role.id].label) re.claims[role.id].label = role.label;
                  if (!re.claims[role.id].description)
                    re.claims[role.id].description = role.description;

                  // Add value to the role property
                  re.claims[role.id].push({
                    mainsnak: {
                      property: role.id,
                      datatype: snak.mainsnak.datatype,
                      label: snak.mainsnak.label,
                      description: snak.mainsnak.description,
                      datavalue: {
                        value: {
                          id: snak.mainsnak.datavalue?.value?.id,
                          label: snak.mainsnak.label,
                          description: snak.mainsnak.description,
                        },
                      },
                    },
                    id: role.id,
                    label: role.label,
                    description: role.description,
                  });
                  processed = true;
                }
              }
              // All P820 qualifiers processed
              qualif2.display = [];
            }
          }
          // Remove P820 qualifier from qualifiers2 and qualifiers
          snak.qualifiers2 = snak.qualifiers2.filter((q) => q.id !== 'P820');
          if (snak.qualifiers && snak.qualifiers['P820']) {
            delete snak.qualifiers['P820'];
          }
          // Remove statement if no more qualifiers
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
  }

  private transformP248(re) {
    const statements = re.claims['P248'];
    if (!Array.isArray(statements) || statements.length === 0) {
      return;
    }

    const values: { label: string; id: string; order: number; extra: string }[] = [];

    for (const statement of statements) {
      const mainsnak = statement.mainsnak || {};
      const datavalue = mainsnak.datavalue || {};
      const value = datavalue.value || {};

      const label = mainsnak.label || value.label || '';
      const id = value.id;
      let order = Number.MAX_SAFE_INTEGER;
      let extra = '';

      // P499 = ordre
      if (statement.qualifiers?.['P499']?.[0]?.datavalue?.value) {
        order = parseInt(statement.qualifiers['P499'][0].datavalue.value.amount, 10);
      }

      // autres qualifiers -> extra
      if (statement.qualifiers) {
        for (const qid in statement.qualifiers) {
          if (qid === 'P499') continue;
          const q = statement.qualifiers[qid][0];
          if (q?.datavalue?.value) {
            extra += ` (${q.datavalue.value})`;
          }
        }
      }

      values.push({ label, id, order, extra });
    }

    // tri selon order
    values.sort((a, b) => a.order - b.order);

    // label combiné, ex : "Jacques, Louis"
    const combinedLabel = values
      .map((v) => v.label)
      .filter(Boolean)
      .join(', ');

    const first = statements[0];

    const alignedStatement = {
      ...first,
      mainsnak: {
        ...first.mainsnak,
        label: combinedLabel,
        datavalue: {
          value: values,
        },
      },
      label: combinedLabel,
    };

    re.claims['P248'] = [alignedStatement];
  }
}
