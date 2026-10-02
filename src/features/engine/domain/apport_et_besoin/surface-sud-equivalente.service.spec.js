import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SurfaceSudEquivalenteService } from './surface-sud-equivalente.service.js';

/**
 * Orientations utilisées dans les tests (identifiants arbitraires : le store est un double de test)
 */
const SUD = '1';
const NORD = '2';
const EST = '3';
const HORIZONTAL = '5';

/**
 * Coefficients C1 de janvier (sud = 1, est = 0,40, nord = 0,31, horizontal = 0,3) utilisés pour les
 * cas de test d'Olivier (issue #101). Indexés par orientation.
 */
const C1 = { [SUD]: 1, [NORD]: 0.31, [EST]: 0.4, [HORIZONTAL]: 0.3 };

/** @type {{ getCoefficientBaieVitree: import('vitest').Mock }} */
let tvStore;

/** @type {SurfaceSudEquivalenteService} */
let service;

/** @type {Contexte} */
const ctx = { zoneClimatique: { id: '2', value: 'h1b' } };

/** Fabrique une baie vitrée avec les données d'entrée/intermédiaires utiles au calcul. */
function baie({ adjacence = '1', surface, orientationId = SUD, sw = 1, referenceLnc }) {
  const bv = {
    donnee_entree: {
      enum_type_adjacence_id: adjacence,
      enum_orientation_id: orientationId,
      enum_inclinaison_vitrage_id: '3',
      surface_totale_baie: surface
    },
    donnee_intermediaire: { sw }
  };
  if (referenceLnc !== undefined) bv.donnee_entree.reference_lnc = referenceLnc;
  return bv;
}

/** Fabrique une baie de l'espace tampon donnant sur l'extérieur (pas de donnée intermédiaire). */
function baieEts(surface, orientationId) {
  return {
    donnee_entree: {
      enum_orientation_id: orientationId,
      enum_inclinaison_vitrage_id: '3',
      surface_totale_baie: surface
    }
  };
}

/** Fabrique une véranda avec ses propres T, bver et baies extérieures. */
function veranda(reference, T, bver, baiesExt) {
  return {
    donnee_entree: { reference },
    donnee_intermediaire: { bver, coef_transparence_ets: T },
    baie_ets_collection: {
      baie_ets: baiesExt.map(([surface, orientationId]) => baieEts(surface, orientationId))
    }
  };
}

function enveloppe(baiesVitrees, ets) {
  return {
    baie_vitree_collection: { baie_vitree: baiesVitrees },
    ets_collection: ets === undefined ? {} : { ets }
  };
}

