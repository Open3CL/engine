import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `conso.js` :
 * - `enums` : libellés de type d'énergie / classe d'altitude / zone climatique ;
 * - `16_conso_eclairage` : consommation d'éclairage forcée à 1 kWh/m² (=> conso = Sh) ;
 * - `tvs` : seuils de classe DPE / GES contrôlés ;
 * - `tv` (utils) : lecture des réseaux de chaleur, retour maîtrisé.
 * Les tables internes du module (coef_ges, coef_cout, coef_ep...) ne sont pas mockées :
 * elles font partie du code testé.
 */
vi.mock('./enums.js', () => ({
  default: {
    type_energie: {
      1: 'électricité',
      2: 'gaz naturel',
      3: 'réseau de chauffage urbain',
      4: 'inconnu'
    },
    classe_altitude: { 1: 'inférieur à 400m', 2: 'supérieur à 800m' },
    zone_climatique: { 1: 'h1a', 2: 'h1b' }
  }
}));

vi.mock('./16_conso_eclairage.js', () => ({ default: vi.fn(() => 1) }));

vi.mock('./tv.js', () => ({
  default: {
    dpe_class_limit: {
      'inférieur à 400m': { 100: { A: 10, B: 20, C: 30, D: 40, E: 300, F: 400 } },
      'supérieur à 800m': {}
    },
    ges_class_limit: {
      'inférieur à 400m': { 100: { A: 1, B: 2, C: 3, D: 4, E: 60, F: 90 } },
      'supérieur à 800m': {}
    }
  }
}));

/** Mode bug_for_bug_compat piloté par les tests (export « live » du module utils mocké). */
const utilsState = vi.hoisted(() => ({ bugForBugCompat: false }));

/** Lecture des tables par défaut : réseau de chaleur "R1" connu, "R2" inconnu. */
const tvParDefaut = (table, matcher) => {
  if (matcher?.identifiant_reseau === 'R1') return { contenu_co2_acv: 0.15 };
  return null;
};

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  get bug_for_bug_compat() {
    return utilsState.bugForBugCompat;
  },
  tv: vi.fn((table, matcher) => tvParDefaut(table, matcher))
}));

const {
  default: calc_conso,
  classe_bilan_dpe,
  classe_emission_ges,
  getCoefKey,
  coef_ep,
  getCoefCout,
  coefCoutProrata,
  masqueEnergie,
  getAuxGenerationEcs,
  getRdimEcs,
  DATE_BAREME_COUT_2024,
  appointBijonction,
  coutBijonction,
  ARRETES_RESEAU_CHALEUR,
  COEF_GES_AUTRES_RESEAUX_CHALEUR,
  indexArreteReseauChaleur,
  getContenuCo2ReseauChaleur
} = await import('./conso.js');
const { tv } = await import('./utils.js');

/**
 * Classe énergétique (bilan DPE)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf
 */
describe('classe_bilan_dpe - seuils de classe énergétique', () => {
  test('consommation nulle (null) : aucune classe', () => {
    expect(classe_bilan_dpe(null, 1, 1, 100)).toBeNull();
  });

  // ca_id=1 => seuils personnalisés {A:10,B:20,C:30,D:40,E:300,F:400}
  test.each([
    [5, 'A'],
    [15, 'B'],
    [25, 'C'],
    [35, 'D'],
    [250, 'E'],
    [350, 'F'],
    [450, 'G']
  ])('seuils personnalisés : conso %s => classe %s', (conso, classe) => {
    expect(classe_bilan_dpe(conso, 1, 1, 100)).toBe(classe);
  });

  // ca_id=2 => seuils absents => valeurs par défaut
  test('valeurs par défaut A-D quand la table ne fournit pas de seuil', () => {
    expect(classe_bilan_dpe(50, 1, 2, 100)).toBe('A'); // < 70
    expect(classe_bilan_dpe(100, 1, 2, 100)).toBe('B'); // < 110
  });

  test('zone climatique standard : seuils E/F par défaut 330/420', () => {
    // zc_id=1 (h1a) non concernée par le cas montagne => 330/420
    expect(classe_bilan_dpe(300, 1, 2, 100)).toBe('E');
    expect(classe_bilan_dpe(400, 1, 2, 100)).toBe('F');
    expect(classe_bilan_dpe(500, 1, 2, 100)).toBe('G');
  });

  test('zone montagne (h1b, > 800m) : seuils E/F relevés à 390/500', () => {
    // zc_id=2 (h1b) + ca 'supérieur à 800m' => 390/500
    expect(classe_bilan_dpe(350, 2, 2, 100)).toBe('E');
    expect(classe_bilan_dpe(450, 2, 2, 100)).toBe('F');
    expect(classe_bilan_dpe(600, 2, 2, 100)).toBe('G');
  });
});

/**
 * Classe climat (émissions GES)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf
 */
describe('classe_emission_ges - seuils de classe climat', () => {
  test('émission nulle (null) : aucune classe', () => {
    expect(classe_emission_ges(null, 1, 1, 100)).toBeNull();
  });

  test.each([
    [0.5, 'A'],
    [1.5, 'B'],
    [2.5, 'C'],
    [3.5, 'D'],
    [55, 'E'],
    [70, 'F'],
    [95, 'G']
  ])('seuils personnalisés : émission %s => classe %s', (emission, classe) => {
    expect(classe_emission_ges(emission, 1, 1, 100)).toBe(classe);
  });

  test('valeurs par défaut A-D quand la table ne fournit pas de seuil', () => {
    expect(classe_emission_ges(3, 1, 2, 100)).toBe('A'); // < 6
    expect(classe_emission_ges(10, 1, 2, 100)).toBe('B'); // < 11
  });

  test('zone climatique standard : seuils E/F par défaut 70/100', () => {
    expect(classe_emission_ges(60, 1, 2, 100)).toBe('E');
    expect(classe_emission_ges(80, 1, 2, 100)).toBe('F');
    expect(classe_emission_ges(120, 1, 2, 100)).toBe('G');
  });

  test('zone montagne (h1b, > 800m) : seuils E/F relevés à 80/110', () => {
    expect(classe_emission_ges(70, 2, 2, 100)).toBe('E');
    expect(classe_emission_ges(90, 2, 2, 100)).toBe('F');
    expect(classe_emission_ges(120, 2, 2, 100)).toBe('G');
  });
});

/**
 * Construction de la clef de la table `coef_ges` pour l'électricité (dépend de l'usage).
 */
describe('getCoefKey - clef du coefficient GES', () => {
  test('énergie non électrique : le libellé est renvoyé tel quel', () => {
    expect(getCoefKey('gaz naturel', 'ch')).toBe('gaz naturel');
  });

  test("électricité : suffixe d'usage ajouté", () => {
    expect(getCoefKey('électricité', 'ch')).toBe('électricité ch');
    expect(getCoefKey('électricité', 'ecs')).toBe('électricité ecs');
  });

  test('électricité avec usage inconnu : erreur signalée mais clef construite', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(getCoefKey('électricité', 'xxx')).toBe('électricité xxx');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('xxx'));
    errorSpy.mockRestore();
  });
});

/** Fabrique un générateur de chauffage. */
function genCh(energieId, di, deExtra = {}) {
  return {
    donnee_entree: { enum_type_energie_id: energieId, ...deExtra },
    donnee_intermediaire: di
  };
}

/** Fabrique une installation de chauffage. */
function installCh(deExtra, gens) {
  return {
    donnee_entree: {
      enum_type_installation_id: '1',
      enum_methode_calcul_conso_id: '1',
      ...deExtra
    },
    generateur_chauffage_collection: { generateur_chauffage: gens }
  };
}

/** Fabrique un générateur ECS. */
function genEcs(energieId, di, deExtra = {}) {
  return {
    donnee_entree: { enum_type_energie_id: energieId, ...deExtra },
    donnee_intermediaire: di
  };
}

/** Fabrique une installation ECS. */
function installEcs(deExtra, gens) {
  return {
    donnee_entree: { ...deExtra },
    donnee_intermediaire: {},
    generateur_ecs_collection: { generateur_ecs: gens }
  };
}

const DATE_DPE = '2024-01-01';

