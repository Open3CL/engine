import { describe, expect, test, vi } from 'vitest';
import {
  conventionPuissanceNominale,
  nombreDecimales,
  qp0Coherent,
  valeurCoherente
} from './13.2_generateur_combustion_pn.js';

/**
 * Module pur (aucune dépendance importée) : les caractéristiques du générateur sont fournies par
 * une fonction injectée, remplacée ici par un double de test déterministe.
 *
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2 et §17.2.1 (virtualisation)
 */

/**
 * Double de test des caractéristiques d'une chaudière : rpn = (84 + 2 log10(Pn collectif kW)) / 100
 * et qp0 = 1 % de Pn collectif, ramené au logement (× ratio).
 */
const caracteristiquesChaudiere = vi.fn((pn, ratio) => {
  const pnCollectifKw = pn / ratio / 1000;
  return {
    rpn: (84 + 2 * Math.log10(pnCollectifKw)) / 100,
    qp0: 0.01 * pnCollectifKw * 1000 * ratio
  };
});

describe('nombreDecimales', () => {
  test.each([
    [12, 0],
    [0.87, 2],
    [0.868943, 6],
    [1e-7, 7],
    [1.5e-7, 8],
    [1.5e3, 0]
  ])('%s possède %s décimale(s)', (valeur, attendu) => {
    expect(nombreDecimales(valeur)).toBe(attendu);
  });
});

describe('valeurCoherente', () => {
  test('valeur arrondie à 2 décimales : tolérance d’une demi-unité (0,005)', () => {
    expect(valeurCoherente(0.87, 0.8749)).toBe(true);
    expect(valeurCoherente(0.87, 0.8651)).toBe(true);
    expect(valeurCoherente(0.87, 0.876)).toBe(false);
  });

  test('valeur arrondie à 1 décimale : la tolérance reste bornée à 0,005', () => {
    expect(valeurCoherente(0.9, 0.904)).toBe(true);
    expect(valeurCoherente(0.9, 0.908)).toBe(false);
  });

  test('valeur non arrondie : tolérance relative de 0,1 % (troncature de la puissance)', () => {
    expect(valeurCoherente(0.868943160626844, 0.8696)).toBe(true);
    expect(valeurCoherente(0.868943160626844, 0.8705)).toBe(false);
  });

  test('grande valeur entière : tolérance relative de 0,1 %', () => {
    expect(valeurCoherente(2400, 2402)).toBe(true);
    expect(valeurCoherente(2400, 2403)).toBe(false);
  });
});

describe('qp0Coherent', () => {
  test('qp0 stocké en W', () => {
    expect(qp0Coherent(240, 240)).toBe(true);
  });

  test('qp0 stocké en kW (certains logiciels)', () => {
    expect(qp0Coherent(0.24, 240)).toBe(true);
  });

  test('qp0 incohérent dans les deux unités', () => {
    expect(qp0Coherent(0.5, 240)).toBe(false);
  });
});

describe('conventionPuissanceNominale - cas sans détection', () => {
  test.each([
    ['installation individuelle (ratio = 1)', 23000, 1, { rpn: 0.87 }],
    ['ratio absent', 23000, undefined, { rpn: 0.87 }],
    ['ratio nul', 23000, 0, { rpn: 0.87 }],
    ['puissance absente', 0, 0.1, { rpn: 0.87 }],
    ['rpn du DPE absent', 23000, 0.1, {}],
    ['rpn du DPE non numérique', 23000, 0.1, { rpn: '0.87' }],
    ['valeurs du DPE absentes', 23000, 0.1, undefined]
  ])('%s : convention individualisée conservée', (_, pn, ratio, valeursDpe) => {
    const caracteristiques = vi.fn();
    expect(conventionPuissanceNominale(pn, ratio, valeursDpe, caracteristiques, true)).toEqual({
      pn,
      ratio,
      convention: 'individualisee'
    });
    expect(caracteristiques).not.toHaveBeenCalled();
  });
});

