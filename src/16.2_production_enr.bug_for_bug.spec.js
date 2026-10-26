import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * 16.2 - Production photovoltaïque : comportement activé par bug_for_bug_compat.
 *
 * Tribu `Calcul_batiment.cs` l.1376-1386 (`Calcul_ProdPV`) cumule `Ppv_mensuel` à l'intérieur de
 * la boucle sur les installations : l'installation i (sur N) est comptée N − i fois.
 */
let bugForBug = true;
vi.mock('./tv.js', () => ({
  default: { e_pv: { janvier: { h1a: 100 }, fevrier: { h1a: 50 } } }
}));
vi.mock('./enums.js', () => ({ default: { zone_climatique: { 1: 'h1a' } } }));
vi.mock('./conso.js', () => ({ DEFAULT_COEFF_EP: 2.3 }));
vi.mock('./utils.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    mois_liste: ['janvier', 'fevrier'],
    get bug_for_bug_compat() {
      return bugForBug;
    },
    tv: vi.fn()
  };
});

const { ProductionENR } = await import('./16.2_production_enr.js');
const { tv } = await import('./utils.js');

describe('getPpv - cumul des installations du moteur de référence (bug_for_bug_compat)', () => {
  const productionENR = new ProductionENR();
  // Production unitaire d'1 m² orienté k = 1 : 0,17 × (100 + 50) × 0,86 = 21,93 kWh
  const UNITAIRE = 0.17 * 150 * 0.86;
  const inst = (surface, orientation = '1') => ({
    surface_totale_capteurs: surface,
    enum_orientation_pv_id: orientation,
    enum_inclinaison_pv_id: '1'
  });
  const enr = (...panneaux_pv) => ({ panneaux_pv_collection: { panneaux_pv } });

  beforeEach(() => {
    bugForBug = true;
    vi.mocked(tv).mockReset();
    vi.mocked(tv).mockImplementation((table, matcher) =>
      matcher.enum_orientation_pv_id === 'inconnue' ? undefined : { coef_orientation_pv: 1 }
    );
  });

  test('une seule installation : production conforme à la méthode (poids 1)', () => {
    expect(productionENR.getPpv(enr(inst(2)), 1)).toBeCloseTo(2 * UNITAIRE, 9);
  });

  test('trois installations : la i-ème est comptée N − i fois (3, 2, 1)', () => {
    // 3 × 1 m² + 2 × 2 m² + 1 × 4 m² = 11 m² équivalents
    expect(productionENR.getPpv(enr(inst(1), inst(2), inst(4)), 1)).toBeCloseTo(11 * UNITAIRE, 9);
  });

  test('installations identiques : N(N+1)/2 fois la production unitaire (2359E2927991K : 5 × 1,8 m²)', () => {
    // ADEME 6 646,0 kWh = 3 × la somme simple : poids 5+4+3+2+1 = 15 = 3 × 5
    const cinq = enr(inst(1.8), inst(1.8), inst(1.8), inst(1.8), inst(1.8));
    expect(productionENR.getPpv(cinq, 1)).toBeCloseTo(15 * 1.8 * UNITAIRE, 9);
  });

  test('une installation sans coefficient d’orientation est ignorée et ne compte pas dans N', () => {
    // installations valides : 1 m² (rang 0, poids 2) et 4 m² (rang 1, poids 1)
    expect(productionENR.getPpv(enr(inst(1), inst(2, 'inconnue'), inst(4)), 1)).toBeCloseTo(
      6 * UNITAIRE,
      9
    );
  });

  test('hors bug_for_bug_compat : somme simple des installations', () => {
    bugForBug = false;
    expect(productionENR.getPpv(enr(inst(1), inst(2), inst(4)), 1)).toBeCloseTo(7 * UNITAIRE, 9);
  });

  test('le matcher transmis à tv porte l’orientation et l’inclinaison de chaque installation', () => {
    productionENR.getPpv(enr(inst(1, '3')), 1);
    expect(tv).toHaveBeenCalledWith('coef_orientation_pv', {
      enum_orientation_pv_id: '3',
      enum_inclinaison_pv_id: '1'
    });
  });
});