describe('calc_conso - agrégation des consommations', () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test('chauffage électrique individuel : EF, EP (×1,9), GES et coût déterministes', () => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('1', { conso_ch: 1000, conso_ch_depensier: 1200 })
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);

    // EF : passe-plat (coefficient nul)
    expect(res.ef_conso.conso_ch).toBe(1000);
    // EP : coefficient électricité 1,9
    expect(res.ep_conso.ep_conso_ch).toBeCloseTo(1900, 9);
    // GES : coef_ges['électricité ch'] = 0,079
    expect(res.emission_ges.emission_ges_ch).toBeCloseTo(79, 9);
    // Coût : cout_electricite(1000) = 149 + 0,14066 * 1000
    expect(res.cout.cout_ch).toBeCloseTo(149 + 0.14066 * 1000, 9);
    // Classes calculées et injectées
    expect(res.ep_conso.classe_bilan_dpe).toBeDefined();
    expect(res.emission_ges.classe_emission_ges).toBeDefined();
    // Éclairage = calc_conso_eclairage(zc) * Sh = 1 * 100 (passe-plat EF)
    expect(res.ef_conso.conso_eclairage).toBe(100);
  });

  test('autoconsommation PV : GES de tous les postes et coût hors éclairage/froid/ventilation minorés (Tribu Calcul_batiment.cs l.1188 / l.1318)', () => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('1', { conso_ch: 1000, conso_ch_depensier: 1200 })
      ])
    ];
    // 25 % du chauffage et 50 % de l'éclairage autoconsommés
    const facteursAc = { ch: 0.75, eclairage: 0.5 };

    const brut = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    const net = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep, 1, 1, facteursAc);

    // EF / EP inchangées (la minoration EF/EP reste faite par ProductionENR.updateEfConso)
    expect(net.ef_conso).toStrictEqual(brut.ef_conso);
    expect(net.ep_conso.ep_conso_5_usages).toBeCloseTo(brut.ep_conso.ep_conso_5_usages, 9);
    // GES : 750 kWh × 0,079 ; éclairage 100 × 0,5 × coef
    expect(net.emission_ges.emission_ges_ch).toBeCloseTo(750 * 0.079, 9);
    expect(net.emission_ges.emission_ges_eclairage).toBeCloseTo(
      brut.emission_ges.emission_ges_eclairage * 0.5,
      9
    );
    // Coût : chauffage tarifé sur 750 kWh au lieu de 1000, éclairage tarifé brut
    expect(net.cout.cout_ch).toBeLessThan(brut.cout.cout_ch);
    expect(net.cout.cout_ch).toBeCloseTo(
      calc_conso(
        100,
        1,
        1,
        [],
        [
          installCh({ cle_repartition_ch: 1 }, [
            genCh('1', { conso_ch: 750, conso_ch_depensier: 900 })
          ])
        ],
        [],
        [],
        1,
        1,
        DATE_DPE,
        coef_ep
      ).cout.cout_ch,
      9
    );
    expect(net.cout.cout_eclairage).toBeCloseTo(brut.cout.cout_eclairage, 9);
  });

  test('autoconsommation PV : froid électrique minoré, froid non électrique non minoré', () => {
    const frElec = [
      {
        donnee_entree: { enum_type_energie_id: '1' },
        donnee_intermediaire: { conso_fr: 200, conso_fr_depensier: 250 }
      }
    ];
    const frGaz = [
      {
        donnee_entree: { enum_type_energie_id: '2' },
        donnee_intermediaire: { conso_fr: 200, conso_fr_depensier: 250 }
      }
    ];
    const facteursAc = { fr: 0.5 };

    const brutElec = calc_conso(100, 1, 1, [], [], [], frElec, 1, 1, DATE_DPE, coef_ep);
    const netElec = calc_conso(
      100,
      1,
      1,
      [],
      [],
      [],
      frElec,
      1,
      1,
      DATE_DPE,
      coef_ep,
      1,
      1,
      facteursAc
    );
    expect(netElec.emission_ges.emission_ges_fr).toBeCloseTo(
      brutElec.emission_ges.emission_ges_fr * 0.5,
      9
    );

    const brutGaz = calc_conso(100, 1, 1, [], [], [], frGaz, 1, 1, DATE_DPE, coef_ep);
    const netGaz = calc_conso(
      100,
      1,
      1,
      [],
      [],
      [],
      frGaz,
      1,
      1,
      DATE_DPE,
      coef_ep,
      1,
      1,
      facteursAc
    );
    expect(netGaz.emission_ges.emission_ges_fr).toBeGreaterThan(0);
    expect(netGaz.emission_ges.emission_ges_fr).toBe(brutGaz.emission_ges.emission_ges_fr);
  });

  test('sans facteurs d’autoconsommation : résultats identiques', () => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('1', { conso_ch: 1000, conso_ch_depensier: 1200 })
      ])
    ];
    const brut = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    const net = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep, 1, 1, {});
    expect(net).toStrictEqual(brut);
  });

  test('installation collective (méthode 2) : clé de répartition appliquée à conso et distribution', () => {
    const ch = [
      installCh(
        {
          cle_repartition_ch: 2,
          enum_type_installation_id: '2',
          enum_methode_calcul_conso_id: '2'
        },
        [
          genCh('1', {
            conso_ch: 1000,
            conso_ch_depensier: 1200,
            conso_auxiliaire_distribution_ch: 100
          })
        ]
      )
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);

    // conso_ch = 1000 * clé (2)
    expect(res.ef_conso.conso_ch).toBe(2000);
    // distribution = 100 * clé (2) (méthode 2 + clé présente)
    expect(res.ef_conso.conso_auxiliaire_distribution_ch).toBe(200);
  });

  test('chauffage individuel avec rdim reconstitué (issue #287) : clé appliquée à conso et aux. génération, pas à la distribution', () => {
    // § 17.2.2.2.2 : chauffage individuel, coef_IFC = 1 → Cch_ap = Clé_ap × Cch_immeuble
    const ch = [
      installCh({ cle_repartition_ch: 0.25, enum_methode_calcul_conso_id: '3' }, [
        genCh(
          '1',
          {
            conso_ch: 1000,
            conso_ch_depensier: 1200,
            conso_auxiliaire_generation_ch: 40,
            conso_auxiliaire_distribution_ch: 80
          },
          { rdim_reconstitue: true }
        )
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);

    expect(res.ef_conso.conso_ch).toBe(250);
    expect(res.ef_conso.conso_auxiliaire_generation_ch).toBe(10);
    // Distribution non proratisée, comme dans les sorties ADEME
    expect(res.ef_conso.conso_auxiliaire_distribution_ch).toBe(80);
  });

  test('chauffage individuel sans rdim reconstitué : clé ignorée (prorata chauffage)', () => {
    const ch = [
      installCh({ cle_repartition_ch: 0.25, enum_methode_calcul_conso_id: '3' }, [
        genCh('1', {
          conso_ch: 1000,
          conso_ch_depensier: 1200,
          conso_auxiliaire_generation_ch: 40
        })
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);

    expect(res.ef_conso.conso_ch).toBe(1000);
    expect(res.ef_conso.conso_auxiliaire_generation_ch).toBe(40);
  });

  test('chauffage individuel avec rdim reconstitué et clé nulle : repli sur le prorata chauffage, comme la conso', () => {
    // clé installation 0 et prorata 0 → clé générateur 0 → repli sur prorataChauffage (0)
    const ch = [
      installCh({ cle_repartition_ch: 0, enum_methode_calcul_conso_id: '3' }, [
        genCh(
          '1',
          { conso_ch: 1000, conso_ch_depensier: 1200, conso_auxiliaire_generation_ch: 40 },
          { rdim_reconstitue: true }
        )
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 0, DATE_DPE, coef_ep);

    expect(res.ef_conso.conso_ch).toBe(0);
    expect(res.ef_conso.conso_auxiliaire_generation_ch).toBe(0);
  });

  test('installation avec clé absente (non collective) : répartition = prorata chauffage', () => {
    const ch = [
      installCh(
        {
          cle_repartition_ch: 0,
          enum_type_installation_id: '1',
          enum_methode_calcul_conso_id: '3'
        },
        [
          genCh('1', {
            conso_ch: 1000,
            conso_ch_depensier: 1200,
            conso_auxiliaire_distribution_ch: 50
          })
        ]
      )
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);

    // clé 0 => prorataChauffage (1) ; distribution non multipliée (méthode 3)
    expect(res.ef_conso.conso_ch).toBe(1000);
    expect(res.ef_conso.conso_auxiliaire_distribution_ch).toBe(50);
  });

  test('clé de répartition nulle (prorata 0) : consommation de chauffage annulée', () => {
    // cle===1 => value.cle = prorataChauffage(0) ; type collectif => répartition = 0
    const ch = [
      installCh({ cle_repartition_ch: 1, enum_type_installation_id: '2' }, [
        genCh('1', { conso_ch: 1000, conso_ch_depensier: 1200 })
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 0, DATE_DPE, coef_ep);
    expect(res.ef_conso.conso_ch).toBe(0);
  });

  test('réseau de chaleur connu : le coefficient GES provient de la table réseau', () => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh(
          '3',
          { conso_ch: 1000, conso_ch_depensier: 1200 },
          { identifiant_reseau_chaleur: 'R1', date_arrete_reseau_chaleur: '2030-01-01' }
        )
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    // contenu_co2_acv = 0,15 (tv mocké) => émission = 1000 * 0,15
    expect(res.emission_ges.emission_ges_ch).toBeCloseTo(150, 9);
  });

  test('réseau de chaleur inconnu (identifiant sans ligne) : erreur signalée, facteur « autres réseaux » 0,385', () => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh(
          '3',
          { conso_ch: 1000, conso_ch_depensier: 1200 },
          { identifiant_reseau_chaleur: 'R2' }
        )
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('R2'));
    // Plus de repli sur 1 kgCO2/kWh (GES = consommation) : 1000 * 0,385
    expect(res.emission_ges.emission_ges_ch).toBeCloseTo(385, 9);
  });

  test('réseau de chaleur sans identifiant : coefficient GES forfaitaire 0,385', () => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('3', { conso_ch: 1000, conso_ch_depensier: 1200 })
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    // 1000 * 0,385
    expect(res.emission_ges.emission_ges_ch).toBeCloseTo(385, 9);
  });

  test("date d'arrêté réseau de chaleur invalide : aucune exception", () => {
    // date_arrete_reseau_chaleur = Symbol : ignorée (repli sur la date du DPE)
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh(
          '1',
          { conso_ch: 1000, conso_ch_depensier: 1200 },
          { date_arrete_reseau_chaleur: Symbol('invalide') }
        )
      ])
    ];

    // Ne doit pas lever
    expect(() => calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep)).not.toThrow();
  });

  test('énergie inconnue : coefficient GES par défaut de 1', () => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('4', { conso_ch: 1000, conso_ch_depensier: 1200 })
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    // coef_ges['inconnu'] absent => getGesCoeffForGenerateur renvoie 1 => émission = 1000
    expect(res.emission_ges.emission_ges_ch).toBeCloseTo(1000, 9);
  });

  test('coût du gaz naturel : trois paliers tarifaires couverts', () => {
    // Trois générateurs gaz avec des consommations dans chaque palier tarifaire
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('2', { conso_ch: 3000, conso_ch_depensier: 3000 }), // < 5009
        genCh('2', { conso_ch: 30000, conso_ch_depensier: 30000 }), // < 50055
        genCh('2', { conso_ch: 60000, conso_ch_depensier: 60000 }) // else
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    // Somme des trois paliers : 0,11121*3000 + (230+0,06533*30000) + (415+0,06164*60000)
    const attendu = 0.11121 * 3000 + (230 + 0.06533 * 30000) + (415 + 0.06164 * 60000);
    expect(res.cout.cout_ch).toBeCloseTo(attendu, 6);
  });

  test("coût de l'électricité : cinq paliers tarifaires couverts", () => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('1', { conso_ch: 500, conso_ch_depensier: 500 }), // < 1000
        genCh('1', { conso_ch: 1500, conso_ch_depensier: 1500 }), // < 2500
        genCh('1', { conso_ch: 3000, conso_ch_depensier: 3000 }), // < 5000
        genCh('1', { conso_ch: 10000, conso_ch_depensier: 10000 }), // < 15000
        genCh('1', { conso_ch: 20000, conso_ch_depensier: 20000 }) // else
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    const attendu =
      0.29007 * 500 +
      (149 + 0.14066 * 1500) +
      (122 + 0.15176 * 3000) +
      (94 + 0.15735 * 10000) +
      (56 + 0.15989 * 20000);
    expect(res.cout.cout_ch).toBeCloseTo(attendu, 6);
  });

  test('ECS collective (prorataECS=1) : clé de répartition = clé × rdim', () => {
    const ecs = [
      installEcs({ cle_repartition_ecs: 2, rdim: 3 }, [
        genEcs('1', { conso_ecs: 100, conso_ecs_depensier: 120 })
      ])
    ];

    const res = calc_conso(100, 1, 1, [], [], ecs, [], 1, 1, DATE_DPE, coef_ep);
    // clé = 2 * 3 = 6 => conso_ecs = 100 * 6
    expect(res.ef_conso.conso_ecs).toBe(600);
  });

  test('ECS collective en immeuble, rdim neutralisé (11_ecs.js) : conso non remultipliée par rdim', () => {
    const inst = installEcs({ cle_repartition_ecs: 2, rdim: 22 }, [
      genEcs('1', { conso_ecs: 100, conso_ecs_depensier: 120 })
    ]);
    inst.donnee_intermediaire.rdim_neutralise = true;

    const res = calc_conso(100, 1, 1, [], [], [inst], [], 1, 1, DATE_DPE, coef_ep);
    // clé = 2 × 1 (rdim neutralisé) => conso_ecs = 100 × 2
    expect(inst.generateur_ecs_collection.generateur_ecs[0].donnee_entree.cle_repartition_ecs).toBe(
      2
    );
    expect(res.ef_conso.conso_ecs).toBe(200);
  });

  test('ECS avec prorataECS différent de 1 : clé issue du prorata', () => {
    // Quand prorataECS !== 1, la boucle ECS ne renseigne pas donnee_utilisateur :
    // on la fournit en amont (coefficient GES déjà connu) pour refléter les données réelles.
    const gen = genEcs('1', { conso_ecs: 100, conso_ecs_depensier: 120 });
    gen.donnee_utilisateur = { coeffEmissionGes: 0.065 };
    const ecs = [installEcs({}, [gen])];

    const res = calc_conso(100, 1, 1, [], [], ecs, [], 0.5, 1, DATE_DPE, coef_ep);
    // clé absente => prorataECS (0,5) => conso_ecs = 100 * 0,5
    expect(res.ef_conso.conso_ecs).toBe(50);
  });

  test('ECS sans clé ni rdim, énergie non renseignée : valeurs de repli (1 et électricité)', () => {
    // cle_repartition_ecs et rdim absents => 1 ; enum_type_energie_id absent => électricité (id 1)
    const ecs = [installEcs({}, [genEcs(undefined, { conso_ecs: 100, conso_ecs_depensier: 120 })])];

    const res = calc_conso(100, 1, 1, [], [], ecs, [], 1, 1, DATE_DPE, coef_ep);
    // clé = 1 * 1 => conso_ecs = 100 ; EP électricité => 100 * 1,9
    expect(res.ef_conso.conso_ecs).toBe(100);
    expect(res.ep_conso.ep_conso_ecs).toBeCloseTo(190, 9);
  });

  test.each([
    ['absente', undefined],
    ['nulle', null],
    ['non tabulaire', { installation_ecs: [] }]
  ])('collection ECS %s : traitée comme une liste vide', (_libelle, ecs) => {
    const chFixture = () => [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('1', { conso_ch: 1000, conso_ch_depensier: 1200 })
      ])
    ];

    const res = calc_conso(100, 1, 1, [], chFixture(), ecs, [], 1, 1, DATE_DPE, coef_ep);

    // Identique à un appel avec une collection ECS vide : aucune conso ni auxiliaire d'ECS
    expect(res).toEqual(calc_conso(100, 1, 1, [], chFixture(), [], [], 1, 1, DATE_DPE, coef_ep));
    expect(res.ef_conso.conso_ecs).toBe(0);
    expect(res.ef_conso.conso_auxiliaire_distribution_ecs).toBe(0);
  });

  test('ventilation et froid : auxiliaires et froid agrégés par énergie', () => {
    const vt = [
      {
        donnee_entree: { cle_repartition_ventilation: 2 },
        donnee_intermediaire: { conso_auxiliaire_ventilation: 20 }
      },
      // conso absente => 0 ; pas de clé de répartition
      { donnee_entree: {}, donnee_intermediaire: {} }
    ];
    const fr = [
      {
        donnee_entree: { enum_type_energie_id: '1' },
        donnee_intermediaire: { conso_fr: 200, conso_fr_depensier: 250 }
      }
    ];

    const res = calc_conso(100, 1, 1, vt, [], [], fr, 1, 1, DATE_DPE, coef_ep);

    // ventilation : 20 * 2 (clé) + 0 = 40
    expect(res.ef_conso.conso_auxiliaire_ventilation).toBe(40);
    expect(res.ef_conso.conso_fr).toBe(200);
    // sortie par énergie pour l'électricité
    const elec = res.sortie_par_energie_collection.sortie_par_energie.find(
      (e) => e.enum_type_energie_id === '1'
    );
    expect(elec.conso_ch).toBeDefined();
  });

  test('sortie par énergie : électricité ajoutée même en son absence', () => {
    // Seul le gaz est présent => l'électricité (id 1) est tout de même ajoutée
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('2', { conso_ch: 1000, conso_ch_depensier: 1200 })
      ])
    ];

    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    const ids = res.sortie_par_energie_collection.sortie_par_energie.map(
      (e) => e.enum_type_energie_id
    );
    expect(ids).toContain('2');
    expect(ids).toContain('1');
  });
});

