import { tvs as tv } from '../../../tv-v2.js';
import { getRange } from '../../../utils.js';
import { logger } from '../../../core/util/logger/log-service.js';
import { TypeHabitation } from '../domain/models/type-habitation.model.js';

/**
 * Accès aux données des tables de valeurs
 *
 * /!\ Les tableaux des valeurs doivent souvent être ordonnés (ex: epaisseur_structure pour umur0)
 */
export class TvStore {
  /**
   * Coefficients U des portes
   * Si le coefficient U des portes est connu et justifié, le saisir directement. Sinon, prendre les valeurs forfaitaires
   *
   * @see Chapitre 3.3.4
   *
   * @param enumTypePorteId {string} Identifiant du type de porte
   * @return {number|undefined} Uporte si trouvé, sinon undefined
   */
  getUPorte(enumTypePorteId) {
    const uPorte = tv['uporte'].find((v) =>
      v.enum_type_porte_id.split('|').includes(enumTypePorteId)
    )?.uporte;

    if (!uPorte) {
      logger.error(`Pas de valeur forfaitaire uPorte pour enumTypePorteId:${enumTypePorteId}`);
      return;
    }

    logger.debug(`uPorte pour type ${enumTypePorteId} = ${uPorte}`);
    return parseFloat(uPorte);
  }

  /**
   * Coefficient de réduction des déperditions b
   * @param enumTypeAdjacenceId {string}
   * @param uVue {number|undefined}
   * @param enumCfgIsolationLncId {string|undefined}
   * @param rAiuAue {number|undefined}
   * @param zc {string|undefined}
   * @return {number|undefined}
   */
  getB(
    enumTypeAdjacenceId,
    uVue = undefined,
    enumCfgIsolationLncId = undefined,
    rAiuAue = undefined,
    zc = undefined
  ) {
    const b = tv['coef_reduction_deperdition'].find(
      (v) =>
        (!enumTypeAdjacenceId ||
          v.enum_type_adjacence_id.split('|').includes(enumTypeAdjacenceId)) &&
        (!uVue || !v.uvue || parseFloat(v.uvue) === uVue) &&
        (!enumCfgIsolationLncId ||
          !v.enum_cfg_isolation_lnc_id ||
          v.enum_cfg_isolation_lnc_id === enumCfgIsolationLncId) &&
        (!zc ||
          !v.zone_climatique ||
          zc.toLowerCase().startsWith(v.zone_climatique.toLowerCase())) &&
        (!rAiuAue ||
          ((!v.aiu_aue_min || v.aiu_aue_min < rAiuAue) &&
            (!v.aiu_aue_max || v.aiu_aue_max >= rAiuAue)))
    )?.b;

    if (!b) {
      logger.error(`Pas de valeur forfaitaire b pour enumTypeAdjacenceId:${enumTypeAdjacenceId}`);
      return;
    }

    logger.debug(`b pour enumTypeAdjacenceId ${enumTypeAdjacenceId} = ${b}`);
    return parseFloat(b);
  }

  /**
   * Coefficient surfacique équivalent
   * @param enumTypeAdjacenceId {string}
   * @return {number|undefined}
   */
  getUVue(enumTypeAdjacenceId) {
    const uvue = tv['uvue'].find((v) => v.enum_type_adjacence_id === enumTypeAdjacenceId)?.uvue;

    if (!uvue) {
      logger.error(
        `Pas de valeur forfaitaire uVue pour enumTypeAdjacenceId:${enumTypeAdjacenceId}`
      );
      return;
    }

    logger.debug(`uvue pour enumTypeAdjacenceId ${enumTypeAdjacenceId} = ${uvue}`);
    return parseFloat(uvue);
  }

  /**
   * Coefficient de transmission thermique du mur non isolé
   * @param enumMateriauxStructureMurId {string}
   * @param epaisseurStructure {number|undefined}
   * @return {number|undefined}
   */
  getUmur0(enumMateriauxStructureMurId, epaisseurStructure = undefined) {
    const umur0 = tv['umur0']
      .filter((v) => v.enum_materiaux_structure_mur_id === enumMateriauxStructureMurId)
      .find(
        (v, idx, items) =>
          !v.epaisseur_structure ||
          !epaisseurStructure ||
          !items[idx + 1] ||
          epaisseurStructure < parseFloat(items[idx + 1].epaisseur_structure)
      )?.umur0;

    if (!umur0) {
      logger.error(
        `Pas de valeur forfaitaire umur0 pour enumMateriauxStructureMurId:${enumMateriauxStructureMurId}`
      );
      return;
    }

    logger.debug(
      `umur0 pour enumMateriauxStructureMurId ${enumMateriauxStructureMurId} = ${umur0}`
    );
    return parseFloat(umur0);
  }

