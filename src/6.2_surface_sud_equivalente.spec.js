import { describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées :
 * - `enums` : orientation et inclinaison des vitrages (détermine la clé de la table c1) ;
 * - `tvs.c1` : coefficient d'ensoleillement mensuel par zone/orientation (valeurs contrôlées) ;
 * - `mois_liste` : réduite à un mois pour rendre l'agrégation annuelle vérifiable.
 */
vi.mock('./enums.js', () => ({
  default: {
    orientation: { 1: 'sud', 2: 'horizontal' },
    inclinaison_vitrage: { 3: 'verticale', 4: 'horizontal' }
  }
}));

vi.mock('./tv.js', () => ({
  default: {
    c1: {
      h1a: {
        Janvier: { 'sud verticale': 0.5, horizontal: 0.3 }
      }
    }
  }
}));

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  mois_liste: ['Janvier']
}));

const { calc_sse_j, calc_sse } = await import('./6.2_surface_sud_equivalente.js');

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