/**
 * Ligne « électricité » de sortie_par_energie (issue #34).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15, §16.2 ; arrêté DPE habitation du 31/03/2021 §3.a, §4.a
 */
describe('sortie_par_energie - ligne électricité (issue #34)', () => {
  const elecDe = (res) =>
    res.sortie_par_energie_collection.sortie_par_energie.find(
      (e) => e.enum_type_energie_id === '1'
    );

  /** Chaudière gaz avec auxiliaires de génération et de distribution (électriques). */
  const chGaz = () => [
    installCh({ cle_repartition_ch: 1 }, [
      genCh('2', {
        conso_ch: 10000,
        conso_ch_depensier: 12000,
        conso_auxiliaire_generation_ch: 100,
        conso_auxiliaire_distribution_ch: 50
      })
    ])
  ];

  test('chaudière gaz : auxiliaires rattachés à l’électricité, GES = Σ postes × coefficient par usage', () => {
    const res = calc_conso(100, 1, 1, [], chGaz(), [], [], 1, 1, DATE_DPE, coef_ep);
    const elec = elecDe(res);

    // Pas de chauffage électrique ; éclairage = 1 × Sh = 100 ; auxiliaires = 100 + 50
    expect(elec.conso_ch).toBe(0);
    expect(elec.conso_5_usages).toBeCloseTo(100 + 150, 9);
    // 100 × 0,069 (éclairage) + 150 × 0,064 (auxiliaires)
    expect(elec.emission_ges_5_usages).toBeCloseTo(100 * 0.069 + 150 * 0.064, 9);
    // La ligne gaz ne porte plus les auxiliaires
    const gaz = res.sortie_par_energie_collection.sortie_par_energie.find(
      (e) => e.enum_type_energie_id === '2'
    );
    expect(gaz.conso_5_usages).toBeCloseTo(10000, 9);
  });

  test('somme des lignes par énergie = totaux 5 usages (EF et GES)', () => {
    const ecs = [installEcs({}, [genEcs('1', { conso_ecs: 1000, conso_ecs_depensier: 1100 })])];
    const vt = [{ donnee_entree: {}, donnee_intermediaire: { conso_auxiliaire_ventilation: 40 } }];
    const res = calc_conso(100, 1, 1, vt, chGaz(), ecs, [], 1, 1, DATE_DPE, coef_ep);
    const lignes = res.sortie_par_energie_collection.sortie_par_energie;
    const somme = (k) => lignes.reduce((acc, l) => acc + l[k], 0);

    expect(somme('conso_5_usages')).toBeCloseTo(res.ef_conso.conso_5_usages, 9);
    expect(somme('emission_ges_5_usages')).toBeCloseTo(res.emission_ges.emission_ges_5_usages, 9);
    // ECS électrique au coefficient ECS (0,065)
    expect(elecDe(res).emission_ges_ecs).toBeCloseTo(1000 * 0.065, 9);
  });

  test('froid : électrique compté dans la ligne électricité, réseau de froid exclu', () => {
    const frElec = [
      { donnee_entree: { enum_type_energie_id: '1' }, donnee_intermediaire: { conso_fr: 200 } }
    ];
    const frReseau = [
      { donnee_entree: { enum_type_energie_id: '3' }, donnee_intermediaire: { conso_fr: 200 } }
    ];
    const avecElec = elecDe(calc_conso(100, 1, 1, [], [], [], frElec, 1, 1, DATE_DPE, coef_ep));
    const avecReseau = elecDe(calc_conso(100, 1, 1, [], [], [], frReseau, 1, 1, DATE_DPE, coef_ep));

    expect(avecElec.conso_5_usages).toBeCloseTo(100 + 200, 9);
    expect(avecElec.emission_ges_5_usages).toBeCloseTo(100 * 0.069 + 200 * 0.064, 9);
    expect(avecReseau.conso_5_usages).toBeCloseTo(100, 9);
  });

  test('autoconsommation PV : ligne électricité nette, usage par usage', () => {
    const facteursAc = { eclairage: 0.5, auxiliaire_generation_ch: 0.8 };
    const net = elecDe(
      calc_conso(100, 1, 1, [], chGaz(), [], [], 1, 1, DATE_DPE, coef_ep, 1, 1, facteursAc)
    );

    // éclairage 100 × 0,5 ; génération 100 × 0,8 ; distribution 50 inchangée
    expect(net.conso_5_usages).toBeCloseTo(50 + 80 + 50, 9);
    expect(net.emission_ges_5_usages).toBeCloseTo(50 * 0.069 + (80 + 50) * 0.064, 9);
  });

  test('aucune émission NaN sur la ligne électricité', () => {
    const res = calc_conso(100, 1, 1, [], chGaz(), [], [], 1, 1, DATE_DPE, coef_ep);
    for (const ligne of res.sortie_par_energie_collection.sortie_par_energie) {
      expect(Number.isFinite(ligne.emission_ges_5_usages)).toBe(true);
    }
  });
});

