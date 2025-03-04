import { inject } from 'dioma';
import { DeperditionService } from '../deperdition.service.js';
import { logger } from '../../../../../core/util/logger/log-service.js';
import { compareReferences } from '../../../../../utils.js';
import { DeperditionMurService } from '../mur/deperdition-mur.service.js';
import { PontThermiqueTvStore } from '../../../../dpe/infrastructure/enveloppe/pontThermiqueTv.store.js';
import enums from '../../../../../enums.js';
import { DeperditionPlancherHautService } from '../plancher_haut/deperdition-plancher-haut.service.js';
import { DeperditionPlancherBasService } from '../plancher_bas/deperdition-plancher-bas.service.js';

/**
 * Calcul des déperditions des ponts thermiques
 * Chapitre 3.4 Calcul des déperditions par les ponts thermiques
 *
 * Méthode de calcul 3CL-DPE 2021
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 *
 * Si le coefficient U des portes est connu et justifié, le saisir directement. Sinon, prendre les valeurs tabulées
 */
export class DeperditionPontThermiqueService extends DeperditionService {
  /**
   * @type {DeperditionMurService}
   */
  #deperditionMurService;

  /**
   * @type {DeperditionPlancherHautService}
   */
  #deperditionPlancherHautService;

  /**
   * @type {DeperditionPlancherBasService}
   */
  #deperditionPlancherBasService;

  /**
   * @param tvStore {PontThermiqueTvStore}
   * @param deperditionMurService {DeperditionMurService}
   * @param deperditionPlancherHautService {DeperditionPlancherHautService}
   * @param deperditionPlancherBasService {DeperditionPlancherBasService}
   */
  constructor(
    tvStore = inject(PontThermiqueTvStore),
    deperditionMurService = inject(DeperditionMurService),
    deperditionPlancherHautService = inject(DeperditionPlancherHautService),
    deperditionPlancherBasService = inject(DeperditionPlancherBasService)
  ) {
    super(tvStore);
    this.#deperditionMurService = deperditionMurService;
    this.#deperditionPlancherHautService = deperditionPlancherHautService;
    this.#deperditionPlancherBasService = deperditionPlancherBasService;
  }

  /**
   * @param ctx {Contexte}
   * @param enveloppe {Enveloppe}
   * @param pontThermiqueDE {PontThermiqueDE}
   * @return {PontThermiqueDI}
   */
  execute(ctx, enveloppe, pontThermiqueDE) {
    /** @type {PontThermiqueDI} */
    const di = {
      k: undefined
    };

    if ([2, 3].includes(parseInt(pontThermiqueDE.enum_methode_saisie_pont_thermique_id))) {
      // valeur justifiée saisie à partir des documents justificatifs autorisés
      // saisie direct k depuis rset/rsee( etude rt2012/re2020)
      di.k = pontThermiqueDE.k_saisi;

      if (!di.k) {
        logger.error(`
          Aucune valeur de k_saisi pour le pont thermique '${pontThermiqueDE.reference}' alors que la donnée est saisie
        `);
      }
    } else {
      // valeur forfaitaire
      di.k = this.k(ctx, pontThermiqueDE, enveloppe);
    }

    if (di.k === undefined) {
      logger.error(`
        Aucune valeur k n'a été trouvée pour le pont thermique '${pontThermiqueDE.description}'.
      `);
      di.k = this.defaultValue(pontThermiqueDE);
    }

    return di;
  }

