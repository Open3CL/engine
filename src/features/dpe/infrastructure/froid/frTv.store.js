import { tvs as tv } from '../../../../tv.js';
import { TvStore } from './../tv.store.js';
import { logger } from '../../../../core/util/logger/log-service.js';

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
   * — dh19 : degrés heures de chauffage pour un mois donné à 19°C (comportement conventionnel).
   * — dh21 : degrés heures de chauffage pour un mois donné à 21°C (comportement dépensier).
   *
   * @param type {'e', nref26' | 'nref28' | 'e_fr_26' | 'e_fr_28' | 'textmoy_clim_26' | 'textmoy_clim_28'| 'dh19'| 'dh21'}
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

    return parseFloat(values[classeAltitude][mois][zoneClimatique]);
  }

  /**
   * Coefficient d’efficience énergétique
   * @see 10.3 - Les consommations de refroidissement
   *
   * @param zoneClimatiqueId {string}
   * @param periodeInstallationId {number}
   *
   * @return {number|undefined}
   */
  getEer(zoneClimatiqueId, periodeInstallationId) {
    const eer = tv['seer'].find(
      (v) =>
        v.enum_zone_climatique_id.includes(zoneClimatiqueId) &&
        parseInt(v.enum_periode_installation_fr_id) === periodeInstallationId
    )?.eer;

    if (!eer) {
      logger.error(
        `Pas de valeur forfaitaire eer pour zoneClimatiqueId:${zoneClimatiqueId}, periodeInstallationId:${periodeInstallationId}`
      );
      return;
    }

    return parseFloat(eer);
  }
}