/**
 * Barème des prix des énergies selon la date d'établissement du DPE.
 * Barème 2021 : Annexe 7 de l'arrêté du 31/03/2021.
 * Barème mis à jour (DPE à partir du 01/07/2024) : valeurs calées sur les sorties Tribu (CSTB)
 * des autotests et sur les DPE publiés par l'ADEME (dataset dpe03existant), reproduites à ±1 €.
 */
describe('getCoefCout - sélection du barème par date de DPE', () => {
  test('date de bascule : 01/07/2024', () => {
    expect(DATE_BAREME_COUT_2024).toBe('2024-07-01');
  });

  test('DPE établi avant le 01/07/2024 : barème 2021 inchangé', () => {
    const coef = getCoefCout('2024-06-30');
    // Annexe 7 : électricité 1000 kWh => 149 + 0,14066 × 1000
    expect(coef['électricité ch'](1000)).toBeCloseTo(149 + 0.14066 * 1000, 9);
    expect(coef['gaz naturel'](3000)).toBeCloseTo(0.11121 * 3000, 9);
    expect(coef['fioul domestique']).toBe(0.09142);
    expect(coef.propane).toBe(0.14305);
  });

  test.each(['2024-07-01', '2025-12-31', '2026-01-15'])(
    'DPE établi le %s : barème mis à jour',
    (date) => {
      const coef = getCoefCout(date);
      // Tribu / ADEME : électricité 1000 kWh => 158 + 0,18954 × 1000
      expect(coef['électricité ch'](1000)).toBeCloseTo(158 + 0.18954 * 1000, 9);
    }
  );

  test('barème mis à jour : prix unitaires constants (fioul, propane, bois, réseau...)', () => {
    const coef = getCoefCout('2026-01-15');
    // Tribu : fioul 0,1482 €/kWh ; propane 0,1567 €/kWh (constants quelle que soit la conso)
    expect(coef['fioul domestique']).toBe(0.14821);
    expect(coef.propane).toBe(0.15672);
    expect(coef.gpl).toBe(0.15672);
    expect(coef.butane).toBe(0.23429);
    expect(coef.charbon).toBe(0.02787);
    expect(coef['réseau de chauffage urbain']).toBe(0.08921);
    expect(coef['bois – granulés (pellets) ou briquettes']).toBe(0.09897);
    expect(coef['bois – bûches']).toBe(0.042);
    expect(coef['bois – plaquettes forestières']).toBe(0.042);
    expect(coef['bois – plaquettes d’industrie']).toBe(0.042);
  });

  test.each([
    // [conso, coût attendu] électricité, une valeur par tranche + limites
    [500, 0.34721 * 500],
    [999.99, 0.34721 * 999.99],
    [1000, 158 + 0.18954 * 1000],
    [2499.99, 158 + 0.18954 * 2499.99],
    [2500, 158 + 0.18949 * 2500],
    [4999.99, 158 + 0.18949 * 4999.99],
    [5000, 119 + 0.19726 * 5000],
    [14999.99, 119 + 0.19726 * 14999.99],
    [15000, 78 + 0.20001 * 15000],
    [20000, 78 + 0.20001 * 20000]
  ])('barème mis à jour - électricité %s kWh => %s €', (conso, attendu) => {
    const coef = getCoefCout('2026-01-15');
    [
      'électricité ch',
      'électricité ecs',
      'électricité fr',
      'électricité éclairage',
      'électricité auxiliaire',
      "électricité d'origine renouvelable utilisée dans le bâtiment"
    ].forEach((cle) => expect(coef[cle](conso)).toBeCloseTo(attendu, 9));
  });

  test.each([
    // [conso, coût attendu] gaz naturel, une valeur par tranche + limites
    [3000, 0.1312 * 3000],
    [5008.99, 0.1312 * 5008.99],
    [5009, 182 + 0.09488 * 5009],
    [50054.99, 182 + 0.09488 * 50054.99],
    [50055, 288 + 0.09274 * 50055],
    [100000, 288 + 0.09274 * 100000]
  ])('barème mis à jour - gaz naturel %s kWh => %s €', (conso, attendu) => {
    expect(getCoefCout('2026-01-15')['gaz naturel'](conso)).toBeCloseTo(attendu, 9);
  });
});

