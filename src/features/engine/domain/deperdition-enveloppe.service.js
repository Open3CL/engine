/**
 * Calcul des déperditions de l’enveloppe GV
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
   *
   * @param deperditionMurService {DeperditionMurService}
   * @param deperditionPorteService {DeperditionPorteService}
   * @param deperditionPlancherBasService {DeperditionPlancherBasService}
   * @param deperditionPlancherHautService {DeperditionPlancherHautService}
   */
  constructor(
    deperditionMurService,
    deperditionPorteService,
    deperditionPlancherBasService,
    deperditionPlancherHautService
  ) {
    this.#deperditionMurService = deperditionMurService;
    this.#deperditionPorteService = deperditionPorteService;
    this.#deperditionPlancherBasService = deperditionPlancherBasService;
    this.#deperditionPlancherHautService = deperditionPlancherHautService;
  }

  /**
   * Calcul des déperditions de l’enveloppe GV
   *
   * @param ctx {Contexte}
   * @param enveloppe {Enveloppe}
   *
   * @return {Deperdition}
   */
  gv(ctx, enveloppe) {
    /**
     * @type {Deperdition}
     */
    const deperditions = {
      deperdition_mur: 0,
      deperdition_plancher_bas: 0,
      deperdition_plancher_haut: 0,
      deperdition_porte: 0
    };

    enveloppe.mur_collection.mur?.forEach((m) => {
      m.donnee_intermediaire = this.#deperditionMurService.process(ctx, m.donnee_entree);
      deperditions.deperdition_mur +=
        m.donnee_intermediaire.b *
        m.donnee_entree.surface_paroi_opaque *
        m.donnee_intermediaire.umur;
    });

    enveloppe.porte_collection.porte?.forEach((p) => {
      p.donnee_intermediaire = this.#deperditionPorteService.process(ctx, p.donnee_entree);
      deperditions.deperdition_porte +=
        p.donnee_intermediaire.b * p.donnee_entree.surface_porte * p.donnee_intermediaire.uporte;
    });

    const plancherBas = enveloppe.plancher_bas_collection.plancher_bas || [];
    plancherBas?.forEach((pb) => {
      pb.donnee_intermediaire = this.#deperditionPlancherBasService.process(
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
      ph.donnee_intermediaire = this.#deperditionPlancherHautService.process(ctx, ph.donnee_entree);
      deperditions.deperdition_plancher_haut +=
        ph.donnee_intermediaire.b *
        ph.donnee_entree.surface_paroi_opaque *
        ph.donnee_intermediaire.uph;
    });

    return deperditions;
  }
}
