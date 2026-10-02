import { describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées :
 * - `enums` : orientation et inclinaison des vitrages (détermine la clé de la table c1) ;
 * - `tvs.c1` : coefficient d'ensoleillement mensuel par zone/orientation (valeurs contrôlées) ;
 * - `mois_liste` : réduite à un mois pour rendre l'agrégation annuelle vérifiable.
 */
vi.mock('./enums.js', () => ({
  default: {
    orientation: { 1: 'sud', 2: 'horizontal', 3: 'est', 4: 'nord' },
    inclinaison_vitrage: { 3: 'verticale', 4: 'horizontal' }
  }
}));

vi.mock('./tv.js', () => ({
  default: {
    c1: {
      h1a: {
        Janvier: { 'sud verticale': 0.5, horizontal: 0.3 }
      },
      // Coefficients C1 de janvier en h1a (sud = 1, est = 0,40, nord = 0,31) pour les cas
      // de test d'Olivier (issue #101)
      h1b: {
        Janvier: { 'sud verticale': 1, 'est verticale': 0.4, 'nord verticale': 0.31 }
      }
    }
  }
}));

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  mois_liste: ['Janvier']
}));

const { calc_sse_j, calc_sse, dedoublonnerEts, rattacherBaiesAuxEts } =
  await import('./6.2_surface_sud_equivalente.js');

/** Fabrique une baie vitrée avec les données d'entrée/intermédiaires utiles au calcul. */
function baie({ adjacence, surface, orientationId = '1', inclinaisonId = '3', sw = 1 }) {
  return {
    donnee_entree: {
      enum_type_adjacence_id: adjacence,
      enum_orientation_id: orientationId,
      enum_inclinaison_vitrage_id: inclinaisonId,
      surface_totale_baie: surface
    },
    donnee_intermediaire: { sw }
  };
}

/**
 * 6.2 Calcul de la surface sud équivalente (SSE)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §6.2 / §6.3
 */