  /**
   * Coefficient de transmission thermique du vitrage (W/(m².K))
   *
   * @param ctx {Contexte}
   * @param pontThermiqueDE {PontThermiqueDE}
   * @param enveloppe {Enveloppe}
   * @return {number|undefined}
   */
  k(ctx, pontThermiqueDE, enveloppe) {
    if (!pontThermiqueDE.reference_1) {
      logger.error(`
        Impossible de trouver un mur ayant pour référence '${pontThermiqueDE.reference_1}' ou '${pontThermiqueDE.reference_2}'.
      `);
      return this.defaultValue(pontThermiqueDE);
    }

    const typeLiaison = parseInt(pontThermiqueDE.enum_type_liaison_id);

    /**
     * @type {MurDE|undefined}
     */
    const mur = this.mur(pontThermiqueDE, enveloppe);

    if (mur && !this.murHasPontThermique(mur, typeLiaison)) {
      return 0;
    }

    const isolationMur = this.isolationMur(ctx, mur);

    switch (typeLiaison) {
      // 'plancher bas / mur'
      case 1: {
        return this.pontThermiquePlancherBasMur(ctx, pontThermiqueDE, enveloppe, isolationMur);
      }
      // 'plancher haut lourd / mur'
      case 3: {
        return this.pontThermiquePlancherHautMur(ctx, pontThermiqueDE, enveloppe, isolationMur);
      }
      // 'menuiserie / mur'
      case 5: {
        return this.pontThermiqueMenuiserieMur(pontThermiqueDE, enveloppe, isolationMur);
      }
      //'plancher intermédiaire lourd / mur'
      // 'refend / mur'
      case 2:
      case 4: {
        return this.tvStore.getKForMur(typeLiaison, enums.type_isolation[isolationMur]);
      }
    }
  }

  /**
   * Calcul de l'isolation du mur
   *
   * @param ctx {Contexte}
   * @param murDE {MurDE}
   * @return {number}
   */
  isolationMur(ctx, murDE) {
    if (murDE) {
      return this.#deperditionMurService.typeIsolation(ctx, murDE);
    } else {
      // Isolation ITI si le mur n'est pas défini
      return 3;
    }
  }

  /**
   * Calcul du pont thermique 'plancher bas / mur'
   *
   * @param ctx {Contexte}
   * @param pontThermiqueDE {PontThermiqueDE}
   * @param enveloppe {Enveloppe}
   * @param isolationMur {number}
   * @return {number|undefined}
   */
  pontThermiquePlancherBasMur(ctx, pontThermiqueDE, enveloppe, isolationMur) {
    const plancherBasDE = this.plancherBas(pontThermiqueDE, enveloppe);

    if (!plancherBasDE) {
      logger.error(`
        Impossible de trouver un plancher bas ayant pour référence '${pontThermiqueDE.reference_1}' ou '${pontThermiqueDE.reference_2}'.
      `);
      return this.defaultValue(pontThermiqueDE);
    }

    if (!this.plancherBasHasPontThermique(plancherBasDE)) {
      return 0;
    }

    const isolationPlancher = this.#deperditionPlancherBasService.typeIsolation(ctx, plancherBasDE);
    return this.tvStore.getKForPlancher(
      1,
      enums.type_isolation[isolationMur],
      enums.type_isolation[isolationPlancher]
    );
  }