describe("masqueEnergie / coefCoutProrata - tranche sur la conso totale de l'énergie", () => {
  test('masque électricité : clés électriques conservées, autres énergies annulées', () => {
    const masque = masqueEnergie('électricité');
    expect(masque['électricité ch'](10)).toBe(10);
    expect(masque['électricité auxiliaire'](10)).toBe(10);
    expect(masque['gaz naturel'](10)).toBe(0);
    expect(masque['réseau de chauffage urbain'](10)).toBe(0);
    expect(masque["électricité d'origine renouvelable utilisée dans le bâtiment"](10)).toBe(0);
    expect(masque['électricité']).toBeUndefined();
  });

  test('aucune consommation : prix moyen nul', () => {
    const coef = coefCoutProrata(
      getCoefCout('2026-01-15'),
      () => ({ total: 0, collectif: 0 }),
      1,
      new Set()
    );
    expect(coef['électricité ch'](100)).toBe(0);
    expect(coef['gaz naturel'](100)).toBe(0);
    // Prix constants conservés
    expect(coef['fioul domestique']).toBe(0.14821);
  });
});

describe('calc_conso - coût avec le barème mis à jour (DPE 2026)', () => {
  const DATE_DPE_2026 = '2026-01-15';
  let errorSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test('DPE antérieur au 01/07/2024 : coût par poste au barème 2021 (inchangé)', () => {
    const ch = [installCh({}, [genCh('1', { conso_ch: 3000, conso_ch_depensier: 3000 })])];
    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, '2024-06-30', coef_ep);
    // Chauffage tarifé seul : 122 + 0,15176 × 3000 ; éclairage seul : 0,29007 × 100
    expect(res.cout.cout_ch).toBeCloseTo(122 + 0.15176 * 3000, 9);
    expect(res.cout.cout_eclairage).toBeCloseTo(0.29007 * 100, 9);
  });

  test('maison tout électrique : tranche sur la conso électrique totale, coût réparti au prorata', () => {
    const ch = [installCh({}, [genCh('1', { conso_ch: 3000, conso_ch_depensier: 3000 })])];
    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE_2026, coef_ep);
    // Conso élec totale = 3000 (ch) + 100 (éclairage = 1 × Sh) = 3100 kWh
    const total = 158 + 0.18949 * 3100;
    expect(res.cout.cout_5_usages).toBeCloseTo(total, 9);
    expect(res.cout.cout_ch).toBeCloseTo((total * 3000) / 3100, 9);
    expect(res.cout.cout_eclairage).toBeCloseTo((total * 100) / 3100, 9);
  });

  test('maison gaz + électricité : chaque énergie tarifée sur sa propre conso totale', () => {
    const ch = [installCh({}, [genCh('2', { conso_ch: 8000, conso_ch_depensier: 8000 })])];
    const ecs = [installEcs({}, [genEcs('2', { conso_ecs: 2000, conso_ecs_depensier: 2000 })])];
    const res = calc_conso(100, 1, 1, [], ch, ecs, [], 1, 1, DATE_DPE_2026, coef_ep);
    // Gaz total 10000 kWh => 182 + 0,09488 × 10000 ; élec (éclairage) 100 kWh => 0,34721 × 100
    const gaz = 182 + 0.09488 * 10000;
    expect(res.cout.cout_ch).toBeCloseTo((gaz * 8000) / 10000, 9);
    expect(res.cout.cout_ecs).toBeCloseTo((gaz * 2000) / 10000, 9);
    expect(res.cout.cout_eclairage).toBeCloseTo(0.34721 * 100, 9);
  });

  test('immeuble à chauffage individuel : barème appliqué par logement (N × f(C / N))', () => {
    const ch = [installCh({}, [genCh('1', { conso_ch: 8000, conso_ch_depensier: 8000 })])];
    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE_2026, coef_ep, 4);
    // Élec totale 8100 kWh pour 4 logements : 4 × f(2025) = 4 × (158 + 0,18954 × 2025)
    expect(res.cout.cout_5_usages).toBeCloseTo(4 * (158 + 0.18954 * 2025), 9);
  });

  test('immeuble à installations collectives : chauffage / ECS collectifs tarifés sur leur total', () => {
    const ch = [
      installCh({ enum_type_installation_id: '2' }, [
        genCh('2', { conso_ch: 60000, conso_ch_depensier: 60000 })
      ])
    ];
    const ecs = [
      installEcs({ enum_type_installation_id: '2' }, [
        genEcs('1', { conso_ecs: 4000, conso_ecs_depensier: 4000 })
      ])
    ];
    const res = calc_conso(100, 1, 1, [], ch, ecs, [], 1, 1, DATE_DPE_2026, coef_ep, 4);
    // Gaz collectif 60000 kWh => 288 + 0,09274 × 60000 (pas de division par logement)
    expect(res.cout.cout_ch).toBeCloseTo(288 + 0.09274 * 60000, 9);
    // ECS élec collective 4000 kWh => 158 + 0,18949 × 4000
    expect(res.cout.cout_ecs).toBeCloseTo(158 + 0.18949 * 4000, 9);
    // Éclairage (usage individuel) 100 kWh / 4 logements => 4 × 0,34721 × 25
    expect(res.cout.cout_eclairage).toBeCloseTo(4 * 0.34721 * 25, 9);
  });

  test("immeuble, ECS sans type d'installation : considérée individuelle", () => {
    const ecs = [installEcs({}, [genEcs('1', { conso_ecs: 4000, conso_ecs_depensier: 4000 })])];
    const res = calc_conso(100, 1, 1, [], [], ecs, [], 1, 1, DATE_DPE_2026, coef_ep, 4);
    // Élec totale 4100 kWh / 4 logements => 4 × (158 + 0,18954 × 1025)
    expect(res.cout.cout_5_usages).toBeCloseTo(4 * (158 + 0.18954 * 1025), 9);
  });

  /**
   * Appartement desservi par une installation collective : tranche déterminée sur la conso de
   * l'immeuble extrapolée (C × k, k = SH_immeuble / SH_logement), coût ramené au logement (÷ k).
   * @see Moteur_DPE.dll (CSTB) Calcul_cout.cs l.133-136 / l.152-154 ; autotests APP5-0-5x, APP3-0-2.
   */
  test('appartement, chauffage gaz collectif : tranche sur la conso extrapolée à l’immeuble', () => {
    const ch = [
      installCh({ enum_type_installation_id: '2' }, [
        genCh('2', { conso_ch: 4000, conso_ch_depensier: 4000 })
      ])
    ];
    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE_2026, coef_ep, 1, 20);
    // 4000 × 20 = 80000 kWh (> 50000) => (288 + 0,09274 × 80000) / 20 = 0,0965 €/kWh × 4000
    expect(res.cout.cout_ch).toBeCloseTo((288 + 0.09274 * 80000) / 20, 9);
    // Sans extrapolation, le logement serait tarifé en 1ʳᵉ tranche (0,1312 × 4000 = 524,8 €).
    expect(res.cout.cout_ch).not.toBeCloseTo(0.1312 * 4000, 0);
    // Éclairage (usage individuel) : tarifé sur la seule conso du logement (100 kWh).
    expect(res.cout.cout_eclairage).toBeCloseTo(0.34721 * 100, 9);
  });

  test('appartement, ECS électrique collective : tranche élec sur la conso extrapolée', () => {
    const ecs = [
      installEcs({ enum_type_installation_id: '2' }, [
        genEcs('1', { conso_ecs: 1400, conso_ecs_depensier: 1400 })
      ])
    ];
    const res = calc_conso(100, 1, 1, [], [], ecs, [], 1, 1, DATE_DPE_2026, coef_ep, 1, 10);
    // 1400 × 10 = 14000 kWh => (119 + 0,19726 × 14000) / 10
    expect(res.cout.cout_ecs).toBeCloseTo((119 + 0.19726 * 14000) / 10, 9);
  });

  test('appartement, installations individuelles : ratio de surface sans effet', () => {
    const ch = [installCh({}, [genCh('2', { conso_ch: 4000, conso_ch_depensier: 4000 })])];
    const res = calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE_2026, coef_ep, 1, 20);
    expect(res.cout.cout_ch).toBeCloseTo(0.1312 * 4000, 9);
  });
});

