import { tvs as tv } from '../../../tv-v2.js';
import { logger } from '../../../core/util/logger/log-service.js';
import { TvStore } from './tv.store.js';

/**
 * Accès aux données des tables de valeurs pour les baies vitrées
 */
export class PontThermiqueTvStore extends TvStore {
  /**
   * Valeur du pont thermique (W/(m.K)) via tv_pont_thermique_id
   *
   * @param tvPontThermiqueId {number}
   * @return {number|undefined}
   */
  getKForMurById(tvPontThermiqueId) {
    const k = tv['pont_thermique'].find(
      (v) => parseInt(v.tv_pont_thermique_id) === tvPontThermiqueId
    )?.k;

    if (!k) {
      logger.error(`Pas de valeur forfaitaire k pour tvPontThermiqueId:${tvPontThermiqueId}`);
      return 0;
    }

    return parseFloat(k);
  }

  /**
   * Valeur du pont thermique (W/(m.K))
   *
   * @param enumTypeLiaisonId {number}
   * @param isolationMur {string}
   * @return {number|undefined}
   */
  getKForMur(enumTypeLiaisonId, isolationMur) {
    const k = tv['pont_thermique'].find(
      (v) =>
        parseInt(v.enum_type_liaison_id) === enumTypeLiaisonId &&
        v.isolation_mur.toLowerCase() === isolationMur.toLowerCase()
    )?.k;

    if (!k) {
      logger.error(`Pas de valeur forfaitaire k pour isolationMur:${isolationMur}`);
      return;
    }

    return parseFloat(k);
  }

  /**
   * Valeur du pont thermique (W/(m.K))
   *
   * @param enumTypeLiaisonId {number}
   * @param isolationMur {string}
   * @param isolationPlancher {string}
   * @return {number|undefined}
   */
  getKForPlancher(enumTypeLiaisonId, isolationMur, isolationPlancher) {
    const k = tv['pont_thermique'].find(
      (v) =>
        parseInt(v.enum_type_liaison_id) === enumTypeLiaisonId &&
        v.isolation_mur.toLowerCase() === isolationMur.toLowerCase() &&
        v.isolation_plancher.toLowerCase() === isolationPlancher.toLowerCase()
    )?.k;

    if (!k) {
      logger.error(
        `Pas de valeur forfaitaire k pour isolationMur:${isolationMur}, isolationPlancher:${isolationPlancher}`
      );
      return;
    }

    return parseFloat(k);
  }

  /**
   * Valeur du pont thermique (W/(m.K))
   *
   * @param enumTypeLiaisonId {number}
   * @param isolationMur {string}
   * @param typePose {number}
   * @param presenceRetourIsolation {number}
   * @param largeurDormant {number}
   * @return {number|undefined}
   */
  getKForMenuiserie(
    enumTypeLiaisonId,
    isolationMur,
    typePose,
    presenceRetourIsolation,
    largeurDormant
  ) {
    const k = tv['pont_thermique'].find(
      (v) =>
        parseInt(v.enum_type_liaison_id) === enumTypeLiaisonId &&
        v.isolation_mur.toLowerCase() === isolationMur.toLowerCase() &&
        (!v.enum_type_pose_id || parseInt(v.enum_type_pose_id) === typePose) &&
        (!v.presence_retour_isolation ||
          parseInt(v.presence_retour_isolation) === presenceRetourIsolation) &&
        (!v.largeur_dormant || !largeurDormant || parseInt(v.largeur_dormant) === largeurDormant)
    )?.k;

    if (!k) {
      logger.error(
        `Pas de valeur forfaitaire k pour isolationMur:${isolationMur}, typePose:${typePose}, presenceRetourIsolation:${presenceRetourIsolation}, largeurDormant:${largeurDormant}`
      );
      return;
    }

    return parseFloat(k);
  }
}
