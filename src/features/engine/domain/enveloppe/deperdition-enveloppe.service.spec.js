import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DeperditionEnveloppeService } from './deperdition-enveloppe.service.js';

/**
 * Tests unitaires isolés de `DeperditionEnveloppeService`.
 *
 * Les services de déperdition par type de paroi sont remplacés par des doubles de test
 * (spies `vi.fn`) : seule la logique d'agrégation propre au service est vérifiée
 * (sommes b × S × U, surfaces déperditives / isolées / menuiseries, espaces tampons).
 */

let murService;
let porteService;
let plancherBasService;
let plancherHautService;
let baieVitreeService;
let espaceTamponService;
let pontThermiqueService;
let ventilationService;

/** @type {DeperditionEnveloppeService} */
let service;

const ctx = { zoneClimatique: { value: 'h1b' } };

/** Logement sans aucun élément d'enveloppe ni ventilation. */
function logementVide() {
  return {
    enveloppe: {
      mur_collection: {},
      porte_collection: {},
      plancher_bas_collection: {},
      plancher_haut_collection: {},
      baie_vitree_collection: {},
      ets_collection: {},
      pont_thermique_collection: {}
    },
    ventilation_collection: {}
  };
}

describe('DeperditionEnveloppeService (§3 déperditions de l’enveloppe)', () => {
  beforeEach(() => {
    murService = { execute: vi.fn() };
    porteService = { execute: vi.fn() };
    plancherBasService = { execute: vi.fn() };
    plancherHautService = { execute: vi.fn() };
    baieVitreeService = { execute: vi.fn() };
    espaceTamponService = { execute: vi.fn() };
    pontThermiqueService = { execute: vi.fn() };
    ventilationService = { execute: vi.fn() };
    service = new DeperditionEnveloppeService(
      murService,
      porteService,
      plancherBasService,
      plancherHautService,
      baieVitreeService,
      espaceTamponService,
      pontThermiqueService,
      ventilationService
    );
  });

  test('logement sans aucun élément : toutes les déperditions sont nulles', () => {
    const logement = logementVide();
    expect(service.deperditions(ctx, logement)).toEqual({
      deperdition_mur: 0,
      deperdition_plancher_bas: 0,
      deperdition_plancher_haut: 0,
      deperdition_baie_vitree: 0,
      deperdition_pont_thermique: 0,
      deperdition_porte: 0,
      hperm: 0,
      hvent: 0,
      deperdition_enveloppe: 0
    });
    expect(espaceTamponService.execute).not.toHaveBeenCalled();
  });

  test('agrège b × S × U par paroi et transmet les surfaces à la ventilation', () => {
    const logement = logementVide();
    const env = logement.enveloppe;
    env.mur_collection.mur = [
      // déperditif, non isolé (type 2)
      { donnee_entree: { surface_paroi_opaque: 10, enum_type_isolation_id: '2' } },
      // déperditif, isolé, mais sur local non déperditif (22) : hors surface déperditive
      {
        donnee_entree: {
          surface_paroi_opaque: 5,
          enum_type_isolation_id: '3',
          enum_type_adjacence_id: '22'
        }
      },
      // b = 0 : ni surface déperditive, ni isolée
      { donnee_entree: { surface_paroi_opaque: 100, enum_type_isolation_id: '3' } }
    ];
    murService.execute
      .mockReturnValueOnce({ b: 1, umur: 2 })
      .mockReturnValueOnce({ b: 0.5, umur: 1 })
      .mockReturnValueOnce({ b: 0, umur: 1 });

    env.porte_collection.porte = [
      { donnee_entree: { surface_porte: 2, presence_joint: true } },
      { donnee_entree: { surface_porte: 3, presence_joint: false } }
    ];
    porteService.execute
      .mockReturnValueOnce({ b: 1, uporte: 3 })
      .mockReturnValueOnce({ b: 0, uporte: 3 });

    env.plancher_bas_collection.plancher_bas = [{ donnee_entree: { surface_paroi_opaque: 20 } }];
    plancherBasService.execute.mockReturnValue({ b: 1, upb_final: 0.5 });

    env.plancher_haut_collection.plancher_haut = [
      { donnee_entree: { surface_paroi_opaque: 30, enum_type_isolation_id: '1' } },
      {
        donnee_entree: {
          surface_paroi_opaque: 7,
          enum_type_isolation_id: '4',
          enum_type_adjacence_id: '22'
        }
      },
      { donnee_entree: { surface_paroi_opaque: 50, enum_type_isolation_id: '4' } }
    ];
    plancherHautService.execute
      .mockReturnValueOnce({ b: 1, uph: 1 })
      .mockReturnValueOnce({ b: 1, uph: 1 })
      .mockReturnValueOnce({ b: 0, uph: 1 });

    env.baie_vitree_collection.baie_vitree = [
      { donnee_entree: { surface_totale_baie: 4, presence_joint: true } },
      { donnee_entree: { surface_totale_baie: 6 } }
    ];
    baieVitreeService.execute
      .mockReturnValueOnce({ b: 1, u_menuiserie: 2 })
      .mockReturnValueOnce({ b: 0, u_menuiserie: 2 });

    env.pont_thermique_collection.pont_thermique = [
      { donnee_entree: { l: 10, pourcentage_valeur_pont_thermique: 0.5 } },
      { donnee_entree: { l: 4 } }
    ];
    pontThermiqueService.execute.mockReturnValue({ k: 0.5 });

    logement.ventilation_collection.ventilation = [{ donnee_entree: { id: 'v' } }];
    ventilationService.execute.mockReturnValue({ hvent: 10, hperm: 5 });

    const resultat = service.deperditions(ctx, logement);

    expect(resultat).toEqual({
      deperdition_mur: 10 * 2 + 0.5 * 5 * 1,
      deperdition_porte: 2 * 3,
      deperdition_plancher_bas: 20 * 0.5,
      deperdition_plancher_haut: 30 + 7,
      deperdition_baie_vitree: 4 * 2,
      deperdition_pont_thermique: 10 * 0.5 * 0.5 + 4 * 0.5,
      hvent: 10,
      hperm: 5,
      deperdition_enveloppe: 22.5 + 6 + 10 + 37 + 8 + 4.5 + 10 + 5
    });

    // Délégation aux services de paroi
    // Ue calculé plancher par plancher (#46) : la liste des planchers n'est plus transmise
    expect(plancherBasService.execute).toHaveBeenCalledWith(
      ctx,
      env.plancher_bas_collection.plancher_bas[0].donnee_entree
    );
    expect(pontThermiqueService.execute).toHaveBeenCalledWith(
      ctx,
      env,
      env.pont_thermique_collection.pont_thermique[0].donnee_entree
    );

    // Surfaces transmises à la ventilation :
    // déperditive = mur 10 + porte 2 + plancher haut 30 + baie 4 = 46
    // isolée = mur 5 + plancher haut 7 = 12 ; non isolée = mur 10 + plancher haut 30 = 40
    // menuiseries avec joint = porte 2 + baie 4 = 6 ; sans joint = porte 3 + baie 6 = 9
    expect(ventilationService.execute).toHaveBeenCalledWith(ctx, { id: 'v' }, 46, 12, 40, 6, 9);
  });

  test('les surfaces sont réinitialisées à chaque calcul', () => {
    const logement = logementVide();
    logement.enveloppe.porte_collection.porte = [{ donnee_entree: { surface_porte: 2 } }];
    porteService.execute.mockReturnValue({ b: 1, uporte: 1 });
    logement.ventilation_collection.ventilation = [{ donnee_entree: {} }];
    ventilationService.execute.mockReturnValue({ hvent: 0, hperm: 0 });

    service.deperditions(ctx, logement);
    service.deperditions(ctx, logement);

    expect(ventilationService.execute).toHaveBeenLastCalledWith(ctx, {}, 2, 0, 0, 0, 2);
  });

  describe('espaces tampons solarisés', () => {
    test('un ETS unique (objet) reçoit ses données intermédiaires', () => {
      const logement = logementVide();
      const ets = { donnee_entree: { tv_coef_transparence_ets_id: '2' } };
      logement.enveloppe.ets_collection.ets = ets;
      espaceTamponService.execute.mockReturnValue({ bver: 0.55, coef_transparence_ets: 0.62 });

      service.deperditions(ctx, logement);

      expect(espaceTamponService.execute).toHaveBeenCalledWith(ctx, ets);
      expect(ets.donnee_intermediaire).toEqual({ bver: 0.55, coef_transparence_ets: 0.62 });
    });

    test('plusieurs ETS : bver et T calculés pour chacun d’eux (issue #101)', () => {
      const logement = logementVide();
      const V1 = { donnee_entree: { reference: 'V1' } };
      const V2 = { donnee_entree: { reference: 'V2' } };
      logement.enveloppe.ets_collection.ets = [V1, V2];
      espaceTamponService.execute
        .mockReturnValueOnce({ bver: 0.55, coef_transparence_ets: 0.62 })
        .mockReturnValueOnce({ bver: 0.85, coef_transparence_ets: 0.45 });

      service.deperditions(ctx, logement);

      expect(espaceTamponService.execute).toHaveBeenCalledTimes(2);
      expect(espaceTamponService.execute).toHaveBeenNthCalledWith(1, ctx, V1);
      expect(espaceTamponService.execute).toHaveBeenNthCalledWith(2, ctx, V2);
      expect(V1.donnee_intermediaire).toEqual({ bver: 0.55, coef_transparence_ets: 0.62 });
      expect(V2.donnee_intermediaire).toEqual({ bver: 0.85, coef_transparence_ets: 0.45 });
    });

    test('sans ets_collection : aucun calcul d’espace tampon', () => {
      const logement = logementVide();
      delete logement.enveloppe.ets_collection;
      service.deperditions(ctx, logement);
      expect(espaceTamponService.execute).not.toHaveBeenCalled();
    });
  });
});