describe('coefCoutProrata - ratio de surface des installations collectives', () => {
  test('ratio ≤ 1 : neutre (tarif sur la conso collective seule)', () => {
    const base = getCoefCout('2026-01-15');
    const consoGroupe = () => ({ total: 4000, collectif: 4000 });
    [undefined, 1, 0.5].forEach((ratio) => {
      const coef = coefCoutProrata(base, consoGroupe, 1, new Set(['g']), ratio);
      const coll = Object.getOwnPropertySymbols(coef).map((s) => coef[s])[0].coef;
      expect(coll['gaz naturel'](4000)).toBeCloseTo(0.1312 * 4000, 9);
    });
  });
});

/**
 * Auxiliaires de génération ECS : multipliés par le rdim de l'installation (comme la conso ECS).
 * @see Moteur_DPE.dll Calcul_batiment.cs l.660 (Qcirc_ecs1 += Qcirc × Rdim) ; autotests IC-echantillon-gaz.
 */
describe('getAuxGenerationEcs - auxiliaires de génération ECS et rdim', () => {
  const coefUnitaire = { 'électricité auxiliaire': 1 };
  const inst = (rdim, ...consos) =>
    installEcs(
      rdim === undefined ? {} : { rdim },
      consos.map((c) =>
        genEcs('1', {
          conso_auxiliaire_generation_ecs: c,
          conso_auxiliaire_generation_ecs_depensier: 2 * c
        })
      )
    );

  test('installation dimensionnée (rdim 3,25) : auxiliaires × rdim à l’échelle du DPE', () => {
    const ecs = [inst(3.25, 2.74, 2.97), inst(undefined, 10)];
    // (2,74 + 2,97) × 3,25 + 10 × 1
    expect(
      getAuxGenerationEcs(ecs, 'conso_auxiliaire_generation_ecs', coefUnitaire, 1)
    ).toBeCloseTo((2.74 + 2.97) * 3.25 + 10, 9);
    expect(
      getAuxGenerationEcs(ecs, 'conso_auxiliaire_generation_ecs_depensier', coefUnitaire, 1)
    ).toBeCloseTo(2 * ((2.74 + 2.97) * 3.25 + 10), 9);
  });

  test('appartement proratisé (prorataECS ≠ 1) : rdim non appliqué', () => {
    const ecs = [inst(3.25, 4)];
    expect(getAuxGenerationEcs(ecs, 'conso_auxiliaire_generation_ecs', coefUnitaire, 0.4)).toBe(4);
  });

  test('rdim non numérique ou générateur sans conso : neutre', () => {
    const ecs = [inst('abc', 4), installEcs({ rdim: 2 }, [genEcs('1', {})])];
    expect(getAuxGenerationEcs(ecs, 'conso_auxiliaire_generation_ecs', coefUnitaire, 1)).toBe(4);
  });

  test('installation ECS collective en immeuble (rdim neutralisé) : auxiliaires non multipliés', () => {
    const collective = inst(22, 4);
    collective.donnee_intermediaire.rdim_neutralise = true;
    const ecs = [collective, inst(3, 1)];
    // 4 × 1 (rdim neutralisé) + 1 × 3
    expect(getAuxGenerationEcs(ecs, 'conso_auxiliaire_generation_ecs', coefUnitaire, 1)).toBe(7);
  });

  test('calc_conso : auxiliaire_generation_ecs intègre le rdim', () => {
    const ecs = [inst(2, 5)];
    const res = calc_conso(100, 1, 1, [], [], ecs, [], 1, 1, DATE_DPE, coef_ep);
    const sansRdim = calc_conso(
      100,
      1,
      1,
      [],
      [],
      [inst(undefined, 5)],
      [],
      1,
      1,
      DATE_DPE,
      coef_ep
    );
    expect(res.ef_conso.conso_auxiliaire_generation_ecs).toBeCloseTo(
      2 * sansRdim.ef_conso.conso_auxiliaire_generation_ecs,
      9
    );
    expect(res.ef_conso.conso_auxiliaire_generation_ecs).toBeGreaterThan(0);
  });
});

/**
 * Rdim appliqué à la conso ECS lors de l'agrégation : 1 si le besoin n'a pas été divisé par rdim.
 * @see Moteur_DPE.dll Calcul_batiment.cs l.1067
 */
describe('getRdimEcs', () => {
  test.each([
    ['rdim renseigné', { rdim: 3 }, {}, 3],
    ['rdim chaîne', { rdim: '2.5' }, {}, 2.5],
    ['rdim absent', {}, {}, 1],
    ['rdim non numérique', { rdim: 'abc' }, {}, 1],
    ['rdim neutralisé', { rdim: 22 }, { rdim_neutralise: true }, 1],
    ['sans donnée intermédiaire', { rdim: 4 }, undefined, 4]
  ])('%s', (_libelle, de, di, attendu) => {
    expect(getRdimEcs({ donnee_entree: de, donnee_intermediaire: di })).toBe(attendu);
  });
});

/**
 * Convecteurs bi-jonction (§9.1.6) : base (60 %) facturée en électricité collective, appoint
 * individuel (40 %) en électricité individuelle.
 * @see Moteur_DPE.dll (CSTB) Calcul_batiment.cs l.861-872 / l.912-915, Calcul_cout.cs l.149-172 ;
 * autotests APP3-0-1 (base 1541 kWh → 311 €, appoint 858 kWh → 197 €) et IC1-0-5.
 */
