import { PRECISION } from './constants.js';
import { DeperditionService } from './deperdition.service.js';

/**
 * Calcul des déperditions de l’enveloppe GV
 * Chapitre 3.2.2 Calcul des planchers bas
 *
 * Méthode de calcul 3CL-DPE 2021
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class DeperditionPlancherBasService extends DeperditionService {
  /**
   * @param tvStore {TvStore}
   */
  constructor(tvStore) {
    super(tvStore);
  }

  /**
   * @param ctx {Contexte}
   * @param pbDE {PlancherBasDE}
   * @param plancherBas {PlancherBas[]}
   * @return {PlancherBasDI}
   */
  process(ctx, pbDE, plancherBas) {
    const upb0 = this.#upb0(pbDE);
    const upb = this.#upb(pbDE, upb0, ctx);
    const upb_final = this.#upbFinal(pbDE, upb, ctx, plancherBas);
    const b = this.b({
      enumTypeAdjacenceId: pbDE.enum_type_adjacence_id,
      surfaceAiu: pbDE.surface_aiu,
      surfaceAue: pbDE.surface_aue,
      enumCfgIsolationLncId: pbDE.enum_cfg_isolation_lnc_id,
      zoneClimatiqueId: ctx.zoneClimatiqueId
    });

    /** @type {PlancherBasDI} */
    return { upb0, upb, upb_final, b };
  }

  /**
   * @param pbDE {PlancherBasDE}
   * @param upb0 {number}
   * @param ctx {Contexte}
   * @return {number|undefined}
   */
  #upb(pbDE, upb0, ctx) {
    // On determine upb_nu (soit upb0 soit 2 comme valeur minimale forfaitaire)
    const upbNu = Math.min(upb0, 2);

    const enumPeriodeIsolationId = this.getEnumPeriodeIsolationId(
      pbDE.enum_periode_isolation_id,
      ctx
    );

    // Selon l'isolation, on applique un calcul au upb nu pour simuler son isolation
    let upb;
    switch (pbDE.enum_methode_saisie_u_id) {
      case '1': // non isolé
        upb = upbNu;
        break;
      case '2': // isolation inconnue (table forfaitaire)
      case '7': // année d'isolation différente de l'année de construction
      case '8': // année de construction saisie
        upb = Math.min(
          upbNu,
          this.tvStore.getUpb(enumPeriodeIsolationId, ctx.zoneClimatiqueId, ctx.effetJoule)
        );
        break;
      case '3': // epaisseur isolation saisie justifiée par mesure ou observation
      case '4': // epaisseur isolation saisie (en cm)
        upb = 1 / (1 / upbNu + (pbDE.epaisseur_isolation * 0.01) / 0.042);
        break;
      case '5':
      case '6': // resistance isolation saisie
        upb = 1 / (1 / upbNu + pbDE.resistance_isolation);
        break;
      default: // saisie direct de la valeur de u
        upb = pbDE.upb_saisi;
        break;
    }

    return Math.round(parseFloat(upb) * PRECISION) / PRECISION;
  }

  /**
   * @param pbDE {PlancherBasDE}
   * @return {number|undefined}
   */
  #upb0(pbDE) {
    let upb0;
    switch (pbDE.enum_methode_saisie_u0_id) {
      case '1': // 'type de paroi inconnu (valeur par défaut)'
      case '2': // 'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire'
        upb0 = this.tvStore.getUpb0(pbDE.enum_type_plancher_bas_id);
        break;
      case '5': // 'u0 non saisi car le u est saisi connu et justifié.'
        return;
      default: // Valeur saisie
        return pbDE.upb0_saisi;
    }

    return upb0;
  }

  /**
   * Pour les vides sanitaires, les sous-sol non chauffés et terre-plein, le calcul des déperditions se fait avec un coefficient
   * Ue en remplacement de Upb.
   *
   * @param pbDE {PlancherBasDE}
   * @param upb {number}
   * @param ctx {Contexte}
   * @param plancherBas {PlancherBas[]}
   * @return {number|undefined}
   */
  #upbFinal(pbDE, upb, ctx, plancherBas) {
    if (pbDE.calcul_ue === 1) {
      return pbDE.ue;
    }

    /**
     * 3 - vide sanitaire
     * 5 - terre-plein
     * 6 - sous-sol non chauffé
     */
    if (!['3', '5', '6'].includes(pbDE.enum_type_adjacence_id)) {
      return upb;
    }

    /**
     * La surface Ue est la surface de tous les planchers bas ayant le même type d'adjacence
     * Le périmètre Ue est le périmètre de tous les planchers bas ayant le même type d'adjacence
     */
    const { surfaceUe, perimetreUe } = plancherBas
      .filter(
        (plancherBas) =>
          pbDE.enum_type_adjacence_id === plancherBas.donnee_entree.enum_type_adjacence_id
      )
      .reduce(
        (acc, plancherBas) => {
          acc.surfaceUe +=
            plancherBas.donnee_entree.surface_ue || plancherBas.donnee_entree.surface_paroi_opaque;
          acc.perimetreUe += plancherBas.donnee_entree.perimetre_ue || 0;
          return acc;
        },
        { surfaceUe: 0, perimetreUe: 0 }
      );

    const available2sp = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20];
    let dsp = perimetreUe ? Math.round((2 * surfaceUe) / perimetreUe) : 1;

    // Recherche de la valeur la plus proche dans les valeurs disponibles
    dsp = available2sp.reduce((prev, curr) => {
      return Math.abs(curr - dsp) < Math.abs(prev - dsp) ? curr : prev;
    });

    const upbFinal = this.tvStore.getUeByUpd(
      pbDE.enum_type_adjacence_id,
      ctx.enumPeriodeConstructionId,
      dsp,
      upb
    );

    return Math.round(parseFloat(upbFinal) * PRECISION) / PRECISION;
  }
}
