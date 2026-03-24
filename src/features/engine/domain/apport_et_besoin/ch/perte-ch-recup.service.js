import { mois_liste } from '../../../../../utils.js';
import { inject } from 'dioma';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';

/**
 * Calcul des pertes récupérées de génération de chauffage
 * Chapitre 9.1.1 Consommation de chauffage
 *
 * Données calculées
 *  — pertes_generateur_ch_recup : pertes récupérées de génération pour le chauffage (kWh)
 *  — pertes_generateur_ch_recup_depensier : pertes récupérées de génération pour le chauffage (kWh) pour le scénario dépensier
 *
 * Methode_de_calcul_3CL_DPE_2021 - Page 57
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class PerteChRecupService {
  /**
   * @type {FrTvStore}
   */
  #tvStore;

  /**
   * @param tvStore {FrTvStore}
   */
  constructor(tvStore = inject(FrTvStore)) {
    this.#tvStore = tvStore;
  }

  /**
   * Pertes récupérées des générateurs de chauffage pour le chauffage (kWh)
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @return {{pertes_generateur_ch_recup: number, pertes_generateur_ch_recup_depensier: number}}
   */
  execute(ctx, logement) {
    return {
      pertes_generateur_ch_recup: this.pertesGenerateurChRecup(ctx, logement, false) / 1000,
      pertes_generateur_ch_recup_depensier: this.pertesGenerateurChRecup(ctx, logement, true) / 1000
    };
  }

  /**
   * Pertes récupérées des générateurs de chauffage pour le chauffage (Wh)
   * 9.1.1 Consommation de chauffage
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @param depensier {boolean}
   * @returns {number}
   */
  pertesGenerateurChRecup(ctx, logement, depensier) {
    const generateursWithPertesGeneration = this.generateursWithPertesGeneration(logement);

    return mois_liste.reduce((acc, mois) => {
      return (
        acc +
        this.Qrec(
          generateursWithPertesGeneration,
          this.#tvStore.getData(
            depensier ? 'nref21' : 'nref19',
            ctx.altitude.value,
            ctx.zoneClimatique.value,
            mois,
            ctx.inertie.ilpa
          ),
          depensier
            ? logement.donnees_de_calcul.besoinChauffageDepensierHP[mois]
            : logement.donnees_de_calcul.besoinChauffageHP[mois]
        )
      );
    }, 0);
  }

  /**
   * Pertes récupérées des générateurs de chauffage pour le chauffage
   * 9.1.1 Consommation de chauffage
   *
   * Seules les pertes des générateurs en volume chauffé sont récupérables.
   * Les pertes récupérées des générateurs d’air chaud sont nulles.
   *
   * @param logement {Logement}
   */
  generateursWithPertesGeneration(logement) {
    const installationsCh =
      logement.installation_chauffage_collection?.installation_chauffage || [];

    return installationsCh.reduce((acc, installation) => {
      // Liste des générateurs de chauffage pour lesquels il y a une récupération d'énergie
      return acc.concat(
        (installation.generateur_chauffage_collection?.generateur_chauffage || []).filter(
          (generateurChauffage) => {
            const generateurChauffageDE = generateurChauffage.donnee_entree;

            /**
             * 50 - générateur à air chaud à combustion avant 2006
             * 51 - générateur à air chaud à combustion standard a partir de 2006
             * 52 - générateur à air chaud à combustion à condensation a partir de 2006
             */
            return (
              (generateurChauffageDE.position_volume_chauffe ?? 0) === 1 &&
              ![50, 51, 52].includes(parseInt(generateurChauffageDE.enum_type_generateur_ch_id))
            );
          }
        )
      );
    }, []);
  }

  /**
   * Pertes récupérées de génération pour le chauffage sur le mois j (Wh)
   *
   * @param generateurs {GenerateurChauffage[]}
   * @param nref {number}
   * @param besoinChauffageMois {number}
   * @constructor
   */
  Qrec(generateurs, nref, besoinChauffageMois) {
    return generateurs.reduce((acc, generateur) => {
      const generateurChauffageDE = generateur.donnee_entree;
      const generateurChauffageDI = generateur.donnee_intermediaire;

      /**
       * Part des pertes par les parois égale à 0,75 pour les équipements à ventouse ou assistés par ventilateur
       * et 0,5 pour les autres
       * @type {number}
       */
      const Cper = parseInt(generateurChauffageDE.presence_ventouse || 0) === 1 ? 0.75 : 0.5;

      /**
       * Durée pendant laquelle les pertes sont récupérées sur le mois (h)
       */
      let Dperj;
      switch (parseInt(generateurChauffageDE.enum_usage_generateur_id)) {
        case 1:
          // Pour les générateurs assurant le chauffage uniquement
          Dperj = Math.min(
            nref,
            this.#pertes_gen_ch(besoinChauffageMois, generateurChauffageDI.pn)
          );
          break;
        case 2:
          // Pour les générateurs assurant l’ECS uniquement
          Dperj = this.#pertes_gen_ecs(nref);
          break;
        case 3:
          // Pour les générateurs assurant le chauffage et l’ECS
          Dperj = Math.min(
            nref,
            this.#pertes_gen_ch(besoinChauffageMois, generateurChauffageDI.pn) +
              this.#pertes_gen_ecs(nref)
          );
          break;
      }

      return acc + 0.48 * Cper * generateurChauffageDI.qp0 * Dperj || 0;
    }, 0);
  }

  #pertes_gen_ch(Bch, pn) {
    return (1.3 * Bch * 1000) / (0.3 * pn);
  }

  #pertes_gen_ecs(nref) {
    return (nref * 1790) / 8760;
  }
}
