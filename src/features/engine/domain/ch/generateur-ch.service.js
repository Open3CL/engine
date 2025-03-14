import { inject } from 'dioma';
import { ChTvStore } from '../../../dpe/infrastructure/ch/chTv.store.js';
import { excel_to_js_exec } from '../../../../utils.js';
import { TvStore } from '../../../dpe/infrastructure/tv.store.js';
import { EmetteurChService } from './emetteur-ch.service.js';
import { TypeGenerateur } from '../../../dpe/domain/models/type-generateur.model.js';

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
  #chTvStore;

  /**
   * @type {TvStore}
   */
  #tvStore;

  /**
   * @type {EmetteurChService}
   */
  #emetteurChService;

  /**
   * @param chTvStore {ChTvStore}
   * @param tvStore {TvStore}
   * @param emetteurChService {EmetteurChService}
   */
  constructor(
    chTvStore = inject(ChTvStore),
    tvStore = inject(TvStore),
    emetteurChService = inject(EmetteurChService)
  ) {
    this.#chTvStore = chTvStore;
    this.#tvStore = tvStore;
    this.#emetteurChService = emetteurChService;
  }

  /**
   * Détermination des données de calcul pour une installation de chauffage
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @param installationChauffage {InstallationChauffage}
   */
  execute(ctx, logement, installationChauffage) {
    const generateursChauffage =
      installationChauffage.generateur_chauffage_collection?.generateur_chauffage || [];

    generateursChauffage.forEach((generateurChauffage) => {
      /** @type {GenerateurChauffageDE}*/
      const generateurChauffageDE = generateurChauffage.donnee_entree;

      /** @type {GenerateurChauffageDI}*/
      const generateurChauffageDI = generateurChauffage.donnee_intermediaire;

      generateurChauffage.donnee_utilisateur = {
        typeGenerateur: this.typeGenerateur(generateurChauffageDE),
        combustion: this.generateurCombustion(generateurChauffageDE),
        pac: this.generateurPAC(generateurChauffageDE),
        ratio_virtualisation: installationChauffage.donnee_entree.ratio_virtualisation || 1
      };

      if (generateurChauffage.donnee_utilisateur.combustion) {
        // Calcul de la puissance nominale si non définie
        if (!generateurChauffageDI.pn) {
          generateurChauffage.donnee_intermediaire.pn = this.pn(ctx, logement);
        }

        generateurChauffage.donnee_utilisateur.generateur = this.#chTvStore.getGenerateurCombustion(
          generateurChauffageDE.enum_type_generateur_ch_id,
          generateurChauffage.donnee_intermediaire.pn /
            ((generateurChauffage.donnee_utilisateur.ratio_virtualisation || 1) * 1000)
        );

        const emetteurs = (
          installationChauffage.emetteur_chauffage_collection?.emetteur_chauffage || []
        ).filter(
          (emetteur) =>
            emetteur.donnee_entree.enum_lien_generateur_emetteur_id ===
            generateurChauffageDE.enum_lien_generateur_emetteur_id
        );

        const caracteristiques = this.caracteristiques(ctx, generateurChauffage, emetteurs);
        generateurChauffage.donnee_intermediaire.qp0 = caracteristiques.qp0;
        generateurChauffage.donnee_intermediaire.rpn = caracteristiques.rpn;
        generateurChauffage.donnee_intermediaire.rpint = caracteristiques.rpint;
        generateurChauffage.donnee_intermediaire.pveil = caracteristiques.pveil;

        if (caracteristiques.temp_fonc_30)
          generateurChauffage.donnee_intermediaire.temp_fonc_30 = caracteristiques.temp_fonc_30;
        if (caracteristiques.temp_fonc_100)
          generateurChauffage.donnee_intermediaire.temp_fonc_100 = caracteristiques.temp_fonc_100;
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
    const typeGenerateurChauffage = parseInt(generateurChauffageDE.enum_type_generateur_ch_id);

    // Chaudière Fioul
    if (typeGenerateurChauffage >= 75 && typeGenerateurChauffage <= 84) {
      return TypeGenerateur.CHAUDIERE;
    }
    // Chaudière Gaz
    if (typeGenerateurChauffage >= 85 && typeGenerateurChauffage <= 97) {
      return TypeGenerateur.CHAUDIERE;
    }
    // Chaudière gpl
    if (typeGenerateurChauffage >= 127 && typeGenerateurChauffage <= 139) {
      return TypeGenerateur.CHAUDIERE;
    }
    // Chaudière hybride
    if ([148, 149, 150, 151, 160, 161].includes(typeGenerateurChauffage)) {
      return TypeGenerateur.CHAUDIERE;
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
    return this.#chTvStore
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
    return this.#chTvStore
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
   *   — temp_fonc_30 : températeur de fonctionnement du générateur à 30% de charge
   *   — temp_fonc_100 : températeur de fonctionnement du générateur à 100% de charge
   *
   * @param ctx {Contexte}
   * @param generateurChauffage {GenerateurChauffage}
   * @param emetteursChauffage {EmetteurChauffage[]}
   * @return {{qp0: number, rpn: number, rpint: number, rpint: number, pveil: number, temp_fonc_30: number, temp_fonc_100: number}}
   */
  caracteristiques(ctx, generateurChauffage, emetteursChauffage) {
    const caracteristiques = {
      qp0: this.qp0(generateurChauffage),
      ...this.rpnrpint(generateurChauffage),
      pveil: this.pveil(generateurChauffage)
    };

    if (generateurChauffage.donnee_utilisateur.typeGenerateur === TypeGenerateur.CHAUDIERE) {
      const { temp_fonc_30, temp_fonc_100 } = this.temperatureFonctionnement(
        ctx,
        generateurChauffage,
        emetteursChauffage
      );

      if (temp_fonc_30) caracteristiques.temp_fonc_30 = temp_fonc_30;
      if (temp_fonc_100) caracteristiques.temp_fonc_100 = temp_fonc_100;
    }

    return caracteristiques;
  }

  /**
   * Calcul de la puissance nominale du générateur
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @return {number}
   */
  pn(ctx, logement) {
    const Tbase = this.#tvStore.getTempBase(ctx.altitude.id, ctx.zoneClimatique.id);
    return (1.2 * logement.sortie.deperdition.deperdition_enveloppe * (19 - Tbase)) / 0.95 ** 3;
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
   * Calcul des températures de fonctionnement du générateur à 30% et 100% de charge
   *
   * @param ctx {Contexte}
   * @param generateurChauffage {GenerateurChauffage}
   * @param emetteursChauffage {EmetteurChauffage[]}
   * @return {{temp_fonc_30: number, temp_fonc_100: number}}
   */
  temperatureFonctionnement(ctx, generateurChauffage, emetteursChauffage) {
    const generateurChauffageDE = generateurChauffage.donnee_entree;
    const generateurChauffageDI = generateurChauffage.donnee_intermediaire;

    /**
     * 5 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint,qp0,temp_fonc_30,temp_fonc_100
     */
    if (
      parseInt(generateurChauffageDE.enum_methode_saisie_carac_sys_id) === 5 &&
      generateurChauffageDI.temp_fonc_30 &&
      generateurChauffageDI.temp_fonc_100
    ) {
      return {
        temp_fonc_30: generateurChauffageDI.temp_fonc_30,
        temp_fonc_100: generateurChauffageDI.temp_fonc_100
      };
    } else {
      return this.#emetteurChService.temperatureFonctionnement(
        ctx,
        generateurChauffage.donnee_entree,
        emetteursChauffage
      );
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
