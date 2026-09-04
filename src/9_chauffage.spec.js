import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `9_chauffage.js` :
 * - `utils` : `requestInput`, `tv`, `tvColumnIDs` et la table `Tbase` ;
 * - `9_emetteur_ch` : `calc_emetteur_ch` (renseignement des émetteurs) ;
 * - `9_generateur_ch` : `calc_generateur_ch` (consommations, piloté par un
 *   espion qui écrit les données intermédiaires), `checkForGeneratorType`
 *   (classification combustion/PAC) et `hasConsoForAuxDistribution` ;
 * - `13.2_generateur_combustion` / `13.2_generateur_combustion_ch` : calculs de
 *   combustion (no-op espionnés).
 *
 * On vérifie la logique d'orchestration propre au module : mise à l'échelle du
 * besoin, facteur de couverture solaire, prorata entre générateurs (cascade,
 * hybride) et répartition des auxiliaires.
 */
vi.mock('./utils.js', () => ({
  requestInput: vi.fn(),
  tv: vi.fn(),
  tvColumnIDs: vi.fn(),
  Tbase: {
    ca1: { h1: -9.5, h2: -6, h3: -3 },
    ca2: { h1: -11 }
  }
}));

vi.mock('./9_emetteur_ch.js', () => ({
  calc_emetteur_ch: vi.fn()
}));

vi.mock('./9_generateur_ch.js', () => ({
  calc_generateur_ch: vi.fn(),
  checkForGeneratorType: vi.fn(),
  hasConsoForAuxDistribution: vi.fn()
}));

vi.mock('./13.2_generateur_combustion.js', () => ({
  tv_generateur_combustion: vi.fn()
}));

vi.mock('./13.2_generateur_combustion_ch.js', () => ({
  tv_temp_fonc_30_100: vi.fn()
}));

vi.mock('./enums.js', () => ({
  default: {
    classe_altitude: { 1: 'ca1', 2: 'ca2' },
    zone_climatique: { 1: 'h1a', 2: 'h2b', 3: 'h3c' }
  }
}));

const { default: calc_chauffage, tauxChargeForGenerator } = await import('./9_chauffage.js');
const { requestInput, tv, tvColumnIDs } = await import('./utils.js');
const { calc_emetteur_ch } = await import('./9_emetteur_ch.js');
const { calc_generateur_ch, checkForGeneratorType, hasConsoForAuxDistribution } = await import(
  './9_generateur_ch.js'
);
const { tv_generateur_combustion } = await import('./13.2_generateur_combustion.js');
const { tv_temp_fonc_30_100 } = await import('./13.2_generateur_combustion_ch.js');

/** calc_generateur_ch mocké : écrit des consommations déterministes. */
function stubGenerateur({ conso = 100, consoDep = 120, auxDistribution } = {}) {
  vi.mocked(calc_generateur_ch).mockImplementation((_dpe, gen) => {
    gen.donnee_intermediaire = gen.donnee_intermediaire || {};
    gen.donnee_intermediaire.conso_ch = conso;
    gen.donnee_intermediaire.conso_ch_depensier = consoDep;
    if (auxDistribution !== undefined) {
      gen.donnee_intermediaire.conso_auxiliaire_distribution_ch = auxDistribution;
    }
  });
}

/** Émetteur minimal. */
function emetteur(lien = '1') {
  return { donnee_entree: { enum_lien_generateur_emetteur_id: lien } };
}

/** Générateur minimal. */
function generateur(de = {}, di = {}) {
  return {
    donnee_entree: {
      enum_type_generateur_ch_id: '98',
      enum_lien_generateur_emetteur_id: '1',
      ...de
    },
    donnee_intermediaire: di
  };
}

/** Installation de chauffage minimale. */
function installation(gens, ems, deOverrides = {}) {
  return {
    donnee_entree: {
      surface_chauffee: 100,
      enum_cfg_installation_ch_id: '1',
      ...deOverrides
    },
    emetteur_chauffage_collection: { emetteur_chauffage: ems },
    generateur_chauffage_collection: { generateur_chauffage: gens }
  };
}

