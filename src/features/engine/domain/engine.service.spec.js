import { beforeEach, describe, expect, test, vi } from 'vitest';
import { EngineService } from './engine.service.js';
import { logger } from '../../../core/util/logger/log-service.js';

/**
 * Tests unitaires isolés de `EngineService`.
 *
 * Les quatre services injectés (`DeperditionEnveloppeService`,
 * `ApportEtBesoinService`, `ConsoService` et `ContexteBuilder`) sont remplacés
 * par des doubles de test (spies `vi.fn`) afin de n'exercer que la logique
 * d'orchestration du moteur : nettoyage des données calculées, construction du
 * contexte, délégation aux services et agrégation des sorties. Aucune donnée
 * réelle (tables, DPE complet) n'est nécessaire.
 */

/** @type {{ deperditions: import('vitest').Mock }} */
let deperditionService;

/** @type {{ execute: import('vitest').Mock }} */
let apportEtBesoinService;

/** @type {{ execute: import('vitest').Mock }} */
let consoService;

/** @type {{ fromDpe: import('vitest').Mock }} */
let contextBuilder;

/** @type {EngineService} */
let service;

/**
 * Construit une enveloppe minimale : toutes les collections existent mais leurs
 * tableaux internes sont absents (exerce le court-circuit des `?.`).
 */
function enveloppeMinimale() {
  return {
    mur_collection: {},
    baie_vitree_collection: {},
    ets_collection: {},
    plancher_bas_collection: {},
    plancher_haut_collection: {},
    pont_thermique_collection: {},
    porte_collection: {}
  };
}

/**
 * Construit un DPE minimal : collections présentes mais vides. Utilisé pour
 * exercer les branches « tableau absent » de `#removeComputedData`.
 */
function dpeMinimal() {
  return {
    numero_dpe: 'DPE-MIN',
    logement: {
      caracteristique_generale: {},
      enveloppe: enveloppeMinimale(),
      climatisation_collection: {},
      ventilation_collection: {},
      installation_ecs_collection: {},
      installation_chauffage_collection: {}
    }
  };
}

/**
 * Construit un DPE complet : chaque collection possède un tableau peuplé avec
 * des `donnee_intermediaire`. Exerce la branche « tableau présent » de
 * `#removeComputedData` ainsi que les `?.` imbriqués.
 */
function dpeComplet() {
  return {
    numero_dpe: 'DPE-FULL',
    logement: {
      caracteristique_generale: {},
      sortie: { deperdition: 'ancienne valeur' },
      enveloppe: {
        mur_collection: { mur: [{ donnee_intermediaire: {} }] },
        baie_vitree_collection: {
          baie_vitree: [
            {
              donnee_intermediaire: {},
              baie_vitree_double_fenetre: { donnee_intermediaire: {} }
            },
            // baie sans double fenêtre : exerce la branche falsy du `?.`
            { donnee_intermediaire: {} }
          ]
        },
        ets_collection: { ets: { donnee_intermediaire: {} } },
        plancher_bas_collection: { plancher_bas: [{ donnee_intermediaire: {} }] },
        plancher_haut_collection: { plancher_haut: [{ donnee_intermediaire: {} }] },
        pont_thermique_collection: { pont_thermique: [{ donnee_intermediaire: {} }] },
        porte_collection: { porte: [{ donnee_intermediaire: {} }] }
      },
      climatisation_collection: { climatisation: [{ donnee_intermediaire: {} }] },
      ventilation_collection: { ventilation: [{ donnee_intermediaire: {} }] },
      installation_ecs_collection: {
        installation_ecs: [
          {
            donnee_intermediaire: {},
            generateur_ecs_collection: {
              generateur_ecs: [{ donnee_intermediaire: {} }]
            }
          }
        ]
      },
      installation_chauffage_collection: {
        installation_chauffage: [
          {
            donnee_intermediaire: {},
            emetteur_chauffage_collection: {
              emetteur_chauffage: [{ donnee_intermediaire: {} }]
            }
          }
        ]
      },
      production_elec_enr: { donnee_intermediaire: {} }
    }
  };
}

