import { DeperditionService } from '../deperdition.service.js';
import { inject } from 'dioma';
import { BaieVitreeTvStore } from '../../../../dpe/infrastructure/baieVitreeTv.store.js';

/**
 * Calcul des déperditions des baies vitrées
 * Chapitre 3.3 Calcul des parois vitrées
 *
 * Méthode de calcul 3CL-DPE 2021
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class DeperditionBaieVitreeService extends DeperditionService {
  /**
   * @param tvStore {BaieVitreeTvStore}
   */
  constructor(tvStore = inject(BaieVitreeTvStore)) {
    super(tvStore);
  }

  /**
   * @param ctx {Contexte}
   * @param bv {BaieVitree}
   * @return {BaieVitreeDI}
   */
  execute(ctx, bv) {
    const bvDE = bv.donnee_entree;

    const b = this.b({
      enumTypeAdjacenceId: bvDE.enum_type_adjacence_id,
      surfaceAiu: bvDE.surface_aiu,
      surfaceAue: bvDE.surface_aue,
      enumCfgIsolationLncId: bvDE.enum_cfg_isolation_lnc_id,
      zoneClimatiqueId: ctx.zoneClimatiqueId
    });

    let sw = this.sw(bv);
    const ug = this.ug(bvDE);
    let uw = this.uw(bv, ug);

    /**
     * Si le type de fermeture n'est pas '1: abscence de fermeture pour la baie vitrée',
     * c'est qu'il y a présence d'une fermeture devant la fenêtre. Il faut prendre en compte la résistance de cette fermeture
     */
    let u_menuiserie = uw;
    let ujn;
    if (parseInt(bvDE.enum_type_fermeture_id) !== 1) {
      ujn = this.ujn(bvDE, uw);
      u_menuiserie = ujn;
    }

    const [fe1, fe2] = this.fe(bvDE);

    /** @type {BaieVitreeDI} */
    return {
      b,
      ug,
      uw,
      ujn,
      u_menuiserie,
      sw,
      fe1,
      fe2
    };
  }

  /**
   * Coefficient de transmission thermique du vitrage (W/(m².K))
   *
   * @param bvDE {BaieVitreeDE|BaieVitreeDoubleFenetreDE}
   * @return {number|undefined}
   */
  ug(bvDE) {
    if (bvDE.ug_saisi) {
      return bvDE.ug_saisi;
    }

    // Pas de valeur ug pour les parois en brique de verre ou polycarbonate
    if (parseInt(bvDE.enum_type_baie_id) < 4) {
      return;
    }

    const enumTypeVitrageId = bvDE.enum_type_vitrage_id;
    let e, enumTypeGazLameId, enumInclinaisonVitrageId, enumVitrageVir;

    // Pas de type_gaz_lame, inclinaison_vitrage ou vitrage_vir pour un simple vitrage
    if (enumTypeVitrageId !== '1') {
      e = Math.min(bvDE.epaisseur_lame, 20);

      const availableEpaisseurs = this.tvStore.getEpaisseurAvailableForUg();
      if (e && !availableEpaisseurs.includes(e)) {
        // 3.3.1 Détermination de la performance du vitrage Ug
        // Attention : si la valeur de l’épaisseur de la lame d’air n’est pas dans le tableau présenté, prendre la valeur directement
        // inférieure qui s’y trouve.
        e = availableEpaisseurs.reduce(
          (closest, num) => (num < e && num > closest ? num : closest),
          -Infinity
        );
      }

      enumTypeGazLameId = bvDE.enum_type_gaz_lame_id;
      enumInclinaisonVitrageId = bvDE.enum_inclinaison_vitrage_id;
      enumVitrageVir = bvDE.vitrage_vir;
    }

    /**
     * Le Ug d’un survitrage est déterminé en apportant une majoration de 0,1 W/(m².K) au Ug du double vitrage rempli à
     * l’air sec ayant la même épaisseur de lame d’air. Les épaisseurs des lames d’air pour le survitrage sont plafonnées à
     * 20mm. C'est-à-dire que toute lame d’air d’un survitrage d’épaisseur supérieure à 20mm sera traitée dans les calculs
     * comme une lame d’air de 20mm d’épaisseur.
     */
    if (enumTypeVitrageId === '4') {
      const ug = this.tvStore.getUg('2', '1', enumInclinaisonVitrageId, enumVitrageVir, e);

      return ug + 0.1;
    } else {
      return this.tvStore.getUg(
        enumTypeVitrageId,
        enumTypeGazLameId,
        enumInclinaisonVitrageId,
        enumVitrageVir,
        e
      );
    }
  }

  /**
   * Proportion d’énergie solaire incidente qui pénètre dans le logement par la paroi vitrée en prenant en compte
   * les doubles-fenêtres si existantes
   *
   * @param bv {BaieVitree}
   * @return {number|undefined}
   */
  sw(bv) {
    const bvDE = bv.donnee_entree;
    let sw = this.#sw(bvDE);

    /**
     * S'il existe une double-fenêtre, calcul des facteurs sw et uw équivalents
     * 6.2.1 Détermination du facteur solaire
     */
    if (bvDE.double_fenetre === 1 && bv.baie_vitree_double_fenetre) {
      sw *= this.#sw(bv.baie_vitree_double_fenetre.donnee_entree) || 1;
    }

    return sw;
  }

  /**
   * Proportion d’énergie solaire incidente qui pénètre dans le logement par la paroi vitrée
   *
   * @param bvDE {BaieVitreeDE|BaieVitreeDoubleFenetreDE}
   * @return {number|undefined}
   */
  #sw(bvDE) {
    if (bvDE.sw_saisi) {
      return bvDE.sw_saisi;
    }

    /**
     * 6.2.1 Détermination du facteur solaire
     * Les champs vitrage_vir et enum_type_pose_id ne sont pas présentes pour les matériaux 'brique de verre' et 'polycarbonate'
     *
     * enum_type_materiaux_menuiserie_id
     * 1 - brique de verre
     * 2 - polycarbonate
     */
    let vitrageVir, typePose;
    const typeMateriaux = bvDE.enum_type_materiaux_menuiserie_id;

    if (![1, 2].includes(parseInt(typeMateriaux))) {
      vitrageVir = bvDE.vitrage_vir;
      typePose = bvDE.enum_type_pose_id;
    }

    return this.tvStore.getSw(
      bvDE.enum_type_vitrage_id,
      bvDE.enum_type_baie_id,
      typeMateriaux,
      vitrageVir,
      typePose
    );
  }

  /**
   * Coefficient de transmission thermique de la fenêtre ou de la porte-fenêtre (vitrage + menuiserie) (W/(m².K)) en prenant en compte
   * les doubles-fenêtres si existantes
   *
   * @param bv {BaieVitree}
   * @param ug {number|undefined}
   * @return {number|undefined}
   */
  uw(bv, ug) {
    const bvDE = bv.donnee_entree;
    let uw = this.#uw(bvDE, ug);

    /**
     * S'il existe une double-fenêtre, calcul des facteurs sw et uw équivalents
     * 3.3.2 Coefficients Uw des fenêtres / portes-fenêtres - Traitement des doubles fenêtre
     */
    if (bvDE.double_fenetre === 1 && bv.baie_vitree_double_fenetre) {
      const bvDoubleFenetreDE = bv.baie_vitree_double_fenetre.donnee_entree;
      uw = 1 / (1 / uw + 1 / (this.#uw(bvDoubleFenetreDE, this.ug(bvDoubleFenetreDE)) || 1) + 0.07);
    }

    return uw;
  }

  /**
   * Coefficient de transmission thermique de la fenêtre ou de la porte-fenêtre (vitrage + menuiserie) (W/(m².K))
   *
   * @param bvDE {BaieVitreeDE|BaieVitreeDoubleFenetreDE}
   * @param ug {number|undefined}
   * @return {number|undefined}
   */
  #uw(bvDE, ug) {
    if (bvDE.uw_saisi) {
      return bvDE.uw_saisi;
    }

    return this.tvStore.getUw(bvDE.enum_type_baie_id, bvDE.enum_type_materiaux_menuiserie_id, ug);
  }

  /**
   * 3.3.3 Coefficients Ujn des fenêtres/portes-fenêtres
   * La présence de volets aux fenêtres et portes-fenêtres leur apporte un supplément d’isolation avec une résistance
   * additionnelle ΔR
   *
   * @param bvDE {BaieVitreeDE}
   * @param uw {number}
   * @return {number|undefined}
   */
  ujn(bvDE, uw) {
    if (bvDE.ujn_saisi) {
      return bvDE.ujn_saisi;
    }

    return this.tvStore.getUjn(bvDE.enum_type_fermeture_id, uw);
  }

  /**
   * 6.2.2 Détermination du facteur d’ensoleillement
   * Prise en comptes des masques qui peuvent faire de l'ombre sur les baies vitrées et influencé le facteur d'ensoleillement
   *
   * @param bvDE {BaieVitreeDE}
   *
   * @return {number[]}
   */
  fe(bvDE) {
    let fe1 = 1,
      fe2 = 1;

    // Calcul des incidences des masques non homogènes
    if (bvDE.masque_lointain_non_homogene_collection) {
      let masquesLointainNonHomogene =
        bvDE.masque_lointain_non_homogene_collection.masque_lointain_non_homogene || [];

      if (!Array.isArray(masquesLointainNonHomogene)) {
        masquesLointainNonHomogene = [masquesLointainNonHomogene];
      }

      fe2 = Math.max(
        0,
        masquesLointainNonHomogene.reduce(
          (acc, masqueLointainNonHomogene) => acc - this.calcOmbre(masqueLointainNonHomogene) / 100,
          1
        )
      );
    }

    // Calcul des incidences des masques proches
    if (bvDE.tv_coef_masque_proche_id) {
      fe1 = this.tvStore.getMasqueProche(bvDE.tv_coef_masque_proche_id);
    }

    // Calcul des incidences des masques proches
    if (bvDE.tv_coef_masque_lointain_homogene_id) {
      fe2 = this.tvStore.getMasqueLointainHomogene(bvDE.tv_coef_masque_lointain_homogene_id);
    }

    return [fe1, fe2];
  }

  /**
   * Calcul de l'ombre apportée par un masque lointain non homogène
   * @param masqueLointainNonHomogene {MasqueLointainNonHomogene}
   * @returns {number}
   */
  calcOmbre(masqueLointainNonHomogene) {
    return this.tvStore.getOmbre(masqueLointainNonHomogene.tv_coef_masque_lointain_non_homogene_id);
  }
}
