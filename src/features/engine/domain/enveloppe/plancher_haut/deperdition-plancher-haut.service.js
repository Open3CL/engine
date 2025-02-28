import { inject } from 'dioma';
import { PRECISION } from '../../constants.js';
import { DeperditionService } from '../deperdition.service.js';
import { TvStore } from '../../../../dpe/infrastructure/tv.store.js';

/**
 * Calcul des déperditions de l’enveloppe GV
 * Chapitre 3.2.3 Calcul des planchers haut
 *
 * Méthode de calcul 3CL-DPE 2021
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class DeperditionPlancherHautService extends DeperditionService {
  /**
   * @param tvStore {TvStore}
   */
  constructor(tvStore = inject(TvStore)) {
    super(tvStore);
  }

  /**
   * @param ctx {Contexte}
   * @param phDE {PlancherHautDE}
   * @return {PlancherHautDI}
   */
  execute(ctx, phDE) {
    const uph0 = this.#uph0(phDE);
    const uph = this.#uph(phDE, uph0, ctx);
    const b = this.b({
      enumTypeAdjacenceId: phDE.enum_type_adjacence_id,
      surfaceAiu: phDE.surface_aiu,
      surfaceAue: phDE.surface_aue,
      enumCfgIsolationLncId: phDE.enum_cfg_isolation_lnc_id,
      zoneClimatiqueId: ctx.zoneClimatiqueId
    });

    /** @type {PlancherHautDI} */
    return { uph0, uph, b };
  }

  /**
   * @param phDE {PlancherHautDE}
   * @param uph0 {number}
   * @param ctx {Contexte}
   * @return {number|undefined}
   */
  #uph(phDE, uph0, ctx) {
    // On determine uph_nu (soit uph0 soit 2 comme valeur minimale forfaitaire)
    const uphNu = Math.min(uph0, 2.5);

    const enumPeriodeIsolationId = this.getEnumPeriodeIsolationId(
      phDE.enum_periode_isolation_id,
      ctx
    );

    // Selon l'isolation, on applique un calcul au uph nu pour simuler son isolation
    let uph;
    switch (phDE.enum_methode_saisie_u_id) {
      case '1':
        // non isolé
        uph = uphNu;
        break;
      case '2': // isolation inconnue (table forfaitaire)
      case '7': // année d'isolation différente de l'année de construction
      case '8': // année de construction saisie
        uph = Math.min(
          uphNu,
          this.tvStore.getUph(
            enumPeriodeIsolationId,
            this.#getTypeAdjacence(phDE),
            ctx.zoneClimatiqueId,
            ctx.effetJoule
          )
        );
        break;
      case '3': // epaisseur isolation saisie justifiée par mesure ou observation
      case '4': // epaisseur isolation saisie (en cm)
        uph = 1 / (1 / uphNu + (phDE.epaisseur_isolation * 0.01) / 0.04);
        break;
      case '5':
      case '6': // resistance isolation saisie
        uph = 1 / (1 / uphNu + phDE.resistance_isolation);
        break;
      default: // saisie direct de la valeur de u
        uph = phDE.uph_saisi;
        break;
    }

    return Math.round(parseFloat(uph) * PRECISION) / PRECISION;
  }

  /**
   * @param phDE {PlancherHautDE}
   * @return {number|undefined}
   */
  #uph0(phDE) {
    let uph0;
    switch (phDE.enum_methode_saisie_u0_id) {
      case '1':
      case '2':
        // type de paroi inconnu (valeur par défaut)
        // déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire
        uph0 = this.tvStore.getUph0(phDE.enum_type_plancher_haut_id);
        break;
      case '5':
        // u0 non saisi car le u est saisi connu et justifié
        return;
      default:
        // Valeur saisie
        return phDE.uph0_saisi;
    }

    return uph0;
  }

  /**
   * Retourne le type d'adjacence à utiliser combles ou terrasse
   * @see Méthode de calcul 3CL-DPE 2021 (cotobre 2021) chapitre 3.2.3.1
   * "Lorsque le local au-dessus du logement est un local non chauffé, ou un local autre que d’habitation., Uph_tab est pris dans la catégorie « Terrasse »."
   * @param phDE {PlancherHautDE}
   * @return {'combles'|'terasse'}
   */
  #getTypeAdjacence(phDE) {
    switch (phDE.enum_type_adjacence_id) {
      case '1':
        // extérieur - type de ph != 'combles aménagés sous rampant'
        return phDE.enum_type_plancher_haut_id === '12' ? 'combles' : 'terrasse';
      case '7':
        // locaux non chauffés non accessible
        return 'terrasse';
      default:
        return 'combles';
    }
  }

  /**
   * Retourner le type d'isolation du plancher haut
   * Si isolation inconnue :
   *  - Pour les bâtiments d’avant 1975, la paroi est considérée comme non isolée
   *  - Pour les bâtiments construits à partir de 1975, les plafonds sont considérés isolés par l’extérieur
   *
   * @param ctx {Contexte}
   * @param plancherHautDE {PlancherHautDE}
   * @return {number}
   */
  typeIsolation(ctx, plancherHautDE) {
    const typeIsolation = parseInt(plancherHautDE.enum_type_isolation_id);

    // Type d'isolation inconnu
    if (typeIsolation === 1) {
      const periodeIsolation =
        parseInt(plancherHautDE.enum_periode_isolation_id) ||
        parseInt(ctx.enumPeriodeConstructionId);

      // Année isolation / construction < 1975
      if (periodeIsolation < 3) {
        // Non isolé
        return 2;
      } else {
        // Isolation ITE
        return 4;
      }
    }

    // Isolation ITE si "isolé mais type d'isolation inconnu"
    return typeIsolation === 9 ? 4 : typeIsolation;
  }
}
