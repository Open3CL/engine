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
  coef_ep
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
