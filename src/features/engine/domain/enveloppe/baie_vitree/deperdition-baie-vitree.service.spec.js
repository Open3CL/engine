import corpus from '../../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { DeperditionBaieVitreeService } from './deperdition-baie-vitree.service.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BaieVitreeTvStore } from '../../../../dpe/infrastructure/baieVitreeTv.store.js';

/** @type {DeperditionBaieVitreeService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {BaieVitreeTvStore} **/
let tvStore;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul de déperdition des baies vitrées', () => {
  beforeEach(() => {
    tvStore = new BaieVitreeTvStore();
    service = new DeperditionBaieVitreeService(tvStore);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  describe('Determination du coefficient sw', () => {
    test('Doit retourner sw_saisi directement', () => {
      vi.spyOn(tvStore, 'getSw').mockReturnValue(18.8);
      /**
       * @type {BaieVitree}
       */
      let bv = {
        donnee_entree: {
          enum_type_materiaux_menuiserie_id: '1',
          enum_type_vitrage_id: '2',
          enum_type_baie_id: '6',
          vitrage_vir: '1',
          enum_type_pose_id: '3',
          sw_saisi: 4.5
        }
      };

      let sw = service.sw(bv);
      expect(tvStore.getSw).not.toHaveBeenCalled();
      expect(sw).toBe(4.5);
    });

    test('Ne doit pas utiliser vitrage_vir et enum_type_pose_id si enum_type_materiaux_menuiserie_id = 1 ou 2', () => {
      vi.spyOn(tvStore, 'getSw').mockReturnValue(18.8);
      /**
       * @type {BaieVitree}
       */
      let bv = {
        donnee_entree: {
          enum_type_materiaux_menuiserie_id: '1',
          enum_type_vitrage_id: '2',
          enum_type_baie_id: '6',
          vitrage_vir: '1',
          enum_type_pose_id: '3'
        }
      };

      let sw = service.sw(bv);
      expect(tvStore.getSw).toHaveBeenCalledWith('2', '6', '1', undefined, undefined);
      expect(sw).toBe(18.8);
    });

    test('Doit utiliser vitrage_vir et enum_type_pose_id si enum_type_materiaux_menuiserie_id != 1 et != 2', () => {
      vi.spyOn(tvStore, 'getSw').mockReturnValue(18.8);
      /**
       * @type {BaieVitree}
       */
      let bv = {
        donnee_entree: {
          enum_type_materiaux_menuiserie_id: '4',
          enum_type_vitrage_id: '2',
          enum_type_baie_id: '6',
          vitrage_vir: '1',
          enum_type_pose_id: '3'
        }
      };

      let sw = service.sw(bv);
      expect(tvStore.getSw).toHaveBeenCalledWith('2', '6', '4', '1', '3');
      expect(sw).toBe(18.8);
    });

    test('Doit prendre en compte le survitrage si présent', () => {
      vi.spyOn(tvStore, 'getSw').mockReturnValue(18.8);
      /**
       * @type {BaieVitree}
       */
      let bv = {
        donnee_entree: {
          enum_type_materiaux_menuiserie_id: '4',
          enum_type_vitrage_id: '2',
          enum_type_baie_id: '6',
          vitrage_vir: '1',
          enum_type_pose_id: '3',
          double_fenetre: 1
        },
        baie_vitree_double_fenetre: {
          donnee_entree: {
            enum_type_materiaux_menuiserie_id: '4',
            enum_type_vitrage_id: '2',
            enum_type_baie_id: '6',
            vitrage_vir: '1',
            enum_type_pose_id: '3'
          }
        }
      };

      let sw = service.sw(bv);
      expect(tvStore.getSw).toHaveBeenNthCalledWith(2, '2', '6', '4', '1', '3');
      expect(sw).toBe(18.8 * 18.8);
    });
  });

  describe('Determination du coefficient uw', () => {
    test('Doit retourner uw_saisi directement', () => {
      vi.spyOn(tvStore, 'getUw').mockReturnValue(18.8);

      let uw = service.uw({ donnee_entree: { uw_saisi: 16.4 } }, 2.4);

      expect(tvStore.getUw).not.toHaveBeenCalled();
      expect(uw).toBe(16.4);
    });

    test('Doit appeler tvStore', () => {
      vi.spyOn(tvStore, 'getUw').mockReturnValue(18.8);

      let uw = service.uw(
        { donnee_entree: { enum_type_baie_id: '10', enum_type_materiaux_menuiserie_id: '1' } },
        2.4
      );

      expect(tvStore.getUw).toHaveBeenCalledWith('10', '1', 2.4);
      expect(uw).toBe(18.8);
    });

    test('Doit prendre en compte le survitrage si présent', () => {
      vi.spyOn(tvStore, 'getUw').mockReturnValue(18.8);
      /**
       * @type {BaieVitree}
       */
      let bv = {
        donnee_entree: {
          ug_saisi: 2.5,
          enum_type_materiaux_menuiserie_id: '4',
          enum_type_baie_id: '6',
          double_fenetre: 1
        },
        baie_vitree_double_fenetre: {
          donnee_entree: {
            ug_saisi: 2.5,
            enum_type_materiaux_menuiserie_id: '4',
            enum_type_baie_id: '6'
          }
        }
      };

      let uw = service.uw(bv, 2.4);
      expect(tvStore.getUw).toHaveBeenNthCalledWith(2, '6', '4', 2.5);
      expect(uw).toBe(1 / (1 / 18.8 + 1 / 18.8 + 0.07));
    });
  });

  describe('Determination du coefficient ug', () => {
    test('Doit retourner ug_saisi directement', () => {
      vi.spyOn(tvStore, 'getUg').mockReturnValue(18.8);

      let ug = service.ug({ ug_saisi: 16.4 });

      expect(tvStore.getUg).not.toHaveBeenCalled();
      expect(ug).toBe(16.4);
    });

    test('Ne retourne aucune valeur pour les parois en brique ou polycarbonate', () => {
      vi.spyOn(tvStore, 'getUg').mockReturnValue(18.8);

      let ug = service.ug({ enum_type_baie_id: '1' });

      expect(tvStore.getUg).not.toHaveBeenCalled();
      expect(ug).toBeUndefined();

      ug = service.ug({ enum_type_baie_id: '2' });

      expect(tvStore.getUg).not.toHaveBeenCalled();
      expect(ug).toBeUndefined();

      ug = service.ug({ enum_type_baie_id: '3' });

      expect(tvStore.getUg).not.toHaveBeenCalled();
      expect(ug).toBeUndefined();
    });

    test('Doit appeler tvStore sans epaisseur, enum_type_gaz_lame_id, enum_inclinaison_vitrage_id, vitrage_vir pour les simples vitrages', () => {
      vi.spyOn(tvStore, 'getUg').mockReturnValue(18.8);

      /**
       * @type {BaieVitreeDE}
       */
      let bvDE = {
        enum_type_vitrage_id: '1',
        vitrage_vir: '1',
        enum_inclinaison_vitrage_id: '1',
        enum_type_gaz_lame_id: '1',
        epaisseur_lame: '18'
      };

      let uw = service.ug(bvDE);

      expect(tvStore.getUg).toHaveBeenCalledWith('1', undefined, undefined, undefined, undefined);
      expect(uw).toBe(18.8);
    });

    test('Doit appeler tvStore avec epaisseur, enum_type_gaz_lame_id, enum_inclinaison_vitrage_id, vitrage_vir pour les doubles vitrages', () => {
      vi.spyOn(tvStore, 'getUg').mockReturnValue(18.8);

      /**
       * @type {BaieVitreeDE}
       */
      let bvDE = {
        enum_type_vitrage_id: '2',
        vitrage_vir: '1',
        enum_inclinaison_vitrage_id: '2',
        enum_type_gaz_lame_id: '1',
        epaisseur_lame: '18'
      };

      let uw = service.ug(bvDE);

      expect(tvStore.getUg).toHaveBeenCalledWith('2', '1', '2', '1', 18);
      expect(uw).toBe(18.8);
    });

    test("Doit appeler tvStore avec l'epaisseur la plus proche dans celles qui sont disponibles", () => {
      vi.spyOn(tvStore, 'getUg').mockReturnValue(18.8);
      vi.spyOn(tvStore, 'getEpaisseurAvailableForUg').mockReturnValue([2, 4, 8]);

      /**
       * @type {BaieVitreeDE}
       */
      let bvDE = {
        enum_type_vitrage_id: '2',
        vitrage_vir: '1',
        enum_inclinaison_vitrage_id: '2',
        enum_type_gaz_lame_id: '1',
        epaisseur_lame: '18'
      };

      let uw = service.ug(bvDE);

      expect(tvStore.getUg).toHaveBeenCalledWith('2', '1', '2', '1', 8);
      expect(uw).toBe(18.8);
    });

    test('Doit appeler tvStore avec un équivalent double vitrage pour un sur vitrage avec majoration de 0.1', () => {
      vi.spyOn(tvStore, 'getUg').mockReturnValue(18.8);

      /**
       * @type {BaieVitreeDE}
       */
      let bvDE = {
        enum_type_vitrage_id: '4',
        vitrage_vir: '0',
        enum_inclinaison_vitrage_id: '3',
        enum_type_gaz_lame_id: '1',
        epaisseur_lame: '20'
      };

      let uw = service.ug(bvDE);

      expect(tvStore.getUg).toHaveBeenCalledWith('2', '1', '3', '0', 20);
      expect(uw).toBe(18.8 + 0.1);
    });
  });

  describe('Determination du facteur d’ensoleillement', () => {
    test('Doit retourner fe1 = 1 et fe2 = 1 si aucun masque', () => {
      vi.spyOn(tvStore, 'getMasqueProche').mockReturnValue(1.2);
      vi.spyOn(tvStore, 'getMasqueLointainHomogene').mockReturnValue(3.4);
      vi.spyOn(tvStore, 'getOmbre').mockReturnValue(0.5);

      let [fe1, fe2] = service.fe({});

      expect(tvStore.getMasqueProche).not.toHaveBeenCalled();
      expect(tvStore.getMasqueLointainHomogene).not.toHaveBeenCalled();
      expect(tvStore.getOmbre).not.toHaveBeenCalled();
      expect(fe1).toBe(1);
      expect(fe2).toBe(1);
    });

    test('Doit utiliser tvStore pour les masques proches', () => {
      vi.spyOn(tvStore, 'getMasqueProche').mockReturnValue(1.2);
      vi.spyOn(tvStore, 'getMasqueLointainHomogene').mockReturnValue(3.4);
      vi.spyOn(tvStore, 'getOmbre').mockReturnValue(0.5);

      let [fe1, fe2] = service.fe({ tv_coef_masque_proche_id: '1' });

      expect(tvStore.getMasqueProche).toHaveBeenCalledWith('1');
      expect(tvStore.getMasqueLointainHomogene).not.toHaveBeenCalled();
      expect(tvStore.getOmbre).not.toHaveBeenCalled();
      expect(fe1).toBe(1.2);
      expect(fe2).toBe(1);
    });

    test('Doit utiliser tvStore pour les masques lointains homogènes', () => {
      vi.spyOn(tvStore, 'getMasqueProche').mockReturnValue(1.2);
      vi.spyOn(tvStore, 'getMasqueLointainHomogene').mockReturnValue(3.4);
      vi.spyOn(tvStore, 'getOmbre').mockReturnValue(0.5);

      let [fe1, fe2] = service.fe({ tv_coef_masque_lointain_homogene_id: '2' });

      expect(tvStore.getMasqueLointainHomogene).toHaveBeenCalledWith('2');
      expect(tvStore.getMasqueProche).not.toHaveBeenCalled();
      expect(tvStore.getOmbre).not.toHaveBeenCalled();
      expect(fe1).toBe(1);
      expect(fe2).toBe(3.4);
    });

    test.each([
      {
        label: 'collection masque_lointain_non_homogene_collection undefined',
        masqueLointainNonHomogene: undefined,
        tvStoreMasqueLointainNonHomogene: undefined,
        fe1Expected: 1,
        fe2Expected: 1
      },
      {
        label: 'collection masque_lointain_non_homogene_collection vide',
        masqueLointainNonHomogene: { masque_lointain_non_homogene: undefined },
        tvStoreMasqueLointainNonHomogene: undefined,
        fe1Expected: 1,
        fe2Expected: 1
      },
      {
        label: 'collection masque_lointain_non_homogene_collection vide',
        masqueLointainNonHomogene: { masque_lointain_non_homogene: [] },
        tvStoreMasqueLointainNonHomogene: undefined,
        fe1Expected: 1,
        fe2Expected: 1
      },
      {
        label: 'collection masque_lointain_non_homogene_collection non array',
        masqueLointainNonHomogene: {
          masque_lointain_non_homogene: { tv_coef_masque_lointain_non_homogene_id: '1' }
        },
        tvStoreMasqueLointainNonHomogene: '1',
        fe1Expected: 1,
        fe2Expected: 0.8
      },
      {
        label: 'collection masque_lointain_non_homogene_collection array',
        masqueLointainNonHomogene: {
          masque_lointain_non_homogene: [
            { tv_coef_masque_lointain_non_homogene_id: '1' },
            { tv_coef_masque_lointain_non_homogene_id: '2' }
          ]
        },
        tvStoreMasqueLointainNonHomogene: '1',
        fe1Expected: 1,
        fe2Expected: 0.6
      },
      {
        label: 'collection masque_lointain_non_homogene_collection array and fe2 min 0',
        masqueLointainNonHomogene: {
          masque_lointain_non_homogene: [
            { tv_coef_masque_lointain_non_homogene_id: '1' },
            { tv_coef_masque_lointain_non_homogene_id: '2' }
          ]
        },
        tvStoreMasqueLointainNonHomogene: '1',
        tvStoreGetOmbreValue: 60,
        fe1Expected: 1,
        fe2Expected: 0
      }
    ])(
      'Doit utiliser tvStore pour les masques lointains non homogènes pour $label',
      ({
        masqueLointainNonHomogene,
        tvStoreMasqueLointainNonHomogene,
        tvStoreGetOmbreValue = undefined,
        fe1Expected,
        fe2Expected
      }) => {
        vi.spyOn(tvStore, 'getMasqueProche').mockReturnValue(1.2);
        vi.spyOn(tvStore, 'getMasqueLointainHomogene').mockReturnValue(3.4);
        vi.spyOn(tvStore, 'getOmbre').mockReturnValue(tvStoreGetOmbreValue || 20);

        let bvDE = {
          masque_lointain_non_homogene_collection: masqueLointainNonHomogene
        };
        let [fe1, fe2] = service.fe(bvDE);

        if (tvStoreMasqueLointainNonHomogene === undefined) {
          expect(tvStore.getOmbre).not.toHaveBeenCalled();
        } else {
          expect(tvStore.getOmbre).toHaveBeenCalledWith(tvStoreMasqueLointainNonHomogene);
        }

        expect(tvStore.getMasqueLointainHomogene).not.toHaveBeenCalled();
        expect(tvStore.getMasqueProche).not.toHaveBeenCalled();

        expect(fe1).toBeCloseTo(fe1Expected, 2);
        expect(fe2).toBeCloseTo(fe2Expected, 2);
      }
    );
  });

  test('Récupération du coefficient ujn', () => {
    vi.spyOn(tvStore, 'getUjn').mockReturnValue(18.8);

    let ujn = service.ujn({ ujn_saisi: 16.4 }, 2.4);

    expect(tvStore.getUjn).not.toHaveBeenCalled();
    expect(ujn).toBe(16.4);

    ujn = service.ujn({ enum_type_fermeture_id: 1 }, 2.4);

    expect(tvStore.getUjn).toHaveBeenCalledWith(1, 2.4);
    expect(ujn).toBe(18.8);
  });

  test("Récupération de l'ombre apportée par un masque lointain", () => {
    vi.spyOn(tvStore, 'getOmbre').mockReturnValue(12.4);

    const ombre = service.calcOmbre({ tv_coef_masque_lointain_non_homogene_id: 16.4 });

    expect(tvStore.getOmbre).toHaveBeenCalledWith(16.4);
    expect(ombre).toBe(12.4);
  });

  test('u_menuiserie est définit par ujn seulement pour les baie vitrée avec fermeture', () => {
    let bvDI = service.execute(
      {},
      { donnee_entree: { ujn_saisi: 5.6, enum_type_fermeture_id: 1 } }
    );
    expect(bvDI.u_menuiserie).toBeUndefined();

    bvDI = service.execute({}, { donnee_entree: { ujn_saisi: 5.6, enum_type_fermeture_id: 2 } });
    expect(bvDI.u_menuiserie).toBe(5.6);
  });

  describe("Test d'intégration des baies vitrées", () => {
    test.each(corpus)('vérification des DI des baies vitrées pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      const bvs = dpeRequest.logement.enveloppe.baie_vitree_collection?.baie_vitree || [];

      bvs.forEach((bv) => {
        const di = service.execute(ctx, bv);

        expect(di.b).toBeCloseTo(bv.donnee_intermediaire.b, 2);

        if (bv.donnee_intermediaire.ug) {
          expect(di.ug).toBeCloseTo(bv.donnee_intermediaire.ug, 2);
        } else {
          expect(di.ug).toBeUndefined();
        }

        expect(di.uw).toBeCloseTo(bv.donnee_intermediaire.uw, 2);

        if (bv.donnee_intermediaire.ujn) {
          expect(di.ujn).toBeCloseTo(bv.donnee_intermediaire.ujn, 2);
        } else {
          expect(di.ujn).toBeUndefined();
        }

        expect(di.u_menuiserie).toBeCloseTo(bv.donnee_intermediaire.u_menuiserie, 2);
        expect(di.sw).toBeCloseTo(bv.donnee_intermediaire.sw, 2);
        expect(di.fe1).toBeCloseTo(bv.donnee_intermediaire.fe1, 2);
        expect(di.fe2).toBeCloseTo(bv.donnee_intermediaire.fe2, 2);
      });
    });
  });
});