  /**
   Calcul du pont thermique 'plancher haut lourd / mur'
   *
   * @param ctx {Contexte}
   * @param pontThermiqueDE {PontThermiqueDE}
   * @param enveloppe {Enveloppe}
   * @param isolationMur {number}
   * @return {number|undefined}
   */
  pontThermiquePlancherHautMur(ctx, pontThermiqueDE, enveloppe, isolationMur) {
    const plancherHautDE = this.plancherHaut(pontThermiqueDE, enveloppe);

    if (!plancherHautDE) {
      logger.error(`
        Impossible de trouver un plancher haut ayant pour référence '${pontThermiqueDE.reference_1}' ou '${pontThermiqueDE.reference_2}'.
      `);
      return this.defaultValue(pontThermiqueDE);
    }

    if (!this.plancherHautHasPontThermique(plancherHautDE)) {
      return 0;
    }

    const isolationPlancher = this.#deperditionPlancherHautService.typeIsolation(
      ctx,
      plancherHautDE
    );
    return this.tvStore.getKForPlancher(
      3,
      enums.type_isolation[isolationMur],
      enums.type_isolation[isolationPlancher]
    );
  }

  /**
   Calcul du pont thermique 'menuiserie / mur'
   *
   * @param pontThermiqueDE {PontThermiqueDE}
   * @param enveloppe {Enveloppe}
   * @param isolationMur {number}
   * @return {number|undefined}
   */
  pontThermiqueMenuiserieMur(pontThermiqueDE, enveloppe, isolationMur) {
    const menuiserieDE = this.menuiserie(pontThermiqueDE, enveloppe);

    if (!menuiserieDE) {
      logger.error(`
        Impossible de trouver une menuiserie ayant pour référence '${pontThermiqueDE.reference_1}' ou '${pontThermiqueDE.reference_2}'.
      `);
      return this.defaultValue(pontThermiqueDE);
    }

    if (parseInt(menuiserieDE.enum_type_vitrage_id) === 5) {
      return 0;
    }

    let typePose = parseInt(menuiserieDE.enum_type_pose_id || 3);

    // Pour les types sans objet
    if (typePose === 4) {
      typePose = 3;
    }

    const largeurDormant = menuiserieDE.largeur_dormant;
    const presenceRetourIsolation = menuiserieDE.presence_retour_isolation;

    return this.tvStore.getKForMenuiserie(
      5,
      enums.type_isolation[isolationMur],
      typePose,
      presenceRetourIsolation,
      largeurDormant
    );
  }

  /**
   * Récupération du mur sur lequel se réfère ce pont thermique à partir des références
   *
   * @param pontThermiqueDE {PontThermiqueDE}
   * @param enveloppe {Enveloppe}
   * @return {MurDE|undefined}
   */
  mur(pontThermiqueDE, enveloppe) {
    return (enveloppe.mur_collection?.mur || []).find(
      (mur) =>
        compareReferences(mur.donnee_entree.reference, pontThermiqueDE.reference_1) ||
        compareReferences(mur.donnee_entree.reference, pontThermiqueDE.reference_2)
    )?.donnee_entree;
  }

  /**
   * Récupération du plancher bas sur lequel se réfère ce pont thermique à partir des références
   *
   * @param pontThermiqueDE {PontThermiqueDE}
   * @param enveloppe {Enveloppe}
   * @return {PlancherBasDE|undefined}
   */
  plancherBas(pontThermiqueDE, enveloppe) {
    return (enveloppe.plancher_bas_collection?.plancher_bas || []).find(
      (plancher) =>
        compareReferences(plancher.donnee_entree.reference, pontThermiqueDE.reference_1) ||
        compareReferences(plancher.donnee_entree.reference, pontThermiqueDE.reference_2)
    )?.donnee_entree;
  }

  /**
   * Récupération du plancher haut sur lequel se réfère ce pont thermique à partir des références
   *
   * @param pontThermiqueDE {PontThermiqueDE}
   * @param enveloppe {Enveloppe}
   * @return {PlancherHautDE|undefined}
   */
  plancherHaut(pontThermiqueDE, enveloppe) {
    return (enveloppe.plancher_haut_collection?.plancher_haut || []).find(
      (plancher) =>
        compareReferences(plancher.donnee_entree.reference, pontThermiqueDE.reference_1) ||
        compareReferences(plancher.donnee_entree.reference, pontThermiqueDE.reference_2)
    )?.donnee_entree;
  }

  /**
   * Récupération de la menuiserie (baie vitrée ou porte) sur laquelle se réfère ce pont thermique
   *
   * @param pontThermiqueDE {PontThermiqueDE}
   * @param enveloppe {Enveloppe}
   * @return {BaieVitreeDE|PorteDE|undefined}
   */
  menuiserie(pontThermiqueDE, enveloppe) {
    return (enveloppe.baie_vitree_collection?.baie_vitree || [])
      .concat(enveloppe.porte_collection?.porte || [])
      .find(
        (menuiserie) =>
          compareReferences(menuiserie.donnee_entree.reference, pontThermiqueDE.reference_1) ||
          compareReferences(menuiserie.donnee_entree.reference, pontThermiqueDE.reference_2)
      )?.donnee_entree;
  }

  /**
   * Retourne true si le mur est concerné par un pont thermique
   * @param murDE {MurDE}
   * @param typeLiaison {number}
   */
  murHasPontThermique(murDE, typeLiaison) {
    /**
     * 3.4 Calcul des déperditions par les ponts thermiques
     * Les ponts thermiques des parois au niveau des circulations communes ne sont pas pris en compte.
     * 14 - Circulation sans ouverture directe sur l'extérieur
     * 15 - Circulation avec ouverture directe sur l'extérieur
     * 16 - Circulation avec bouche ou gaine de désenfumage ouverte en permanence
     * 17 - Hall d'entrée avec dispositif de fermeture automatique
     * 18 - Hall d'entrée sans dispositif de fermeture automatique
     * 22 - Local non déperditif ( local à usage d'habitation chauffé)
     */
    // @todo vérifier la liste
    if ([14, 15, 16, 17, 18, 22].includes(parseInt(murDE.enum_type_adjacence_id))) {
      return false;
    }

    /**
     * 3.4.1 Mur Plancher bas / mur
     * 3.4.3 Plancher haut / mur
     *
     * Seuls les murs et planchers bas constitués d’un matériau lourd (béton, brique, …) sont considérés ici. Pour les autres
     * cas ce pont thermique est pris nul.
     *
     * 5 - Murs en pan de bois sans remplissage tout venant
     * 6 - Murs en pan de bois avec remplissage tout venant
     * 7 - Murs bois (rondin)
     * 16 - Béton cellulaire avant 2013
     * 18 - Murs en ossature bois avec isolant en remplissage ≥ 2006
     * 24 - Murs en ossature bois avec isolant en remplissage 2001-2005
     * 25 - Murs en ossature bois sans remplissage
     * 26 - Murs en ossature bois avec isolant en remplissage <2001
     * 27 - Murs en ossature bois avec remplissage tout venant
     */
    if (typeLiaison === 1 || typeLiaison === 3) {
      return ![5, 6, 7, 16, 18, 24, 25, 26, 27].includes(
        parseInt(murDE.enum_materiaux_structure_mur_id)
      );
    }

    /**
     * 3.4.5 Menuiserie / mur
     * Les ponts thermiques avec les parois en structure bois (ossature bois, rondin de bois, pans de bois) sont négligés.
     * enum_materiaux_structure_mur_id
     *
     * 5 - Murs en pan de bois sans remplissage tout venant
     * 6 - Murs en pan de bois avec remplissage tout venant
     * 7 - Murs bois (rondin)
     * 18 - Murs en ossature bois avec isolant en remplissage ≥ 2006
     * 24 - Murs en ossature bois avec isolant en remplissage 2001-2005
     * 25 - Murs en ossature bois sans remplissage
     * 26 - Murs en ossature bois avec isolant en remplissage <2001
     * 27 - Murs en ossature bois avec remplissage tout venant
     */
    if (typeLiaison === 4) {
      return ![5, 6, 7, 18, 24, 25, 26, 27].includes(
        parseInt(murDE.enum_materiaux_structure_mur_id)
      );
    }

    return true;
  }

  /**
   * Retourne true si le plancher haut est concerné par un pont thermique
   * @param plancherHautDE {PlancherHautDE}
   * @return {boolean}
   */
  plancherHautHasPontThermique(plancherHautDE) {
    /**
     * 3.4.3 Plancher haut / mur
     *
     * Les ponts thermiques des planchers haut en structure légère sont négligés.
     * type_plancher_haut

     * 9 - Plafond bois sur solives bois
     * 10 - Plafond bois sous solives bois
     */
    // @todo d'autres type de plancher haut ?
    return ![9, 10].includes(parseInt(plancherHautDE.enum_type_plancher_haut_id));
  }

  /**
   * Retourne true si le plancher bas est concerné par un pont thermique
   *
   * @param plancherBasDE {PlancherBasDE}
   */
  plancherBasHasPontThermique(plancherBasDE) {
    /**
     * 3.4.3 Plancher haut / mur
     *
     * Seuls les planchers bas constitués d’un matériau lourd (béton, brique, …) sont considérés ici. Pour les autres
     * cas ce pont thermique est pris nul.

     * 4 - Plancher entre solives bois avec ou sans remplissage
     * 10 - Plancher bois sur solives bois
     */
    // @todo d'autres type de plancher bas ?
    return ![4, 10].includes(parseInt(plancherBasDE.enum_type_plancher_bas_id));
  }

  /**
   *
   * @param ptDE {PontThermiqueDE}
   */
  defaultValue(ptDE) {
    return this.tvStore.getKForMurById(ptDE.tv_pont_thermique_id);
  }
}
