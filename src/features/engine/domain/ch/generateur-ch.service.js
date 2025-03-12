import { inject } from 'dioma';
import { ChTvStore } from '../../../dpe/infrastructure/ch/chTv.store.js';
import { TypeGenerateur } from '../../../dpe/domain/models/installation-chauffage.model.js';
import { excel_to_js_exec } from '../../../../utils.js';

/**
 * Calcul des données de calcul pour chacun des générateurs
 * Données calculées
 *   — typeGenerateur : pertes à l’arrêt (kW)
 *   — qp0 : pertes à l’arrêt (kW)
 *   — rpn : rendements à pleine charge
 *   — rpint : rendements à charge intermédiaire
 *   — pveil : puissance de la veilleuse
 */
export class GenerateurChService {
  /**
   * @type {ChTvStore}
   */
  #tvStore;

  /**
   * @param tvStore {ChTvStore}
   */
  constructor(tvStore = inject(ChTvStore)) {
    this.#tvStore = tvStore;
  }

  /**
   * Détermination des données de calcul pour une installation de chauffage
   *
   * @param installationChauffage {InstallationChauffage}
   */
  execute(installationChauffage) {
    const generateursChauffage =
      installationChauffage.generateur_chauffage_collection?.generateur_chauffage || [];

    generateursChauffage.forEach((generateurChauffage) => {
      /** @type {GenerateurChauffageDE}*/
      const generateurChauffageDE = generateurChauffage.donnee_entree;

      const typeGenerateur = this.typeGenerateur(generateurChauffageDE);

      generateurChauffage.donnee_utilisateur = {
        typeGenerateur,
        ratio_virtualisation: installationChauffage.donnee_entree.ratio_virtualisation || 1
      };

      if (typeGenerateur === TypeGenerateur.COMBUSTION) {
        generateurChauffage.donnee_utilisateur.generateur = this.#tvStore.getGenerateurCombustion(
          generateurChauffageDE.enum_type_generateur_ch_id,
          generateurChauffage.donnee_intermediaire.pn /
            ((generateurChauffage.donnee_utilisateur.ratio_virtualisation || 1) * 1000)
        );

        const caracteristiques = this.caracteristiques(generateurChauffage);
        generateurChauffage.donnee_intermediaire.qp0 = caracteristiques.qp0;
        generateurChauffage.donnee_intermediaire.rpn = caracteristiques.rpn;
        generateurChauffage.donnee_intermediaire.rpint = caracteristiques.rpint;
        generateurChauffage.donnee_intermediaire.pveil = caracteristiques.pveil;
      }
    });
  }

  /**
   * Type de générateur de chauffage
   *
   * @param generateurChauffageDE {GenerateurChauffageDE}
   * @return {TypeGenerateur}
   */
  typeGenerateur(generateurChauffageDE) {
    if (this.generateurCombustion(generateurChauffageDE)) {
      return TypeGenerateur.COMBUSTION;
    } else if (this.generateurPAC(generateurChauffageDE)) {
      return TypeGenerateur.PAC;
    }

    return TypeGenerateur.OTHER;
  }

  /**
   * Return true si le générateur de chauffage est à combustion
   *
   * @param generateurChauffageDE {GenerateurChauffageDE}
   * @return {boolean}
   */
  generateurCombustion(generateurChauffageDE) {
    return this.#tvStore
      .getCombustionGenerateurs()
      .includes(parseInt(generateurChauffageDE.enum_type_generateur_ch_id));
  }

  /**
   * Return true si le générateur de chauffage est une PAC
   *
   * @param generateurChauffageDE {GenerateurChauffageDE}
   * @return {boolean}
   */
  generateurPAC(generateurChauffageDE) {
    return this.#tvStore
      .getPacGenerateurs()
      .includes(parseInt(generateurChauffageDE.enum_type_generateur_ch_id));
  }

  /**
   * Calcul des caractéristiques du générateur de chauffage
   *
   * Données calculées
   *   — qp0 : pertes à l’arrêt (kW)
   *   — rpn : rendements à pleine charge
   *   — rpint : rendements à charge intermédiaire
   *   — pveil : puissance de la veilleuse
   *
   * @param generateurChauffage {GenerateurChauffage}
   * @return {{qp0: number, rpn: number, rpint: number, rpint: number, pveil: number}}
   */
  caracteristiques(generateurChauffage) {
    const rpnrpint = this.rpnrpint(generateurChauffage);

    return {
      qp0: this.qp0(generateurChauffage),
      rpn: rpnrpint.rpn,
      rpint: rpnrpint.rpint,
      pveil: this.pveil(generateurChauffage)
    };
  }

  /**
   * Calcul des pertes à l'arrêt qp0 du générateur
   *
   * @param generateurChauffage {GenerateurChauffage}
   * @return {number}
   */
  qp0(generateurChauffage) {
    const generateurChauffageDE = generateurChauffage.donnee_entree;
    const generateurChauffageDU = generateurChauffage.donnee_utilisateur;
    const generateurChauffageDI = generateurChauffage.donnee_intermediaire;

    const E_tab = {
      0: 2.5,
      1: 1.75
    };

    const F_tab = {
      0: -0.8,
      1: -0.55
    };

    const E = E_tab[generateurChauffageDE.presence_ventouse];
    const F = F_tab[generateurChauffageDE.presence_ventouse];

    /**
     * 4 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint,qp0, autres données forfaitaires
     * 5 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint,qp0,temp_fonc_30,temp_fonc_100
     */
    if ([4, 5].includes(parseInt(generateurChauffageDE.enum_methode_saisie_carac_sys_id))) {
      return generateurChauffageDI.qp0;
    } else {
      const qp0_perc = generateurChauffageDU.generateur?.qp0_perc;

      if (qp0_perc) {
        const qp0_calc = excel_to_js_exec(
          qp0_perc,
          generateurChauffageDI.pn / generateurChauffageDU.ratio_virtualisation,
          E,
          F
        );

        // Certaines chaudières ont un qp0 en % de pn, d'autres ont des valeurs constantes
        return qp0_perc.includes('Pn')
          ? qp0_calc * 1000 * generateurChauffageDU.ratio_virtualisation
          : qp0_perc.includes('%')
            ? qp0_calc * generateurChauffageDI.pn
            : qp0_calc * 1000;
      }
    }

    return 0;
  }

  /**
   * Calcul de la puissance de la veilleuse du générateur
   *
   * @param generateurChauffage {GenerateurChauffage}
   * @return {number}
   */
  pveil(generateurChauffage) {
    const generateurChauffageDE = generateurChauffage.donnee_entree;
    const generateurChauffageDI = generateurChauffage.donnee_intermediaire;

    /**
     * 1 - valeurs forfaitaires
     */
    if (
      parseInt(generateurChauffageDE.enum_methode_saisie_carac_sys_id) === 1 ||
      !generateurChauffageDI.pveilleuse
    ) {
      return generateurChauffage.donnee_utilisateur.generateur?.pveil || 0;
    } else {
      return generateurChauffageDI.pveilleuse;
    }
  }

  /**
   * Calcul des rendements à pleine charge et à charge intermédiaire
   *
   * @param generateurChauffage {GenerateurChauffage}
   * @return {{rpn: number, rpint: number}}
   */
  rpnrpint(generateurChauffage) {
    const generateurChauffageDE = generateurChauffage.donnee_entree;
    const generateurChauffageDU = generateurChauffage.donnee_utilisateur;
    const generateurChauffageDI = generateurChauffage.donnee_intermediaire;

    /**
     * 3 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint, autres données forfaitaires
     * 4 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint,qp0, autres données forfaitaires
     * 5 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint,qp0,temp_fonc_30,temp_fonc_100
     */
    if ([3, 4, 5].includes(parseInt(generateurChauffageDE.enum_methode_saisie_carac_sys_id))) {
      return {
        rpn: generateurChauffage.donnee_intermediaire.rpn,
        rpint: generateurChauffage.donnee_intermediaire.rpint
      };
    } else {
      const generateurRpn = generateurChauffageDU.generateur?.rpn;
      const generateurRpint = generateurChauffageDU.generateur?.rpint;

      let rpn = 0;
      let rpint = 0;

      if (generateurRpn) {
        rpn =
          excel_to_js_exec(
            generateurRpn,
            generateurChauffageDI.pn / generateurChauffageDU.ratio_virtualisation
          ) / 100;
      }

      if (generateurRpint) {
        rpint =
          excel_to_js_exec(
            generateurRpint,
            generateurChauffageDI.pn / generateurChauffageDU.ratio_virtualisation
          ) / 100;
      }

      return { rpn, rpint };
    }
  }
}