/** DPE minimal (enveloppe non exploitée ici, calc_generateur_ch mocké). */
const dpe = { logement: { enveloppe: {} } };

/** Appel standard de calc_chauffage. */
function appel(ch, overrides = {}) {
  const args = {
    ca_id: 1,
    zc_id: 1,
    inertie_id: 3,
    map_id: 2,
    bch: 1000,
    bch_dep: 1200,
    GV: 150,
    Sh: 100,
    hsp: 2.5,
    ac: 1,
    ilpa: 0,
    besoin_ch_mois: {},
    ...overrides
  };
  calc_chauffage(
    dpe,
    ch,
    args.ca_id,
    args.zc_id,
    args.inertie_id,
    args.map_id,
    args.bch,
    args.bch_dep,
    args.GV,
    args.Sh,
    args.hsp,
    args.ac,
    args.ilpa,
    args.besoin_ch_mois
  );
  return args;
}

beforeEach(() => {
  vi.mocked(requestInput).mockReset();
  vi.mocked(tv).mockReset();
  vi.mocked(tvColumnIDs).mockReset();
  vi.mocked(calc_emetteur_ch).mockReset();
  vi.mocked(calc_generateur_ch).mockReset();
  vi.mocked(checkForGeneratorType).mockReset();
  vi.mocked(hasConsoForAuxDistribution).mockReset();
  vi.mocked(tv_generateur_combustion).mockReset();
  vi.mocked(tv_temp_fonc_30_100).mockReset();

  // valeurs par défaut : générateur ni combustion ni PAC, pas d'auxiliaire
  vi.mocked(checkForGeneratorType).mockImplementation((_dpe, _de, _di, du) => {
    du.isCombustionGenerator = false;
  });
  vi.mocked(hasConsoForAuxDistribution).mockReturnValue(false);
  vi.mocked(requestInput).mockReturnValue('installation de chauffage simple');
  vi.mocked(tv).mockReturnValue({ facteur_couverture_solaire: '0.4' });
  stubGenerateur();
});

/**
 * 9. Consommation de chauffage — orchestration
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9
 */
describe('calc_chauffage - cas nominal (1 générateur, 1 émetteur)', () => {
  test('agrège les consommations et renseigne les données intermédiaires', () => {
    const ch = installation([generateur()], [emetteur('1')]);
    appel(ch);

    expect(ch.donnee_intermediaire).toStrictEqual({
      besoin_ch: 1000,
      besoin_ch_depensier: 1200,
      conso_ch: 100,
      conso_ch_depensier: 120
    });
    expect(ch.donnee_utilisateur.Pnominal).toBe(0);
    expect(calc_emetteur_ch).toHaveBeenCalledTimes(1);
    expect(checkForGeneratorType).toHaveBeenCalledTimes(1);
  });

  test('renseigne les valeurs par défaut du générateur (fch, ratios, surface)', () => {
    const ch = installation([generateur()], [emetteur('1')]);
    appel(ch);

    const genDe = ch.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree;
    // Fch issu de la table de couverture solaire (0.4)
    expect(genDe.fch).toBe(0.4);
    expect(genDe.ratio_virtualisation).toBe(1);
    expect(genDe.cle_repartition_ch).toBe(1);
    expect(genDe.nombre_niveau_installation_ch).toBe(1);
    expect(genDe.surface_chauffee).toBe(100);
  });

  test('conserve les valeurs déjà présentes sur le générateur', () => {
    const ch = installation([generateur()], [emetteur('1')], {});
    // valeurs propres sur l'installation
    ch.donnee_entree.ratio_virtualisation = 2;
    ch.donnee_entree.cle_repartition_ch = 3;
    ch.donnee_entree.nombre_niveau_installation_ch = 4;
    appel(ch);

    const genDe = ch.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree;
    expect(genDe.ratio_virtualisation).toBe(2);
    expect(genDe.cle_repartition_ch).toBe(3);
    expect(genDe.nombre_niveau_installation_ch).toBe(4);
  });

  test('prorata unitaire : le besoin complet est transmis au générateur', () => {
    const ch = installation([generateur()], [emetteur('1')]);
    appel(ch, { bch: 800 });
    // 6e argument de calc_generateur_ch = bch * prorata (= 800 * 1)
    expect(vi.mocked(calc_generateur_ch).mock.calls[0][5]).toBe(800);
  });
});

