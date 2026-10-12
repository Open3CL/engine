import { describe, expect, test } from 'vitest';
import {
  ANNEE_CHAUDIERE_MURALE_RECENTE,
  anneeInstallationGenerateur,
  isChaudiere,
  periodeInstallationLibelle,
  pnChaudiere,
  pnEstimeeDimensionnement,
  puissanceEcs,
  valeurChaudiereMurale
} from './13.2_generateur_combustion_pdim.js';

/**
 * Module de calcul pur (aucune dépendance) : pas de mock nécessaire.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.2.4 Calcul des puissances nominales (p.90-91)
 */
describe('puissanceEcs - puissance de dimensionnement ECS selon le volume de stockage', () => {
  test('production instantanée (Vs = 0) : Pecs = 21 kW', () => {
    expect(puissanceEcs(0)).toBe(21);
    expect(puissanceEcs('0.000')).toBe(21);
  });

  test('semi-instantanée (0 < Vs ≤ 20) : Pecs = 21 − 0,8 × Vs', () => {
    expect(puissanceEcs(10)).toBeCloseTo(13, 9);
    expect(puissanceEcs(20)).toBeCloseTo(5, 9);
  });

  test('semi-accumulation (20 < Vs ≤ 150) : Pecs = 5 − 1,751 × (Vs − 20) / 65', () => {
    expect(puissanceEcs(85)).toBeCloseTo(5 - 1.751, 9);
    expect(puissanceEcs(150)).toBeCloseTo(5 - (1.751 * 130) / 65, 9);
  });

  test('accumulation (Vs > 150) : Pecs = (7,14 × Vs + 428) / 1000', () => {
    expect(puissanceEcs(200)).toBeCloseTo((7.14 * 200 + 428) / 1000, 9);
  });

  test.each([undefined, null, '', 'abc', -5])('volume %s non exploitable : undefined', (vs) => {
    expect(puissanceEcs(vs)).toBeUndefined();
  });
});

describe('pnChaudiere - table Pdim → Pn des chaudières', () => {
  test.each([
    [3, 18, 5],
    [5, 18, 5],
    [7, 18, 10],
    [12, 18, 13],
    [15, 18, 18],
    [18, 18, 18],
    [20, 24, 24],
    [26, 28, 28],
    [30, 32, 32],
    [40, 40, 40]
  ])('Pdim = %s kW : Pn = %s kW (murale < 2006 ou sol), %s kW (murale ≥ 2006)', (pdim, a, b) => {
    expect(pnChaudiere(pdim, false)).toBe(a);
    expect(pnChaudiere(pdim, true)).toBe(b);
  });

  test('Pdim > 40 kW : Pn = (Partie entière(Pdim / 5) + 1) × 5, quelle que soit la colonne', () => {
    expect(pnChaudiere(41, false)).toBe(45);
    expect(pnChaudiere(45, true)).toBe(50);
    expect(pnChaudiere(57.3, true)).toBe(60);
  });

  test('Pn ≥ Pdim sur toute la table', () => {
    for (let pdim = 0.5; pdim < 80; pdim += 0.5) {
      expect(pnChaudiere(pdim, false)).toBeGreaterThanOrEqual(pdim);
      expect(pnChaudiere(pdim, true)).toBeGreaterThanOrEqual(pdim);
    }
  });
});

describe('isChaudiere - générateurs concernés par la table Pdim → Pn', () => {
  test.each([
    ['chaudière gaz à condensation après 2015', true],
    ['pompe à chaleur hybride : partie chaudière chaudière gaz à condensation après 2015', true],
    ['chaudière(s) gaz multi bâtiment modélisée comme un réseau de chaleur', false],
    ['radiateur à gaz indépendant ou autonome après 2006', false],
    ['générateur à air chaud à combustion avant 2006', false],
    ['accumulateur gaz classique après 2000', false],
    [undefined, false]
  ])('%s → %s', (libelle, attendu) => {
    expect(isChaudiere(libelle)).toBe(attendu);
  });
});

describe('periodeInstallationLibelle - période d’installation déduite du type de générateur', () => {
  test.each([
    ['chaudière gaz standard 2001-2015', 2001, 2015],
    ['chaudière gaz classique avant 1981', -Infinity, 1980],
    ['chaudière gaz à condensation après 2015', 2016, Infinity],
    ['poêle à bois bouilleur bûche installé à partir de 2012', 2012, Infinity],
    ['chaudière électrique', -Infinity, Infinity],
    [undefined, -Infinity, Infinity]
  ])('%s → [%s ; %s]', (libelle, min, max) => {
    expect(periodeInstallationLibelle(libelle)).toStrictEqual({ min, max });
  });
});

