import corpus from '../../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DeperditionPontThermiqueService } from './deperdition-pont-thermique.service.js';
import { PontThermiqueTvStore } from '../../../../dpe/infrastructure/pontThermiqueTv.store.js';
import { DeperditionMurService } from '../mur/deperdition-mur.service.js';
import { DeperditionPlancherHautService } from '../plancher_haut/deperdition-plancher-haut.service.js';
import { DeperditionPlancherBasService } from '../plancher_bas/deperdition-plancher-bas.service.js';

/** @type {DeperditionPontThermiqueService} **/
let service;

/** @type {DeperditionMurService} **/
let deperditionMurService;

/** @type {DeperditionPlancherBasService} **/
let deperditionPlancherBasService;

/** @type {DeperditionPlancherHautService} **/
let deperditionPlancherHautService;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {PontThermiqueTvStore} **/
let tvStore;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul de déperdition des ponts thermiques', () => {
  beforeEach(() => {
    tvStore = new PontThermiqueTvStore();
    deperditionMurService = new DeperditionMurService();
    deperditionPlancherBasService = new DeperditionPlancherBasService();
    deperditionPlancherHautService = new DeperditionPlancherHautService();
    service = new DeperditionPontThermiqueService(
      tvStore,
      deperditionMurService,
      deperditionPlancherHautService,
      deperditionPlancherBasService
    );
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  describe("Determination si un élément de l'enveloppe est concerné par un pont thermique", () => {
    test.each([
      {
        label: 'Les Planchers hauts en structure légère sont négligés',
        enumTypePlancherHaut: [9, 10],
        expected: false
      },
      {
        label: 'Les Planchers hauts en structure lourde sont impactés',
        enumTypePlancherHaut: [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16],
        expected: true
      }
    ])('$label', ({ enumTypePlancherHaut, expected }) => {
      enumTypePlancherHaut.forEach((typePlancherHaut) => {
        expect(
          service.plancherHautHasPontThermique({ enum_type_plancher_haut_id: typePlancherHaut })
        ).toBe(expected);
      });
    });

    test.each([
      {
        label: 'Les Planchers bas en structure légère sont négligés',
        enumTypePlancherBas: [4, 10],
        expected: false
      },
      {
        label: 'Les Planchers bas en structure lourde sont impactés',
        enumTypePlancherBas: [1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13],
        expected: true
      }
    ])('$label', ({ enumTypePlancherBas, expected }) => {
      enumTypePlancherBas.forEach((typePlancherBas) => {
        expect(
          service.plancherBasHasPontThermique({ enum_type_plancher_bas_id: typePlancherBas })
        ).toBe(expected);
      });
    });

    test.each([
      {
        label: 'Les murs avec adjacence sur une circulation sont négligés',
        enumTypeAdjacenceId: [14, 15, 16, 17, 18, 22],
        expected: false
      },
      {
        label: 'Les murs avec adjacence autre que sur une circulation sont impactés',
        enumTypeAdjacenceId: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 19, 20, 21],
        expected: true
      },
      {
        label: 'Les murs en matériaux léger pour les liaisons avec les planchers bas sont négligés',
        typeLiaison: 1,
        enumMateriauxStructureMurId: [5, 6, 7, 16, 18, 24, 25, 26, 27],
        expected: false
      },
      {
        label: 'Les murs en matériaux léger pour les liaisons avec les planchers bas sont impactés',
        typeLiaison: 1,
        enumMateriauxStructureMurId: [
          1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 20, 21, 22, 23
        ],
        expected: true
      },
      {
        label:
          'Les murs en matériaux léger pour les liaisons avec les planchers haut sont négligés',
        typeLiaison: 3,
        enumMateriauxStructureMurId: [5, 6, 7, 16, 18, 24, 25, 26, 27],
        expected: false
      },
      {
        label:
          'Les murs en matériaux léger pour les liaisons avec les planchers haut sont impactés',
        typeLiaison: 3,
        enumMateriauxStructureMurId: [
          1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 20, 21, 22, 23
        ],
        expected: true
      },
      {
        label: 'Les murs en structure bois pour les liaisons avec les menuiseries sont négligés',
        typeLiaison: 4,
        enumMateriauxStructureMurId: [5, 6, 7, 18, 24, 25, 26, 27],
        expected: false
      },
      {
        label:
          'Les murs en matériaux autres que structure bois pour les liaisons avec les menuiseries sont impactés',
        typeLiaison: 4,
        enumMateriauxStructureMurId: [
          1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23
        ],
        expected: true
      }
    ])(
      '$label',
      ({
        enumTypeAdjacenceId = undefined,
        typeLiaison = undefined,
        enumMateriauxStructureMurId = undefined,
        expected
      }) => {
        if (enumTypeAdjacenceId) {
          enumTypeAdjacenceId.forEach((typeAdjacenceId) => {
            expect(
              service.murHasPontThermique(
                {
                  enum_type_adjacence_id: typeAdjacenceId,
                  enum_materiaux_structure_mur_id: enumMateriauxStructureMurId
                },
                typeLiaison
              )
            ).toBe(expected);
          });
        }
        if (enumMateriauxStructureMurId) {
          enumMateriauxStructureMurId.forEach((materiauxStructureMurId) => {
            expect(
              service.murHasPontThermique(
                {
                  enum_type_adjacence_id: enumTypeAdjacenceId,
                  enum_materiaux_structure_mur_id: materiauxStructureMurId
                },
                typeLiaison
              )
            ).toBe(expected);
          });
        }
      }
    );
  });

  describe("Récupération des élements de l'enveloppe à partir des références", () => {
    test('Cas des murs', () => {
      let enveloppe = { mur_collection: {} };
      expect(service.mur({}, enveloppe)).toBeUndefined();

      enveloppe.mur_collection.mur = [];
      expect(service.mur({}, enveloppe)).toBeUndefined();

      const murDE = { reference: 'reference' };
      enveloppe.mur_collection.mur = [{ donnee_entree: murDE }];

      expect(service.mur({}, enveloppe)).toBeUndefined();
      expect(service.mur({ reference_1: 'reference_1' }, enveloppe)).toBeUndefined();
      expect(service.mur({ reference_1: 'reference' }, enveloppe)).toStrictEqual(murDE);
      expect(service.mur({ reference_2: 'reference' }, enveloppe)).toStrictEqual(murDE);
    });

    test('Cas des plancher bas', () => {
      let enveloppe = { plancher_bas_collection: {} };
      expect(service.plancherBas({}, enveloppe)).toBeUndefined();

      enveloppe.plancher_bas_collection.plancher_bas = [];
      expect(service.plancherBas({}, enveloppe)).toBeUndefined();

      const plancherBasDE = { reference: 'reference' };
      enveloppe.plancher_bas_collection.plancher_bas = [{ donnee_entree: plancherBasDE }];

      expect(service.plancherBas({}, enveloppe)).toBeUndefined();
      expect(service.plancherBas({ reference_1: 'reference_1' }, enveloppe)).toBeUndefined();
      expect(service.plancherBas({ reference_1: 'reference' }, enveloppe)).toStrictEqual(
        plancherBasDE
      );
      expect(service.plancherBas({ reference_2: 'reference' }, enveloppe)).toStrictEqual(
        plancherBasDE
      );
    });

    test('Cas des plancher haut', () => {
      let enveloppe = { plancher_haut_collection: {} };
      expect(service.plancherHaut({}, enveloppe)).toBeUndefined();

      enveloppe.plancher_haut_collection.plancher_haut = [];
      expect(service.plancherHaut({}, enveloppe)).toBeUndefined();

      const plancherHautDE = { reference: 'reference' };
      enveloppe.plancher_haut_collection.plancher_haut = [{ donnee_entree: plancherHautDE }];

      expect(service.plancherHaut({}, enveloppe)).toBeUndefined();
      expect(service.plancherHaut({ reference_1: 'reference_1' }, enveloppe)).toBeUndefined();
      expect(service.plancherHaut({ reference_1: 'reference' }, enveloppe)).toStrictEqual(
        plancherHautDE
      );
      expect(service.plancherHaut({ reference_2: 'reference' }, enveloppe)).toStrictEqual(
        plancherHautDE
      );
    });

    test('Cas des plancher menuiseries', () => {
      let enveloppe = { baie_vitree_collection: {}, porte_collection: {} };
      expect(service.menuiserie({}, enveloppe)).toBeUndefined();

      enveloppe.baie_vitree_collection.baie_vitree = [];
      enveloppe.porte_collection.porte = [];
      expect(service.menuiserie({}, enveloppe)).toBeUndefined();

      const menuiserieDE = { reference: 'reference' };
      enveloppe.baie_vitree_collection.baie_vitree = [{ donnee_entree: menuiserieDE }];

      expect(service.menuiserie({}, enveloppe)).toBeUndefined();
      expect(service.menuiserie({ reference_1: 'reference_1' }, enveloppe)).toBeUndefined();
      expect(service.menuiserie({ reference_1: 'reference' }, enveloppe)).toStrictEqual(
        menuiserieDE
      );
      expect(service.menuiserie({ reference_2: 'reference' }, enveloppe)).toStrictEqual(
        menuiserieDE
      );

      enveloppe.baie_vitree_collection.baie_vitree = [];
      enveloppe.porte_collection.porte = [{ donnee_entree: menuiserieDE }];

      expect(service.menuiserie({}, enveloppe)).toBeUndefined();
      expect(service.menuiserie({ reference_1: 'reference_1' }, enveloppe)).toBeUndefined();
      expect(service.menuiserie({ reference_1: 'reference' }, enveloppe)).toStrictEqual(
        menuiserieDE
      );
      expect(service.menuiserie({ reference_2: 'reference' }, enveloppe)).toStrictEqual(
        menuiserieDE
      );

      enveloppe.baie_vitree_collection.baie_vitree = [{ donnee_entree: menuiserieDE }];
      expect(service.menuiserie({ reference_2: 'reference' }, enveloppe)).toStrictEqual(
        menuiserieDE
      );
    });
  });

  describe('Calcul du pont thermique de type plancher bas / mur', () => {
    test('Aucun plancher bas trouvé, valeur par défaut issue de tv_pont_thermique_id', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);
      vi.spyOn(tvStore, 'getKForPlancher').mockReturnValue(0.25);

      expect(service.pontThermiquePlancherBasMur({}, { tv_pont_thermique_id: 1 }, {}, 3)).toBe(
        0.75
      );
      expect(tvStore.getKForMurById).toHaveBeenCalledWith(1);
      expect(tvStore.getKForPlancher).not.toHaveBeenCalled();
    });

    test('Plancher bas non concerné par le pont thermique', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);
      vi.spyOn(tvStore, 'getKForPlancher').mockReturnValue(0.25);

      const pontThermiqueDE = { reference_1: 'reference' };
      const enveloppe = {
        plancher_bas_collection: {
          plancher_bas: [
            { donnee_entree: { enum_type_plancher_bas_id: 4, reference: 'reference' } }
          ]
        }
      };
      expect(service.pontThermiquePlancherBasMur({}, pontThermiqueDE, enveloppe, 3)).toBe(0);
      expect(tvStore.getKForMurById).not.toHaveBeenCalled();
      expect(tvStore.getKForPlancher).not.toHaveBeenCalled();
    });

    test('Utilisation des tables de valeurs pour calculer le pont thermique', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);
      vi.spyOn(tvStore, 'getKForPlancher').mockReturnValue(0.25);

      const pontThermiqueDE = { reference_1: 'reference' };
      const enveloppe = {
        plancher_bas_collection: {
          plancher_bas: [{ donnee_entree: { reference: 'reference', enum_type_isolation_id: 5 } }]
        }
      };
      expect(service.pontThermiquePlancherBasMur({}, pontThermiqueDE, enveloppe, 3)).toBe(0.25);
      expect(tvStore.getKForMurById).not.toHaveBeenCalled();
      expect(tvStore.getKForPlancher).toHaveBeenCalledWith(1, 'iti', 'itr');
    });
  });

  describe('Calcul du pont thermique de type plancher haut / mur', () => {
    test('Aucun plancher haut trouvé, valeur par défaut issue de tv_pont_thermique_id', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);
      vi.spyOn(tvStore, 'getKForPlancher').mockReturnValue(0.25);

      expect(service.pontThermiquePlancherHautMur({}, { tv_pont_thermique_id: 1 }, {}, 3)).toBe(
        0.75
      );
      expect(tvStore.getKForMurById).toHaveBeenCalledWith(1);
      expect(tvStore.getKForPlancher).not.toHaveBeenCalled();
    });

    test('Plancher haut non concerné par le pont thermique', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);
      vi.spyOn(tvStore, 'getKForPlancher').mockReturnValue(0.25);

      const pontThermiqueDE = { reference_1: 'reference' };
      const enveloppe = {
        plancher_haut_collection: {
          plancher_haut: [
            { donnee_entree: { enum_type_plancher_haut_id: 9, reference: 'reference' } }
          ]
        }
      };
      expect(service.pontThermiquePlancherHautMur({}, pontThermiqueDE, enveloppe, 3)).toBe(0);
      expect(tvStore.getKForMurById).not.toHaveBeenCalled();
      expect(tvStore.getKForPlancher).not.toHaveBeenCalled();
    });

    test('Utilisation des tables de valeurs pour calculer le pont thermique', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);
      vi.spyOn(tvStore, 'getKForPlancher').mockReturnValue(0.25);

      const pontThermiqueDE = { reference_1: 'reference' };
      const enveloppe = {
        plancher_haut_collection: {
          plancher_haut: [{ donnee_entree: { reference: 'reference', enum_type_isolation_id: 5 } }]
        }
      };
      expect(service.pontThermiquePlancherHautMur({}, pontThermiqueDE, enveloppe, 3)).toBe(0.25);
      expect(tvStore.getKForMurById).not.toHaveBeenCalled();
      expect(tvStore.getKForPlancher).toHaveBeenCalledWith(3, 'iti', 'itr');
    });
  });

  describe('Calcul du pont thermique de type menuiserie / mur', () => {
    test('Aucune menuiserie trouvée, valeur par défaut issue de tv_pont_thermique_id', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);
      vi.spyOn(tvStore, 'getKForMenuiserie').mockReturnValue(0.25);

      expect(service.pontThermiqueMenuiserieMur({ tv_pont_thermique_id: 1 }, {}, 3)).toBe(0.75);
      expect(tvStore.getKForMurById).toHaveBeenCalledWith(1);
      expect(tvStore.getKForMenuiserie).not.toHaveBeenCalled();
    });

    test('Utilisation des tables de valeurs pour calculer le pont thermique', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);
      vi.spyOn(tvStore, 'getKForMenuiserie').mockReturnValue(0.25);

      const pontThermiqueDE = { reference_1: 'reference' };
      const enveloppe = {
        baie_vitree_collection: {
          baie_vitree: [
            {
              donnee_entree: {
                reference: 'reference',
                enum_type_pose_id: 5,
                largeur_dormant: 5,
                presence_retour_isolation: 0
              }
            }
          ]
        }
      };
      expect(service.pontThermiqueMenuiserieMur(pontThermiqueDE, enveloppe, 3)).toBe(0.25);
      expect(tvStore.getKForMurById).not.toHaveBeenCalled();
      expect(tvStore.getKForMenuiserie).toHaveBeenCalledWith(5, 'iti', 5, 0, 5);
    });

    test("Utilisation du type de pose par défaut 'tunnel' pour calculer le pont thermique", () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);
      vi.spyOn(tvStore, 'getKForMenuiserie').mockReturnValue(0.25);

      const pontThermiqueDE = { reference_1: 'reference' };
      const enveloppe = {
        baie_vitree_collection: {
          baie_vitree: [
            {
              donnee_entree: {
                reference: 'reference',
                largeur_dormant: 5,
                presence_retour_isolation: 0
              }
            }
          ]
        }
      };
      expect(service.pontThermiqueMenuiserieMur(pontThermiqueDE, enveloppe, 3)).toBe(0.25);
      expect(tvStore.getKForMurById).not.toHaveBeenCalled();
      expect(tvStore.getKForMenuiserie).toHaveBeenCalledWith(5, 'iti', 3, 0, 5);
    });
  });

  describe("Calcul de l'isolation du mur", () => {
    test('Utilisation du service deperditionMurService', () => {
      vi.spyOn(deperditionMurService, 'typeIsolation').mockReturnValue(6);

      /**
       * @type {Contexte}
       */
      const ctx = {
        enumPeriodeConstructionId: 1
      };
      /**
       * @type {MurDE}
       */
      const murDE = {
        enum_type_adjacence_id: 1
      };

      expect(service.isolationMur(ctx, murDE)).toBe(6);
      expect(deperditionMurService.typeIsolation).toHaveBeenCalledWith(ctx, murDE);
    });

    test('Isolation ITI si pas possible de définir le mur', () => {
      vi.spyOn(deperditionMurService, 'typeIsolation').mockReturnValue(6);

      expect(service.isolationMur({}, undefined)).toBe(3);
      expect(deperditionMurService.typeIsolation).not.toHaveBeenCalled();
    });
  });

  describe('Calcul du facteur k du pont thermique', () => {
    test('Utilisation de k_saisi', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);

      expect(
        service.execute({}, {}, { k_saisi: 0.6, enum_methode_saisie_pont_thermique_id: 2 }, 3)
      ).toStrictEqual({ k: 0.6 });
      expect(
        service.execute({}, {}, { k_saisi: 0.6, enum_methode_saisie_pont_thermique_id: 3 }, 3)
      ).toStrictEqual({ k: 0.6 });
      expect(tvStore.getKForMurById).not.toHaveBeenCalled();
    });

    test('Utilisation de la valeur par défaut si pas de reference_1', () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);

      const pontThermiqueDE = { tv_pont_thermique_id: 1, enum_methode_saisie_pont_thermique_id: 4 };
      expect(service.execute({}, {}, pontThermiqueDE)).toStrictEqual({ k: 0.75 });
      expect(tvStore.getKForMurById).toHaveBeenCalledWith(1);
    });

    test("Utilisation de la valeur par défaut si la valeur k n'est pas trouvée", () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);

      expect(
        service.execute(
          {},
          {},
          { k_saisi: undefined, enum_methode_saisie_pont_thermique_id: 2, tv_pont_thermique_id: 1 },
          3
        )
      ).toStrictEqual({ k: 0.75 });

      expect(tvStore.getKForMurById).toHaveBeenCalledWith(1);
    });

    test("0 si le mur n'est pas concerné par les déperditions pont thermique", () => {
      vi.spyOn(tvStore, 'getKForMurById').mockReturnValue(0.75);

      const pontThermiqueDE = {
        reference_1: 'reference',
        tv_pont_thermique_id: 1,
        enum_methode_saisie_pont_thermique_id: 4
      };
      const enveloppe = {
        mur_collection: {
          mur: [{ donnee_entree: { reference: 'reference', enum_type_adjacence_id: 14 } }]
        }
      };

      expect(service.execute({}, enveloppe, pontThermiqueDE)).toStrictEqual({ k: 0 });
      expect(tvStore.getKForMurById).not.toHaveBeenCalled();
    });

    test('Utilisation de getKForMur pour les refend ou plancher intermédiaire', () => {
      vi.spyOn(tvStore, 'getKForMur').mockReturnValue(0.75);

      const pontThermiqueDE = {
        reference_1: 'reference',
        tv_pont_thermique_id: 1,
        enum_type_liaison_id: 2,
        enum_type_adjacence_id: 8,
        enum_methode_saisie_pont_thermique_id: 4
      };
      expect(service.execute({}, {}, pontThermiqueDE)).toStrictEqual({ k: 0.75 });
      expect(tvStore.getKForMur).toHaveBeenCalledWith(2, 'iti');

      pontThermiqueDE.enum_type_liaison_id = 4;
      expect(service.execute({}, {}, pontThermiqueDE)).toStrictEqual({ k: 0.75 });
      expect(tvStore.getKForMur).toHaveBeenCalledWith(2, 'iti');
    });

    test('Utilisation de getKForPlancher pour un plancher bas', () => {
      vi.spyOn(tvStore, 'getKForPlancher').mockReturnValue(0.35);
      vi.spyOn(deperditionPlancherBasService, 'typeIsolation').mockReturnValue(3);

      const pontThermiqueDE = {
        reference_1: 'reference',
        tv_pont_thermique_id: 1,
        enum_type_liaison_id: 1,
        enum_materiaux_structure_mur_id: 3,
        enum_methode_saisie_pont_thermique_id: 4
      };

      const plancherBasDE = { reference: 'reference', enum_type_plancher_bas_id: 1 };

      const enveloppe = {
        plancher_bas_collection: { plancher_bas: [{ donnee_entree: plancherBasDE }] }
      };
      expect(service.execute({}, enveloppe, pontThermiqueDE)).toStrictEqual({ k: 0.35 });
      expect(deperditionPlancherBasService.typeIsolation).toHaveBeenCalledWith({}, plancherBasDE);
      expect(tvStore.getKForPlancher).toHaveBeenCalledWith(1, 'iti', 'iti');
    });

    test('Utilisation de getKForPlancher pour un plancher haut', () => {
      vi.spyOn(tvStore, 'getKForPlancher').mockReturnValue(0.35);
      vi.spyOn(deperditionPlancherHautService, 'typeIsolation').mockReturnValue(3);

      const pontThermiqueDE = {
        reference_1: 'reference',
        tv_pont_thermique_id: 1,
        enum_type_liaison_id: 3,
        enum_materiaux_structure_mur_id: 3,
        enum_methode_saisie_pont_thermique_id: 4
      };

      const plancherHautDE = { reference: 'reference', enum_type_plancher_haut_id: 1 };

      const enveloppe = {
        plancher_haut_collection: { plancher_haut: [{ donnee_entree: plancherHautDE }] }
      };
      expect(service.execute({}, enveloppe, pontThermiqueDE)).toStrictEqual({ k: 0.35 });
      expect(deperditionPlancherHautService.typeIsolation).toHaveBeenCalledWith({}, plancherHautDE);
      expect(tvStore.getKForPlancher).toHaveBeenCalledWith(3, 'iti', 'iti');
    });

    test('Utilisation de getKForMenuiserie pour une menuiserie', () => {
      vi.spyOn(tvStore, 'getKForMenuiserie').mockReturnValue(0.35);

      const pontThermiqueDE = {
        reference_1: 'reference',
        tv_pont_thermique_id: 1,
        enum_type_liaison_id: 5,
        enum_materiaux_structure_mur_id: 3,
        enum_methode_saisie_pont_thermique_id: 4
      };

      const porteDE = {
        reference: 'reference',
        enum_type_plancher_haut_id: 1,
        largeur_dormant: 5,
        presence_retour_isolation: 0
      };

      const enveloppe = { porte_collection: { porte: [{ donnee_entree: porteDE }] } };
      expect(service.execute({}, enveloppe, pontThermiqueDE)).toStrictEqual({ k: 0.35 });
      expect(tvStore.getKForMenuiserie).toHaveBeenCalledWith(5, 'iti', 3, 0, 5);
    });

    test("Utilisation de getKForMenuiserie avec type de pose 3 pour une menuiserie avec une pose 'sans objet'", () => {
      vi.spyOn(tvStore, 'getKForMenuiserie').mockReturnValue(0.35);

      const pontThermiqueDE = {
        reference_1: 'reference',
        tv_pont_thermique_id: 1,
        enum_type_liaison_id: 5,
        enum_materiaux_structure_mur_id: 3,
        enum_methode_saisie_pont_thermique_id: 4
      };

      const porteDE = {
        reference: 'reference',
        enum_type_plancher_haut_id: 1,
        enum_type_pose_id: 4,
        largeur_dormant: 5,
        presence_retour_isolation: 0
      };

      const enveloppe = { porte_collection: { porte: [{ donnee_entree: porteDE }] } };
      expect(service.execute({}, enveloppe, pontThermiqueDE)).toStrictEqual({ k: 0.35 });
      expect(tvStore.getKForMenuiserie).toHaveBeenCalledWith(5, 'iti', 3, 0, 5);
    });
  });

  describe("Test d'intégration des ponts thermiques", () => {
    test.each(corpus)('vérification des DI des ponts thermiques pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      const pontsThermiques =
        dpeRequest.logement.enveloppe.pont_thermique_collection?.pont_thermique || [];

      pontsThermiques.forEach((pontThermique) => {
        const di = service.execute(ctx, dpeRequest.logement.enveloppe, pontThermique.donnee_entree);
        expect(di.k).toBeCloseTo(pontThermique.donnee_intermediaire.k, 2);
      });
    });
  });
});