describe('calc_sse_j - surface sud équivalente journalière', () => {
  test("sans espace tampon : somme sur les baies donnant sur l'extérieur", () => {
    // getSsd = surface * c1j * sw = 2 * 0.5 * 0.4
    const bvList = [baie({ adjacence: '1', surface: 2, sw: 0.4 })];
    expect(calc_sse_j(bvList, null, 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.4, 10);
  });

  test("les baies non extérieures sont ignorées en l'absence d'espace tampon", () => {
    const bvList = [
      baie({ adjacence: '1', surface: 2, sw: 0.4 }),
      baie({ adjacence: '3', surface: 5, sw: 0.9 }) // adjacence autre => ignorée
    ];
    expect(calc_sse_j(bvList, null, 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.4, 10);
  });

  test('une baie horizontale utilise la clé "horizontal" de la table c1', () => {
    const bvList = [baie({ adjacence: '1', surface: 2, orientationId: '2', sw: 0.4 })];
    // c1j = 0.3 => 2 * 0.3 * 0.4
    expect(calc_sse_j(bvList, null, 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.24, 10);
  });

  test('avec espace tampon solarisé (véranda) : apports directs + indirects', () => {
    const bvList = [
      baie({ adjacence: '10', surface: 3, sw: 0.5 }), // baie logement / véranda
      baie({ adjacence: '1', surface: 2, sw: 0.4 }) // baie extérieure
    ];
    const ets = {
      donnee_intermediaire: { bver: 0.5, coef_transparence_ets: 0.8 },
      baie_ets_collection: {
        baie_ets: baie({ adjacence: '1', surface: 4, sw: 1 })
      }
    };

    // Ssdj = T * (3*0.5*0.5) = 0.8 * 0.75 = 0.6
    // Sstj = 4 * 0.5 * (0.8*0.8 + 0.024) = 2 * 0.664 = 1.328
    // ssIndj = 1.328 - 0.6 = 0.728 ; SseVeranda = 0.6 + 0.728*0.5 = 0.964
    // sseBaiesExt = 2*0.5*0.4 = 0.4 ; total = 1.364
    expect(calc_sse_j(bvList, ets, 'ca1', 'h1a', 'Janvier')).toBeCloseTo(1.364, 10);
  });

  test('un espace tampon fourni sous forme de tableau utilise le premier élément', () => {
    const bvList = [baie({ adjacence: '10', surface: 3, sw: 0.5 })];
    const ets = [
      {
        donnee_intermediaire: { bver: 0.5, coef_transparence_ets: 0.8 },
        baie_ets_collection: { baie_ets: baie({ adjacence: '1', surface: 4, sw: 1 }) }
      }
    ];
    // pas de baie extérieure : total = SseVeranda = 0.964
    expect(calc_sse_j(bvList, ets, 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.964, 10);
  });

  test("baie d'espace tampon sans donnée intermédiaire ni inclinaison : valeurs par défaut", () => {
    // La baie de l'ets n'a ni donnee_intermediaire (=> {} : fe1/fe2 valent 1) ni
    // enum_inclinaison_vitrage_id (=> repli sur l'inclinaison verticale, id 3).
    const ets = {
      donnee_intermediaire: { bver: 0.5, coef_transparence_ets: 0.8 },
      baie_ets_collection: {
        baie_ets: {
          donnee_entree: {
            enum_type_adjacence_id: '1',
            enum_orientation_id: '1',
            surface_totale_baie: 4
          }
        }
      }
    };

    // Une baie logement / véranda (adjacence 10) est nécessaire pour que Sse_ver soit calculée (issue #140).
    const bvList = [baie({ adjacence: '10', surface: 3, sw: 0.5 })];

    // orientation 'sud' + inclinaison par défaut 'verticale' => clé 'sud verticale' (c1j = 0.5)
    // coeff = 0.8 * T + 0.024 = 0.664 ; Sstj = 4 * 0.5 * 0.664 = 1.328
    // Ssdj = 0.8 * (3*0.5*0.5) = 0.6 ; ssInd = 0.728 ; SseVeranda = 0.6 + 0.728 * bver = 0.964
    expect(calc_sse_j(bvList, ets, 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.964, 10);
  });

  test('les facteurs fe1/fe2 de la baie extérieure sont appliqués au calcul', () => {
    const bv = baie({ adjacence: '1', surface: 2, sw: 0.5 });
    bv.donnee_intermediaire.fe1 = 0.5;
    bv.donnee_intermediaire.fe2 = 0.8;
    // getSsd = 2 * 0.5(c1) * 0.5(sw) * 0.5(fe1) * 0.8(fe2) = 0.2
    expect(calc_sse_j([bv], null, 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.2, 10);
  });
});

/**
 * Issue #140 : la surface sud équivalente véranda (Sse_ver = Ssd + Ssind * bver) n'est calculée que
 * pour les baies vitrées séparant le logement de l'espace tampon solarisé (adjacence 10).
 * Sans aucune de ces baies, les apports de l'ETS n'entrent pas dans le logement => Sse_ver = 0.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §6.3
 */
describe('calc_sse_j - espace tampon solarisé sans baie séparant le logement de l’ETS', () => {
  /** Fabrique un espace tampon solarisé avec une baie donnant sur l'extérieur. */
  function espaceTampon({ bver = 0.5, T = 0.8 } = {}) {
    return {
      donnee_intermediaire: { bver, coef_transparence_ets: T },
      baie_ets_collection: { baie_ets: baie({ adjacence: '1', surface: 4, sw: 1 }) }
    };
  }

  test('ETS avec seulement des baies extérieures : seule la somme des baies adjacence 1 est retenue', () => {
    const bvList = [
      baie({ adjacence: '1', surface: 2, sw: 0.4 }),
      baie({ adjacence: '3', surface: 5, sw: 0.9 }) // adjacence autre => ignorée
    ];
    // sseBaiesExt = 2 * 0.5 * 0.4 = 0.4 ; Sse_ver non ajoutée (avant correctif : 0.4 + 0.664)
    expect(calc_sse_j(bvList, espaceTampon(), 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.4, 10);
  });

  test('ETS sans baie adjacence 10 : bver et coefficient de transparence sont sans effet', () => {
    const bvList = [baie({ adjacence: '1', surface: 2, sw: 0.4 })];
    const ref = calc_sse_j(bvList, null, 'ca1', 'h1a', 'Janvier');

    expect(calc_sse_j(bvList, espaceTampon({ bver: 0.9, T: 0.2 }), 'ca1', 'h1a', 'Janvier')).toBe(
      ref
    );
    expect(calc_sse_j(bvList, espaceTampon({ bver: 0.1, T: 0.9 }), 'ca1', 'h1a', 'Janvier')).toBe(
      ref
    );
  });

  test('ETS sans aucune baie vitrée du logement : surface sud équivalente nulle', () => {
    expect(calc_sse_j([], espaceTampon(), 'ca1', 'h1a', 'Janvier')).toBe(0);
  });

  test('ETS dupliqué (tableau) sans baie adjacence 10 : même règle, Sse_ver non ajoutée', () => {
    const bvList = [baie({ adjacence: '1', surface: 2, sw: 0.4 })];
    const ets = [espaceTampon(), espaceTampon()];
    expect(calc_sse_j(bvList, ets, 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.4, 10);
  });

  test('ETS avec une baie adjacence 10 : Sse_ver toujours calculée (non-régression)', () => {
    const bvList = [
      baie({ adjacence: '10', surface: 3, sw: 0.5 }),
      baie({ adjacence: '1', surface: 2, sw: 0.4 })
    ];
    // Ssdj = 0.8 * (3*0.5*0.5) = 0.6 ; Sstj = 4 * 0.5 * 0.664 = 1.328 ; ssInd = 0.728
    // SseVeranda = 0.6 + 0.728 * 0.5 = 0.964 ; sseBaiesExt = 0.4
    // Valeur de référence de régression (calculée avec le vrai module, tables mockées) : 1.364
    expect(calc_sse_j(bvList, espaceTampon(), 'ca1', 'h1a', 'Janvier')).toBeCloseTo(1.364, 9);
  });

  test('sans ETS : seules les baies extérieures comptent, les baies adjacence 10 sont ignorées', () => {
    const bvList = [
      baie({ adjacence: '10', surface: 3, sw: 0.5 }),
      baie({ adjacence: '1', surface: 2, sw: 0.4 })
    ];
    expect(calc_sse_j(bvList, undefined, 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.4, 10);
    expect(calc_sse_j(bvList, [], 'ca1', 'h1a', 'Janvier')).toBeCloseTo(0.4, 10);
  });

  test('calc_sse annuel : ETS sans baie adjacence 10 => pas de Sse_ver', () => {
    const bvList = [baie({ adjacence: '1', surface: 2, sw: 0.4 })];
    expect(calc_sse('ca1', 'h1a', bvList, espaceTampon())).toBeCloseTo(0.4, 10);
  });
});

describe('calc_sse - surface sud équivalente annuelle', () => {
  test('agrège la surface sud équivalente sur tous les mois', () => {
    const bvList = [baie({ adjacence: '1', surface: 2, sw: 0.4 })];
    // un seul mois mocké => identique au calcul journalier
    expect(calc_sse('ca1', 'h1a', bvList, null)).toBeCloseTo(0.4, 10);
  });
});

/**
 * 6.3 Plusieurs espaces tampons solarisés (issue #101) : T, bver, Sst et Ssd sont propres à chaque
 * véranda ; Sse = Sse_ext + Σ(v) Sse_veranda_v. Une baie adjacence 10 n'entre que dans la véranda
 * sur laquelle elle donne (reference_lnc = ets.reference).
 * Cas de test fournis par Olivier (thermicien), zone h1b mockée avec C1 sud = 1, est = 0,40,
 * nord = 0,31 ; Fe = 1.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §6.3
 */
describe('calc_sse_j - plusieurs espaces tampons solarisés (issue #101)', () => {
  const SUD = '1';
  const EST = '3';
  const NORD = '4';

  function baieInt(surface, orientationId, referenceLnc) {
    const bv = baie({ adjacence: '10', surface, orientationId, sw: 0.47 });
    if (referenceLnc !== undefined) bv.donnee_entree.reference_lnc = referenceLnc;
    return bv;
  }

  function veranda(reference, T, bver, baiesExt) {
    return {
      donnee_entree: { reference },
      donnee_intermediaire: { bver, coef_transparence_ets: T },
      baie_ets_collection: {
        baie_ets: baiesExt.map(([surface, orientationId]) =>
          baie({ adjacence: '1', surface, orientationId })
        )
      }
    };
  }

  // Baie extérieure 10 m² sud, Sw = 0,5 => Sse_ext = 5
  const baieExt = baie({ adjacence: '1', surface: 10, orientationId: SUD, sw: 0.5 });
  // V1 : T = 0,62, bver = 0,55, baies vers l'extérieur 8 m² sud + 4 m² est
  const V1 = veranda('V1', 0.62, 0.55, [
    [8, SUD],
    [4, EST]
  ]);
  // V2 : T = 0,45, bver = 0,85, baie vers l'extérieur 6 m² nord
  const V2 = veranda('V2', 0.45, 0.85, [[6, NORD]]);
  const baiesV1 = [baieInt(4, SUD, 'V1'), baieInt(2, SUD, 'V1')];
  const baiesV2 = [baieInt(2, NORD, 'V2'), baieInt(1, NORD, 'V2')];

  // SseV1 = 1,7484 + (4,992 - 1,7484) * 0,55 = 3,53238
  const SSE_V1 = 3.53238;
  // SseV2 = 0,196695 + (0,71424 - 0,196695) * 0,85 = 0,63660825
  const SSE_V2 = 0.63660825;

  test('CT1 - cas de l’issue : Sse = Sse_ext + SseV1 + SseV2 avec T et bver propres', () => {
    const bvList = [baieExt, ...baiesV1, ...baiesV2];
    expect(calc_sse_j(bvList, [V1, V2], 'ca1', 'h1b', 'Janvier')).toBeCloseTo(
      5 + SSE_V1 + SSE_V2,
      9
    );
  });

  test('CT2 - seules les baies de V2 : le Sst de V1 n’est pas appliqué', () => {
    const bvList = [baieExt, ...baiesV2];
    expect(calc_sse_j(bvList, [V1, V2], 'ca1', 'h1b', 'Janvier')).toBeCloseTo(5 + SSE_V2, 9);
  });

  test('CT3 - seules les baies de V1 : V2 sans baie vers le logement apporte 0', () => {
    const bvList = [baieExt, ...baiesV1];
    expect(calc_sse_j(bvList, [V1, V2], 'ca1', 'h1b', 'Janvier')).toBeCloseTo(5 + SSE_V1, 9);
  });

  test('CT4 - véranda dupliquée : pas de double comptage', () => {
    const bvList = [baieExt, ...baiesV1];
    expect(calc_sse_j(bvList, [V1, structuredClone(V1)], 'ca1', 'h1b', 'Janvier')).toBeCloseTo(
      5 + SSE_V1,
      9
    );
  });

  test('baies sans reference_lnc : rattachées à la première véranda (comportement historique)', () => {
    const bvList = [baieExt, baieInt(4, SUD), baieInt(2, SUD)];
    expect(calc_sse_j(bvList, [V1, V2], 'ca1', 'h1b', 'Janvier')).toBeCloseTo(5 + SSE_V1, 9);
  });

  test('l’ordre des vérandas dans la collection est sans effet', () => {
    const bvList = [baieExt, ...baiesV1, ...baiesV2];
    expect(calc_sse_j(bvList, [V2, V1], 'ca1', 'h1b', 'Janvier')).toBeCloseTo(
      5 + SSE_V1 + SSE_V2,
      9
    );
  });
});

describe('dedoublonnerEts / rattacherBaiesAuxEts', () => {
  test('dédoublonnage par référence, à défaut par contenu identique ; éléments vides ignorés', () => {
    const a = { donnee_entree: { reference: 'A' }, x: 1 };
    const aBis = { donnee_entree: { reference: 'A' }, x: 2 };
    const sansRef = { donnee_intermediaire: { bver: 1 } };
    const autreSansRef = { donnee_intermediaire: { bver: 2 } };
    expect(
      dedoublonnerEts([a, aBis, sansRef, structuredClone(sansRef), autreSansRef, null])
    ).toEqual([a, sansRef, autreSansRef]);
  });

  test('rattachement par reference_lnc ; référence inconnue => première véranda', () => {
    const ets = [{ donnee_entree: { reference: 'A' } }, { donnee_entree: { reference: 'B' } }];
    const bA = { donnee_entree: { reference_lnc: 'A' } };
    const bB = { donnee_entree: { reference_lnc: 'B' } };
    const bInconnue = { donnee_entree: { reference_lnc: 'Z' } };
    const bSans = { donnee_entree: {} };
    expect(rattacherBaiesAuxEts([bA, bB, bInconnue, bSans], ets)).toEqual([
      [bA, bInconnue, bSans],
      [bB]
    ]);
  });

  test('aucune véranda exploitable (ets = [null]) : baies non rattachées, seules les baies extérieures comptent', () => {
    const bA = { donnee_entree: { reference_lnc: 'A' } };
    expect(rattacherBaiesAuxEts([bA], [])).toEqual([]);
    const bvList = [
      baie({ adjacence: '1', surface: 10, sw: 0.5 }),
      baie({ adjacence: '10', surface: 4 })
    ];
    // c1 h1a janvier sud = 0,5 => 10 × 0,5 × 0,5
    expect(calc_sse_j(bvList, [null], 'ca1', 'h1a', 'Janvier')).toBeCloseTo(2.5, 9);
  });

  test('véranda sans donnee_entree : seules les baies sans lien lui sont rattachées', () => {
    const ets = [{}, { donnee_entree: { reference: 'B' } }];
    const bB = { donnee_entree: { reference_lnc: 'B' } };
    const bSans = { donnee_entree: {} };
    expect(rattacherBaiesAuxEts([bB, bSans], ets)).toEqual([[bSans], [bB]]);
  });
});