describe('anneeInstallationGenerateur - année d’installation retenue', () => {
  test('année d’installation saisie prioritaire', () => {
    expect(anneeInstallationGenerateur('2003', 1970, 'chaudière gaz après 2015')).toBe(2003);
  });

  test('repli : année de construction si elle est compatible avec le type de générateur', () => {
    expect(anneeInstallationGenerateur(undefined, '2010', 'chaudière gaz standard 2001-2015')).toBe(
      2010
    );
  });

  test('repli : année de construction ramenée dans la période du type de générateur', () => {
    expect(
      anneeInstallationGenerateur(undefined, 1970, 'chaudière gaz à condensation après 2015')
    ).toBe(2016);
    expect(anneeInstallationGenerateur(undefined, 2020, 'chaudière gaz classique avant 1981')).toBe(
      1980
    );
  });

  test('sans année de construction : borne de la période si elle tranche par rapport à 2006', () => {
    expect(anneeInstallationGenerateur(undefined, undefined, 'chaudière gaz après 2015')).toBe(
      2016
    );
    expect(anneeInstallationGenerateur(undefined, undefined, 'chaudière gaz avant 1981')).toBe(
      1980
    );
    expect(
      anneeInstallationGenerateur(undefined, undefined, 'chaudière gaz standard 2001-2015')
    ).toBeUndefined();
    expect(
      anneeInstallationGenerateur(undefined, undefined, 'chaudière électrique')
    ).toBeUndefined();
  });
});

describe('valeurChaudiereMurale - sous-fiche « Chaudière murale »', () => {
  test.each([
    ['oui', true],
    [' Oui ', true],
    ['non', false],
    ['NC', undefined],
    [undefined, undefined]
  ])('%s → %s', (valeur, attendu) => {
    expect(valeurChaudiereMurale(valeur)).toBe(attendu);
  });
});

describe('pnEstimeeDimensionnement - Pn estimée (W) d’un générateur sans pn', () => {
  const CHAUDIERE = 'chaudière gaz à condensation après 2015';

  test('chaudière de chauffage seul, murale récente : Pn = table(Pch) seconde colonne', () => {
    expect(
      pnEstimeeDimensionnement({
        pch: 7800,
        libelleTypeGenerateur: CHAUDIERE,
        murale: true,
        anneeInstallation: 2018
      })
    ).toBe(10000);
  });

  test('chaudière au sol : première colonne (plancher 18 kW) même installée après 2006', () => {
    expect(
      pnEstimeeDimensionnement({
        pch: 7800,
        libelleTypeGenerateur: CHAUDIERE,
        murale: false,
        anneeInstallation: 2018
      })
    ).toBe(18000);
  });

  test('chaudière murale installée avant 2006 : première colonne', () => {
    expect(
      pnEstimeeDimensionnement({
        pch: 2300,
        libelleTypeGenerateur: 'chaudière gaz standard 1991-2000',
        murale: true,
        anneeInstallation: ANNEE_CHAUDIERE_MURALE_RECENTE - 1
      })
    ).toBe(18000);
  });

  test('pose inconnue : seconde colonne si installée à partir de 2006, première sinon', () => {
    const base = { pch: 2300, libelleTypeGenerateur: CHAUDIERE };
    expect(pnEstimeeDimensionnement({ ...base, anneeInstallation: 2006 })).toBe(5000);
    expect(pnEstimeeDimensionnement({ ...base, anneeInstallation: 2005 })).toBe(18000);
    expect(pnEstimeeDimensionnement({ ...base, anneeInstallation: undefined })).toBe(18000);
  });

  test('chaudière mixte à production instantanée : Pdim = max(Pch ; 21 kW)', () => {
    expect(
      pnEstimeeDimensionnement({
        pch: 7800,
        volumeStockage: 0,
        usageEcs: true,
        libelleTypeGenerateur: CHAUDIERE,
        murale: true,
        anneeInstallation: 2018
      })
    ).toBe(24000);
  });

  test('chaudière mixte à accumulation : Pecs faible, Pdim = Pch', () => {
    expect(
      pnEstimeeDimensionnement({
        pch: 12500,
        volumeStockage: 200,
        usageEcs: true,
        libelleTypeGenerateur: CHAUDIERE,
        murale: true,
        anneeInstallation: 2018
      })
    ).toBe(13000);
  });

  test('générateur ECS seul : Pdim = Pecs (Pch ignorée)', () => {
    expect(
      pnEstimeeDimensionnement({
        pch: 30000,
        volumeStockage: 10,
        usageEcs: true,
        usageChauffage: false,
        libelleTypeGenerateur: CHAUDIERE,
        murale: true,
        anneeInstallation: 2018
      })
    ).toBe(13000);
  });

  test('générateur ECS seul sans volume de stockage : Pch conservée (comportement historique)', () => {
    expect(
      pnEstimeeDimensionnement({
        pch: 7800,
        usageEcs: true,
        usageChauffage: false,
        libelleTypeGenerateur: CHAUDIERE
      })
    ).toBe(7800);
  });

  test('générateur non-chaudière (radiateur gaz, air chaud…) : Pn = Pdim', () => {
    expect(
      pnEstimeeDimensionnement({
        pch: 7800,
        libelleTypeGenerateur: 'radiateur à gaz indépendant ou autonome après 2006'
      })
    ).toBeCloseTo(7800, 9);
    expect(
      pnEstimeeDimensionnement({
        pch: 3000,
        volumeStockage: 0,
        usageEcs: true,
        usageChauffage: false,
        libelleTypeGenerateur: 'chauffe-eau gaz à production instantanée après 2015'
      })
    ).toBeCloseTo(21000, 9);
  });
});
