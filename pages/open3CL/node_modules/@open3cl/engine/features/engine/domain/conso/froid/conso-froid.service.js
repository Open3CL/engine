import { inject } from 'dioma';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';

/**
 * Calcul de la consommation en froid
 * Chapitre 10.3 - Les consommations de refroidissement
 *
 * Methode_de_calcul_3CL_DPE_2021 - Page 69
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class ConsoFroidService {
  /**
   * @type {FrTvStore}
   */
  #frStore;

  /**
   * @param frStore {FrTvStore}
   */
  constructor(frStore = inject(FrTvStore)) {
    this.#frStore = frStore;
  }

  /**
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @return {{besoin_fr: number, besoin_fr_depensier: number}}
   */
  execute(ctx, logement) {
    const climatisations = logement.climatisation_collection?.climatisation || [];

    climatisations.forEach((climatisation) => {
      const consos = this.consoFroid(ctx, logement.sortie.apport_et_besoin, climatisation);

      climatisation.donnee_intermediaire ??= {};
      climatisation.donnee_intermediaire.besoin_fr = consos.besoin_fr;
      climatisation.donnee_intermediaire.besoin_fr_depensier = consos.besoin_fr_depensier;
      climatisation.donnee_intermediaire.conso_fr = consos.conso_fr;
      climatisation.donnee_intermediaire.conso_fr_depensier = consos.conso_fr_depensier;
    });
  }

  /**
   * Calcul de la consommation en froid d'un système de refroidissement
   *
   * @param ctx {Contexte}
   * @param apportEtBesoin {ApportEtBesoin}
   * @param climatisation {Climatisation}
   * @returns {{besoin_fr: number, besoin_fr_depensier: number, conso_fr: number, conso_fr_depensier: number}}
   */
  consoFroid(ctx, apportEtBesoin, climatisation) {
    let eer;

    /** @type {ClimatisationDE} **/
    const climatisationDE = climatisation.donnee_entree;

    /** @type {ClimatisationDI} **/
    const climatisationDI = climatisation.donnee_intermediaire || {};

    const ratioSurfaceClimatisation =
      (climatisationDE.surface_clim || ctx.surfaceHabitable) / ctx.surfaceHabitable;
    const besoin_fr = apportEtBesoin.besoin_fr * ratioSurfaceClimatisation;
    const besoin_fr_depensier = apportEtBesoin.besoin_fr_depensier * ratioSurfaceClimatisation;

    /**
     * Si la méthode de saisie n'est pas "Valeur forfaitaire" mais "caractéristiques saisies"
     * Documentation 3CL : "Pour les installations récentes ou recommandées, les caractéristiques réelles des chaudières présentées sur les bases
     * de données professionnelles peuvent être utilisées."
     *
     * 6 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système thermodynamique : scop/cop/eer
     * 7 - déterminé à partir du rset/rsee( etude rt2012/re2020)
     * 8 - seer saisi pour permettre la saisie de réseau de froid ou de système de climatisations qui ne sont pas éléctriques
     */
    if (
      ![6, 7, 8].includes(parseInt(climatisationDE.enum_methode_saisie_carac_sys_id)) ||
      !climatisationDI.eer
    ) {
      eer = this.#frStore.getEer(
        ctx.zoneClimatique.id,
        parseInt(climatisationDE.enum_periode_installation_fr_id)
      );
    } else {
      eer = climatisationDI.eer;
    }

    return {
      besoin_fr,
      besoin_fr_depensier,
      conso_fr: (0.9 * besoin_fr) / eer,
      conso_fr_depensier: (0.9 * besoin_fr_depensier) / eer
    };
  }
}
