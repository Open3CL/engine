import { ObjectUtil } from './core/util/infrastructure/object-util.js';

const nodesToMap = [
  'mur',
  'plancher_bas',
  'plancher_haut',
  'baie_vitree',
  'porte',
  'pont_thermique',
  'ventilation',
  'installation_ecs',
  'generateur_ecs',
  'climatisation',
  'installation_chauffage',
  'generateur_chauffage',
  'emetteur_chauffage',
  'sortie_par_energie'
];

/**
 * Transform single nodes in {@link nodesToMap} into array of nodes.
 * Transform string number into digits
 * These transformations should be done inside the open3cl library
 *
 * @example
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
    return ObjectUtil.deepObjectTransform(
      dpe,
      (key) => key,
      (val, key) => {
        if (this.#needTransform(key, val)) {
          return [val];
        }

        if (this.#isEnum(key)) {
          return val;
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
