import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `9_conso_ch.js` :
 * - `utils` : `mois_liste` (réduite) et `requestInputID` (lien générateur/émetteur) ;
 * - `9_emetteur_ch` : `rendement_emission` (produit des rendements de l'émetteur) ;
 * - `8_intermittence` : `calc_intermittence` (coefficient d'intermittence I0) ;
 * - `tv` : profils mensuels dh14 / text / nref19 (valeurs contrôlées) ;
 * - `enums` : mapping altitude / zone climatique.
 *
 * `isNil` (lodash-es) est un utilitaire déterministe conservé tel quel.
 * On pilote les fonctions mockées pour vérifier la logique de composition
 * propre au module (choix des coefficients, prorata de surface, base+appoint).
 */
vi.mock('./utils.js', () => ({
  mois_liste: ['Janvier', 'Février'],
  requestInputID: vi.fn()
}));

vi.mock('./9_emetteur_ch.js', () => ({
  rendement_emission: vi.fn()
}));

vi.mock('./8_intermittence.js', () => ({
  calc_intermittence: vi.fn()
}));

vi.mock('./tv.js', () => ({
  default: {
    dh14: {
      0: { ca1: { Janvier: { h1a: 1000 }, Février: { h1a: 800 } } },
      1: { ca1: { Janvier: { h1a: 1100 }, Février: { h1a: 900 } } }
    },
    text: {
      0: { ca1: { Janvier: { h1a: 5 }, Février: { h1a: 7 } } },
      1: { ca1: { Janvier: { h1a: 5 }, Février: { h1a: 7 } } }
    },
    nref19: {
      0: { ca1: { Janvier: { h1a: 500 }, Février: { h1a: 400 } } },
      1: { ca1: { Janvier: { h1a: 500 }, Février: { h1a: 400 } } }
    }
  }
}));

vi.mock('./enums.js', () => ({
  default: {
    zone_climatique: { 1: 'h1a' },
    classe_altitude: { 1: 'ca1' }
  }
}));

const { conso_ch } = await import('./9_conso_ch.js');
const { default: tvs } = await import('./tv.js');
const { requestInputID } = await import('./utils.js');
const { rendement_emission } = await import('./9_emetteur_ch.js');
const { calc_intermittence } = await import('./8_intermittence.js');

/** Émetteur minimal avec une valeur d'intermittence I0 propre. */
function emetteur(i0, surface = 100, lien = '1') {
  return {
    donnee_entree: { enum_lien_generateur_emetteur_id: lien, surface_chauffee: surface },
    donnee_intermediaire: { i0 }
  };
}

/**
 * 9. Consommations de chauffage (Cch)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9
 */
describe('conso_ch - configuration par défaut (installation simple)', () => {
  beforeEach(() => {
    vi.mocked(requestInputID).mockReset();
    vi.mocked(rendement_emission).mockReset();
    vi.mocked(calc_intermittence).mockReset();
    // rendement d'émission global = 0.8 -> Ich émetteur = 1 / 0.8 = 1.25
    vi.mocked(rendement_emission).mockReturnValue(0.8);
    // I0 renvoyé tel quel pour rendre le prorata vérifiable
    vi.mocked(calc_intermittence).mockImplementation((_gv, _sh, _hsp, i0) => i0);
  });

  test('conso = coeff * (I0 / rendement_emission / rg) * bch (générateur électrique, 1 émetteur)', () => {
    const di = { rg: 1, rg_dep: 1 };
    // enum électrique + installation simple => émetteur sélectionné par position
    const de = { enum_type_generateur_ch_id: '98', surface_chauffee: 100 };
    const em = [emetteur(0.9)];

    conso_ch(
      di,
      de,
      {},
      0,
      'installation de chauffage simple',
      em,
      150,
      100,
      2.5,
      1000,
      2000,
      -9.5,
      0,
      1,
      1
    );

    // coeff = 1 ; emetteur_eq = 0.9 * 1.25 = 1.125
    expect(di.conso_ch).toBeCloseTo(1125, 9);
    expect(di.conso_ch_depensier).toBeCloseTo(2250, 9);
    // un seul émetteur => calc_intermittence appelé avec l'I0 de l'émetteur
    expect(calc_intermittence).toHaveBeenCalledWith(150, 100, 2.5, 0.9);
  });

  test('coefficient de configuration : "chauffage solaire" applique (1 - Fch)', () => {
    const di = { rg: 1, rg_dep: 1 };
    // non électrique => tous les émetteurs filtrés sont retenus
    const de = { enum_type_generateur_ch_id: '10', surface_chauffee: 100, fch: 0.4 };
    const em = [emetteur(1)];

    conso_ch(
      di,
      de,
      {},
      0,
      'installation de chauffage avec chauffage solaire',
      em,
      150,
      100,
      2.5,
      1000,
      2000,
      -9.5,
      0,
      1,
      1
    );

    // coeff = 1 - 0.4 = 0.6 ; Ich = 1 * 1.25 = 1.25
    expect(di.conso_ch).toBeCloseTo(0.6 * 1.25 * 1000, 9);
  });

  test('sans fch, le coefficient utilise la valeur par défaut 0.5', () => {
    const di = { rg: 1, rg_dep: 1 };
    const de = { enum_type_generateur_ch_id: '10', surface_chauffee: 100 };
    const em = [emetteur(1)];

    conso_ch(
      di,
      de,
      {},
      0,
      'installation de chauffage avec chauffage solaire',
      em,
      150,
      100,
      2.5,
      1000,
      2000,
      -9.5,
      0,
      1,
      1
    );

    // coeff = 1 - 0.5 = 0.5
    expect(di.conso_ch).toBeCloseTo(0.5 * 1.25 * 1000, 9);
  });

  test('coefficient absent pour la position demandée : repli sur 1', () => {
    const di = { rg: 1, rg_dep: 1 };
    // non électrique pour conserver tous les émetteurs malgré la position 2
    const de = { enum_type_generateur_ch_id: '10', surface_chauffee: 100 };
    const em = [emetteur(0.9)];

    conso_ch(
      di,
      de,
      {},
      2,
      'installation de chauffage simple',
      em,
      150,
      100,
      2.5,
      1000,
      2000,
      -9.5,
      0,
      1,
      1
    );

    // coeff = 1 (aucune clé 2 dans la table) ; Ich = 0.9 * 1.25
    expect(di.conso_ch).toBeCloseTo(0.9 * 1.25 * 1000, 9);
  });

  test('plusieurs émetteurs : prorata par la surface chauffée de chaque émetteur', () => {
    const di = { rg: 1, rg_dep: 1 };
    // non électrique => les deux émetteurs liés sont conservés
    const de = { enum_type_generateur_ch_id: '10', surface_chauffee: 40 };
    vi.mocked(requestInputID).mockReturnValue('1');
    const em = [emetteur(1, 10, '1'), emetteur(2, 30, '1')];

    conso_ch(
      di,
      de,
      {},
      0,
      'installation de chauffage simple',
      em,
      150,
      100,
      2.5,
      1000,
      2000,
      -9.5,
      0,
      1,
      1
    );

    // emetteur_eq = (10/40)*1*1.25 + (30/40)*2*1.25 = 0.3125 + 1.875 = 2.1875
    expect(di.conso_ch).toBeCloseTo(2187.5, 9);
    expect(rendement_emission).toHaveBeenCalledTimes(2);
  });

  test('générateur électrique avec position nulle : tous les émetteurs sont conservés (isNil)', () => {
    const di = { rg: 1, rg_dep: 1 };
    const de = { enum_type_generateur_ch_id: '98', surface_chauffee: 40 };
    vi.mocked(requestInputID).mockReturnValue('1');
    const em = [emetteur(1, 10, '1'), emetteur(2, 30, '1')];

    conso_ch(
      di,
      de,
      {},
      null,
      'installation de chauffage simple',
      em,
      150,
      100,
      2.5,
      1000,
      2000,
      -9.5,
      0,
      1,
      1
    );

    // les deux émetteurs pris en compte => emetteur_eq = 2.1875
    expect(di.conso_ch).toBeCloseTo(2187.5, 9);
  });
});

describe('conso_ch - convecteurs bi-jonction (individuel + collectif)', () => {
  beforeEach(() => {
    vi.mocked(requestInputID).mockReset();
    vi.mocked(rendement_emission).mockReset();
    vi.mocked(calc_intermittence).mockReset();
    vi.mocked(rendement_emission).mockReturnValue(0.8);
    vi.mocked(calc_intermittence).mockImplementation((_gv, _sh, _hsp, i0) => i0);
  });

  test('somme des parts individuelle (coeff 0.4) et collective (coeff 0.6, I0 forcé à 1.03)', () => {
    const di = { rg: 1, rg_dep: 1 };
    const de = { enum_type_generateur_ch_id: '10', surface_chauffee: 100, fch: 0.5 };
    const em = [emetteur(0.5)];

    conso_ch(
      di,
      de,
      {},
      0,
      'convecteurs bi-jonction',
      em,
      150,
      100,
      2.5,
      1000,
      2000,
      -9.5,
      0,
      1,
      1
    );

    // individuel : 0.4 * (0.5 / 0.8) * 1000 = 250
    // collectif  : 0.6 * (1.03 / 0.8) * 1000 = 772.5
    expect(di.conso_ch).toBeCloseTo(250 + 772.5, 9);
    expect(di.conso_ch_depensier).toBeCloseTo((250 + 772.5) * 2, 9);
    // l'intermittence collective est calculée avec I0 = 1.03
    expect(calc_intermittence).toHaveBeenCalledWith(150, 100, 2.5, 1.03);
  });
});

describe('conso_ch - installation collective base + appoint', () => {
  beforeEach(() => {
    vi.mocked(requestInputID).mockReset();
    vi.mocked(rendement_emission).mockReset();
    vi.mocked(calc_intermittence).mockReset();
    vi.mocked(rendement_emission).mockReturnValue(0.9);
    vi.mocked(calc_intermittence).mockReturnValue(1);
  });

  /** Jeu d'installation base + appoint minimal. */
  function baseAppointArgs(pos, { pn = 5000 } = {}) {
    const di = { rg: 1, rg_dep: 1 };
    const de = { surface_chauffee: 100, rdim: 1 };
    const emBase = {
      donnee_entree: { surface_chauffee: 100 },
      donnee_intermediaire: {
        i0: 0.9,
        rendement_distribution: 0.95,
        rendement_regulation: 0.99,
        rendement_emission: 0.95
      }
    };
    const emAppoint = {
      donnee_entree: { surface_chauffee: 100 },
      donnee_intermediaire: { i0: 0.9 }
    };
    const genBase = { donnee_intermediaire: { pn, rendement_generation: 0.9 } };
    const genAppoint = { donnee_intermediaire: { pn: 0, rendement_generation: 0.9 } };
    const em_list = [emBase, emAppoint];
    const gen_ch_list = [genBase, genAppoint];
    const besoin_ch_mois = { Janvier: 3000, Février: 2000 };
    return [
      di,
      de,
      pos,
      'installation de chauffage collectif avec base + appoint',
      em_list,
      150,
      100,
      2.5,
      50,
      60,
      -9.5,
      0,
      1,
      1,
      besoin_ch_mois,
      100,
      gen_ch_list
    ];
  }

  /** Adaptation à la signature réelle de `conso_ch`. */
  function callBaseAppoint(pos, opts) {
    const [
      di,
      de,
      _pos,
      cfg,
      em_list,
      GV,
      Sh,
      hsp,
      bch,
      bch_dep,
      tbase,
      ilpa,
      ca_id,
      zc_id,
      besoin_ch_mois,
      s_chauffee_inst,
      gen_ch_list
    ] = baseAppointArgs(pos, opts);
    conso_ch(
      di,
      de,
      {},
      _pos,
      cfg,
      em_list,
      GV,
      Sh,
      hsp,
      bch,
      bch_dep,
      tbase,
      ilpa,
      ca_id,
      zc_id,
      besoin_ch_mois,
      s_chauffee_inst,
      gen_ch_list
    );
    return di;
  }

  test('générateur de base (pos 0) : valeur de référence de régression', () => {
    const di = callBaseAppoint(0);
    // référence de régression (calcul mensuel base+appoint avec pn > 0)
    expect(di.conso_ch).toBeCloseTo(6.172839506172839, 9);
  });

  test("générateur d'appoint (pos 1) : valeur de référence de régression", () => {
    const di = callBaseAppoint(1);
    // référence de régression (part d'appoint = bch - besoin de base)
    expect(di.conso_ch).toBeCloseTo(55.55555555555556, 9);
  });

  test('puissance nulle (pe = 0) : le besoin de base est forfaitairement la moitié du besoin', () => {
    const di = callBaseAppoint(0, { pn: 0 });
    // pe = 0 => bch_base_j = besoin_ch_mois * 0.5 sur chaque mois
    // référence de régression
    expect(di.conso_ch).toBeCloseTo(3.0864197530864197, 9);
  });

  test('faible puissance (dhtj positif) : le besoin de base peut devenir nul (ratioDh <= 0)', () => {
    // pn faible => t proche de 14 => xj > 0 => dhtj > 0 et supérieur à dh14j
    // => ratioDh <= 0 => bch_base_j forcé à 0 sur les mois concernés
    const di = callBaseAppoint(0, { pn: 100 });
    // référence de régression (dhtj > 0, ratioDh <= 0)
    expect(di.conso_ch).toBeCloseTo(0, 9);
  });

  test('logement collectif ILPA + valeurs par défaut (rdim, rendement de génération)', () => {
    const di = { rg: 1, rg_dep: 1 };
    // pas de rdim => rdim = 1 ; pas de rendement_generation => Ich = 1
    const de = { surface_chauffee: 100 };
    const emBase = {
      donnee_entree: { surface_chauffee: 100 },
      donnee_intermediaire: {
        i0: 0.9,
        rendement_distribution: 0.95,
        rendement_regulation: 0.99,
        rendement_emission: 0.95
      }
    };
    const genBase = { donnee_intermediaire: { pn: 5000 } };
    const genAppoint = { donnee_intermediaire: { pn: 0 } };

    conso_ch(
      di,
      de,
      {},
      0,
      'installation de chauffage collectif avec base + appoint',
      [emBase, emBase],
      150,
      100,
      2.5,
      50,
      60,
      -9.5,
      1, // ilpa vrai => idx_ilpa = 1
      1,
      1,
      { Janvier: 3000, Février: 2000 },
      100,
      [genBase, genAppoint]
    );

    expect(Number.isFinite(di.conso_ch)).toBe(true);
    expect(di.conso_ch).toBeGreaterThanOrEqual(0);
  });

  test('degrés-heures mensuels nuls (dh14j = 0) : mois neutralisé sans division', () => {
    const initialFev = tvs.dh14[0].ca1.Février.h1a;
    tvs.dh14[0].ca1.Février.h1a = 0;
    try {
      const di = callBaseAppoint(0, { pn: 100 });
      // le mois à dh14j nul est ignoré (branche dh14j > 0 fausse)
      expect(Number.isFinite(di.conso_ch)).toBe(true);
      expect(di.conso_ch).toBeGreaterThanOrEqual(0);
    } finally {
      tvs.dh14[0].ca1.Février.h1a = initialFev;
    }
  });

  test('besoin de chauffage nul : la consommation reste indéfinie (aucun calcul)', () => {
    const di = { rg: 1, rg_dep: 1 };
    const de = { surface_chauffee: 100, rdim: 1 };
    const emBase = {
      donnee_entree: { surface_chauffee: 100 },
      donnee_intermediaire: {
        i0: 0.9,
        rendement_distribution: 0.95,
        rendement_regulation: 0.99,
        rendement_emission: 0.95
      }
    };
    const genBase = { donnee_intermediaire: { pn: 5000, rendement_generation: 0.9 } };

    conso_ch(
      di,
      de,
      {},
      0,
      'installation de chauffage collectif avec base + appoint',
      [emBase, emBase],
      150,
      100,
      2.5,
      0,
      0,
      -9.5,
      0,
      1,
      1,
      { Janvier: 3000, Février: 2000 },
      100,
      [genBase, genBase]
    );

    // bch = 0 => la branche de calcul n'est pas exécutée
    expect(di.conso_ch).toBeUndefined();
  });
});
