import { Injectable, inject } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class IframesDisplayService {
 
setIframesDisplay(item, iframes){
  try {
    // Basic guards
    if (!item || !Array.isArray(item) || !item[0] || !item[0].claims) {
      return;
    }

    const claims = item[0].claims;

    const removeFromIndexList = (prop) => {
      if (Array.isArray(item[1])) {
        const idx = item[1].indexOf(prop);
        if (idx > -1) item[1].splice(idx, 1);
      }
    };

    const pushIfNonEmpty = (propArr) => {
      if (propArr && (Array.isArray(propArr) ? propArr.length > 0 : true)) {
        iframes.push(propArr);
      }
    };

    // Helper to process a claim which is expected to be an array
    const processClaimArray = (propName) => {
      const prop: any = claims[propName];
      if (!Array.isArray(prop) || prop.length === 0) return;
      removeFromIndexList(propName);
      // Ensure iframe is an array on the prop wrapper object
      try {
        if (!Array.isArray((prop as any).iframe)) {
          (prop as any).iframe = [];
        }
      } catch (e) {
        // Defensive: if prop is not an object bail out silently
        return;
      }

      for (let i = 0; i < prop.length; i++) {
        const el = prop[i];
        if (el && el.mainsnak && el.mainsnak.datavalue) {
          // store datatype for compatibility with older code
          el.mainsnak.datatype = el.mainsnak.datavalue.value;
          // push value to the iframe array to avoid assigning to undefined indices
          try {
            (prop as any).iframe.push(el.mainsnak.datavalue.value);
          } catch (e) {
            // ignore push failures silently
          }
        } else {
          // skip malformed elements silently
        }
      }
      pushIfNonEmpty(prop);
    };

    // Process known properties
    processClaimArray('P309');
    processClaimArray('P320');
    processClaimArray('P679');
    processClaimArray('P693');
    processClaimArray('P720');

  } catch (err) {
    // fail silently to avoid noisy logs in production
  }
}

    setHouseNumbersQuery(res){
      res = res.replace("item%","viewer%");
      res = res.replace("%7D%7D",`%7D%20BIND%28STRAFTER%28STR%28%3Fitem%29%2C%20STR%28wd%3A%29%29%20AS%20%3FitemId%29%20BIND%28IRI%28CONCAT%28%22https%3A%2F%2Fdatabase.factgrid.de%2Fviewer%2Fitem%2F%22%2C%20%3FitemId%29%29%20AS%20%3Fviewer%29%7D%0A`);
      return res
    }
  }
