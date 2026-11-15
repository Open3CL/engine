import { describe, expect, test } from 'vitest';
import { prorataChauffageTertiaire } from './17.4_prorata_tertiaire_immeuble.js';

/**
 * Convention LICIEL (Tribu) : la consommation de chauffage d'un DPE immeuble dont les installations
 * desservent aussi une surface tertiaire est ramenée à la part habitation SH / (SH + ST).
 * Ce n'est pas une règle de la méthode 3CL : le facteur n'est appliqué qu'en mode
 * `compat_for_corpus_analysis`.
 *
 * @see Tribu : Calcul_batiment.cs l. 477-488 et Calcul_installation.cs l. 79 (S_ratio)
 */
describe('Part habitation du chauffage d’un immeuble avec surface tertiaire', () => {
  const liciel = 'LICIEL Diagnostics v4 [Version 4.1.1]';
  const cg = { surface_habitable_immeuble: 356.5, surface_tertiaire_immeuble: 1455.27 };

  test('applique SH / (SH + ST) pour un immeuble LICIEL en mode compat', () => {
    // référence de régression : 356,5 / (356,5 + 1455,27), DPE 2529E0255903S
    expect(prorataChauffageTertiaire('immeuble', cg, liciel, true)).toBeCloseTo(0.196768906, 9);
  });

  test('accepte des surfaces exportées sous forme de chaînes', () => {
    const cgTexte = { surface_habitable_immeuble: '300', surface_tertiaire_immeuble: '100' };
    expect(prorataChauffageTertiaire('immeuble', cgTexte, liciel, true)).toBe(0.75);
  });

  test('reconnaît LICIEL sans tenir compte de la casse', () => {
    expect(prorataChauffageTertiaire('immeuble', cg, 'liciel diagnostics', true)).toBeLessThan(1);
  });

  test('retourne 1 hors mode compat_for_corpus_analysis', () => {
    expect(prorataChauffageTertiaire('immeuble', cg, liciel, false)).toBe(1);
  });

  test('retourne 1 pour un DPE qui n’est pas un immeuble', () => {
    expect(prorataChauffageTertiaire('appartement', cg, liciel, true)).toBe(1);
    expect(prorataChauffageTertiaire('maison', cg, liciel, true)).toBe(1);
  });

  test('retourne 1 pour un logiciel autre que LICIEL (Pleiades, Expertec…)', () => {
    expect(prorataChauffageTertiaire('immeuble', cg, 'Pleiades: 6.24.6.6', true)).toBe(1);
    expect(prorataChauffageTertiaire('immeuble', cg, 'EXPERTEC Pro 7.5', true)).toBe(1);
  });

  test('retourne 1 sans version de logiciel', () => {
    expect(prorataChauffageTertiaire('immeuble', cg, undefined, true)).toBe(1);
  });

  test('retourne 1 sans surface tertiaire (absente, nulle ou négative)', () => {
    const sh = { surface_habitable_immeuble: 300 };
    expect(prorataChauffageTertiaire('immeuble', sh, liciel, true)).toBe(1);
    expect(
      prorataChauffageTertiaire('immeuble', { ...sh, surface_tertiaire_immeuble: 0 }, liciel, true)
    ).toBe(1);
    expect(
      prorataChauffageTertiaire('immeuble', { ...sh, surface_tertiaire_immeuble: -5 }, liciel, true)
    ).toBe(1);
  });

  test('retourne 1 si la surface habitable est absente ou nulle', () => {
    expect(
      prorataChauffageTertiaire('immeuble', { surface_tertiaire_immeuble: 100 }, liciel, true)
    ).toBe(1);
    expect(
      prorataChauffageTertiaire(
        'immeuble',
        { surface_habitable_immeuble: 0, surface_tertiaire_immeuble: 100 },
        liciel,
        true
      )
    ).toBe(1);
  });

  test('retourne 1 sans caractéristiques générales', () => {
    expect(prorataChauffageTertiaire('immeuble', undefined, liciel, true)).toBe(1);
  });
});
