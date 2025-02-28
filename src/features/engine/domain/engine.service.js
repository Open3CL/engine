import { inject } from 'dioma';
import { ContexteBuilder } from './contexte.builder.js';
import { DeperditionEnveloppeService } from './enveloppe/deperdition-enveloppe.service.js';
import { logger } from '../../../core/util/logger/log-service.js';

export class EngineService {
  /**
   * @type {DeperditionEnveloppeService}
   */
  #deperditionService;
  /**
   * @type {ContexteBuilder}
   */
  #contextBuilder;

  /**
   * @param deperditionService {DeperditionEnveloppeService}
   * @param contextBuilder {ContexteBuilder}
   */
  constructor(
    deperditionService = inject(DeperditionEnveloppeService),
    contextBuilder = inject(ContexteBuilder)
  ) {
    this.#deperditionService = deperditionService;
    this.#contextBuilder = contextBuilder;
  }

  /**
   * Applique la méthode 3CL à l'entrée du DPE
   * @param dpe {Dpe}
   * @return {Dpe} Nouveau DPE avec les données intermédiaires et les sorties calculées
   */
  execute(dpe) {
    /** @type {Dpe} */
    const proceededDpe = this.#removeComputedData(JSON.parse(JSON.stringify(dpe)));

    logger.info(`Process DPE ${proceededDpe.numero_dpe}`);

    proceededDpe.logement.sortie = {
      deperdition: undefined,
      apport_et_besoin: undefined,
      ef_conso: undefined,
      ep_conso: undefined,
      emission_ges: undefined,
      cout: undefined,
      production_electricite: undefined,
      sortie_par_energie_collection: undefined,
      confort_ete: undefined,
      qualite_isolation: undefined
    };
    const ctx = this.#contextBuilder.fromDpe(proceededDpe);

    // Calcul de l'inertie

    // Calcul des déperditions
    proceededDpe.logement.sortie.deperdition = this.#deperditionService.deperditions(
      ctx,
      dpe.logement
    );

    // Calcul des déperditions par renouvellement de l'air

    // Calcul de l'intermittence

    // Calcul des apports gratuit

    // Calcul des besoins de chauffage

    // Calcul des rendements des installations

    // Calcul des rendements des générations

    // Calcul des rendements des générateurs ECS

    // Calcul des consommations chauffage

    // Calcul des consommations de froid

    // Calcul des consommations ECS

    // Calcul des consommations d'auxiliaires des installations de chauffage et ECS

    // Calcul des consommations d'auxiliaires de ventilation

    // Calcul des consommations éclairage et production d'électricités

    // Calcul du DPE dans le collectif

    return proceededDpe;
  }

  /**
   * Supprime toutes les données calculées d'un DPE
   * Utilisé en particulier pour les DPE déjà existant.
   * @param dpe {Dpe}
   * @return {Dpe} DPE sans les données intermédiaires et les sorties calculées
   */
  #removeComputedData(dpe) {
    delete dpe.logement.sortie;
    delete dpe.logement.enveloppe.inertie;

    dpe.logement.enveloppe.mur_collection.mur?.map((m) => delete m.donnee_intermediaire);
    dpe.logement.enveloppe.baie_vitree_collection.baie_vitree?.map((m) => {
      delete m.baie_vitree_double_fenetre?.donnee_intermediaire;
      delete m.donnee_intermediaire;
    });
    delete dpe.logement.enveloppe.ets_collection.ets?.donnee_intermediaire;
    dpe.logement.enveloppe.plancher_bas_collection.plancher_bas?.map(
      (m) => delete m.donnee_intermediaire
    );
    dpe.logement.enveloppe.plancher_haut_collection.plancher_haut?.map(
      (m) => delete m.donnee_intermediaire
    );
    dpe.logement.enveloppe.pont_thermique_collection.pont_thermique?.map(
      (m) => delete m.donnee_intermediaire
    );
    dpe.logement.enveloppe.porte_collection.porte?.map((m) => delete m.donnee_intermediaire);
    dpe.logement.climatisation_collection.climatisation?.map((m) => delete m.donnee_intermediaire);
    dpe.logement.ventilation_collection.ventilation?.map((m) => delete m.donnee_intermediaire);
    dpe.logement.ventilation_collection.ventilation?.map((m) => delete m.donnee_intermediaire);
    dpe.logement.installation_ecs_collection.installation_ecs?.map((m) => {
      m.generateur_ecs_collection.generateur_ecs?.map((n) => {
        delete n.donnee_intermediaire;
      });
      delete m.donnee_intermediaire;
    });
    dpe.logement.installation_chauffage_collection.installation_chauffage?.map((m) => {
      m.emetteur_chauffage_collection.emetteur_chauffage?.map((n) => {
        delete n.donnee_intermediaire;
      });
      m.generateur_chauffage_collection.generateur_chauffage?.map((n) => {
        delete n.donnee_intermediaire;
      });
      delete m.donnee_intermediaire;
    });
    delete dpe.logement.production_elec_enr?.donnee_intermediaire;

    return dpe;
  }
}