describe('calc_conso - coût des convecteurs bi-jonction (base collective + appoint individuel)', () => {
  const DATE_DPE_2026 = '2026-01-15';
  let errorSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  /** Installation bi-jonction (type 4) : conso totale 2400 kWh dont 900 kWh d'appoint. */
  const bijonction = (typeInstallation = '4') => [
    installCh({ enum_type_installation_id: typeInstallation }, [
      {
        ...genCh('1', { conso_ch: 2400, conso_ch_depensier: 4800 }),
        donnee_utilisateur: {
          conso_ch_appoint_bijonction: 900,
          conso_ch_appoint_bijonction_depensier: 1800
        }
      }
    ])
  ];

  test('appartement : base tarifée sur la tranche de l’immeuble, appoint avec les usages individuels', () => {
    const res = calc_conso(
      100,
      1,
      1,
      [],
      bijonction(),
      [],
      [],
      1,
      1,
      DATE_DPE_2026,
      coef_ep,
      1,
      20
    );
    // Base 1500 kWh × 20 = 30000 kWh (≥ 15000) => (78 + 0,20001 × 30000) / 20
    const base = (78 + 0.20001 * 30000) / 20;
    // Individuel : appoint 900 + éclairage 100 = 1000 kWh (tranche 1000-2500) au prorata
    const indiv = 158 + 0.18954 * 1000;
    expect(res.cout.cout_ch).toBeCloseTo(base + (indiv * 900) / 1000, 9);
    expect(res.cout.cout_eclairage).toBeCloseTo((indiv * 100) / 1000, 9);
    expect(res.cout.cout_5_usages).toBeCloseTo(base + indiv, 9);
  });

  test('immeuble : base sur le total collectif, appoint rapporté au logement (N × f(C / N))', () => {
    const res = calc_conso(100, 1, 1, [], bijonction(), [], [], 1, 1, DATE_DPE_2026, coef_ep, 4);
    // Base 1500 kWh (tranche 1000-2500) ; individuel (900 + 100) / 4 logements = 250 kWh
    const base = 158 + 0.18954 * 1500;
    const indiv = 4 * 0.34721 * 250;
    expect(res.cout.cout_ch).toBeCloseTo(base + (indiv * 900) / 1000, 9);
    expect(res.cout.cout_5_usages).toBeCloseTo(base + indiv, 9);
  });

  test('scénario dépensier : part d’appoint dépensière utilisée', () => {
    const res = calc_conso(
      100,
      1,
      1,
      [],
      bijonction(),
      [],
      [],
      1,
      1,
      DATE_DPE_2026,
      coef_ep,
      1,
      20
    );
    const coef = (c) => ((78 + 0.20001 * 30000) / 30000) * c;
    const prixIndiv = (158 + 0.18954 * 1000) / 1000;
    expect(res.cout.cout_ch_depensier).toBeCloseTo(coef(3000) + prixIndiv * 1800, 9);
  });

  test('installation individuelle : un seul barème (individuel) pour tout le générateur', () => {
    const res = calc_conso(
      100,
      1,
      1,
      [],
      bijonction('1'),
      [],
      [],
      1,
      1,
      DATE_DPE_2026,
      coef_ep,
      1,
      20
    );
    // Élec totale 2400 + 100 = 2500 kWh (tranche 2500-5000) au prorata
    expect(res.cout.cout_ch).toBeCloseTo(((158 + 0.18949 * 2500) * 2400) / 2500, 9);
  });

  test('sans surface d’immeuble (ratio 1, 1 logement) : base et appoint tarifés séparément', () => {
    const res = calc_conso(100, 1, 1, [], bijonction(), [], [], 1, 1, DATE_DPE_2026, coef_ep);
    // Base 1500 kWh seule (tranche 1000-2500) ; individuel 900 + 100 = 1000 kWh
    const base = 158 + 0.18954 * 1500;
    const indiv = 158 + 0.18954 * 1000;
    expect(res.cout.cout_ch).toBeCloseTo(base + (indiv * 900) / 1000, 9);
    expect(res.cout.cout_5_usages).toBeCloseTo(base + indiv, 9);
  });

  test('DPE antérieur au 01/07/2024 : barème 2021 par poste, sans scission', () => {
    const res = calc_conso(100, 1, 1, [], bijonction(), [], [], 1, 1, '2024-06-30', coef_ep, 1, 20);
    expect(res.cout.cout_ch).toBeCloseTo(149 + 0.14066 * 2400, 9);
  });

  test('consommations EF / EP inchangées par la scission', () => {
    const res = calc_conso(
      100,
      1,
      1,
      [],
      bijonction(),
      [],
      [],
      1,
      1,
      DATE_DPE_2026,
      coef_ep,
      1,
      20
    );
    expect(res.ef_conso.conso_ch).toBeCloseTo(2400, 9);
    expect(res.ep_conso.ep_conso_ch).toBeCloseTo(2400 * 1.9, 9);
  });
});

describe('appointBijonction / coutBijonction', () => {
  test('appointBijonction : part mémorisée selon le scénario, 0 sinon', () => {
    const gen = {
      donnee_utilisateur: {
        conso_ch_appoint_bijonction: 9,
        conso_ch_appoint_bijonction_depensier: 18
      }
    };
    expect(appointBijonction(gen, 'conso_ch')).toBe(9);
    expect(appointBijonction(gen, 'conso_ch_depensier')).toBe(18);
    expect(appointBijonction({}, 'conso_ch')).toBe(0);
    expect(appointBijonction({ donnee_utilisateur: {} }, 'conso_ch_depensier')).toBe(0);
  });

  test('coutBijonction : null hors barème collectif ou sans appoint', () => {
    const gen = { donnee_utilisateur: { conso_ch_appoint_bijonction: 10 } };
    const base = getCoefCout('2026-01-15');
    expect(coutBijonction(base, gen, 'électricité ch', 30, 'conso_ch')).toBeNull();
    expect(coutBijonction(null, gen, 'électricité ch', 30, 'conso_ch')).toBeNull();
    const coef = coefCoutProrata(base, () => ({ total: 100, collectif: 50 }), 1, new Set([gen]));
    expect(coutBijonction(coef, {}, 'électricité ch', 30, 'conso_ch')).toBeNull();
    // base 20 kWh au prix collectif f(50)/50, appoint 10 kWh au prix individuel f(50)/50
    expect(coutBijonction(coef, gen, 'électricité ch', 30, 'conso_ch')).toBeCloseTo(
      0.34721 * 30,
      9
    );
  });
});

/**
 * Facteur d'émission des réseaux de chaleur urbains : table de l'arrêté utilisé
 * (modele_donnee/arrete_reseau_chaleur.json de l'observatoire DPE).
 */
