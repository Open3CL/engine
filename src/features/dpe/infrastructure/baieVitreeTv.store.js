import { tvs as tv } from '../../../tv-v2.js';
import { getRange } from '../../../utils.js';
import { logger } from '../../../core/util/logger/log-service.js';
import { TvStore } from './tv.store.js';
import enums from '../../../enums.js';

/**
 * Accès aux données des tables de valeurs pour les baies vitrées
 */
export class BaieVitreeTvStore extends TvStore {
  /**
   * Coefficient de transmission thermique du vitrage (W/(m².K))
   *
   * @param enumTypeVitrageId {string}
   * @param enumTypeGazLameId {string|undefined}
   * @param enumInclinaisonVitrageId {string|undefined}
   * @param vitrageVir {number|undefined}
   * @param epaisseurLame {number|undefined}
   * @return {number|undefined}
   */
  getUg(enumTypeVitrageId, enumTypeGazLameId, enumInclinaisonVitrageId, vitrageVir, epaisseurLame) {
    const ug = tv['ug'].find(
      (v) =>
        v.enum_type_vitrage_id.split('|').includes(enumTypeVitrageId) &&
        (!enumTypeGazLameId || v.enum_type_gaz_lame_id?.split('|').includes(enumTypeGazLameId)) &&
        (!enumInclinaisonVitrageId ||
          v.enum_inclinaison_vitrage_id?.split('|').includes(enumInclinaisonVitrageId)) &&
        (!vitrageVir || parseInt(vitrageVir) === parseInt(v.vitrage_vir)) &&
        (!epaisseurLame || parseFloat(v.epaisseur_lame) === epaisseurLame)
    )?.ug;

    if (!ug) {
      logger.error(
        `Pas de valeur forfaitaire ug pour enumTypeVitrageId:${enumTypeVitrageId}, enumTypeGazLameId:${enumTypeGazLameId}, enumInclinaisonVitrageId:${enumInclinaisonVitrageId}, vitrageVir:${vitrageVir}, epaisseurLame:${epaisseurLame}`
      );
      return;
    }

    return parseFloat(ug);
  }

  /**
   * Épaisseurs disponibles pour les coefficients de transmission thermique du vitrage (W/(m².K))
   *
   * @return {number[]}
   */
  getEpaisseurAvailableForUg() {
    return [
      ...new Set(tv['ug'].map((value) => parseInt(value.epaisseur_lame) || 0).sort((a, b) => a - b))
    ];
  }

  /**
   * Proportion d’énergie solaire incidente qui pénètre dans le logement par la paroi vitrée
   *
   * @param enumTypeVitrageId {string}
   * @param enumTypeBaieId {string}
   * @param enumTypeMateriauxMenuiserieId {string}
   * @param vitrageVir {number|undefined}
   * @param enumTypePoseId {string|undefined}
   * @return {number|undefined}
   */
  getSw(
    enumTypeVitrageId,
    enumTypeBaieId,
    enumTypeMateriauxMenuiserieId,
    vitrageVir,
    enumTypePoseId
  ) {
    const sw = tv['sw'].find(
      (v) =>
        (!v.enum_type_vitrage_id ||
          v.enum_type_vitrage_id.split('|').includes(enumTypeVitrageId)) &&
        v.enum_type_baie_id.split('|').includes(enumTypeBaieId) &&
        v.enum_type_materiaux_menuiserie_id.split('|').includes(enumTypeMateriauxMenuiserieId) &&
        (!vitrageVir || parseInt(vitrageVir) === parseInt(v.vitrage_vir)) &&
        (!enumTypePoseId || v.enum_type_pose_id.split('|').includes(enumTypePoseId))
    )?.sw;

    if (!sw) {
      logger.error(
        `Pas de valeur forfaitaire sw pour enumTypeVitrageId:${enumTypeVitrageId}, enumTypeBaieId:${enumTypeBaieId}, enumTypeMateriauxMenuiserieId:${enumTypeMateriauxMenuiserieId}, vitrageVir:${vitrageVir}, enumTypePoseId:${enumTypePoseId}`
      );
      return;
    }

    return parseFloat(sw);
  }

