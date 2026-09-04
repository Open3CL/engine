import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler l'orchestrateur `calc_deperdition` :
 * - `enums` : mapping minimal des types d'adjacence (utilisé par le calcul de Sdep) ;
 * - tous les modules de calcul par paroi (`calc_mur`, `calc_pb`, `calc_ph`, `calc_bv`,
 *   `calc_porte`, `calc_pont_thermique`, `calc_ventilation`) : espions no-op, les données
 *   intermédiaires sont donc pré-remplies dans les fixtures.
 */
vi.mock('./enums.js', () => ({
  default: {
    type_adjacence: {
      1: 'extérieur',
      2: "local non déperditif (local à usage d'habitation chauffé)"
    }
  }
}));

vi.mock('./3.2.1_mur.js', () => ({ default: vi.fn() }));
vi.mock('./3.2.2_plancher_bas.js', () => ({ default: vi.fn() }));
vi.mock('./3.2.3_plancher_haut.js', () => ({ default: vi.fn() }));
vi.mock('./3.3_baie_vitree.js', () => ({ default: vi.fn() }));
vi.mock('./3.3.1.4_porte.js', () => ({ default: vi.fn() }));
vi.mock('./3.4_pont_thermique.js', () => ({ default: vi.fn() }));
vi.mock('./4_ventilation.js', () => ({ default: vi.fn() }));

const {
  default: calc_deperdition,
  Umur,
  Uph,
  Upb,
  Ubv,
  Uporte,
  Upt
} = await import('./3_deperdition.js');
const { default: calc_mur } = await import('./3.2.1_mur.js');
const { default: calc_pont_thermique } = await import('./3.4_pont_thermique.js');
const { default: calc_ventilation } = await import('./4_ventilation.js');

let errorSpy;

