import { logger } from '../../../../../core/util/logger/log-service.js';
import { inject } from 'dioma';
import { PRECISION } from '../../constants.js';
import { DeperditionService } from '../deperdition.service.js';
import { TvStore } from '../../../../dpe/infrastructure/tv.store.js';

/**
 * Calcul des déperditions de l’enveloppe GV
 * Chapitre 3.2.1 Calcul des Umur
 *
 * Méthode de calcul 3CL-DPE 2021
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class DeperditionMurService extends DeperditionService {
  /**
   * @param tvStore {TvStore}
   */
  constructor(tvStore = inject(TvStore)) {
    super(tvStore);
  }

  /**
   * @param ctx {Contexte}
   * @param murDE {MurDE}
   * @return {MurDI}
   */
  execute(ctx, murDE) {
    const umur0 = this.#umur0(murDE);
    const umur = this.#umur(murDE, umur0, ctx);
    const b = this.b({
      enumTypeAdjacenceId: murDE.enum_type_adjacence_id,
      surfaceAiu: murDE.surface_aiu,
      surfaceAue: murDE.surface_aue,
      enumCfgIsolationLncId: murDE.enum_cfg_isolation_lnc_id,
      tvCoefReductionDeperditionId: murDE.tv_coef_reduction_deperdition_id,
      zoneClimatique: ctx.zoneClimatique.value
    });

    /** @type {MurDI} */
    return { umur0, umur, b };
  }

  /**
   * @param murDE {MurDE}
   * @param umur0 {number}
   * @param ctx {Contexte}
   * @return {number|undefined}
   */
  #umur(murDE, umur0, ctx) {
    // On determine umur_nu (soit umur0 soit 2.5 comme valeur minimale forfaitaire)
    const umurNu = Math.min(umur0, 2.5);

    const enumPeriodeIsolationId = this.getEnumPeriodeIsolationId(
      murDE.enum_periode_isolation_id,
      ctx
    );

    // Selon l'isolation, on applique un calcul au mur nu pour simuler son isolation
    let umur;
    switch (murDE.enum_methode_saisie_u_id) {
      case '1': // non isolé
        umur = umurNu;
        break;
      case '2': // isolation inconnue (table forfaitaire)
        umur = Math.min(
          umurNu,
          this.tvStore.getUmur(ctx.enumPeriodeConstructionId, ctx.zoneClimatique.id, ctx.effetJoule)
        );
        break;
      case '7': // année d'isolation différente de l'année de construction
      case '8': // année de construction saisie
        umur = Math.min(
          umurNu,
          this.tvStore.getUmur(enumPeriodeIsolationId, ctx.zoneClimatique.id, ctx.effetJoule)
        );
        break;
      case '3': // epaisseur isolation saisie justifiée par mesure ou observation
      case '4': {
        // epaisseur isolation saisie (en cm)
        const epaisseurIsolation = murDE.epaisseur_isolation;
        if (epaisseurIsolation) {
          umur = 1 / (1 / umurNu + (murDE.epaisseur_isolation * 0.01) / 0.04);
        } else {
          logger.warn(
            `Le mur ${murDE.description} ne possède pas de donnée d'entrée pour epaisseur_isolation 
              alors que methode_saisie_u = 'epaisseur isolation saisie'`
          );
          umur = Math.min(umur0, 2.5);
        }
        break;
      }
      case '5':
      case '6':
        // resistance isolation saisie
        umur = 1 / (1 / umurNu + murDE.resistance_isolation);
        break;
      default:
        // saisie direct de la valeur de u
        umur = murDE.umur_saisi;
        break;
    }

    return Math.round(parseFloat(umur) * PRECISION) / PRECISION;
  }

  /**
   * @param murDE {MurDE}
   * @return {number|undefined}
   */
  #umur0(murDE) {
    let umur0;
    switch (murDE.enum_methode_saisie_u0_id) {
      case '1':
        umur0 = this.tvStore.getUmur0(murDE.enum_materiaux_structure_mur_id);
        break;
      case '2':
        umur0 = this.tvStore.getUmur0(
          murDE.enum_materiaux_structure_mur_id,
          murDE.epaisseur_structure
        );
        break;
      case '5':
        // Valeur u saisie directement umur0 vide
        return;
      default:
        // Valeur saisie
        return murDE.umur0_saisi;
    }

    /**
     * Pour l’ensemble des parois, la présence d’un doublage apporte une résistance thermique supplémentaire
     */
    switch (murDE.enum_type_doublage_id) {
      case '3':
        // doublage indéterminé ou lame d'air inf 15 mm
        umur0 = 1 / (1 / umur0 + 0.1);
        break;
      case '4': // doublage indéterminé ou lame d'air sup 15 mm
      case '5': // doublage connu (plâtre brique bois)
        umur0 = 1 / (1 / umur0 + 0.21);
        break;
      default:
        // absence de doublage ou inconnu
        break;
    }

    /**
     * Pour les parois dites « anciennes », c’est-à-dire constituées de matériaux traditionnels à savoir pierres, terre, mur à
     * colombage, brique ancienne, la présence d’un enduit isolant n’est pas considérée comme une isolation. Cependant,
     * cet enduit apporte une correction d’isolation qu’il faut prendre en compte
     *
     * la paroi est une paroi ancienne sur laquelle a été appliquée un enduit isolant (Renduit=0,7m².K.W-1) 0 : non 1 : oui.
     * (Attention ! nom de propriété pas tout à fait explicite)
     * OBSOLETE > remplacé par enduit_isolant_paroi_ancienne
     */
    if (murDE.enduit_isolant_paroi_ancienne) {
      umur0 = 1 / (1 / umur0 + 0.7);
    }

    /**
     * @todo Comportement non clairement documenté
     * Dans beaucoup de cas umur0 retourné en le min entre 2.5 et la valeur trouvée,
     * mais pas de documentation sur ce point dans la méthode 3CL
     */
    return Math.min(2.5, Math.round(parseFloat(umur0) * PRECISION) / PRECISION);
  }

  /**
   * Retourner le type d'isolation du mur
   * Si isolation inconnue, on considère isolation iti si la période d'isolation (à défaut année de construction) est > 1975
   *
   * @param ctx {Contexte}
   * @param murDE {MurDE}
   * @return {number}
   */
  typeIsolation(ctx, murDE) {
    const typeIsolation = parseInt(murDE.enum_type_isolation_id);

    // Type d'isolation inconnu
    if (typeIsolation === 1) {
      const periodeIsolation = murDE.enum_periode_isolation_id || ctx.enumPeriodeConstructionId;

      // Année isolation / construction > 1974
      if (parseInt(periodeIsolation) >= 3) {
        // Isolation ITI
        return 3;
      } else {
        // Non isolé
        return 2;
      }
    }

    return typeIsolation;
  }
}