describe('conventionPuissanceNominale - détection de la convention du logiciel', () => {
  const ratio = 0.1;
  const pn = 23000;

  test('rpn cohérent avec pn / ratio : pn est bien la puissance virtualisée (convention 3CL)', () => {
    // rpn sur Pn collectif = 230 kW
    const rpn = caracteristiquesChaudiere(pn, ratio).rpn;
    expect(
      conventionPuissanceNominale(pn, ratio, { rpn }, caracteristiquesChaudiere, false)
    ).toEqual({ pn, ratio, convention: 'individualisee' });
  });

  test('rpn non recalculé (caractéristique saisie) : convention individualisée conservée', () => {
    const caracteristiques = vi.fn(() => ({ qp0: 100 }));
    expect(conventionPuissanceNominale(pn, ratio, { rpn: 0.87 }, caracteristiques, false)).toEqual({
      pn,
      ratio,
      convention: 'individualisee'
    });
    expect(caracteristiques).toHaveBeenCalledTimes(1);
  });

  test('rpn incohérent avec les deux hypothèses : convention individualisée conservée', () => {
    expect(
      conventionPuissanceNominale(pn, ratio, { rpn: 0.5 }, caracteristiquesChaudiere, true)
    ).toEqual({ pn, ratio, convention: 'individualisee' });
  });

  test('rpn et qp0 calculés par le logiciel sur pn collectif, qp0 virtualisé : pn ramené à Pe = pn × ratio', () => {
    // rpn sur 23 kW, qp0 = 1 % × 23 kW × 0,1 = 23 W
    const valeursDpe = { rpn: caracteristiquesChaudiere(pn, 1).rpn, qp0: 23 };
    const resultat = conventionPuissanceNominale(
      pn,
      ratio,
      valeursDpe,
      caracteristiquesChaudiere,
      true
    );
    expect(resultat.convention).toBe('collective_virtualisee');
    expect(resultat.pn).toBeCloseTo(2300, 9);
    expect(resultat.ratio).toBe(ratio);
    // Hypothèse virtualisée évaluée sur Pe = pn × ratio
    expect(caracteristiquesChaudiere).toHaveBeenCalledWith(pn * ratio, ratio);
  });

  test('qp0 du DPE absent : rpn suffit à établir que pn est la puissance collective', () => {
    const valeursDpe = { rpn: caracteristiquesChaudiere(pn, 1).rpn };
    expect(
      conventionPuissanceNominale(pn, ratio, valeursDpe, caracteristiquesChaudiere, true)
    ).toMatchObject({ convention: 'collective_virtualisee', ratio });
  });

  test('qp0 non recalculé (méthode de saisie 4/5) : rpn suffit', () => {
    const rpnCollectif = caracteristiquesChaudiere(pn, 1).rpn;
    const caracteristiques = (p, r) => ({ rpn: caracteristiquesChaudiere(p, r).rpn });
    expect(
      conventionPuissanceNominale(
        pn,
        ratio,
        { rpn: rpnCollectif, qp0: 999 },
        caracteristiques,
        true
      )
    ).toMatchObject({ convention: 'collective_virtualisee' });
  });

  test('logiciel n’ayant pas virtualisé qp0 (qp0 en kW sur pn) + bug_for_bug_compat : calcul non virtualisé reproduit', () => {
    // qp0 = 1 % × 23 kW = 0,23 kW, non multiplié par le ratio
    const valeursDpe = { rpn: caracteristiquesChaudiere(pn, 1).rpn, qp0: 0.23 };
    expect(
      conventionPuissanceNominale(pn, ratio, valeursDpe, caracteristiquesChaudiere, true)
    ).toEqual({ pn, ratio: 1, convention: 'collective_non_virtualisee' });
  });

  test('logiciel n’ayant pas virtualisé qp0 sans bug_for_bug_compat : application de la méthode (pn × ratio)', () => {
    const valeursDpe = { rpn: caracteristiquesChaudiere(pn, 1).rpn, qp0: 230 };
    const resultat = conventionPuissanceNominale(
      pn,
      ratio,
      valeursDpe,
      caracteristiquesChaudiere,
      false
    );
    expect(resultat.convention).toBe('collective_virtualisee');
    expect(resultat.pn).toBeCloseTo(2300, 9);
    expect(resultat.ratio).toBe(ratio);
  });

  test('qp0 incohérent avec les deux hypothèses : convention individualisée conservée', () => {
    const valeursDpe = { rpn: caracteristiquesChaudiere(pn, 1).rpn, qp0: 5000 };
    expect(
      conventionPuissanceNominale(pn, ratio, valeursDpe, caracteristiquesChaudiere, true)
    ).toEqual({ pn, ratio, convention: 'individualisee' });
  });

  test('qp0 non recalculable dans l’hypothèse non virtualisée : convention individualisée conservée', () => {
    const caracteristiques = (p, r) =>
      r === 1 ? { rpn: 0.8 } : { ...caracteristiquesChaudiere(p, r) };
    const valeursDpe = { rpn: caracteristiquesChaudiere(pn, 1).rpn, qp0: 5000 };
    expect(conventionPuissanceNominale(pn, ratio, valeursDpe, caracteristiques, true)).toEqual({
      pn,
      ratio,
      convention: 'individualisee'
    });
  });

  test('cas réel DPEWin 2415E2886950G (rpn = 0,87 ; qp0 = 0,276 kW) avec une table réaliste', () => {
    // Chaudière gaz standard : rpn = 84 + 2 log(Pn), qp0 = 1,2 % de Pn
    const caracteristiques = (p, r) => ({
      rpn: (84 + 2 * Math.log10(p / r / 1000)) / 100,
      qp0: 0.012 * p
    });
    const resultat = conventionPuissanceNominale(
      23000,
      0.1150571,
      { rpn: 0.87, qp0: 0.276 },
      caracteristiques,
      true
    );
    expect(resultat).toEqual({ pn: 23000, ratio: 1, convention: 'collective_non_virtualisee' });
  });
});