describe('EngineService (orchestration de la méthode 3CL)', () => {
  beforeEach(() => {
    deperditionService = { deperditions: vi.fn().mockReturnValue('DEPERDITION') };
    apportEtBesoinService = { execute: vi.fn().mockReturnValue('APPORT_ET_BESOIN') };
    consoService = { execute: vi.fn() };
    contextBuilder = { fromDpe: vi.fn().mockReturnValue('CTX') };
    service = new EngineService(
      deperditionService,
      apportEtBesoinService,
      consoService,
      contextBuilder
    );
    vi.spyOn(logger, 'info').mockImplementation(() => {});
  });

  test('trace le numéro de DPE traité', () => {
    service.execute(dpeMinimal());
    expect(logger.info).toHaveBeenCalledWith('Process DPE DPE-MIN');
  });

  test('construit le contexte à partir du DPE nettoyé puis délègue aux services', () => {
    const resultat = service.execute(dpeMinimal());

    // Le contexte est construit une fois à partir du DPE traité
    expect(contextBuilder.fromDpe).toHaveBeenCalledTimes(1);
    const dpeTraite = contextBuilder.fromDpe.mock.calls[0][0];

    // Les services reçoivent le contexte construit et le logement traité
    expect(deperditionService.deperditions).toHaveBeenCalledWith('CTX', dpeTraite.logement);
    expect(apportEtBesoinService.execute).toHaveBeenCalledWith('CTX', dpeTraite.logement);
    expect(consoService.execute).toHaveBeenCalledWith('CTX', dpeTraite.logement);

    // Les résultats des services sont agrégés dans la sortie
    expect(resultat.logement.sortie.deperdition).toBe('DEPERDITION');
    expect(resultat.logement.sortie.apport_et_besoin).toBe('APPORT_ET_BESOIN');
  });

  test('initialise la structure de sortie avec toutes les clés attendues', () => {
    const resultat = service.execute(dpeMinimal());

    expect(resultat.logement.sortie).toEqual({
      deperdition: 'DEPERDITION',
      apport_et_besoin: 'APPORT_ET_BESOIN',
      ef_conso: undefined,
      ep_conso: undefined,
      emission_ges: undefined,
      cout: undefined,
      production_electricite: undefined,
      sortie_par_energie_collection: undefined,
      confort_ete: undefined,
      qualite_isolation: undefined
    });
  });

  test('supprime les données de calcul intermédiaires du DPE retourné', () => {
    const resultat = service.execute(dpeMinimal());
    expect(resultat.logement.donnees_de_calcul).toBeUndefined();
  });

  test("n'altère pas le DPE d'entrée (travail sur une copie profonde)", () => {
    const original = dpeComplet();
    const resultat = service.execute(original);

    // L'entrée conserve ses données calculées d'origine
    expect(original.logement.sortie).toEqual({ deperdition: 'ancienne valeur' });
    expect(original.logement.enveloppe.mur_collection.mur[0].donnee_intermediaire).toBeDefined();
    // La sortie est bien un nouvel objet
    expect(resultat).not.toBe(original);
  });

  test('nettoie toutes les données intermédiaires quand les collections sont peuplées', () => {
    const resultat = service.execute(dpeComplet());
    const env = resultat.logement.enveloppe;

    expect(env.mur_collection.mur[0].donnee_intermediaire).toBeUndefined();
    expect(env.baie_vitree_collection.baie_vitree[0].donnee_intermediaire).toBeUndefined();
    expect(
      env.baie_vitree_collection.baie_vitree[0].baie_vitree_double_fenetre.donnee_intermediaire
    ).toBeUndefined();
    expect(env.ets_collection.ets.donnee_intermediaire).toBeUndefined();
    expect(env.plancher_bas_collection.plancher_bas[0].donnee_intermediaire).toBeUndefined();
    expect(env.plancher_haut_collection.plancher_haut[0].donnee_intermediaire).toBeUndefined();
    expect(env.pont_thermique_collection.pont_thermique[0].donnee_intermediaire).toBeUndefined();
    expect(env.porte_collection.porte[0].donnee_intermediaire).toBeUndefined();

    expect(
      resultat.logement.climatisation_collection.climatisation[0].donnee_intermediaire
    ).toBeUndefined();
    expect(
      resultat.logement.ventilation_collection.ventilation[0].donnee_intermediaire
    ).toBeUndefined();

    const ecs = resultat.logement.installation_ecs_collection.installation_ecs[0];
    expect(ecs.donnee_intermediaire).toBeUndefined();
    expect(ecs.generateur_ecs_collection.generateur_ecs[0].donnee_intermediaire).toBeUndefined();

    const ch = resultat.logement.installation_chauffage_collection.installation_chauffage[0];
    expect(ch.donnee_intermediaire).toBeUndefined();
    expect(
      ch.emetteur_chauffage_collection.emetteur_chauffage[0].donnee_intermediaire
    ).toBeUndefined();

    expect(resultat.logement.production_elec_enr.donnee_intermediaire).toBeUndefined();
  });

  test('reste robuste lorsque les collections ne contiennent aucun élément', () => {
    // Aucun tableau interne ni production_elec_enr : les `?.` court-circuitent
    expect(() => service.execute(dpeMinimal())).not.toThrow();
  });
});