  /**
   * Coefficient de transmission thermique des fenêtres
   *
   * @param enumTypeVitrageId {string}
   * @param enumTypeBaieId {string}
   * @param enumTypeMateriauxMenuiserieId {string}
   * @param ug {number|undefined}
   * @return {number|undefined}
   */
  getUw(enumTypeBaieId, enumTypeMateriauxMenuiserieId, ug) {
    let uw;

    /**
     * Pas de notion de ug pour les parois polycarbonate ou verre
     * enum_type_baie_id
     * 1 - paroi en brique de verre pleine
     * 2 - paroi en brique de verre creuse
     * 3 - paroi en polycarbonnate
     */
    if (['1', '2', '3'].includes(enumTypeBaieId)) {
      uw = tv['uw'].find((v) => v.enum_type_baie_id.split('|').includes(enumTypeBaieId))?.uw;
    } else {
      /**
       * 3.3.2 Coefficients Uw des fenêtres / portes-fenêtres
       * Les Uw associés à des Ug non présents dans les tableaux peuvent être obtenus par interpolation ou
       * extrapolation avec les deux Ug tabulés les plus proches.
       */
      const ugValues =
        tv['uw'].filter(
          (v) =>
            v.enum_type_baie_id.split('|').includes(enumTypeBaieId) &&
            v.enum_type_materiaux_menuiserie_id.split('|').includes(enumTypeMateriauxMenuiserieId)
        ) || [];

      let ug1, ug2;

      if (ugValues.length) {
        [ug1, ug2] = getRange(ug, [...new Set(ugValues.map((value) => value.ug).sort())]);

        const uw1 = ugValues.find((value) => value.ug === ug1)?.uw || 0;
        const uw2 = ugValues.find((value) => value.ug === ug2)?.uw || 0;

        const delta_uw = Number(uw2) - Number(uw1);
        const delta_ug = ug2 - ug1 || 0;

        if (delta_ug === 0) {
          uw = Number(uw1);
        } else {
          // Interpolation linéaire si upb n'est pas une valeur connue
          uw = Number(uw1) + (delta_uw * (ug - ug1)) / delta_ug;
        }
      }
    }

    if (!uw) {
      logger.error(
        `Pas de valeur forfaitaire uw pour enumTypeBaieId:${enumTypeBaieId}, enumTypeMateriauxMenuiserieId:${enumTypeMateriauxMenuiserieId}, ug:${ug}`
      );
      return;
    }

    return parseFloat(uw);
  }

  /**
   * La présence de volets aux fenêtres et portes-fenêtres leur apporte un supplément d’isolation avec une résistance
   * additionnelle ΔR
   *
   * @param enumTypeFermetureId {string}
   * @return {number|undefined}
   */
  getDeltar(enumTypeFermetureId) {
    const deltar = tv['deltar'].find((v) =>
      v.enum_type_fermeture_id.split('|').includes(enumTypeFermetureId)
    )?.deltar;

    if (!deltar) {
      logger.error(
        `Pas de valeur forfaitaire deltar pour enumTypeFermetureId:${enumTypeFermetureId}`
      );
      return;
    }

    return parseFloat(deltar);
  }

  /**
   * La présence de volets aux fenêtres et portes-fenêtres leur apporte un supplément d’isolation avec une résistance
   * additionnelle ΔR
   *
   * @param enumTypeFermetureId {string}
   * @param uw {number}
   *
   * @return {number|undefined}
   */
  getUjn(enumTypeFermetureId, uw) {
    let ujn;
    /**
     * 3.3.3 Coefficients Ujn des fenêtres/portes-fenêtres
     * Dans la suite, les Ujn associés à des Uw non présents dans les tableaux peuvent être obtenus par interpolation ou
     * extrapolation avec les deux Uw tabulés les plus proches.
     */
    const deltar = this.getDeltar(enumTypeFermetureId);
    const uwValues =
      tv['ujn'].filter((v) => Number(v.deltar).toPrecision(2) === Number(deltar).toPrecision(2)) ||
      [];

    let uw1, uw2;

    if (uwValues.length) {
      [uw1, uw2] = getRange(uw, [...new Set(uwValues.map((value) => value.uw).sort())]);

      const ujn1 =
        uwValues.find((value) => Number(value.uw).toPrecision(2) === Number(uw1).toPrecision(2))
          ?.ujn || 0;
      const ujn2 =
        uwValues.find((value) => Number(value.uw).toPrecision(2) === Number(uw2).toPrecision(2))
          ?.ujn || 0;

      const delta_ujn = Number(ujn2) - Number(ujn1);
      const delta_uw = uw2 - uw1 || 0;

      if (delta_uw === 0) {
        ujn = Number(ujn1);
      } else {
        // Interpolation linéaire si uw n'est pas une valeur connue
        ujn = Number(ujn1) + (delta_ujn * (uw - uw1)) / delta_uw;
      }

      if (!ujn) {
        logger.error(
          `Pas de valeur forfaitaire ujn pour enumTypeFermetureId:${enumTypeFermetureId}, uw:${uw}`
        );
        return;
      }

      return parseFloat(ujn);
    }
  }

