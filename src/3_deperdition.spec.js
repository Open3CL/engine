import { beforeEach, describe, expect, test, vi } from 'vitest';

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
const { default: calc_ventilation } = await import('./4_ventilation.js');

beforeEach(() => {
  vi.mocked(calc_mur).mockReset();
  vi.mocked(calc_ventilation).mockReset();
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
  deperdition_mur = 0
} = {}) {
  return {
    numero_dpe: 'TEST',
    logement: {
      sortie: { deperdition: { deperdition_mur } },
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
});
