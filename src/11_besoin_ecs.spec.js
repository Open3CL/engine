import { describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler le module :
 * - `tvs.tefs` : température d'eau froide sanitaire mensuelle par classe d'altitude / zone ;
 * - `Njj` : nombre de jours du mois ;
 * - `mois_liste` : réduite à un seul mois pour rendre la somme annuelle vérifiable.
 * Le calcul du besoin ECS ne dépend ainsi que de valeurs contrôlées.
 */
vi.mock('./tv.js', () => ({
  tvs: {
    tefs: { ca1: { Janvier: { h1a: 10 } } }
  }
}));

vi.mock('./utils.js', () => ({
  mois_liste: ['Janvier'],
  Njj: { Janvier: 30 }
}));

const { default: calc_besoin_ecs, calc_besoin_ecs_j } = await import('./11_besoin_ecs.js');

/**
 * 11. Calcul du besoin d'eau chaude sanitaire (Becs)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §11
 */
describe('calc_besoin_ecs_j - besoin ECS journalier', () => {
  test('valeur de référence en mode conventionnel (56 L/j/personne)', () => {
    // valeur de référence de régression : (1.163 * 2 * 56 * (40 - 10) * 30) / 1000
    expect(calc_besoin_ecs_j('ca1', 'Janvier', 'h1a', 2, false)).toBeCloseTo(117.2304, 9);
  });

  test('valeur de référence en mode dépensier (79 L/j/personne)', () => {
    // valeur de référence de régression : (1.163 * 2 * 79 * (40 - 10) * 30) / 1000
    expect(calc_besoin_ecs_j('ca1', 'Janvier', 'h1a', 2, true)).toBeCloseTo(165.3786, 9);
  });

  test('le besoin dépensier est supérieur au besoin conventionnel (ratio 79/56)', () => {
    const conventionnel = calc_besoin_ecs_j('ca1', 'Janvier', 'h1a', 2, false);
    const depensier = calc_besoin_ecs_j('ca1', 'Janvier', 'h1a', 2, true);
    expect(depensier / conventionnel).toBeCloseTo(79 / 56, 9);
  });

  test('un nombre équivalent d’adultes nul donne un besoin nul', () => {
    expect(calc_besoin_ecs_j('ca1', 'Janvier', 'h1a', 0, false)).toBe(0);
    expect(calc_besoin_ecs_j('ca1', 'Janvier', 'h1a', 0, true)).toBe(0);
  });

  test('le besoin est proportionnel au nombre équivalent d’adultes', () => {
    const un = calc_besoin_ecs_j('ca1', 'Janvier', 'h1a', 1, false);
    const trois = calc_besoin_ecs_j('ca1', 'Janvier', 'h1a', 3, false);
    expect(trois).toBeCloseTo(3 * un, 9);
  });
});

describe('calc_besoin_ecs - agrégation annuelle', () => {
  test('agrège les besoins conventionnel et dépensier sur les mois', () => {
    const ret = calc_besoin_ecs('ca1', 'h1a', 2);
    // un seul mois mocké => identique au calcul journalier
    expect(ret.besoin_ecs).toBeCloseTo(117.2304, 9);
    expect(ret.besoin_ecs_depensier).toBeCloseTo(165.3786, 9);
  });

  test('un nombre équivalent d’adultes nul donne un besoin annuel nul', () => {
    const ret = calc_besoin_ecs('ca1', 'h1a', 0);
    expect(ret.besoin_ecs).toBe(0);
    expect(ret.besoin_ecs_depensier).toBe(0);
  });
});
