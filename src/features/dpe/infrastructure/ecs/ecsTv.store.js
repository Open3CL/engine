import { tvs as tv } from '../../../../tv-v2.js';
import { TvStore } from './../tv.store.js';

/**
 * Accès aux données des tables de valeurs pour le besoin en eau chaude sanitaire
 */
export class EcsTvStore extends TvStore {
  /**
   * Température moyenne d’eau froide sanitaire sur le mois j (°C).
   * La température d’eau froide est une donnée climatique mensuelle pour chacune des 8 zones climatiques
   * @see 11.1 Calcul du besoin d’ECS : Tefs
   *
   * @param classeAltitude {string}
   * @param zoneClimatique {string}
   * @param mois {string}
   *
   * @return {number|undefined}
   */
  getTefs(classeAltitude, zoneClimatique, mois) {
    return tv['tefs'][classeAltitude][mois][zoneClimatique];
  }
}