describe('Calcul de la surface sud équivalente (§6.2 / §6.3)', () => {
  beforeEach(() => {
    tvStore = {
      getCoefficientBaieVitree: vi.fn((orientation) => C1[orientation])
    };
    service = new SurfaceSudEquivalenteService(tvStore);
  });

  describe('ssdBaieMois', () => {
    test('interroge la table C1 avec orientation, inclinaison, zone climatique et mois', () => {
      const bv = baie({ surface: 10, orientationId: EST, sw: 0.5 });
      // 10 * 0,40 * 0,5
      expect(service.ssdBaieMois(bv, '2', 'Janvier')).toBeCloseTo(2, 9);
      expect(tvStore.getCoefficientBaieVitree).toHaveBeenCalledWith(3, 3, 2, 'Janvier');
    });

    test('inclinaison absente : vitrage vertical (3) par défaut ; facteurs fe1/fe2 appliqués', () => {
      const bv = baie({ surface: 10, sw: 0.5 });
      delete bv.donnee_entree.enum_inclinaison_vitrage_id;
      bv.donnee_intermediaire.fe1 = 0.8;
      bv.donnee_intermediaire.fe2 = 0.5;
      expect(service.ssdBaieMois(bv, '2', 'Janvier')).toBeCloseTo(10 * 0.5 * 0.8 * 0.5, 9);
      expect(tvStore.getCoefficientBaieVitree).toHaveBeenCalledWith(1, 3, 2, 'Janvier');
    });

    test('un coefficient explicite remplace le facteur solaire sw de la baie', () => {
      expect(service.ssdBaieMois(baieEts(10, SUD), '2', 'Janvier', 0.3)).toBeCloseTo(3, 9);
    });
  });

  describe('ssdMois - sans espace tampon solarisé', () => {
    test('somme des baies donnant sur l’extérieur ; les autres adjacences sont ignorées', () => {
      const bvList = [
        baie({ surface: 10, sw: 0.5 }),
        baie({ adjacence: '10', surface: 4 }),
        baie({ adjacence: '3', surface: 4 })
      ];
      expect(service.ssdMois(ctx, enveloppe(bvList), 'Janvier')).toBeCloseTo(5, 9);
    });

    test('ets_collection vide (tableau) ou absente : seules les baies extérieures comptent', () => {
      const bvList = [baie({ surface: 10, sw: 0.5 }), baie({ adjacence: '10', surface: 4 })];
      expect(service.ssdMois(ctx, enveloppe(bvList, []), 'Janvier')).toBeCloseTo(5, 9);
      expect(
        service.ssdMois(ctx, { baie_vitree_collection: { baie_vitree: bvList } }, 'Janvier')
      ).toBeCloseTo(5, 9);
    });

    test('aucune baie vitrée : surface sud équivalente nulle', () => {
      expect(service.ssdMois(ctx, {}, 'Janvier')).toBe(0);
    });
  });

  describe('ssdMois - un espace tampon solarisé', () => {
    test('apports directs + indirects : Sse = Sse_ext + Ssd + (Sst - Ssd) × bver', () => {
      // T = 0,5, bver = 0,8, baie extérieure ETS 10 m² sud (unique, non tableau)
      const ets = {
        donnee_entree: {},
        donnee_intermediaire: { bver: 0.8, coef_transparence_ets: 0.5 },
        baie_ets_collection: { baie_ets: baieEts(10, SUD) }
      };
      const bvList = [baie({ surface: 10, sw: 0.5 }), baie({ adjacence: '10', surface: 2 })];
      // Ssd = 0,5 × 2 × 1 × 1 = 1 ; Sst = 10 × (0,8 × 0,5 + 0,024) = 4,24
      // Sse_ver = 1 + (4,24 - 1) × 0,8 = 3,592
      expect(service.ssdMois(ctx, enveloppe(bvList, ets), 'Janvier')).toBeCloseTo(5 + 3.592, 9);
    });

    test('ETS sans baie adjacence 10 : bver et T sans effet, Sse_ver non ajoutée', () => {
      const ets = veranda('V', 0.5, 0.8, [[10, SUD]]);
      const bvList = [baie({ surface: 10, sw: 0.5 })];
      expect(service.ssdMois(ctx, enveloppe(bvList, ets), 'Janvier')).toBeCloseTo(5, 9);
    });

    test('ETS sans baie extérieure : Sst = 0', () => {
      const ets = {
        donnee_entree: {},
        donnee_intermediaire: { bver: 0.5, coef_transparence_ets: 0.5 }
      };
      const bvList = [baie({ adjacence: '10', surface: 2 })];
      // Ssd = 1 ; Sse_ver = 1 + (0 - 1) × 0,5 = 0,5
      expect(service.ssdMois(ctx, enveloppe(bvList, ets), 'Janvier')).toBeCloseTo(0.5, 9);
    });

    test('la Sse_ver n’est comptée qu’une fois quel que soit le nombre de baies adjacence 10', () => {
      const ets = veranda('V', 0.5, 0.8, [[10, SUD]]);
      const uneBaie = [baie({ adjacence: '10', surface: 2 })];
      const deuxBaies = [
        baie({ adjacence: '10', surface: 1 }),
        baie({ adjacence: '10', surface: 1 })
      ];
      expect(service.ssdMois(ctx, enveloppe(deuxBaies, ets), 'Janvier')).toBeCloseTo(
        service.ssdMois(ctx, enveloppe(uneBaie, ets), 'Janvier'),
        9
      );
    });
  });

  /**
   * 6.3 Plusieurs espaces tampons solarisés (issue #101) : T, bver, Sst et Ssd sont propres à chaque
   * véranda ; Sse = Sse_ext + Σ(v) Sse_veranda_v. Une baie adjacence 10 n'entre que dans la véranda
   * sur laquelle elle donne (reference_lnc = ets.reference).
   * Cas de test fournis par Olivier (thermicien) : C1 sud = 1, est = 0,40, nord = 0,31 ; Fe = 1.
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §6.3
   */
  describe('ssdMois - plusieurs espaces tampons solarisés (issue #101)', () => {
    // Baie extérieure 10 m² sud, Sw = 0,5 => Sse_ext = 5
    const baieExt = baie({ surface: 10, sw: 0.5 });
    // V1 : T = 0,62, bver = 0,55, baies vers l'extérieur 8 m² sud + 4 m² est
    const V1 = veranda('V1', 0.62, 0.55, [
      [8, SUD],
      [4, EST]
    ]);
    // V2 : T = 0,45, bver = 0,85, baie vers l'extérieur 6 m² nord
    const V2 = veranda('V2', 0.45, 0.85, [[6, NORD]]);
    const baiesV1 = [
      baie({ adjacence: '10', surface: 4, sw: 0.47, referenceLnc: 'V1' }),
      baie({ adjacence: '10', surface: 2, sw: 0.47, referenceLnc: 'V1' })
    ];
    const baiesV2 = [
      baie({ adjacence: '10', surface: 2, orientationId: NORD, sw: 0.47, referenceLnc: 'V2' }),
      baie({ adjacence: '10', surface: 1, orientationId: NORD, sw: 0.47, referenceLnc: 'V2' })
    ];

    // SseV1 = 1,7484 + (4,992 - 1,7484) × 0,55 = 3,53238
    const SSE_V1 = 3.53238;
    // SseV2 = 0,196695 + (0,71424 - 0,196695) × 0,85 = 0,63660825
    const SSE_V2 = 0.63660825;

    test('CT1 - cas de l’issue : Sse = Sse_ext + SseV1 + SseV2 avec T et bver propres', () => {
      const env = enveloppe([baieExt, ...baiesV1, ...baiesV2], [V1, V2]);
      expect(service.ssdMois(ctx, env, 'Janvier')).toBeCloseTo(5 + SSE_V1 + SSE_V2, 9);
    });

    test('CT2 - seules les baies de V2 : le Sst de V1 n’est pas appliqué', () => {
      const env = enveloppe([baieExt, ...baiesV2], [V1, V2]);
      expect(service.ssdMois(ctx, env, 'Janvier')).toBeCloseTo(5 + SSE_V2, 9);
    });

    test('CT3 - seules les baies de V1 : V2 sans baie vers le logement apporte 0', () => {
      const env = enveloppe([baieExt, ...baiesV1], [V1, V2]);
      expect(service.ssdMois(ctx, env, 'Janvier')).toBeCloseTo(5 + SSE_V1, 9);
    });

    test('CT4 - véranda dupliquée : pas de double comptage', () => {
      const env = enveloppe([baieExt, ...baiesV1], [V1, structuredClone(V1)]);
      expect(service.ssdMois(ctx, env, 'Janvier')).toBeCloseTo(5 + SSE_V1, 9);
    });

    test('baies sans reference_lnc : rattachées à la première véranda (comportement historique)', () => {
      const env = enveloppe(
        [
          baieExt,
          baie({ adjacence: '10', surface: 4, sw: 0.47 }),
          baie({ adjacence: '10', surface: 2, sw: 0.47 })
        ],
        [V1, V2]
      );
      expect(service.ssdMois(ctx, env, 'Janvier')).toBeCloseTo(5 + SSE_V1, 9);
    });

    test('l’ordre des vérandas dans la collection est sans effet', () => {
      const env = enveloppe([baieExt, ...baiesV1, ...baiesV2], [V2, V1]);
      expect(service.ssdMois(ctx, env, 'Janvier')).toBeCloseTo(5 + SSE_V1 + SSE_V2, 9);
    });

    test('execute somme la surface sud équivalente de chaque mois', () => {
      const env = enveloppe([baieExt, ...baiesV1, ...baiesV2], [V1, V2]);
      // C1 indépendant du mois dans le double de test : 12 × valeur de janvier
      expect(service.execute(ctx, env)).toBeCloseTo(12 * (5 + SSE_V1 + SSE_V2), 9);
    });
  });

  describe('dedoublonnerEts / rattacherBaiesAuxEts / getEtsList', () => {
    test('getEtsList : objet unique, tableau ou absence', () => {
      const ets = { donnee_entree: {} };
      expect(service.getEtsList({ ets_collection: { ets } })).toEqual([ets]);
      expect(service.getEtsList({ ets_collection: { ets: [ets] } })).toEqual([ets]);
      expect(service.getEtsList({})).toEqual([]);
    });

    test('dédoublonnage par référence, à défaut par contenu identique ; éléments vides ignorés', () => {
      const a = { donnee_entree: { reference: 'A' }, x: 1 };
      const aBis = { donnee_entree: { reference: 'A' }, x: 2 };
      const sansRef = { donnee_intermediaire: { bver: 1 } };
      const autreSansRef = { donnee_intermediaire: { bver: 2 } };
      expect(
        service.dedoublonnerEts([a, aBis, sansRef, structuredClone(sansRef), autreSansRef, null])
      ).toEqual([a, sansRef, autreSansRef]);
    });

    test('rattachement par reference_lnc ; référence inconnue ou absente => première véranda', () => {
      const ets = [{ donnee_entree: { reference: 'A' } }, { donnee_entree: { reference: 'B' } }];
      const bA = { donnee_entree: { reference_lnc: 'A' } };
      const bB = { donnee_entree: { reference_lnc: 'B' } };
      const bInconnue = { donnee_entree: { reference_lnc: 'Z' } };
      const bSans = { donnee_entree: {} };
      expect(service.rattacherBaiesAuxEts([bA, bB, bInconnue, bSans], ets)).toEqual([
        [bA, bInconnue, bSans],
        [bB]
      ]);
    });

    test('véranda sans donnee_entree : seules les baies sans lien lui sont rattachées', () => {
      const ets = [{}, { donnee_entree: { reference: 'B' } }];
      const bB = { donnee_entree: { reference_lnc: 'B' } };
      const bSans = { donnee_entree: {} };
      expect(service.rattacherBaiesAuxEts([bB, bSans], ets)).toEqual([[bSans], [bB]]);
    });
  });
});
