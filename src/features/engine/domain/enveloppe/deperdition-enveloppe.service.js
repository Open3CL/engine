import { inject } from 'dioma';
import { DeperditionMurService } from './mur/deperdition-mur.service.js';
import { DeperditionPorteService } from './porte/deperdition-porte.service.js';
import { DeperditionPlancherBasService } from './plancher_bas/deperdition-plancher-bas.service.js';
import { DeperditionPlancherHautService } from './plancher_haut/deperdition-plancher-haut.service.js';
import { DeperditionVentilationService } from './ventilation/deperdition-ventilation.service.js';
import { DeperditionBaieVitreeService } from './baie_vitree/deperdition-baie-vitree.service.js';
import { DeperditionPontThermiqueService } from './pont_thermique/deperdition-pont-thermique.service.js';

/**
 * Calcul des déperditions de l’enveloppe
 * @see Méthode de calcul 3CL-DPE 2021 (cotobre 2021) chapitre 3
 */
export class DeperditionEnveloppeService {
  /**
   * @type {DeperditionMurService}
   */
  #deperditionMurService;

  /**
   * @type {DeperditionPorteService}
   */
  #deperditionPorteService;

  /**
   * @type {DeperditionPlancherBasService}
   */
  #deperditionPlancherBasService;

  /**
   * @type {DeperditionPlancherHautService}
   */
  #deperditionPlancherHautService;

  /**
   * @type {DeperditionBaieVitreeService}
   */
  #deperditionBaieVitreeService;

  /**
   * @type {DeperditionPontThermiqueService}
   */
  #deperditionPontThermiqueService;

  /**
   * @type {DeperditionVentilationService}
   */
  #deperditionVentilationService;

  /**
   * @type {number}
   */
  #surfaceDeperditive;

  /**
   * @type {number}
   */
  #surfaceIsolee;

  /**
   * @type {number}
   */
  #surfaceNonIsolee;

  /**
   * @type {number}
   */
  #surfaceMenuiserieAvecJoint;

  /**
   * @type {number}
   */
  #surfaceMenuiserieSansJoint;

  /**
   *
   * @param deperditionMurService {DeperditionMurService}
   * @param deperditionPorteService {DeperditionPorteService}
   * @param deperditionPlancherBasService {DeperditionPlancherBasService}
   * @param deperditionPlancherHautService {DeperditionPlancherHautService}
   * @param deperditionBaieVitreeService {DeperditionBaieVitreeService}
   * @param deperditionPontThermiqueService {DeperditionPontThermiqueService}
   * @param deperditionVentilationService {DeperditionVentilationService}
   */
  constructor(
    deperditionMurService = inject(DeperditionMurService),
    deperditionPorteService = inject(DeperditionPorteService),
    deperditionPlancherBasService = inject(DeperditionPlancherBasService),
    deperditionPlancherHautService = inject(DeperditionPlancherHautService),
    deperditionBaieVitreeService = inject(DeperditionBaieVitreeService),
    deperditionPontThermiqueService = inject(DeperditionPontThermiqueService),
    deperditionVentilationService = inject(DeperditionVentilationService)
  ) {
    this.#deperditionMurService = deperditionMurService;
    this.#deperditionPorteService = deperditionPorteService;
    this.#deperditionPlancherBasService = deperditionPlancherBasService;
    this.#deperditionPlancherHautService = deperditionPlancherHautService;
    this.#deperditionBaieVitreeService = deperditionBaieVitreeService;
    this.#deperditionPontThermiqueService = deperditionPontThermiqueService;
    this.#deperditionVentilationService = deperditionVentilationService;
    this.#surfaceDeperditive = 0;
    this.#surfaceIsolee = 0;
    this.#surfaceNonIsolee = 0;
    this.#surfaceMenuiserieAvecJoint = 0;
    this.#surfaceMenuiserieSansJoint = 0;
  }

  /**
   * Calcul des déperditions de l’enveloppe
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @returns {{hvent: number, hperm: number, deperdition_renouvellement_air: number, deperdition_mur: number, deperdition_plancher_bas: number, deperdition_plancher_haut: number, deperdition_baie_vitree: number, deperdition_porte: number, deperdition_pont_thermique: number, deperdition_enveloppe: number}}
   */
  deperditions(ctx, logement) {
    const GV = this.#gv(ctx, logement.enveloppe);
    const ventilation = this.#ventilation(ctx, logement);
    return {
      ...GV,
      ...ventilation,
      ...{
        deperdition_enveloppe:
          GV.deperdition_mur +
          GV.deperdition_plancher_bas +
          GV.deperdition_plancher_haut +
          GV.deperdition_baie_vitree +
          GV.deperdition_porte +
          GV.deperdition_pont_thermique +
          ventilation.hvent +
          ventilation.hperm
      }
    };
  }

  /**
   * Calcul des déperditions de l’enveloppe GV
   *
   * @param ctx {Contexte}
   * @param enveloppe {Enveloppe}
   *
   * @return {Deperdition}
   */
  #gv(ctx, enveloppe) {
    this.#surfaceDeperditive = 0;
    this.#surfaceIsolee = 0;
    this.#surfaceNonIsolee = 0;
    this.#surfaceMenuiserieAvecJoint = 0;
    this.#surfaceMenuiserieSansJoint = 0;

    /**
     * @type {Deperdition}
     */
    const deperditions = {
      deperdition_mur: 0,
      deperdition_plancher_bas: 0,
      deperdition_plancher_haut: 0,
      deperdition_baie_vitree: 0,
      deperdition_pont_thermique: 0,
      deperdition_porte: 0
    };