describe('réseaux de chaleur - sélection de l’arrêté et du contenu CO2', () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(tv).mockReset();
    utilsState.bugForBugCompat = false;
  });

  afterEach(() => {
    errorSpy.mockRestore();
    vi.mocked(tv).mockImplementation(tvParDefaut);
    utilsState.bugForBugCompat = false;
  });

  /** Tables mockées : identifiant -> { table: ligne } */
  const mockTables = (lignes) =>
    vi
      .mocked(tv)
      .mockImplementation((table, matcher) => lignes[matcher.identifiant_reseau]?.[table] ?? null);

  test('six arrêtés, dans l’ordre chronologique, table ≠ année de l’arrêté', () => {
    expect(ARRETES_RESEAU_CHALEUR.map((a) => a.table)).toEqual([
      'reseau_chaleur_2020',
      'reseau_chaleur_2021',
      'reseau_chaleur_2022',
      'reseau_chaleur_2023',
      'reseau_chaleur_2024',
      'reseau_chaleur_2025'
    ]);
    // L'arrêté du 05/07/2024 publie la table 2023 (cause du bug : 2024 - 1 = 2023 forcé à 2022)
    expect(ARRETES_RESEAU_CHALEUR[3]).toMatchObject({
      table: 'reseau_chaleur_2023',
      date_arrete: '2024-07-05'
    });
    const dates = ARRETES_RESEAU_CHALEUR.map((a) => a.date_arrete);
    expect([...dates].sort()).toEqual(dates);
    ARRETES_RESEAU_CHALEUR.forEach((a) => expect(a.date_application >= a.date_arrete).toBe(true));
  });

  test.each([
    ['2020-10-12', 0],
    ['2021-10-21', 1],
    ['2022-01-18', 1], // date hors liste : dernier arrêté publié avant
    ['2023-03-16', 2],
    ['2024-07-05', 3],
    ['2024-07-10', 3],
    ['2025-04-11', 4],
    ['2026-03-29', 4], // veille de l'arrêté du 30/03/2026
    ['2026-03-30', 5],
    ['2026-04-25', 5], // date de publication au JO
    ['2030-01-01', 5],
    ['2019-01-01', 0]
  ])('date_arrete_reseau_chaleur %s : arrêté n°%i', (dateArrete, index) => {
    // La date du DPE est ignorée quand la date d'arrêté est renseignée
    expect(indexArreteReseauChaleur(dateArrete, '2030-01-01')).toBe(index);
  });

  test.each([
    ['2022-01-17', 0],
    ['2022-01-18', 1],
    ['2023-04-15', 1], // arrêté du 16/03/2023 applicable au 16/04/2023 seulement
    ['2023-04-16', 2],
    ['2024-08-09', 3],
    [undefined, 0],
    ['date invalide', 0]
  ])('sans date d’arrêté, DPE du %s : arrêté applicable n°%i', (dateDpe, index) => {
    expect(indexArreteReseauChaleur(undefined, dateDpe)).toBe(index);
  });

  test('date d’arrêté illisible (non chaîne) : repli sur la date du DPE', () => {
    expect(indexArreteReseauChaleur(Symbol('invalide'), '2024-08-09')).toBe(3);
    expect(indexArreteReseauChaleur(new Date('2024-07-05'), undefined)).toBe(3);
  });

  test('arrêté du 05/07/2024 : lecture de reseau_chaleur_2023 et contenu ACV (cas Pau 6403C)', () => {
    mockTables({
      '6403C': { reseau_chaleur_2023: { contenu_co2: '0.047', contenu_co2_acv: '0.061' } }
    });
    expect(getContenuCo2ReseauChaleur('6403C', '2024-07-05', '2025-01-24', 'Pleiades')).toBe(0.061);
    expect(tv).toHaveBeenCalledTimes(1);
    expect(tv).toHaveBeenCalledWith('reseau_chaleur_2023', { identifiant_reseau: '6403C' });
  });

  test('bug_for_bug_compat + LICIEL + table 2023 : contenu CO2 hors ACV transmis par le logiciel', () => {
    utilsState.bugForBugCompat = true;
    mockTables({
      '6403C': {
        reseau_chaleur_2023: { contenu_co2: '0.047', contenu_co2_acv: '0.061' },
        reseau_chaleur_2022: { contenu_co2: '0.1', contenu_co2_acv: '0.2' }
      }
    });
    const liciel = 'LICIEL Diagnostics v4 [Version XML:305]';
    expect(getContenuCo2ReseauChaleur('6403C', '2024-07-05', '2025-01-24', liciel)).toBe(0.047);
    // Autre logiciel : valeur ACV
    expect(getContenuCo2ReseauChaleur('6403C', '2024-07-05', '2025-01-24', 'DPEWIN V5.2.5')).toBe(
      0.061
    );
    expect(getContenuCo2ReseauChaleur('6403C', '2024-07-05', '2025-01-24', undefined)).toBe(0.061);
    // LICIEL avec un autre arrêté (16/03/2023 -> table 2022) : valeur ACV
    expect(getContenuCo2ReseauChaleur('6403C', '2023-03-16', '2023-06-01', liciel)).toBe(0.2);
  });

  test('sans bug_for_bug_compat, LICIEL lit aussi le contenu ACV', () => {
    mockTables({
      R: { reseau_chaleur_2023: { contenu_co2: '0.047', contenu_co2_acv: '0.061' } }
    });
    expect(getContenuCo2ReseauChaleur('R', '2024-07-05', undefined, 'LICIEL')).toBe(0.061);
  });

  test('réseau absent de la table de l’arrêté : table antérieure la plus récente qui le contient', () => {
    mockTables({
      R: {
        reseau_chaleur_2021: { contenu_co2: '0.3', contenu_co2_acv: '0.33' },
        reseau_chaleur_2020: { contenu_co2: '0.4', contenu_co2_acv: '0.44' }
      }
    });
    expect(getContenuCo2ReseauChaleur('R', '2024-07-05', undefined, undefined)).toBe(0.33);
    expect(vi.mocked(tv).mock.calls.map((c) => c[0])).toEqual([
      'reseau_chaleur_2023',
      'reseau_chaleur_2022',
      'reseau_chaleur_2021'
    ]);
  });

  test('réseau introuvable dans toutes les tables : facteur « autres réseaux de chaleur » 0,385 et erreur', () => {
    mockTables({});
    expect(COEF_GES_AUTRES_RESEAUX_CHALEUR).toBe(0.385);
    expect(getContenuCo2ReseauChaleur('XXXX', '2024-07-05', undefined, undefined)).toBe(0.385);
    expect(tv).toHaveBeenCalledTimes(4);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('XXXX'));
  });

  test('calc_conso : facteur réseau appliqué au chauffage et à l’ECS, version logiciel transmise', () => {
    utilsState.bugForBugCompat = true;
    mockTables({
      '6403C': { reseau_chaleur_2023: { contenu_co2: '0.047', contenu_co2_acv: '0.061' } }
    });
    const de = { identifiant_reseau_chaleur: '6403C', date_arrete_reseau_chaleur: '2024-07-05' };
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('3', { conso_ch: 1000, conso_ch_depensier: 1200 }, de)
      ])
    ];
    const ecs = [
      installEcs({ cle_repartition_ecs: 1 }, [
        genEcs('3', { conso_ecs: 500, conso_ecs_depensier: 600 }, de)
      ])
    ];
    const args = [100, 1, 1, [], ch, ecs, [], 1, 1, '2025-01-24', coef_ep, 1, 1, {}];

    const licielRes = calc_conso(...args, 'LICIEL Diagnostics v4');
    // 1000 * 0,047 et 500 * 0,047 (valeur ADEME du DPE 2564E0255485Z) — avant : 1000 * 1
    expect(licielRes.emission_ges.emission_ges_ch).toBeCloseTo(47, 9);
    expect(licielRes.emission_ges.emission_ges_ecs).toBeCloseTo(23.5, 9);

    const autreRes = calc_conso(...args);
    expect(autreRes.emission_ges.emission_ges_ch).toBeCloseTo(61, 9);
  });

  test('calc_conso : réseau à contenu CO2 nul, émissions chauffage et ECS nulles (pas de repli sur 1)', () => {
    utilsState.bugForBugCompat = true;
    // Réseau 1606C (MONTEMBOEUF), arrêté du 05/07/2024 : contenu_co2 = 0 (transmis par LICIEL)
    mockTables({
      '1606C': { reseau_chaleur_2023: { contenu_co2: '0', contenu_co2_acv: '0.024' } }
    });
    const de = { identifiant_reseau_chaleur: '1606C', date_arrete_reseau_chaleur: '2024-07-05' };
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh('3', { conso_ch: 1000, conso_ch_depensier: 1200 }, de)
      ])
    ];
    const ecs = [
      installEcs({ cle_repartition_ecs: 1 }, [
        genEcs('3', { conso_ecs: 500, conso_ecs_depensier: 600 }, de)
      ])
    ];
    const args = [100, 1, 1, [], ch, ecs, [], 1, 1, '2025-03-06', coef_ep, 1, 1, {}];

    const licielRes = calc_conso(...args, 'LICIEL Diagnostics v4');
    // DPE 2516E0769459J : emission_ges_ch = emission_ges_ecs = 0 dans l'export ADEME (avant : 1000 et 500)
    expect(licielRes.emission_ges.emission_ges_ch).toBe(0);
    expect(licielRes.emission_ges.emission_ges_ecs).toBe(0);
    expect(licielRes.emission_ges.emission_ges_ch_depensier).toBe(0);

    // Hors LICIEL : contenu ACV 0,024
    const autreRes = calc_conso(...args);
    expect(autreRes.emission_ges.emission_ges_ch).toBeCloseTo(24, 9);
  });

  /**
   * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §17.3 p.118 : GES calculées à partir des énergies
   * consommées réellement par les générateurs.
   */
  const calcMultiBatiment = (typeCh, typeEcs, deExtra = {}) => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh(
          '3',
          { conso_ch: 1000, conso_ch_depensier: 1200 },
          { enum_type_generateur_ch_id: typeCh, identifiant_reseau_chaleur: '', ...deExtra }
        )
      ])
    ];
    const ecs = [
      installEcs({ cle_repartition_ecs: 1 }, [
        genEcs(
          '3',
          { conso_ecs: 500, conso_ecs_depensier: 600 },
          { enum_type_generateur_ecs_id: typeEcs, identifiant_reseau_chaleur: '', ...deExtra }
        )
      ])
    ];
    return calc_conso(100, 1, 1, [], ch, ecs, [], 1, 1, '2025-01-22', coef_ep, 1, 1, {}, 'LICIEL')
      .emission_ges;
  };

  test.each([
    // DPE 2373E0201684Z (109/74) : facteur ADEME 0,03 (0,024 sur quelques exports plaquettes)
    ['109', '74', 0.03],
    ['110', '75', 0.324],
    // DPE 2467E0759983V-like (111/76) : 814 DPE LICIEL KO GES-seul à 0,227
    ['111', '76', 0.227]
  ])(
    'chaudière(s) multi bâtiment %s / %s sans identifiant : facteur de l’énergie %f',
    (typeCh, typeEcs, facteur) => {
      const ges = calcMultiBatiment(typeCh, typeEcs);
      expect(ges.emission_ges_ch).toBeCloseTo(1000 * facteur, 9);
      expect(ges.emission_ges_ecs).toBeCloseTo(500 * facteur, 9);
      expect(tv).not.toHaveBeenCalled();
    }
  );

  test('PAC multi bâtiment (112 / 77) ou réseau sans identifiant : facteur « autres réseaux » 0,385', () => {
    const ges = calcMultiBatiment('112', '77');
    expect(ges.emission_ges_ch).toBeCloseTo(385, 9);
    expect(ges.emission_ges_ecs).toBeCloseTo(192.5, 9);
    // Réseau de chaleur classique (ch 71 / ecs 72) sans identifiant
    const reseau = calcMultiBatiment('71', '72');
    expect(reseau.emission_ges_ch).toBeCloseTo(385, 9);
  });

  test('chaudière multi bâtiment avec identifiant réseau : contenu CO2 de l’arrêté prioritaire', () => {
    mockTables({ R: { reseau_chaleur_2023: { contenu_co2: '0.05', contenu_co2_acv: '0.06' } } });
    const ges = calcMultiBatiment('111', '76', {
      identifiant_reseau_chaleur: 'R',
      date_arrete_reseau_chaleur: '2024-07-05'
    });
    expect(ges.emission_ges_ch).toBeCloseTo(60, 9);
    expect(ges.emission_ges_ecs).toBeCloseTo(30, 9);
  });
});