beforeEach(() => {
  vi.mocked(calc_mur).mockReset();
  vi.mocked(calc_pont_thermique).mockReset();
  vi.mocked(calc_ventilation).mockReset();
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

/**
 * 3. Déperditions de l'enveloppe : déperditions surfaciques par paroi.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3
 */
describe('déperditions surfaciques par paroi (U * surface * b)', () => {
  test('Umur = surface_paroi_opaque * umur * b', () => {
    const mur = {
      donnee_entree: { surface_paroi_opaque: 10 },
      donnee_intermediaire: { umur: 0.5, b: 1 }
    };
    expect(Umur(mur)).toBeCloseTo(5, 9);
  });

  test('Uph = surface_paroi_opaque * uph * b', () => {
    const ph = {
      donnee_entree: { surface_paroi_opaque: 8 },
      donnee_intermediaire: { uph: 0.2, b: 1 }
    };
    expect(Uph(ph)).toBeCloseTo(1.6, 9);
  });

  test('Upb = surface_paroi_opaque * upb_final * b', () => {
    const pb = {
      donnee_entree: { surface_paroi_opaque: 12 },
      donnee_intermediaire: { upb_final: 0.3, b: 1 }
    };
    expect(Upb(pb)).toBeCloseTo(3.6, 9);
  });

  test('Ubv = surface_totale_baie * u_menuiserie * b', () => {
    const bv = {
      donnee_entree: { surface_totale_baie: 5 },
      donnee_intermediaire: { u_menuiserie: 2, b: 1 }
    };
    expect(Ubv(bv)).toBeCloseTo(10, 9);
  });

  test('Uporte = surface_porte * uporte * b', () => {
    const porte = {
      donnee_entree: { surface_porte: 2 },
      donnee_intermediaire: { uporte: 1.5, b: 1 }
    };
    expect(Uporte(porte)).toBeCloseTo(3, 9);
  });

  test('un coefficient de réduction b nul annule la déperdition de la paroi', () => {
    const mur = {
      donnee_entree: { surface_paroi_opaque: 10 },
      donnee_intermediaire: { umur: 0.5, b: 0 }
    };
    expect(Umur(mur)).toBe(0);
  });
});

/**
 * 3.4 Déperdition d'un pont thermique : Upt = l * k * pourcentage.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4
 */
describe('Upt - déperdition linéique des ponts thermiques', () => {
  test("Upt = l * k lorsque le pourcentage n'est pas renseigné (défaut 1)", () => {
    const pt = { donnee_entree: { l: 4 }, donnee_intermediaire: { k: 0.5 } };
    expect(Upt(pt)).toBeCloseTo(2, 9);
  });

  test('le pourcentage de prise en compte du pont thermique est appliqué', () => {
    const pt = {
      donnee_entree: { l: 4, pourcentage_valeur_pont_thermique: 0.5 },
      donnee_intermediaire: { k: 0.5 }
    };
    expect(Upt(pt)).toBeCloseTo(1, 9);
  });
});

/** Fabrique un DPE minimal avec une enveloppe pré-calculée. */
function makeDpe({
  mur = [],
  pb = [],
  ph = [],
  bv = [],
  porte = [],
  pt = [],
  ventilation = [],
  deperdition_mur = 0,
  deperdition_pont_thermique
} = {}) {
  const deperdition = { deperdition_mur };
  if (deperdition_pont_thermique !== undefined) {
    deperdition.deperdition_pont_thermique = deperdition_pont_thermique;
  }
  return {
    numero_dpe: 'TEST',
    logement: {
      sortie: { deperdition },
      enveloppe: {
        mur_collection: { mur },
        plancher_bas_collection: { plancher_bas: pb },
        plancher_haut_collection: { plancher_haut: ph },
        porte_collection: { porte },
        baie_vitree_collection: { baie_vitree: bv },
        pont_thermique_collection: { pont_thermique: pt }
      },
      ventilation_collection: { ventilation }
    }
  };
}

/** Fabrique une paroi surfacique générique. */
function paroi(surfaceField, surface, uField, u, b, adjacence = '1') {
  return {
    donnee_entree: { [surfaceField]: surface, enum_type_adjacence_id: adjacence },
    donnee_intermediaire: { [uField]: u, b }
  };
}

describe("calc_deperdition - agrégation des déperditions de l'enveloppe", () => {
  test('une enveloppe vide donne des déperditions nulles', () => {
    const ret = calc_deperdition(
      { enum_periode_construction_id: '1' },
      'h1a',
      'th',
      '0',
      makeDpe(),
      100
    );

    expect(ret.deperdition_enveloppe).toBe(0);
    expect(ret.deperdition_renouvellement_air).toBe(0);
  });

  test("agrège les déperditions surfaciques, linéiques et de renouvellement d'air", () => {
    const mur = [
      {
        donnee_entree: { surface_paroi_opaque: 10, enum_type_adjacence_id: '1' },
        donnee_intermediaire: { umur: 0.5, b: 1 }
      }
    ];
    const ph = [
      {
        donnee_entree: { surface_paroi_opaque: 8, enum_type_adjacence_id: '1' },
        donnee_intermediaire: { uph: 0.2, b: 1 }
      }
    ];
    const pb = [
      {
        donnee_entree: { surface_paroi_opaque: 12 },
        donnee_intermediaire: { upb_final: 0.3, b: 1 }
      }
    ];
    const bv = [
      { donnee_entree: { surface_totale_baie: 5 }, donnee_intermediaire: { u_menuiserie: 2, b: 1 } }
    ];
    const porte = [
      { donnee_entree: { surface_porte: 2 }, donnee_intermediaire: { uporte: 1.5, b: 1 } }
    ];
    const pt = [{ donnee_entree: { l: 4 }, donnee_intermediaire: { k: 0.5 } }];
    const ventilation = [{ donnee_intermediaire: { hvent: 40, hperm: 20 } }];

    const dpe = makeDpe({ mur, ph, pb, bv, porte, pt, ventilation, deperdition_mur: 5 });
    const ret = calc_deperdition({ enum_periode_construction_id: '1' }, 'h1a', 'th', '0', dpe, 100);

    expect(ret.deperdition_mur).toBeCloseTo(5, 9);
    expect(ret.deperdition_plancher_haut).toBeCloseTo(1.6, 9);
    expect(ret.deperdition_plancher_bas).toBeCloseTo(3.6, 9);
    expect(ret.deperdition_baie_vitree).toBeCloseTo(10, 9);
    expect(ret.deperdition_porte).toBeCloseTo(3, 9);
    expect(ret.deperdition_pont_thermique).toBeCloseTo(2, 9);
    expect(ret.hvent).toBe(40);
    expect(ret.hperm).toBe(20);
    expect(ret.deperdition_renouvellement_air).toBe(60);
    // 5 + 1,6 + 3,6 + 10 + 3 + 2 + 40 + 20
    expect(ret.deperdition_enveloppe).toBeCloseTo(85.2, 9);
  });

  test('chaque paroi est confiée à son module de calcul dédié', () => {
    const mur = [
      {
        donnee_entree: { surface_paroi_opaque: 10, enum_type_adjacence_id: '1' },
        donnee_intermediaire: { umur: 0.5, b: 1 }
      }
    ];
    const ventilation = [{ donnee_intermediaire: { hvent: 0, hperm: 0 } }];
    const dpe = makeDpe({ mur, ventilation, deperdition_mur: 5 });

    calc_deperdition({ enum_periode_construction_id: '1' }, 'h1a', 'th', '0', dpe, 100);

    expect(calc_mur).toHaveBeenCalledTimes(1);
    expect(calc_ventilation).toHaveBeenCalledTimes(1);
  });

  /**
   * calc_Sdep (surface déperditive transmise à la ventilation) exclut les parois à coefficient
   * b nul et les parois adjacentes à un local non déperditif. Les parois à déperdition nulle
   * (b = 0) sont malgré tout parcourues par les réductions de déperdition (branche `|| 0`).
   */
  test('calc_Sdep exclut les parois à b nul et les locaux non déperditifs', () => {
    const mur = [
      paroi('surface_paroi_opaque', 10, 'umur', 0.5, 0, '1'), // b = 0 => exclu de Sdep
      paroi('surface_paroi_opaque', 20, 'umur', 0.4, 1, '2'), // local non déperditif => exclu
      paroi('surface_paroi_opaque', 30, 'umur', 0.5, 1, '1') // pris en compte : +30
    ];
    const ph = [
      paroi('surface_paroi_opaque', 7, 'uph', 0.2, 0, '1'), // b = 0 => exclu de Sdep
      paroi('surface_paroi_opaque', 8, 'uph', 0.2, 1, '1') // pris en compte : +8
    ];
    const pb = [
      paroi('surface_paroi_opaque', 6, 'upb_final', 0.3, 0), // b = 0 (branche `|| 0`)
      paroi('surface_paroi_opaque', 12, 'upb_final', 0.3, 1)
    ];
    const porte = [
      { donnee_entree: { surface_porte: 2 }, donnee_intermediaire: { uporte: 1.5, b: 0 } }, // exclu
      { donnee_entree: { surface_porte: 3 }, donnee_intermediaire: { uporte: 1.5, b: 1 } } // +3
    ];
    const bv = [
      {
        donnee_entree: { surface_totale_baie: 5 },
        donnee_intermediaire: { u_menuiserie: 2, b: 0 }
      }, // exclu
      { donnee_entree: { surface_totale_baie: 4 }, donnee_intermediaire: { u_menuiserie: 2, b: 1 } } // +4
    ];
    const ventilation = [{ donnee_intermediaire: { hvent: 0, hperm: 0 } }];

    // d_mur = 0 + 20*0,4 + 30*0,5 = 23 (déclaré identique => conservé sans divergence)
    const dpe = makeDpe({ mur, ph, pb, bv, porte, ventilation, deperdition_mur: 23 });
    const ret = calc_deperdition({ enum_periode_construction_id: '1' }, 'h1a', 'th', '0', dpe, 100);

    // Sdep transmis à calc_ventilation : 30 (mur) + 8 (ph) + 3 (porte) + 4 (bv) = 45
    const sdepTransmis = vi.mocked(calc_ventilation).mock.calls[0][3];
    expect(sdepTransmis).toBeCloseTo(45, 9);

    expect(ret.deperdition_mur).toBeCloseTo(23, 9);
    expect(ret.deperdition_plancher_haut).toBeCloseTo(1.6, 9); // 0 + 8*0,2
    expect(ret.deperdition_plancher_bas).toBeCloseTo(3.6, 9); // 0 + 12*0,3
    expect(ret.deperdition_porte).toBeCloseTo(4.5, 9); // 0 + 3*1,5
    expect(ret.deperdition_baie_vitree).toBeCloseTo(8, 9); // 0 + 4*2
  });

  /**
   * Collections d'enveloppe absentes : chaque liste retombe sur son tableau vide par défaut
   * (`|| []`) et l'agrégation produit des déperditions nulles.
   */
  test('collections absentes : chaque liste retombe sur un tableau vide', () => {
    const dpe = {
      numero_dpe: 'TEST',
      logement: {
        sortie: { deperdition: { deperdition_mur: 0 } },
        enveloppe: {
          mur_collection: {},
          plancher_bas_collection: {},
          plancher_haut_collection: {},
          porte_collection: {},
          baie_vitree_collection: {},
          pont_thermique_collection: {}
        },
        ventilation_collection: {}
      }
    };

    const ret = calc_deperdition({ enum_periode_construction_id: '1' }, 'h1a', 'th', '0', dpe, 100);
    expect(ret.deperdition_enveloppe).toBe(0);
  });
});

/**
 * 3.4 Comparaison des déperditions calculées et déclarées.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4
 */
describe('totalDeperditionMurs - arbitrage entre valeur calculée et déclarée', () => {
  /** Un mur unique : Umur = 10 * 0,5 * 1 = 5. */
  const mur = () => [
    {
      donnee_entree: { surface_paroi_opaque: 10, enum_type_adjacence_id: '1' },
      donnee_intermediaire: { umur: 0.5, b: 1 }
    }
  ];

  test('déclaré supérieur au calculé : le total déclaré est conservé', () => {
    const dpe = makeDpe({
      mur: mur(),
      ventilation: [{ donnee_intermediaire: { hvent: 0, hperm: 0 } }],
      deperdition_mur: 6
    });
    const ret = calc_deperdition({ enum_periode_construction_id: '1' }, 'h1a', 'th', '0', dpe, 100);

    expect(ret.deperdition_mur).toBe(6);
    expect(errorSpy).toHaveBeenCalled();
  });

  test('déclaré inférieur au calculé : le total calculé est conservé', () => {
    const dpe = makeDpe({
      mur: mur(),
      ventilation: [{ donnee_intermediaire: { hvent: 0, hperm: 0 } }],
      deperdition_mur: 4
    });
    const ret = calc_deperdition({ enum_periode_construction_id: '1' }, 'h1a', 'th', '0', dpe, 100);

    expect(ret.deperdition_mur).toBeCloseTo(5, 9);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('totalDeperditionPontThermique - arbitrage entre valeur calculée et déclarée', () => {
  /**
   * Ponts thermiques calculés identiques aux déclarés (mêmes k) mais total déclaré divergent :
   * le total déclaré est conservé. Le premier pont thermique (l = 0) exerce la branche `|| 0`
   * de la réduction, le second porte un pourcentage de prise en compte.
   */
  test('ponts thermiques identiques mais total déclaré divergent : total déclaré conservé', () => {
    const pt = [
      { donnee_entree: { l: 0 }, donnee_intermediaire: { k: 0 } }, // Upt = 0 (branche `|| 0`)
      {
        donnee_entree: { l: 4, pourcentage_valeur_pont_thermique: 0.5 },
        donnee_intermediaire: { k: 0.5 }
      } // Upt = 4 * 0,5 * 0,5 = 1
    ];
    const dpe = makeDpe({
      pt,
      ventilation: [{ donnee_intermediaire: { hvent: 0, hperm: 0 } }],
      deperdition_pont_thermique: 3 // total calculé = 1, déclaré = 3
    });
    const ret = calc_deperdition({ enum_periode_construction_id: '1' }, 'h1a', 'th', '0', dpe, 100);

    expect(ret.deperdition_pont_thermique).toBe(3);
    expect(errorSpy).toHaveBeenCalled();
  });

  /**
   * Lorsque les ponts thermiques calculés diffèrent des déclarés (module de calcul modifiant k),
   * la comparaison échoue et le total calculé est utilisé.
   */
  test('ponts thermiques calculés divergents des déclarés : total calculé conservé', () => {
    vi.mocked(calc_pont_thermique).mockImplementation((pt) => {
      pt.donnee_intermediaire.k = 0.8;
    });
    const pt = [{ donnee_entree: { l: 4 }, donnee_intermediaire: { k: 0.5 } }];
    const dpe = makeDpe({
      pt,
      ventilation: [{ donnee_intermediaire: { hvent: 0, hperm: 0 } }],
      deperdition_pont_thermique: 5
    });
    const ret = calc_deperdition({ enum_periode_construction_id: '1' }, 'h1a', 'th', '0', dpe, 100);

    // Upt = 4 * 0,8 * 1 = 3,2 (valeur calculée, différente du déclaré 5)
    expect(ret.deperdition_pont_thermique).toBeCloseTo(3.2, 9);
  });
});