  /**
   * Calcul de l’ombrage créé par un obstacle sur une paroi
   *
   * @param tvCoeffMasqueLointainNonHomogeneId {number}
   * @return {number|undefined}
   */
  getOmbre(tvCoeffMasqueLointainNonHomogeneId) {
    const ombre = tv['coef_masque_lointain_non_homoge'].find(
      (v) =>
        parseInt(v.tv_coef_masque_lointain_non_homogene_id) ===
        parseInt(tvCoeffMasqueLointainNonHomogeneId)
    )?.omb;

    if (!ombre) {
      logger.error(
        `Pas de valeur forfaitaire ombre pour tvCoeffMasqueLointainNonHomogeneId:${tvCoeffMasqueLointainNonHomogeneId}`
      );
      return;
    }

    return parseFloat(ombre);
  }

  /**
   * Calcul de l'incidence d'un masque proche sur une paroi
   *
   * @param tvCoefMasqueProcheId {number}
   * @return {number|undefined}
   */
  getMasqueProche(tvCoefMasqueProcheId) {
    const fe1 = tv['coef_masque_proche'].find(
      (v) => parseInt(v.tv_coef_masque_proche_id) === parseInt(tvCoefMasqueProcheId)
    )?.fe1;

    if (!fe1) {
      logger.error(`Pas de valeur fe1 pour tvCoefMasqueProcheId:${tvCoefMasqueProcheId}`);
      return;
    }

    return parseFloat(fe1);
  }

  /**
   * Calcul de l'incidence d'un masque lointain homogène sur une paroi
   *
   * @param tvCoefMasqueLointainHomogeneId {number}
   * @return {number|undefined}
   */
  getMasqueLointainHomogene(tvCoefMasqueLointainHomogeneId) {
    const fe2 = tv['coef_masque_lointain_homogene'].find(
      (v) =>
        parseInt(v.tv_coef_masque_lointain_homogene_id) === parseInt(tvCoefMasqueLointainHomogeneId)
    )?.fe2;

    if (!fe2) {
      logger.error(
        `Pas de valeur fe2 pour tvCoefMasqueLointainHomogeneId:${tvCoefMasqueLointainHomogeneId}`
      );
      return;
    }

    return parseFloat(fe2);
  }

  /**
   * Calcul des coefficients de réduction de température des espaces tampons
   *
   * @param zoneClimatique {string}
   * @param enumCfgIsolationLncId {number}
   * @return {number|undefined}
   */
  getBver(zoneClimatique, enumCfgIsolationLncId) {
    const bver = tv['coef_reduction_deperdition'].find(
      (v) =>
        zoneClimatique.toLowerCase().startsWith(v.zone_climatique?.toLowerCase()) &&
        parseInt(v.enum_cfg_isolation_lnc_id) === parseInt(enumCfgIsolationLncId)
    )?.b;

    if (!bver) {
      logger.error(
        `Pas de valeur b pour zoneClimatique:${zoneClimatique}, enumCfgIsolationLncId:${enumCfgIsolationLncId}`
      );
      return;
    }

    return parseFloat(bver);
  }

  /**
   * Calcul des coefficients de transparence des espaces tampons
   *
   * @param tvCoefTransparenceEtsId {number}
   * @return {number|undefined}
   */
  getCoefTransparenceEts(tvCoefTransparenceEtsId) {
    const coefTransparence = tv['coef_transparence_ets'].find(
      (v) => parseInt(v.tv_coef_transparence_ets_id) === parseInt(tvCoefTransparenceEtsId)
    )?.coef_transparence_ets;

    if (!coefTransparence) {
      logger.error(
        `Pas de valeur coef_transparence_ets pour tvCoefTransparenceEtsId:${tvCoefTransparenceEtsId}`
      );
      return;
    }

    return parseFloat(coefTransparence);
  }

  /**
   * @see 18.5 - Coefficients d’orientation et d’inclinaison des parois vitrées : C1
   *
   * @param enumOrientationId {number}
   * @param enumInclinaisonVitrageId {number}
   * @param zoneClimatiqueId {number}
   * @param mois {string}
   *
   * @return {number|undefined}
   */
  getCoefficientBaieVitree(enumOrientationId, enumInclinaisonVitrageId, zoneClimatiqueId, mois) {
    const orientation = enums.orientation[enumOrientationId];
    const inclinaison = enums.inclinaison_vitrage[enumInclinaisonVitrageId];
    const zoneClimatique = enums.zone_climatique[zoneClimatiqueId];

    const c1ZoneClimatique = tv['c1'][zoneClimatique][mois];

    if (inclinaison === 'horizontal') {
      return c1ZoneClimatique[inclinaison];
    }

    return c1ZoneClimatique[`${orientation} ${inclinaison}`];
  }
}
