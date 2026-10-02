import { describe, expect, test, vi } from 'vitest';
import {
  conventionPuissanceNominale,
  decalageDecimal,
  inverserRendement,
  nombreDecimales,
  puissanceDepuisRpn,
  puissanceRecalculeeDepuisRpn,
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

/**
 * 4e hypothèse : pn recalculé à partir du rpn stocké dans le DPE (issue #124, DPE 2592E2935275X).
 * Double de test d'une chaudière gaz à condensation 2001-2015 : rpn = 91 + log10(Pn),
 * rpint = 97 + log10(Pn) (Pn collectif en kW), qp0 = 1 % de la puissance saisie.
 */
const condensation = {
  rpn: (pnCollectif) => (91 + Math.log10(pnCollectif / 1000)) / 100,
  caracteristiques: (pn, ratio) => ({
    rpn: (91 + Math.log10(pn / ratio / 1000)) / 100,
    rpint: (97 + Math.log10(pn / ratio / 1000)) / 100,
    qp0: 0.01 * pn
  })
};
const formuleRpnCondensation = () => condensation.rpn;

describe('inverserRendement', () => {
  test('formule « A + B × log10(Pn) » : Pn retrouvé (W)', () => {
    // rpn = 91 + log10(696) % -> Pn = 696 kW
    expect(inverserRendement((91 + Math.log10(696)) / 100, condensation.rpn)).toBeCloseTo(
      696000,
      6
    );
    const formule = (p) => (84 + 2 * Math.log10(p / 1000)) / 100;
    expect(inverserRendement(formule(23000), formule)).toBeCloseTo(23000, 6);
  });

  test('rendement indépendant de Pn (B = 0) : non inversible', () => {
    expect(inverserRendement(0.9, () => 0.9)).toBeUndefined();
  });

  test('formule non affine en log10(Pn) : non inversible', () => {
    expect(inverserRendement(0.9, (p) => (80 + Math.log10(p / 1000) ** 2) / 100)).toBeUndefined();
  });

  test('formule non évaluable : non inversible', () => {
    expect(inverserRendement(0.9, () => NaN)).toBeUndefined();
  });
});

describe('puissanceDepuisRpn', () => {
  /**
   * Table à deux lignes selon le critère de puissance : Pn ≤ 70 kW -> 84 + 2 log10(Pn),
   * Pn > 70 kW -> 91 + log10(Pn).
   */
  const petite = (p) => (84 + 2 * Math.log10(p / 1000)) / 100;
  const formuleSelonPn = (pnCollectif) => (pnCollectif <= 70000 ? petite : condensation.rpn);

  test('ligne de table stable : Pn obtenu en une inversion', () => {
    const formuleRpn = vi.fn(formuleSelonPn);
    expect(puissanceDepuisRpn(500000, condensation.rpn(696000), formuleRpn)).toBeCloseTo(696000, 6);
    expect(formuleRpn).toHaveBeenCalledTimes(2);
  });

  test('première ligne inadaptée : ligne re-sélectionnée sur le Pn obtenu', () => {
    // Départ sur la ligne « Pn ≤ 70 kW », Pn réel 696 kW
    const formuleRpn = vi.fn(formuleSelonPn);
    expect(puissanceDepuisRpn(24000, condensation.rpn(696000), formuleRpn)).toBeCloseTo(696000, 6);
    expect(formuleRpn).toHaveBeenCalledTimes(4);
  });

  test('aucune ligne de table : abandon', () => {
    expect(puissanceDepuisRpn(24000, 0.93, () => undefined)).toBeUndefined();
  });

  test('ligne sans formule rpn après re-sélection : abandon après 3 itérations', () => {
    const formuleRpn = vi.fn((p) => (p === 24000 ? condensation.rpn : undefined));
    expect(puissanceDepuisRpn(24000, 0.93, formuleRpn)).toBeUndefined();
  });

  test('rpn indépendant de Pn : abandon', () => {
    expect(puissanceDepuisRpn(24000, 0.9, () => () => 0.9)).toBeUndefined();
  });

  test('lignes incompatibles (Pn hors de la plage de chaque ligne) : abandon', () => {
    // 0,93 -> 100 kW sur la ligne « Pn ≤ 70 kW » et 14 kW sur la ligne « Pn > 70 kW »
    const grande = (p) => (70 + 20 * Math.log10(p / 1000)) / 100;
    const formuleRpn = (p) => (p <= 70000 ? condensation.rpn : grande);
    expect(puissanceDepuisRpn(24000, 0.93, formuleRpn)).toBeUndefined();
  });
});

describe('decalageDecimal', () => {
  test('puissance saisie décalée d’une puissance de dix (69600 W pour 696 kW)', () => {
    expect(decalageDecimal(69600, 696000)).toBe(true);
    expect(decalageDecimal(696, 696000)).toBe(true);
    expect(decalageDecimal(2018.32, 201.832)).toBe(true);
  });

  test('puissance identique ou sans rapport : pas de décalage', () => {
    expect(decalageDecimal(696000, 696000)).toBe(false);
    expect(decalageDecimal(23000, 696000)).toBe(false);
  });
});

describe('puissanceRecalculeeDepuisRpn', () => {
  // Valeurs du DPE 2592E2935275X (WinDpe) : pn = 69600 W, Pn réel = 696 kW
  const ratio = 0.00289987937273824;
  const rpn = 0.938426100909721;
  const rpint = 0.998426100909721;

  test('rpint du DPE cohérent avec le Pn retrouvé : Pe = a × Pn retenu', () => {
    const resultat = puissanceRecalculeeDepuisRpn(
      69600,
      ratio,
      { rpn, rpint, qp0: 2.01832 },
      condensation.caracteristiques,
      formuleRpnCondensation
    );
    expect(resultat.convention).toBe('puissance_depuis_rpn');
    expect(resultat.ratio).toBe(ratio);
    /**
     * Référence de régression : le logiciel a calculé rpn sur Pn = Pe / a avec Pe = 2018,32 W
     * (arrondi au centième), soit Pn = 696,0014 kW ; on retrouve exactement Pe = 2018,32 W.
     */
    expect(resultat.pnCollectif).toBeCloseTo(2018.32 / ratio, 3);
    expect(resultat.pn).toBeCloseTo(2018.32, 6);
  });

  test('rpint du DPE incohérent avec le Pn retrouvé : abandon', () => {
    expect(
      puissanceRecalculeeDepuisRpn(
        69600,
        ratio,
        { rpn, rpint: 0.95, qp0: 20.1832 },
        condensation.caracteristiques,
        formuleRpnCondensation
      )
    ).toBeUndefined();
  });

  test('sans rpint : qp0 virtualisé du DPE (W) confirme le Pn retrouvé', () => {
    expect(
      puissanceRecalculeeDepuisRpn(
        12345,
        ratio,
        { rpn, qp0: 20.1832 },
        condensation.caracteristiques,
        formuleRpnCondensation
      )
    ).toMatchObject({ convention: 'puissance_depuis_rpn' });
  });

  test('sans rpint : qp0 non virtualisé du DPE (kW) confirme le Pn retrouvé', () => {
    // qp0 = 1 % × 696 kW = 6,96 kW
    expect(
      puissanceRecalculeeDepuisRpn(
        12345,
        ratio,
        { rpn, qp0: 6.96 },
        condensation.caracteristiques,
        formuleRpnCondensation
      )
    ).toMatchObject({ convention: 'puissance_depuis_rpn' });
  });

  test('sans rpint ni qp0 cohérent : pn saisi décalé d’une puissance de dix de Pn', () => {
    expect(
      puissanceRecalculeeDepuisRpn(
        69600,
        ratio,
        { rpn, qp0: 2.01832 },
        condensation.caracteristiques,
        formuleRpnCondensation
      )
    ).toMatchObject({ convention: 'puissance_depuis_rpn' });
  });

  test('sans rpint ni qp0 : pn saisi décalé d’une puissance de dix de Pe', () => {
    expect(
      puissanceRecalculeeDepuisRpn(
        201.832,
        ratio,
        { rpn },
        condensation.caracteristiques,
        formuleRpnCondensation
      )
    ).toMatchObject({ convention: 'puissance_depuis_rpn' });
  });

  test('aucune confirmation (rpint et qp0 non recalculés, pn sans rapport) : abandon', () => {
    const caracteristiques = (pn, r) => ({ rpn: condensation.caracteristiques(pn, r).rpn });
    expect(
      puissanceRecalculeeDepuisRpn(
        12345,
        ratio,
        { rpn, rpint, qp0: 2.01832 },
        caracteristiques,
        formuleRpnCondensation
      )
    ).toBeUndefined();
  });

  test('rpn non inversible : abandon sans calcul des caractéristiques', () => {
    const caracteristiques = vi.fn();
    expect(
      puissanceRecalculeeDepuisRpn(69600, ratio, { rpn }, caracteristiques, () => () => 0.9)
    ).toBeUndefined();
    expect(caracteristiques).not.toHaveBeenCalled();
  });
});

describe('conventionPuissanceNominale - 4e hypothèse (pn recalculé depuis rpn)', () => {
  const ratio = 0.00289987937273824;
  const valeursDpe = { rpn: 0.938426100909721, rpint: 0.998426100909721, qp0: 2.01832 };

  test('cas réel WinDpe 2592E2935275X : pn ni Pe ni Pn -> Pe = a × Pn(rpn) = 2018,32 W', () => {
    const resultat = conventionPuissanceNominale(
      69600,
      ratio,
      valeursDpe,
      condensation.caracteristiques,
      true,
      formuleRpnCondensation
    );
    expect(resultat).toMatchObject({ convention: 'puissance_depuis_rpn', ratio });
    expect(resultat.pn).toBeCloseTo(2018.32, 6);
  });

  test('formule rpn non fournie : convention individualisée conservée', () => {
    expect(
      conventionPuissanceNominale(69600, ratio, valeursDpe, condensation.caracteristiques, true)
    ).toEqual({ pn: 69600, ratio, convention: 'individualisee' });
  });

  test('confirmation impossible : convention individualisée conservée', () => {
    expect(
      conventionPuissanceNominale(
        69600,
        ratio,
        { ...valeursDpe, rpint: 0.95 },
        condensation.caracteristiques,
        true,
        formuleRpnCondensation
      )
    ).toEqual({ pn: 69600, ratio, convention: 'individualisee' });
  });

  test('pn cohérent avec Pe : la 4e hypothèse n’est pas évaluée', () => {
    const formuleRpn = vi.fn(formuleRpnCondensation);
    expect(
      conventionPuissanceNominale(
        2018.32,
        ratio,
        valeursDpe,
        condensation.caracteristiques,
        true,
        formuleRpn
      )
    ).toMatchObject({ convention: 'individualisee' });
    expect(formuleRpn).not.toHaveBeenCalled();
  });
});
