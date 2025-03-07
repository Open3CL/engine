import { tvs as tv } from '../../../../tv-v2.js';
import { TvStore } from './../tv.store.js';

/**
 * Accès aux données des tables de valeurs pour le besoin en froid
 */
export class FrTvStore extends TvStore {
  /**
   * Recherche des valeurs nécessaires au calcul du besoin en froid
   * @see 10.2 Calcul du besoin mensuel de froid
   * — e : nombre d’heures de chauffage pour un mois donné et une consigne de refroidissement à 26°C (comportement dépensier).
   * — nref26 : nombre d’heures de chauffage pour un mois donné et une consigne de refroidissement à 26°C (comportement dépensier).
   * — nref28 : nombre d’heures de chauffage pour un mois donné et une consigne de refroidissement à 28°C (comportement conventionnel).
   * — e_fr_26 : ensoleillement reçu en période de refroidissement pour un mois donné et une consigne de refroidissement à 26°C (comportement conventionnel).
   * — e_fr_28 : ensoleillement reçu en période de refroidissement pour un mois donné et une consigne de refroidissement à 28°C (comportement conventionnel).
   * — textmoy_clim_26 : Température extérieure moyenne pour un mois donné et une consigne de refroidissement à 26°C (comportement conventionnel).
   * — textmoy_clim_28 : nombre d’heures de chauffage pour un mois donné et une consigne de refroidissement à 28°C (comportement conventionnel).
   *
   * @param type {'e', nref26' | 'nref28' | 'e_fr_26' | 'e_fr_28' | 'textmoy_clim_26' | 'textmoy_clim_28'}
   * @param classeAltitude {string}
   * @param zoneClimatique {string}
   * @param mois {string}
   * @param ilpa {number|undefined} 1 si bien à inertie lourde, 0 sinon
   *
   * @return {number|undefined}
   */
  getData(type, classeAltitude, zoneClimatique, mois, ilpa = undefined) {
    let values = tv[type];

    if (ilpa !== undefined) {
      values = values[ilpa];
    }

    return values[classeAltitude][mois][zoneClimatique];
  }
}
