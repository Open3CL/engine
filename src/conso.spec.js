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

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  tv: vi.fn((table, matcher) => {
    // Réseau de chaleur "R1" connu, "R2" inconnu
    if (matcher?.identifiant_reseau === 'R1') return { contenu_co2_acv: 0.15 };
    return null;
  })
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
  DATE_BAREME_COUT_2024
} = await import('./conso.js');

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

  test('réseau de chaleur inconnu (identifiant sans ligne) : erreur signalée', () => {
    const ch = [
      installCh({ cle_repartition_ch: 1 }, [
        genCh(
          '3',
          { conso_ch: 1000, conso_ch_depensier: 1200 },
          { identifiant_reseau_chaleur: 'R2' }
        )
      ])
    ];

    calc_conso(100, 1, 1, [], ch, [], [], 1, 1, DATE_DPE, coef_ep);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('R2'));
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

  test("date de DPE invalide (levée d'exception) : année de repli 2022", () => {
    // date_arrete_reseau_chaleur = Symbol => new Date(...) lève => catch => 2022
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
