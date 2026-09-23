import { DeperditionService } from '../deperdition.service.js';

import { logger } from '../../../../../core/util/logger/log-service.js';
import { TypeHabitation } from '../../../../dpe/domain/models/type-habitation.model.js';
import { TypeVentilation } from '../../../../dpe/domain/models/type-ventilation.model.js';

/**
 * Calcul des déperditions par ventilation
 * Chapitre 4 Calcul des déperditions par renouvellement d’air
 *
 * Méthode de calcul 3CL-DPE 2021
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class DeperditionVentilationService extends DeperditionService {
  /**
   * Calcul des déperditions par ventilation
   * @param ctx {Contexte}
   * @param ventilationDE {VentilationDE}
   * @param surfaceDeperditive {number}
   * @param surfaceIsolee {number}
   * @param surfaceNonIsolee {number}
   * @param surfaceMenuiserieAvecJoint {number}
   * @param surfaceMenuiserieSansJoint {number}
   * @return {VentilationDI}
   */
  execute(
    ctx,
    ventilationDE,
    surfaceDeperditive,
    surfaceIsolee,
    surfaceNonIsolee,
    surfaceMenuiserieAvecJoint,
    surfaceMenuiserieSansJoint
  ) {
    const q4paConv = this.q4paConv(
      ventilationDE,
      ctx,
      surfaceIsolee,
      surfaceNonIsolee,
      surfaceMenuiserieAvecJoint,
      surfaceMenuiserieSansJoint
    );
    const debitsVentilation = this.#debitsVentilation(ventilationDE.enum_type_ventilation_id);

    /** @type {VentilationDI} */
    return {
      ...{
        hvent: this.hvent(ctx.surfaceHabitable, debitsVentilation),
        hperm: this.hperm(ventilationDE, debitsVentilation, ctx, surfaceDeperditive, q4paConv)
      },
      ...this.#consoAuxiliaireVentilation(ventilationDE, ctx, debitsVentilation)
    };
  }

  /**
   * Valeur conventionnelle de la perméabilité sous 4Pa
   *
   * @param ventilationDE {VentilationDE}
   * @param ctx {Contexte}
   * @param surfaceIsolee {number}
   * @param surfaceNonIsolee {number}
   * @param surfaceMenuiserieAvecJoint {number}
   * @param surfaceMenuiserieSansJoint {number}
   * @return {number}
   */
  q4paConv(
    ventilationDE,
    ctx,
    surfaceIsolee,
    surfaceNonIsolee,
    surfaceMenuiserieAvecJoint,
    surfaceMenuiserieSansJoint
  ) {
    // Pour les bâtiments qui ont fait l’objet d’une mesure d’étanchéité à l’air moins de deux ans avant le diagnostic, la valeur
    // mesurée de Q4Paconv/m² peut être saisie.
    if (ventilationDE.q4pa_conv_saisi) {
      return ventilationDE.q4pa_conv_saisi;
    }

    const enumPeriodeConstructionId = ctx.enumPeriodeConstructionId;
    let isolationSurface;
    let presenceJointsMenuiserie;

    if (enumPeriodeConstructionId === '1') {
      // Pour les bâtiments ou logements construits avant 1948, avec une isolation des murs et/ou du plafond (isolation
      // de plus de 50% des surfaces) => valeur forfaitaire.
      isolationSurface = surfaceIsolee > surfaceNonIsolee ? '1' : '0';

      if (isolationSurface === '0') {
        // Pour les bâtiments ou logements construits avant 1948, si les menuiseries possèdent des joints
        // (si les menuiseries représentant plus de 50% de la surface totale possèdent des joints) => valeur forfaitaire.
        if (surfaceMenuiserieAvecJoint > surfaceMenuiserieSansJoint) {
          presenceJointsMenuiserie = '1';
        }
      }
    } else if (enumPeriodeConstructionId === '2') {
      // Pour les bâtiments ou logements construits entre 1948 et 1974, avec une isolation des murs et/ou du plafond (isolation
      // de plus de 50% des surfaces) => valeur forfaitaire.
      isolationSurface = surfaceIsolee > surfaceNonIsolee ? '1' : '0';
    }

    return this.tvStore.getQ4paConv(
      ctx.enumPeriodeConstructionId,
      ctx.typeHabitation,
      isolationSurface,
      presenceJointsMenuiserie
    )?.q4pa_conv;
  }

  /**
   * Déperdition thermique par renouvellement d’air due au système de ventilation
   * @param surfaceHabitable {number}
   * @param debitsVentilation {{qvarep_conv?: number, qvasouf_conv?: number, smea_conv?: number}}
   * @return number
   */
  hvent(surfaceHabitable, debitsVentilation) {
    return 0.34 * Number(debitsVentilation?.qvarep_conv) * surfaceHabitable;
  }

  /**
   * Déperdition thermique par renouvellement d’air due au système de ventilation
   * @param ventilationDE {VentilationDE}
   * @param debitsVentilation {{qvarep_conv?: number, qvasouf_conv?: number, smea_conv?: number}}
   * @param ctx {Contexte}
   * @param surfaceDeperditive {number}
   * @param q4paConv {number}
   * @return number
   */
  hperm(ventilationDE, debitsVentilation, ctx, surfaceDeperditive, q4paConv) {
    const pfe = ventilationDE.plusieurs_facade_exposee;
    const surfaceHabitable = ctx.surfaceHabitable;

    // Coefficients de protection
    const e = pfe ? 0.07 : 0.02;
    const f = pfe ? 15 : 20;

    const q4pa_env = q4paConv * surfaceDeperditive;

    // Perméabilité sous 4 Pa de la zone
    const q4pa = q4pa_env + 0.45 * debitsVentilation?.smea_conv * surfaceHabitable;

    const n50 = q4pa / ((4 / 50) ** (2 / 3) * ctx.hauteurSousPlafond * surfaceHabitable);

    //  Débit d’air dû aux infiltrations liées au vent (m3/h)
    const qvinf =
      (ctx.hauteurSousPlafond * surfaceHabitable * n50 * e) /
      (1 +
        (f / e) *
          ((debitsVentilation?.qvasouf_conv - debitsVentilation?.qvarep_conv) /
            (ctx.hauteurSousPlafond * n50)) **
            2);

    return 0.34 * qvinf;
  }

  /**
   * Puissance moyenne des auxiliaires (W)
   * @param typeVentilation {string}
   * @param ctx {Contexte}
   * @param ventilationPost2012 {boolean}
   * @param debitsVentilation {{qvarep_conv?: number, qvasouf_conv?: number, smea_conv?: number}}
   * @returns {*|number}
   */
  pventMoy(typeVentilation, ctx, ventilationPost2012, debitsVentilation) {
    let hybride = false;

    /** @type {TypeVentilation} **/
    let type;

    /**
     * 1 - ventilation par ouverture des fenêtres
     * 2 - ventilation par entrées d'air hautes et basses
     * 25 - ventilation naturelle par conduit
     * 34 - ventilation naturelle par conduit avec entrées d'air hygro
     * 35 - puits climatique sans échangeur avant 2013
     * 36 - puits climatique sans échangeur à partir de 2013
     * 37 - puits climatique avec échangeur avant 2013
     * 38 - puits climatique avec échangeur à partir de 2013
     */
    if (['1', '2', '25', '34', '35', '36', '37', '38'].includes(typeVentilation)) {
      return 0;
    }

    /**
     * 26 - ventilation hybride avant 2001
     * 27 - ventilation hybride de 2001 à 2012
     * 28 - ventilation hybride après 2012
     * 29 - ventilation hybride avec entrées d'air hygro avant  2001
     * 30 - ventilation hybride avec entrées d'air hygro de 2001 à 2012
     * 31 - ventilation hybride avec entrées d'air hygro après 2012
     */
    if (['26', '27', '28', '29', '30', '31'].includes(typeVentilation)) {
      hybride = true;
      type = TypeVentilation.SIMPLE_FLUX_AUTO;
    }

    /**
     * 3 - vmc sf auto réglable avant 1982
     * 4 - vmc sf auto réglable de 1982 à 2000
     * 5 - vmc sf auto réglable de 2001 à 2012
     * 6 - vmc sf auto réglable après 2012
     * 32 - ventilation mécanique sur conduit existant avant 2013
     * 33 - ventilation mécanique sur conduit existant à partir de 2013
     */
    if (['3', '4', '5', '6', '32', '33'].includes(typeVentilation)) {
      type = TypeVentilation.SIMPLE_FLUX_AUTO;
    }

    /**
     * 10 - vmc sf gaz avant  2001
     * 11 - vmc sf gaz de 2001 à 2012
     * 12 - vmc sf gaz après 2012
     */
    if (['10', '11', '12'].includes(typeVentilation)) {
      type = TypeVentilation.SIMPLE_FLUX_AUTO;
    }

    /**
     * 7 - vmc sf hygro a avant 2001
     * 8 - vmc sf hygro a de 2001 à 2012
     * 9 - vmc sf hygro a après 2012
     * 13 - vmc sf hygro b avant  2001
     * 14 - vmc sf hygro b de 2001 à 2012
     * 15 - vmc sf hygro b après 2012
     * 16 - vmc basse pression auto-réglable
     * 17 - vmc basse pression hygro a
     * 18 - vmc basse pression hygro b
     */
    if (['7', '8', '9', '13', '14', '15', '16', '17', '18'].includes(typeVentilation)) {
      type = TypeVentilation.SIMPLE_FLUX_HYGRO;
    }

    /**
     * 19 - vmc df individuelle avec échangeur avant 2013
     * 20 - vmc df individuelle avec échangeur à partir de 2013
     * 21 - vmc df collective avec échangeur avant 2013
     * 22 - vmc df collective avec échangeur à partir de 2013
     * 23 - vmc df sans échangeur avant 2013
     * 24 - vmc df sans échangeur après 2012
     */
    if (['19', '20', '21', '22', '23', '24'].includes(typeVentilation)) {
      type = TypeVentilation.DOUBLE_FLUX;
    }

    // Puissance des auxiliaires (W/(m³/h))
    let pvent;

    switch (type) {
      case TypeVentilation.SIMPLE_FLUX_AUTO: {
        if (ctx.typeHabitation === TypeHabitation.MAISON) {
          pvent = ventilationPost2012 ? 35 : 65;
        } else {
          pvent = ventilationPost2012 ? 0.25 : 0.46;
        }
        break;
      }
      case TypeVentilation.SIMPLE_FLUX_HYGRO: {
        if (ctx.typeHabitation === TypeHabitation.MAISON) {
          pvent = ventilationPost2012 ? 15 : 50;
        } else {
          pvent = ventilationPost2012 ? 0.25 : 0.46;
        }
        break;
      }
      case TypeVentilation.DOUBLE_FLUX: {
        if (ctx.typeHabitation === TypeHabitation.MAISON) {
          pvent = ventilationPost2012 ? 35 : 80;
        } else {
          pvent = ventilationPost2012 ? 0.6 : 1.1;
        }
        break;
      }
    }

    let pventMoy;

    /**
     * @see Methode_de_calcul_3CL_DPE_2021-338.pdf, pages 41-42
     * Les consommations d’auxiliaires pour une VMC hybride correspondent aux consommations d’une VMC
     * classique autoréglable de 2001 à 2012 multipliées par le ratio du temps d’utilisation
     */
    const ratioUtilisation = hybride
      ? (ctx.typeHabitation === TypeHabitation.MAISON ? 14 : 28) / (24 * 7)
      : 1;

    if (ctx.typeHabitation === TypeHabitation.MAISON) {
      pventMoy = pvent * ratioUtilisation;
    } else {
      pventMoy = pvent * debitsVentilation?.qvarep_conv * ctx.surfaceHabitable * ratioUtilisation;
    }

    return pventMoy;
  }

  /**
   * Débits de ventilation
   * @param typeVentilation {number}
   * @return {{qvarep_conv?: number, qvasouf_conv?: number, smea_conv?: number}}
   */
  #debitsVentilation(typeVentilation) {
    const debitsVentilation = this.tvStore.getDebitsVentilation(typeVentilation);

    return {
      qvarep_conv: Number(debitsVentilation?.qvarep_conv),
      qvasouf_conv: Number(debitsVentilation?.qvasouf_conv),
      smea_conv: Number(debitsVentilation?.smea_conv)
    };
  }

  /**
   * Consommation des auxiliaires de ventilation
   * @param ventilationDE {VentilationDE}
   * @param ctx {Contexte}
   * @param debitsVentilation {{qvarep_conv?: number, qvasouf_conv?: number, smea_conv?: number}}
   * @returns {{conso_auxiliaire_ventilation: number, pvent_moy}|number}
   */
  #consoAuxiliaireVentilation(ventilationDE, ctx, debitsVentilation) {
    const typeVentilation = ventilationDE.enum_type_ventilation_id;
    let ventilationPost2012 = ventilationDE.ventilation_post_2012;

    if (typeVentilation === undefined && ventilationPost2012 === undefined) {
      logger.error(`
        Impossible de calculer la consommation des auxiliaires de ventilation sans les variables enum_type_ventilation_id et ventilation_post_2012
      `);

      return 0;
    }

    // Puissance moyenne des auxiliaires (W)
    const pventMoy = this.pventMoy(typeVentilation, ctx, ventilationPost2012, debitsVentilation);

    return {
      conso_auxiliaire_ventilation: 8.76 * pventMoy,
      pvent_moy: pventMoy
    };
  }
}