describe('calc_chauffage - mise à l’échelle du besoin selon la surface', () => {
  test('besoin ajusté au prorata surface_chauffee / Sh quand elles diffèrent', () => {
    const ch = installation([generateur()], [emetteur('1')]);
    ch.donnee_entree.surface_chauffee = 50;
    appel(ch, { bch: 1000, Sh: 100 });
    // bch mis à l'échelle : 1000 * 50 / 100 = 500 transmis au générateur
    expect(vi.mocked(calc_generateur_ch).mock.calls[0][5]).toBe(500);
  });

  test('surface d’installation absente : la surface habitable Sh sert de repli', () => {
    const ch = installation([generateur()], [emetteur('1')], { surface_chauffee: 0 });
    appel(ch, { Sh: 120 });
    // de.surface_chauffee falsy => genChDe.surface_chauffee = Sh
    expect(
      ch.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree.surface_chauffee
    ).toBe(120);
  });
});

describe('calc_chauffage - facteur de couverture solaire (Fch)', () => {
  test('facteur saisi directement pris tel quel', () => {
    const ch = installation([generateur()], [emetteur('1')]);
    ch.donnee_entree.fch_saisi = 0.7;
    appel(ch);
    expect(ch.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree.fch).toBe(0.7);
    expect(tv).not.toHaveBeenCalled();
  });

  test('facteur lu en table quand non saisi', () => {
    const ch = installation([generateur()], [emetteur('1')]);
    vi.mocked(tv).mockReturnValue({ facteur_couverture_solaire: '0.55' });
    appel(ch);
    expect(ch.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree.fch).toBe(0.55);
  });

  test('aucune ligne trouvée : Fch nul, repli sur 0.5 et message d’erreur', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ch = installation([generateur()], [emetteur('1')]);
    vi.mocked(tv).mockReturnValue(null);
    appel(ch);
    // Fch = null => genChDe.fch = null || 0.5
    expect(ch.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree.fch).toBe(0.5);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe('calc_chauffage - générateurs à combustion', () => {
  beforeEach(() => {
    vi.mocked(checkForGeneratorType).mockImplementation((_dpe, _de, _di, du) => {
      du.isCombustionGenerator = true;
    });
    vi.mocked(tvColumnIDs).mockReturnValue(['5']);
  });

  test('méthode de saisie ≠ 5 : recalcul des températures de fonctionnement', () => {
    const ch = installation(
      [generateur({ enum_type_generateur_ch_id: '5', enum_methode_saisie_carac_sys_id: '1' })],
      [emetteur('1')]
    );
    appel(ch);
    expect(tv_generateur_combustion).toHaveBeenCalled();
    expect(tv_temp_fonc_30_100).toHaveBeenCalled();
  });

  test('méthode 5 avec températures déjà connues : pas de recalcul', () => {
    const ch = installation(
      [
        generateur(
          { enum_type_generateur_ch_id: '5', enum_methode_saisie_carac_sys_id: '5' },
          { temp_fonc_30: 30, temp_fonc_100: 45 }
        )
      ],
      [emetteur('1')]
    );
    appel(ch);
    expect(tv_temp_fonc_30_100).not.toHaveBeenCalled();
  });

  test('méthode 5 mais temp_fonc_30 manquante : recalcul', () => {
    const ch = installation(
      [
        generateur(
          { enum_type_generateur_ch_id: '5', enum_methode_saisie_carac_sys_id: '5' },
          { temp_fonc_100: 45 }
        )
      ],
      [emetteur('1')]
    );
    appel(ch);
    expect(tv_temp_fonc_30_100).toHaveBeenCalled();
  });

  test('méthode 5 mais temp_fonc_100 manquante : recalcul', () => {
    const ch = installation(
      [
        generateur(
          { enum_type_generateur_ch_id: '5', enum_methode_saisie_carac_sys_id: '5' },
          { temp_fonc_30: 30 }
        )
      ],
      [emetteur('1')]
    );
    appel(ch);
    expect(tv_temp_fonc_30_100).toHaveBeenCalled();
  });

  test('type de générateur hors table temp_fonc_30 : pas de recalcul de températures', () => {
    const ch = installation(
      [generateur({ enum_type_generateur_ch_id: '99', enum_methode_saisie_carac_sys_id: '1' })],
      [emetteur('1')]
    );
    appel(ch);
    expect(tv_generateur_combustion).toHaveBeenCalled();
    expect(tv_temp_fonc_30_100).not.toHaveBeenCalled();
  });

  test('deux générateurs à combustion en cascade : prorata au prorata des puissances', () => {
    const gen1 = generateur({ enum_type_generateur_ch_id: '5' }, { pn: 3000 });
    const gen2 = generateur({ enum_type_generateur_ch_id: '5' }, { pn: 1000 });
    const ch = installation([gen1, gen2], [emetteur('1')], {
      enum_cfg_installation_ch_id: '1'
    });
    appel(ch, { bch: 1000 });

    // Pnominal = 4000 ; prorata gen1 = 3000/4000, gen2 = 1000/4000
    expect(ch.donnee_utilisateur.Pnominal).toBe(4000);
    expect(vi.mocked(calc_generateur_ch).mock.calls[0][5]).toBeCloseTo(750, 9);
    expect(vi.mocked(calc_generateur_ch).mock.calls[1][5]).toBeCloseTo(250, 9);
  });
});

describe('calc_chauffage - prorata entre générateurs', () => {
  test('configuration ≠ 1 : prorata neutre (1 / (0 || 1))', () => {
    const ch = installation([generateur()], [emetteur('1')], {
      enum_cfg_installation_ch_id: '2'
    });
    appel(ch, { bch: 900 });
    // nbCascadeForSameEmetteur = 0 => prorata = 1 / (0 || 1) = 1
    expect(vi.mocked(calc_generateur_ch).mock.calls[0][5]).toBe(900);
  });

  test('plusieurs émetteurs pour le même lien : pas de cascade (nbEmetteur ≠ 1)', () => {
    const ch = installation(
      [generateur({ enum_lien_generateur_emetteur_id: '1' })],
      [emetteur('1'), emetteur('1')],
      { enum_cfg_installation_ch_id: '1' }
    );
    appel(ch, { bch: 900 });
    // nbEmetteur = 2 => nbCascadeForSameEmetteur = 0 => prorata = 1
    expect(vi.mocked(calc_generateur_ch).mock.calls[0][5]).toBe(900);
  });

  test('générateur PAC hybride avec scop : part PAC (0.8 en zone H1)', () => {
    const gen = generateur({ enum_type_generateur_ch_id: '150' }, { scop: 3.5 });
    const ch = installation([gen], [emetteur('1')]);
    appel(ch, { bch: 1000, zc_id: 1 });
    // hybrideProrata h1 pac = 0.8
    expect(vi.mocked(calc_generateur_ch).mock.calls[0][5]).toBeCloseTo(800, 9);
  });

  test('générateur PAC hybride sans scop/cop : part chaudière (0.2 en zone H1)', () => {
    const gen = generateur({ enum_type_generateur_ch_id: '150' }, {});
    const ch = installation([gen], [emetteur('1')]);
    appel(ch, { bch: 1000, zc_id: 1 });
    // hybrideProrata h1 chaudiere = 0.2
    expect(vi.mocked(calc_generateur_ch).mock.calls[0][5]).toBeCloseTo(200, 9);
  });
});

describe('calc_chauffage - auxiliaires de distribution répartis', () => {
  test('répartition de la consommation d’auxiliaires sur les générateurs éligibles', () => {
    vi.mocked(hasConsoForAuxDistribution).mockReturnValue(true);
    stubGenerateur({ auxDistribution: 400 });

    const ch = installation(
      [
        generateur({ enum_type_generateur_ch_id: '110' }),
        generateur({ enum_type_generateur_ch_id: '110' })
      ],
      [emetteur('1')],
      { enum_cfg_installation_ch_id: '2' }
    );
    appel(ch);

    // 2 générateurs éligibles => 400 / 2 = 200 chacun
    const gens = ch.generateur_chauffage_collection.generateur_chauffage;
    expect(gens[0].donnee_intermediaire.conso_auxiliaire_distribution_ch).toBe(200);
    expect(gens[1].donnee_intermediaire.conso_auxiliaire_distribution_ch).toBe(200);
  });

  test('aucun auxiliaire de distribution : pas de division', () => {
    const ch = installation([generateur()], [emetteur('1')]);
    appel(ch);
    // conso_auxiliaire_distribution_ch non défini par le stub => aucune répartition
    expect(
      ch.generateur_chauffage_collection.generateur_chauffage[0].donnee_intermediaire
        .conso_auxiliaire_distribution_ch
    ).toBeUndefined();
  });
});

describe('calc_chauffage - initialisation défensive des données du générateur', () => {
  test('générateur sans donnee_utilisateur ni donnee_intermediaire initiales', () => {
    const gen = {
      donnee_entree: { enum_type_generateur_ch_id: '98', enum_lien_generateur_emetteur_id: '1' }
    };
    const ch = installation([gen], [emetteur('1')]);
    appel(ch);
    expect(gen.donnee_utilisateur.nbGenerateurCascade).toBe(1);
    expect(gen.donnee_intermediaire.conso_ch).toBe(100);
  });
});

/**
 * 13.2.1.2 Taux de charge des générateurs à combustion (cdimref)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.2
 */
describe('tauxChargeForGenerator - taux de charge des générateurs à combustion', () => {
  /** Installation avec un générateur à combustion. */
  function installCombustion(pnominal = 5000, rdim) {
    return {
      donnee_entree: { rdim },
      donnee_utilisateur: { Pnominal: pnominal },
      generateur_chauffage_collection: {
        generateur_chauffage: [{ donnee_utilisateur: { isCombustionGenerator: true } }]
      }
    };
  }

  test('maison : GV utilisé directement pour le calcul du taux de charge', () => {
    const install = installCombustion(5000);
    tauxChargeForGenerator([install], 200, 1, 1, 'maison');

    const gen = install.generateur_chauffage_collection.generateur_chauffage[0];
    // cdimref = Pn / (GV * (19 - tbase)) ; tbase = -9.5 (ca1/h1)
    expect(gen.donnee_utilisateur.cdimref).toBeCloseTo(5000 / (200 * (19 + 9.5)), 9);
    expect(gen.donnee_utilisateur.cdimrefDep).toBeCloseTo(5000 / (200 * (21 + 9.5)), 9);
  });

  test('immeuble : GV corrigé par le ratio de dimensionnement rdim', () => {
    const install = installCombustion(5000, 2);
    tauxChargeForGenerator([install], 200, 1, 1, 'immeuble');

    const gen = install.generateur_chauffage_collection.generateur_chauffage[0];
    const gvRatio = 200 * (1 / 2);
    expect(gen.donnee_utilisateur.cdimref).toBeCloseTo(5000 / (gvRatio * (19 + 9.5)), 9);
  });

  test('immeuble sans rdim : ratio de dimensionnement par défaut (1)', () => {
    const install = installCombustion(5000);
    tauxChargeForGenerator([install], 200, 1, 1, 'immeuble');

    const gen = install.generateur_chauffage_collection.generateur_chauffage[0];
    // rdim absent => GV_ratio = GV
    expect(gen.donnee_utilisateur.cdimref).toBeCloseTo(5000 / (200 * (19 + 9.5)), 9);
  });

  test('installation sans générateur à combustion : ignorée', () => {
    const installSans = {
      donnee_entree: {},
      donnee_utilisateur: {},
      generateur_chauffage_collection: {
        generateur_chauffage: [{ donnee_utilisateur: { isCombustionGenerator: false } }]
      }
    };
    // aucune erreur, aucune donnée de taux de charge écrite
    expect(() => tauxChargeForGenerator([installSans], 200, 1, 1, 'maison')).not.toThrow();
    expect(installSans.donnee_utilisateur.genCombustion).toBeUndefined();
  });
});