  /**
   * Coefficient de transmission thermique du mur
   * @param enumPeriodeConstructionId {string}
   * @param enumZoneClimatiqueId {string}
   * @param effetJoule {boolean}
   * @return {number|undefined}
   */
  getUmur(enumPeriodeConstructionId, enumZoneClimatiqueId, effetJoule = false) {
    const umur = tv['umur'].find(
      (v) =>
        v.enum_periode_construction_id.split('|').includes(enumPeriodeConstructionId) &&
        v.enum_zone_climatique_id.split('|').includes(enumZoneClimatiqueId) &&
        effetJoule === (parseInt(v.effet_joule) === 1)
    )?.umur;

    if (!umur) {
      logger.error(
        `Pas de valeur forfaitaire umur pour enumPeriodeConstructionId:${enumPeriodeConstructionId}, enumPeriodeConstructionId:${enumPeriodeConstructionId}`
      );
      return;
    }

    logger.debug(
      `umur pour enumPeriodeConstructionId:${enumPeriodeConstructionId}, enumPeriodeConstructionId:${enumPeriodeConstructionId} = ${umur}`
    );
    return parseFloat(umur);
  }

  /**
   * Coefficient de transmission thermique du plancher bas
   * @param enumTypePlancherBasId {string}
   * @return {number|undefined}
   */
  getUpb0(enumTypePlancherBasId) {
    const upbO = tv['upb0'].find(
      (v) => v.enum_type_plancher_bas_id === enumTypePlancherBasId
    )?.upb0;

    if (!upbO) {
      logger.error(
        `Pas de valeur forfaitaire upbO pour enumTypePlancherBasId:${enumTypePlancherBasId}`
      );
      return;
    }

    logger.debug(`upbO pour enumTypePlancherBasId ${enumTypePlancherBasId} = ${upbO}`);
    return parseFloat(upbO);
  }

  /**
   * Coefficient de transmission thermique du plancher bas
   * @param enumPeriodeConstructionId {string}
   * @param enumZoneClimatiqueId {string}
   * @param effetJoule {boolean}
   * @return {number|undefined}
   */
  getUpb(enumPeriodeConstructionId, enumZoneClimatiqueId, effetJoule = false) {
    const upb = tv['upb'].find(
      (v) =>
        v.enum_zone_climatique_id.split('|').includes(enumZoneClimatiqueId) &&
        v.enum_periode_construction_id.split('|').includes(enumPeriodeConstructionId) &&
        effetJoule === (parseInt(v.effet_joule) === 1)
    )?.upb;

    if (!upb) {
      logger.error(
        `Pas de valeur forfaitaire upb pour enumPeriodeConstructionId:${enumPeriodeConstructionId}, enumPeriodeConstructionId:${enumPeriodeConstructionId}`
      );
      return;
    }

    logger.debug(
      `upb pour enumPeriodeConstructionId:${enumPeriodeConstructionId}, enumPeriodeConstructionId:${enumPeriodeConstructionId} = ${upb}`
    );
    return parseFloat(upb);
  }

  /**
   * Retourne la valeur UE la plus proche
   * @param enumTypeAdjacenceId {string}
   * @param enumPeriodeConstructionId {string}
   * @param dsp {number} Valeur entière la plus proche de 2S/P
   * @param upb {number} Valeur de upb
   * @return {number|undefined}
   */
  getUeByUpd(enumTypeAdjacenceId, enumPeriodeConstructionId, dsp, upb) {
    const ueValues =
      tv['ue'].filter(
        (v) =>
          parseInt(v['2s_p']) === dsp &&
          v.enum_type_adjacence_id.split('|').includes(enumTypeAdjacenceId) &&
          v.enum_periode_construction_id.split('|').includes(enumPeriodeConstructionId)
      ) || [];

    const ueRange = [...new Set(ueValues.map((value) => value.upb).sort())];
    let ue;
    let upb1, upb2;

    if (ueValues.length) {
      [upb1, upb2] = getRange(upb, ueRange);

      const ue1 = ueValues.find((value) => value.upb === upb1)?.ue || 0;
      const ue2 = ueValues.find((value) => value.upb === upb2)?.ue || 0;

      const delta_ue = Number(ue2) - Number(ue1);
      const delta_upb = upb2 - upb1 || 0;

      if (delta_upb === 0) {
        ue = Number(ue1);
      } else {
        // Interpolation linéaire si upb n'est pas une valeur connue
        ue = Number(ue1) + (delta_ue * (upb - upb1)) / delta_upb;
      }
    }

    if (ue === undefined) {
      logger.error(
        `Pas de valeur forfaitaire ue pour enumTypeAdjacenceId:${enumTypeAdjacenceId}, enumPeriodeConstructionId:${enumPeriodeConstructionId}, 2S/P:${dsp}`
      );
      return;
    }

    logger.debug(
      `ue pour enumTypeAdjacenceId:${enumTypeAdjacenceId}, enumPeriodeConstructionId:${enumPeriodeConstructionId}, 2S/P:${dsp} = ${ue}`
    );
    return parseFloat(ue);
  }

