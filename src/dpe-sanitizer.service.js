import { ObjectUtil } from './core/util/infrastructure/object-util.js';
import { set, has } from 'lodash-es';

const nodesToMap = [
  'installation_ecs',
  'generateur_ecs',
  'installation_chauffage',
  'generateur_chauffage',
  'emetteur_chauffage',
  'sortie_par_energie'
];

const nodesCollectionToCheck = [
  'logement.enveloppe.mur_collection.mur',
  'logement.enveloppe.plancher_bas_collection.plancher_bas',
  'logement.enveloppe.plancher_haut_collection.plancher_haut',
  'logement.ventilation_collection.ventilation',
  'logement.climatisation_collection.climatisation',
  'logement.enveloppe.baie_vitree_collection.baie_vitree',
  'logement.enveloppe.porte_collection.porte',
  'logement.enveloppe.pont_thermique_collection.pont_thermique'
];

/**
 * Transform single nodes in {@link nodesToMap} into array of nodes.
 * Transform string number into digits
 * These transformations should be done inside the open3cl library
 *
 * @example
 *
 * // Will create
 * "plancher_haut_collection": {
 *         "plancher_haut": []
 * }
 * if the plancher_haut_collection.plancher_haut nodes does not exist or are not an array
 *
 * // Will transform
 * "plancher_haut_collection": {
 *         "plancher_haut": {"id": 1}
 * }
 * // Into
 * "plancher_haut_collection": {
 *         "plancher_haut": [{"id": 1}]
 * }
 *
 * @example
 * // Will transform
 * "surface_paroi_opaque": "40.94"
 * // Into
 * "surface_paroi_opaque": 40.94
 */
export default class DpeSanitizerService {
  /**
   * @param dpe {FullDpe}
   * @return {FullDpe}
   */
  execute(dpe) {
    for (const path of nodesCollectionToCheck) {
      if (!has(dpe, path)) {
        set(dpe, path, []);
      }
    }

    return ObjectUtil.deepObjectTransform(
      dpe,
      (key) => key,
      (val, key) => {
        if (this.#needTransform(key, val)) {
          return [val];
        }

        if (this.#isEnum(key)) {
          return val?.toString();
        }

        if (this.#isUndefinedVal(val)) {
          return '';
        }

        if (this.#isEmptyArray(val)) {
          return val;
        }

        if (Number.isNaN(Number(val))) {
          return val;
        }
        return Number(val);
      }
    );
  }

  #isEnum(key) {
    return key.startsWith('enum_') || key.startsWith('original_enum');
  }

  #needTransform(key, val) {
    return typeof val === 'object' && !Array.isArray(val) && nodesToMap.includes(key);
  }

  #isUndefinedVal(val) {
    return val === '' || val === null;
  }

  #isEmptyArray(val) {
    return Array.isArray(val) && val.length === 0;
  }
}
