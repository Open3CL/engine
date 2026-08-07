import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SurfaceSudEquivalenteService } from './surface-sud-equivalente.service.js';
import { BaieVitreeTvStore } from '../../../dpe/infrastructure/enveloppe/baieVitreeTv.store.js';

/**
 * Tests de non-régression pour le fix du ticket #140 :
 * "La surface sud équivalente véranda ne doit PAS être calculée
 *  s'il n'y a pas de baies séparant l'ETS du reste du logement"
 *
 * Méthode 3CL §6.3 : Sse_ver = 0 si aucune baie vitrée du logement
 * n'a type_adjacence = 10 (espace tampon solarisé).
 */

/** @type {SurfaceSudEquivalenteService} **/
let service;

/** @type {BaieVitreeTvStore} **/
let tvStore;

describe("[Issue #140] ETS - Sse_ver sans baie intérieure vers l'ETS", () => {
  beforeEach(() => {
    tvStore = new BaieVitreeTvStore();
    service = new SurfaceSudEquivalenteService(tvStore);
  });

  test("ETS avec uniquement des baies vers l'extérieur (pas de type_adjacence=10) : Sse_ver = 0", () => {
    vi.spyOn(tvStore, 'getCoefficientBaieVitree').mockReturnValue(0.5);

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 } };

    /**
     * DPE comportant un ETS avec uniquement des baies vers l'extérieur (baie_ets)
     * mais aucune baie vitrée du logement donnant sur l'ETS (type_adjacence = 10).
     * Cas de reproduction : DPE 2518E0102737H
     *
     * @type {Enveloppe}
     */
    const enveloppe = {
      baie_vitree_collection: {
        baie_vitree: [
          {
            // Baie extérieure du logement (type_adjacence = 1)
            donnee_entree: {
              enum_type_adjacence_id: 1,
              enum_orientation_id: 2,
              surface_totale_baie: 10
            },
            donnee_intermediaire: { sw: 1 }
          }
        ]
      },
      ets_collection: {
        ets: {
          donnee_intermediaire: { bver: 0.6, coef_transparence_ets: 0.4 },
          baie_ets_collection: {
            baie_ets: {
              donnee_entree: {
                enum_inclinaison_vitrage_id: 3,
                enum_orientation_id: 1,
                surface_totale_baie: 7
              }
            }
          }
        }
      }
    };

    // surface(10) * C1(0.5) * sw(1) * fe1(1) * fe2(1) = 5 pour la baie extérieure
    // Sse_ver = 0 car aucune baie type_adjacence=10
    const result = service.ssdMois(ctx, enveloppe, 'Janvier');

    expect(result).toBe(5);
    // Le getCoefficientBaieVitree ne doit être appelé qu'une seule fois
    // (pour la baie extérieure, pas pour les baies ETS)
    expect(tvStore.getCoefficientBaieVitree).toHaveBeenCalledTimes(1);
    expect(tvStore.getCoefficientBaieVitree).toHaveBeenCalledWith(2, 3, 1, 'Janvier');
  });

  test('ETS avec baie intérieure (type_adjacence=10) ET baie extérieure : Sse_ver est calculé normalement', () => {
    vi.spyOn(tvStore, 'getCoefficientBaieVitree').mockReturnValue(0.5);

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 } };

    /** @type {Enveloppe} */
    const enveloppe = {
      baie_vitree_collection: {
        baie_vitree: [
          {
            // Baie intérieure logement→ETS (type_adjacence = 10)
            donnee_entree: {
              enum_type_adjacence_id: 10,
              enum_orientation_id: 2,
              surface_totale_baie: 10
            },
            donnee_intermediaire: { sw: 1 }
          },
          {
            // Baie extérieure du logement (type_adjacence = 1)
            donnee_entree: {
              enum_type_adjacence_id: 1,
              enum_orientation_id: 2,
              surface_totale_baie: 10
            },
            donnee_intermediaire: { sw: 1 }
          }
        ]
      },
      ets_collection: {
        ets: {
          donnee_intermediaire: { bver: 0.6, coef_transparence_ets: 0.4 },
          baie_ets_collection: {
            baie_ets: {
              donnee_entree: {
                enum_inclinaison_vitrage_id: 3,
                enum_orientation_id: 1,
                surface_totale_baie: 7
              }
            }
          }
        }
      }
    };

    // T = 0.4, bver = 0.6
    // C1 = 0.5 (mocké pour toutes les baies)
    //
    // Ssdj = T * ssdBaieMois(bv_adjacence_10) = 0.4 * (10 * 0.5 * 1 * 1 * 1) = 2
    // Sstj = ssdBaieMois(baie_ets, coeff=0.8*T+0.024) = 7 * 0.5 * (0.8*0.4+0.024) * 1 * 1
    //      = 7 * 0.5 * 0.344 = 1.204
    // Ssindj = Sstj - Ssdj = 1.204 - 2 = -0.796
    // SseVerandaj = Ssdj + Ssindj * bver = 2 + (-0.796) * 0.6 = 2 - 0.4776 = 1.5224
    //
    // Contribution baie type_adjacence=10 : SseVerandaj = 1.5224
    // Contribution baie type_adjacence=1  : ssdBaieMois = 10 * 0.5 * 1 = 5
    // Total = 1.5224 + 5 = 6.5224
    expect(service.ssdMois(ctx, enveloppe, 'Janvier')).toBe(6.5224);
  });

  test("ETS sans collection de baies vers l'ETS (ets_collection absent) : seulement les baies extérieures", () => {
    vi.spyOn(tvStore, 'getCoefficientBaieVitree').mockReturnValue(0.5);

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 } };

    /** @type {Enveloppe} */
    const enveloppe = {
      baie_vitree_collection: {
        baie_vitree: [
          {
            donnee_entree: {
              enum_type_adjacence_id: 1,
              enum_orientation_id: 2,
              surface_totale_baie: 10
            },
            donnee_intermediaire: { sw: 1 }
          }
        ]
      }
      // Pas de ets_collection
    };

    expect(service.ssdMois(ctx, enveloppe, 'Janvier')).toBe(5);
  });
});
