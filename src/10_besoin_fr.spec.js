import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler le module :
 * - tables de valeurs (`tvs`) : profils mensuels nref / e_fr / textmoy_clim ;
 * - calcul des apports internes/solaires (`calc_ai_j`, `calc_as_j`) et surface sud équivalente
 *   (`calc_sse_j`) : simples fonctions dont on contrôle le retour ;
 * - `mois_liste` : réduite à un seul mois pour rendre la somme vérifiable.
 */
vi.mock('./tv.js', () => ({
  tvs: {
    nref26: { ca1: { Janvier: { h1a: 10 } } },
    nref28: { ca1: { Janvier: { h1a: 10 } } },
    e_fr_26: { ca1: { Janvier: { h1a: 100 } } },
    e_fr_28: { ca1: { Janvier: { h1a: 100 } } },
    textmoy_clim_26: { ca1: { Janvier: { h1a: 30 } } },
    textmoy_clim_28: { ca1: { Janvier: { h1a: 30 } } }
  }
}));

vi.mock('./utils.js', () => ({
  mois_liste: ['Janvier']
}));

vi.mock('./6.1_apport_gratuit.js', () => ({
  calc_ai_j: vi.fn(),
  calc_as_j: vi.fn()
}));

vi.mock('./6.2_surface_sud_equivalente.js', () => ({
  calc_sse_j: vi.fn()
}));

const { default: calc_besoin_fr, calc_besoin_fr_j } = await import('./10_besoin_fr.js');
const { calc_ai_j, calc_as_j } = await import('./6.1_apport_gratuit.js');
const { calc_sse_j } = await import('./6.2_surface_sud_equivalente.js');

/**
 * 10. Calcul des besoins de froid (Bfr)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §10
 */
describe('calc_besoin_fr_j - besoin de froid journalier', () => {
  test('retourne 0 lorsque le nombre de jours de référence est nul', () => {
    expect(calc_besoin_fr_j(100, 300, 'moyenne', 5000, 2000, 0, 30, 28)).toBe(0);
  });

  test('retourne 0 lorsque le taux Rbth est inférieur à 1/2 (apports insuffisants)', () => {
    // aij + asj = 0 => Rbth = 0 < 0.5
    expect(calc_besoin_fr_j(100, 300, 'moyenne', 0, 0, 10, 30, 28)).toBe(0);
  });

  test('valeur de référence (Tint=28°C, inertie moyenne)', () => {
    expect(calc_besoin_fr_j(100, 300, 'moyenne', 5000, 2000, 10, 30, 28)).toBeCloseTo(
      11.312243423584366,
      9
    );
  });

  test('valeur de référence en mode dépensier (Tint=26°C)', () => {
    expect(calc_besoin_fr_j(100, 300, 'moyenne', 5000, 2000, 10, 30, 26)).toBeCloseTo(
      12.777039072730146,
      9
    );
  });

  test('le besoin de froid dépensier (26°C) est supérieur au besoin conventionnel (28°C)', () => {
    const conventionnel = calc_besoin_fr_j(100, 300, 'moyenne', 5000, 2000, 10, 30, 28);
    const depensier = calc_besoin_fr_j(100, 300, 'moyenne', 5000, 2000, 10, 30, 26);
    expect(depensier).toBeGreaterThan(conventionnel);
  });
});

describe('calc_besoin_fr - agrégation mensuelle', () => {
  beforeEach(() => {
    vi.mocked(calc_ai_j).mockReset();
    vi.mocked(calc_as_j).mockReset();
    vi.mocked(calc_sse_j).mockReset();
  });

  test('agrège le besoin conventionnel et dépensier sur les mois', () => {
    vi.mocked(calc_ai_j).mockReturnValue(5000);
    vi.mocked(calc_as_j).mockReturnValue(2000);
    vi.mocked(calc_sse_j).mockReturnValue(10);

    const ret = calc_besoin_fr('ca1', 'h1a', 100, 3, 300, 'moyenne', [], null);

    expect(ret.besoin_fr).toBeCloseTo(11.312243423584366, 9);
    expect(ret.besoin_fr_depensier).toBeCloseTo(12.777039072730146, 9);
  });

  test('délègue le calcul de la surface sud équivalente mois par mois', () => {
    vi.mocked(calc_ai_j).mockReturnValue(0);
    vi.mocked(calc_as_j).mockReturnValue(0);
    vi.mocked(calc_sse_j).mockReturnValue(0);

    calc_besoin_fr('ca1', 'h1a', 100, 3, 300, 'moyenne', ['bv'], 'ets');

    expect(calc_sse_j).toHaveBeenCalledWith(['bv'], 'ets', 'ca1', 'h1a', 'Janvier');
    // apports internes calculés à partir de la surface et du nombre d'adultes équivalents
    expect(calc_ai_j).toHaveBeenCalledWith(100, 3, 10);
  });

  test('un besoin nul sur tous les mois donne un besoin annuel nul', () => {
    vi.mocked(calc_ai_j).mockReturnValue(0);
    vi.mocked(calc_as_j).mockReturnValue(0);
    vi.mocked(calc_sse_j).mockReturnValue(0);

    const ret = calc_besoin_fr('ca1', 'h1a', 100, 3, 300, 'moyenne', [], null);

    expect(ret.besoin_fr).toBe(0);
    expect(ret.besoin_fr_depensier).toBe(0);
  });
});