  /**
   * Coefficient de transmission thermique du plancher haut
   * @param enumTypePlancherHautId {string}
   * @return {number|undefined}
   */
  getUph0(enumTypePlancherHautId) {
    const uph0 = tv['uph0'].find((v) =>
      v.enum_type_plancher_haut_id.split('|').includes(enumTypePlancherHautId)
    )?.uph0;

    if (!uph0) {
      logger.error(
        `Pas de valeur forfaitaire uph0 pour enumTypePlancherHautId:${enumTypePlancherHautId}`
      );
      return;
    }

    logger.debug(`upbO pour enumTypePlancherHautId ${enumTypePlancherHautId} = ${uph0}`);
    return parseFloat(uph0);
  }

  /**
   * Coefficient de transmission thermique du plancher bas
   * @param enumPeriodeConstructionId {string}
   * @param typeToiture {('combles'|'terrasse')}
   * @param enumZoneClimatiqueId {string}
   * @param effetJoule {boolean}
   * @return {number|undefined}
   */
  getUph(enumPeriodeConstructionId, typeToiture, enumZoneClimatiqueId, effetJoule = false) {
    const uph = tv['uph'].find(
      (v) =>
        v.enum_periode_construction_id.split('|').includes(enumPeriodeConstructionId) &&
        v.enum_zone_climatique_id.split('|').includes(enumZoneClimatiqueId) &&
        v.type_toiture === typeToiture &&
        effetJoule === (parseInt(v.effet_joule) === 1)
    )?.uph;

    if (!uph) {
      logger.error(
        `Pas de valeur forfaitaire uph pour enumPeriodeConstructionId:${enumPeriodeConstructionId}, enumPeriodeConstructionId:${enumPeriodeConstructionId}, typeToiture:${typeToiture}`
      );
      return;
    }

    logger.debug(
      `uph pour enumPeriodeConstructionId:${enumPeriodeConstructionId}, enumPeriodeConstructionId:${enumPeriodeConstructionId}, typeToiture:${typeToiture} = ${uph}`
    );
    return parseFloat(uph);
  }

  /**
   * Débits de la ventilation
   * @param typeVentilation {number}
   * @return {object|undefined}
   */
  getDebitsVentilation(typeVentilation) {
    const debitsVentilation = tv['debits_ventilation'].find((v) =>
      v.enum_type_ventilation_id.split('|').includes(typeVentilation)
    );

    if (!debitsVentilation) {
      logger.error(
        `Pas de valeur forfaitaire debits_ventilation pour enumTypeVentilationId: ${typeVentilation}`
      );
      return;
    }

    return debitsVentilation;
  }

  /**
   * Valeur conventionnelle de la perméabilité sous 4Pa
   * @see Chapitre 4 - Calcul des déperditions par renouvellement d’air
   *
   * @param periodConstruction {string}
   * @param typeHabitation {TypeHabitation}
   * @param isolationSurface {string | undefined}
   * @param presenceJointsMenuiserie {string | undefined}
   *
   * @return {object|undefined}
   */
  getQ4paConv(periodConstruction, typeHabitation, isolationSurface, presenceJointsMenuiserie) {
    const q4paConv = tv['q4pa_conv'].find(
      (v) =>
        v.enum_periode_construction_id.split('|').includes(periodConstruction) &&
        v.type_habitation.split('/').includes(TypeHabitation[typeHabitation].toLowerCase()) &&
        (isolationSurface === undefined || v.isolation_surfaces === isolationSurface) &&
        (presenceJointsMenuiserie === undefined ||
          v.presence_joints_menuiserie === presenceJointsMenuiserie)
    );

    if (!q4paConv) {
      logger.error(
        `Pas de valeur forfaitaire q4pa_conv pour periodConstruction: ${periodConstruction}, 
        typeHabitation: ${typeHabitation}, isolationSurface: ${isolationSurface}, 
        presenceJointsMenuiserie: ${presenceJointsMenuiserie}`
      );
      return;
    }

    return q4paConv;
  }
}