    enveloppe.mur_collection.mur?.forEach((m) => {
      m.donnee_intermediaire = this.#deperditionMurService.execute(ctx, m.donnee_entree);
      deperditions.deperdition_mur +=
        m.donnee_intermediaire.b *
        m.donnee_entree.surface_paroi_opaque *
        m.donnee_intermediaire.umur;

      if (m.donnee_intermediaire.b > 0) {
        // Paroi déperditive si b != 0 et adjacence != 'local non déperditif'
        if (m.donnee_entree.enum_type_adjacence_id !== '22') {
          this.#surfaceDeperditive += m.donnee_entree.surface_paroi_opaque;
        }
        // Surface isolée si b != 0 et type d'isolation != 'inconnu' et != 'non isolé'
        if (['1', '2'].includes(m.donnee_entree.enum_type_isolation_id)) {
          this.#surfaceNonIsolee += m.donnee_entree.surface_paroi_opaque;
        } else {
          this.#surfaceIsolee += m.donnee_entree.surface_paroi_opaque;
        }
      }
    });

    enveloppe.porte_collection.porte?.forEach((p) => {
      p.donnee_intermediaire = this.#deperditionPorteService.execute(ctx, p.donnee_entree);
      deperditions.deperdition_porte +=
        p.donnee_intermediaire.b * p.donnee_entree.surface_porte * p.donnee_intermediaire.uporte;

      // Surface de porte déperditive si b != 0
      if (p.donnee_intermediaire.b > 0) {
        this.#surfaceDeperditive += p.donnee_entree.surface_porte;
      }
      // Surface de porte avec ou sans joint
      if (p.donnee_entree.presence_joint) {
        this.#surfaceMenuiserieAvecJoint += p.donnee_entree.surface_porte;
      } else {
        this.#surfaceMenuiserieSansJoint += p.donnee_entree.surface_porte;
      }
    });

    const plancherBas = enveloppe.plancher_bas_collection.plancher_bas || [];
    plancherBas?.forEach((pb) => {
      pb.donnee_intermediaire = this.#deperditionPlancherBasService.execute(
        ctx,
        pb.donnee_entree,
        plancherBas
      );
      deperditions.deperdition_plancher_bas +=
        pb.donnee_intermediaire.b *
        pb.donnee_entree.surface_paroi_opaque *
        pb.donnee_intermediaire.upb_final;
    });

    enveloppe.plancher_haut_collection.plancher_haut?.forEach((ph) => {
      ph.donnee_intermediaire = this.#deperditionPlancherHautService.execute(ctx, ph.donnee_entree);
      deperditions.deperdition_plancher_haut +=
        ph.donnee_intermediaire.b *
        ph.donnee_entree.surface_paroi_opaque *
        ph.donnee_intermediaire.uph;

      if (ph.donnee_intermediaire.b > 0) {
        // Plancher déperditif si b != 0 et adjacence != 'local non déperditif'
        if (ph.donnee_entree.enum_type_adjacence_id !== '22') {
          this.#surfaceDeperditive += ph.donnee_entree.surface_paroi_opaque;
        }
        // Surface isolée si b != 0 et type d'isolation != 'inconnu' et != 'non isolé'
        if (['1', '2'].includes(ph.donnee_entree.enum_type_isolation_id)) {
          this.#surfaceNonIsolee += ph.donnee_entree.surface_paroi_opaque;
        } else {
          this.#surfaceIsolee += ph.donnee_entree.surface_paroi_opaque;
        }
      }
    });

    enveloppe.baie_vitree_collection.baie_vitree?.forEach((bv) => {
      bv.donnee_intermediaire = this.#deperditionBaieVitreeService.execute(ctx, bv);
      deperditions.deperdition_baie_vitree +=
        bv.donnee_intermediaire.b *
        bv.donnee_entree.surface_totale_baie *
        bv.donnee_intermediaire.u_menuiserie;

      // Surface de baie vitrée déperditive si b != 0
      if (bv.donnee_intermediaire.b > 0) {
        this.#surfaceDeperditive += bv.donnee_entree.surface_totale_baie;
      }
      // Surface de baie vitrée avec ou sans joint
      if (bv.donnee_entree.presence_joint) {
        this.#surfaceMenuiserieAvecJoint += bv.donnee_entree.surface_totale_baie;
      } else {
        this.#surfaceMenuiserieSansJoint += bv.donnee_entree.surface_totale_baie;
      }
    });

    enveloppe.pont_thermique_collection.pont_thermique?.forEach((pt) => {
      pt.donnee_intermediaire = this.#deperditionPontThermiqueService.execute(
        ctx,
        enveloppe,
        pt.donnee_entree
      );
      deperditions.deperdition_pont_thermique +=
        pt.donnee_entree.l *
        pt.donnee_intermediaire.k *
        (pt.donnee_entree.pourcentage_valeur_pont_thermique || 1);
    });

    return deperditions;
  }

  /**
   * Calcul des déperditions par la ventilation
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   *
   * @return {Deperdition}
   */
  #ventilation(ctx, logement) {
    /**
     * @type {Deperdition}
     */
    const deperditions = {
      hperm: 0,
      hvent: 0
    };

    logement.ventilation_collection.ventilation?.forEach((ventilation) => {
      ventilation.donnee_intermediaire = this.#deperditionVentilationService.execute(
        ctx,
        ventilation.donnee_entree,
        this.#surfaceDeperditive,
        this.#surfaceIsolee,
        this.#surfaceNonIsolee,
        this.#surfaceMenuiserieAvecJoint,
        this.#surfaceMenuiserieSansJoint
      );
      deperditions.hvent += ventilation.donnee_intermediaire.hvent;
      deperditions.hperm += ventilation.donnee_intermediaire.hperm;
    });

    return deperditions;
  }
}
