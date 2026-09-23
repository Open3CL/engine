import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_ecs` :
 * - `enums.type_installation` : libellé du type d'installation (individuelle / collective) ;
 * - `tv` : accès à la table rendement_distribution_ecs (ligne contrôlée) ;
 * - `requestInput` : passe-plat vers les données d'entrée pour le réseau collectif ;
 * - `calc_gen_ecs` : calcul par générateur, neutralisé (les consommations sont pré-remplies).
 * Aucune vraie table de valeurs n'est sollicitée : les tests restent stables si les données changent.
 */
vi.mock('./enums.js', () => ({
  default: {
    type_installation: {
      1: 'installation individuelle',
      2: 'installation collective',
      3: 'installation collective multi-bâtiment'
    }
  }
}));

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  tv: vi.fn(),
  requestInput: vi.fn(),
  // Calendrier réduit à deux mois pour le calcul mensuel des auxiliaires de distribution
  mois_liste: ['Janvier', 'Février'],
  Njj: { Janvier: 31, Février: 28 }
}));

vi.mock('./14_generateur_ecs.js', () => ({
  default: vi.fn()
}));

const { default: calc_ecs } = await import('./11_ecs.js');
const { tv, requestInput } = await import('./utils.js');
const { default: calc_gen_ecs } = await import('./14_generateur_ecs.js');

/** Fabrique une installation ECS avec un générateur dont la consommation est pré-remplie. */
function makeEcs(de, gens) {
  return {
    donnee_entree: de,
    generateur_ecs_collection: {
      generateur_ecs: gens ?? [
        {
          donnee_entree: { position_volume_chauffe: 1 },
          donnee_intermediaire: { conso_ecs: 10, conso_ecs_depensier: 20 }
        }
      ]
    }
  };
}

beforeEach(() => {
  vi.mocked(tv).mockReset();
  vi.mocked(requestInput).mockReset();
  vi.mocked(calc_gen_ecs).mockReset();
  // ligne forfaitaire de rendement de distribution par défaut
  vi.mocked(tv).mockReturnValue({ rd: '0.9', tv_rendement_distribution_ecs_id: '5' });
});

/**
 * 11. Prise en compte de l'ECS (ratio de besoin + rendement de distribution)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §11 / §17.2.1
 */
describe('calc_ecs - ratio de besoin ECS', () => {
  test('virtualisation : le ratio est la clé de répartition ECS', () => {
    const de = { tv_rendement_distribution_ecs_id: '5', cle_repartition_ecs: 0.5 };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', true, null, null, false);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(0.5);
    expect(ecs.donnee_intermediaire.besoin_ecs).toBeCloseTo(50, 9);
    expect(ecs.donnee_intermediaire.besoin_ecs_depensier).toBeCloseTo(100, 9);
  });

  test('immeuble à systèmes ECS individuels : ratio = 1 / nombre d’appartements', () => {
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'immeuble', false, null, 4, true);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(0.25);
    expect(ecs.donnee_intermediaire.besoin_ecs).toBeCloseTo(25, 9);
  });

  test('présence de rdim : ratio = 1 / rdim', () => {
    const de = { tv_rendement_distribution_ecs_id: '5', rdim: 2 };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(0.5);
    expect(ecs.donnee_intermediaire.besoin_ecs).toBeCloseTo(50, 9);
  });

  test('virtualisation sans clé de répartition : ratio = 1 (valeur de repli)', () => {
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', true, null, null, false);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(1);
    expect(ecs.donnee_intermediaire.besoin_ecs).toBe(100);
  });

  test('immeuble à systèmes ECS individuels sans nombre d’appartements : ratio calculé au prorata', () => {
    const de = {
      tv_rendement_distribution_ecs_id: '5',
      surface_habitable: 50,
      rdim: 1,
      nombre_logement: 10
    };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'immeuble', false, 200, null, true);

    // ratio = ((surface_habitable / surfaceImmeuble) * rdim) / (nombre_logement * nombreAppartements)
    // nombreAppartements est nul -> division par 0 => ratio infini, on vérifie seulement la branche prise
    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(Infinity);
  });

  test('immeuble à systèmes ECS individuels : surface immeuble et rdim absents utilisent le repli 1', () => {
    const de = {
      tv_rendement_distribution_ecs_id: '5',
      surface_habitable: 50,
      nombre_logement: 10
    };
    const ecs = makeEcs(de);
    // surfaceImmeuble null et de.rdim absent -> les deux `|| 1` s'appliquent
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'immeuble', false, null, null, true);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(Infinity);
  });

  test('rdim infini : la valeur de repli 1 s’applique (1 / Infinity vaut 0)', () => {
    const de = { tv_rendement_distribution_ecs_id: '5', rdim: Infinity };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    // 1 / Infinity = 0 -> `|| 1` prend le repli
    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(1);
  });

  test('cas par défaut : ratio = 1 (aucune proratisation)', () => {
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(1);
    expect(ecs.donnee_intermediaire.besoin_ecs).toBe(100);
    expect(ecs.donnee_intermediaire.besoin_ecs_depensier).toBe(200);
  });
});

describe('calc_ecs - rendement de distribution', () => {
  test('la ligne forfaitaire alimente rendement_distribution et l’identifiant de table', () => {
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(ecs.donnee_intermediaire.rendement_distribution).toBe(0.9);
    expect(de.tv_rendement_distribution_ecs_id).toBe(5);
  });

  test('installation individuelle, production dans le volume chauffé : matcher de configuration', () => {
    const de = { enum_type_installation_id: '1' };
    const ecs = makeEcs(de, [
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 0, conso_ecs_depensier: 0 }
      }
    ]);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(tv).toHaveBeenCalledWith('rendement_distribution_ecs', {
      configuration_logement: 'production volume habitable [+] pièces alimentées contiguës'
    });
  });

  test('installation individuelle, production hors volume chauffé : configuration adaptée', () => {
    const de = { enum_type_installation_id: '1' };
    const ecs = makeEcs(de, [
      {
        donnee_entree: { position_volume_chauffe: 0 },
        donnee_intermediaire: { conso_ecs: 0, conso_ecs_depensier: 0 }
      }
    ]);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(tv).toHaveBeenCalledWith('rendement_distribution_ecs', {
      configuration_logement: 'production hors volume habitable'
    });
  });

  test('installation collective non isolée : matcher type de réseau + configuration', () => {
    vi.mocked(requestInput).mockImplementation((de, du, field) =>
      field === 'reseau_distribution_isole' ? 0 : undefined
    );
    const de = { enum_type_installation_id: '2' };
    const ecs = makeEcs(de, [
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 0, conso_ecs_depensier: 0 }
      }
    ]);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'immeuble', false, null, null, false);

    expect(tv).toHaveBeenCalledWith('rendement_distribution_ecs', {
      type_reseau_collectif: 'Réseau collectif non isolé',
      configuration_logement: 'majorité des logements avec pièces alimentées contiguës'
    });
  });

  test('installation collective multi-bâtiment isolée bouclée : configuration non contiguë', () => {
    vi.mocked(requestInput).mockImplementation((de, du, field) => {
      if (field === 'reseau_distribution_isole') return 1;
      if (field === 'bouclage_reseau_ecs') return "réseau d'ecs bouclé";
      return undefined;
    });
    const de = { enum_type_installation_id: '3' };
    const ecs = makeEcs(de, [
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 0, conso_ecs_depensier: 0 }
      }
    ]);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'immeuble', false, null, null, false);

    expect(tv).toHaveBeenCalledWith('rendement_distribution_ecs', {
      type_reseau_collectif: 'Réseau collectif isolé bouclé',
      configuration_logement: 'majorité des logements avec pièces alimentées non contiguës'
    });
  });

  test('installation collective isolée sans bouclage (traçage) : configuration ignorée', () => {
    vi.mocked(requestInput).mockImplementation((de, du, field) => {
      if (field === 'reseau_distribution_isole') return 1;
      if (field === 'bouclage_reseau_ecs') return "réseau d'ecs non bouclé";
      return undefined;
    });
    const de = { enum_type_installation_id: '2' };
    const ecs = makeEcs(de, [
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 0, conso_ecs_depensier: 0 }
      }
    ]);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'immeuble', false, null, null, false);

    // configuration_logement mise à null -> absente du matcher, seul le type de réseau subsiste
    expect(tv).toHaveBeenCalledWith('rendement_distribution_ecs', {
      type_reseau_collectif:
        'Réseau collectif isolé avec traçage ou Réseau collectif isolé sans traçage ni bouclage'
    });
  });

  test('aucune ligne forfaitaire trouvée : rendement de distribution non renseigné', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(tv).mockReturnValue(undefined);
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(ecs.donnee_intermediaire.rendement_distribution).toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('calc_ecs - agrégation des consommations', () => {
  test('somme les consommations des générateurs et invoque calc_gen_ecs par générateur', () => {
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const gens = [
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 10, conso_ecs_depensier: 20 }
      },
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 5, conso_ecs_depensier: 8 }
      }
    ];
    const ecs = makeEcs(de, gens);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(calc_gen_ecs).toHaveBeenCalledTimes(2);
    expect(ecs.donnee_intermediaire.conso_ecs).toBe(15);
    expect(ecs.donnee_intermediaire.conso_ecs_depensier).toBe(28);
  });
});

/**
 * Consommation des auxiliaires de distribution ECS - cas immeuble
 * Seuls les réseaux collectifs bouclés ou avec traçage consomment de l'énergie.
 */
describe('calc_ecs - auxiliaires de distribution ECS (immeuble)', () => {
  /** Calcule l'ECS d'un immeuble et retourne la conso des auxiliaires de distribution [kWh]. */
  function consoAuxDistribution(deExtra, becsParMois, surfaceImmeuble = 400, th = 'immeuble') {
    const ecs = makeEcs({ tv_rendement_distribution_ecs_id: '5', ...deExtra });
    calc_ecs(
      {},
      ecs,
      100,
      200,
      1,
      'ca1',
      'h1a',
      th,
      false,
      surfaceImmeuble,
      null,
      false,
      becsParMois
    );
    return ecs.donnee_intermediaire.conso_auxiliaire_distribution_ecs;
  }

  test.each([
    ['logement autre qu’un immeuble', 'maison', { Janvier: 1000 }],
    ['besoin mensuel absent', 'immeuble', undefined],
    ['besoin mensuel vide', 'immeuble', {}]
  ])('%s : pas de consommation', (_libelle, th, becsParMois) => {
    expect(
      consoAuxDistribution(
        { enum_type_installation_id: '2', enum_bouclage_reseau_ecs_id: '2' },
        becsParMois,
        400,
        th
      )
    ).toBe(0);
  });

  test.each([
    ['type d’installation inconnu', { enum_type_installation_id: '9' }],
    ['installation individuelle', { enum_type_installation_id: '1' }],
    [
      'réseau collectif non bouclé',
      { enum_type_installation_id: '2', enum_bouclage_reseau_ecs_id: '1' }
    ],
    ['type de bouclage non renseigné', { enum_type_installation_id: '2' }]
  ])('%s : pas de consommation', (_libelle, de) => {
    expect(consoAuxDistribution(de, { Janvier: 1000 })).toBe(0);
  });

  test('réseau avec traçage : 0,14 × besoin annuel × ratio de surface', () => {
    const conso = consoAuxDistribution(
      { enum_type_installation_id: '2', enum_bouclage_reseau_ecs_id: 3, surface_habitable: 100 },
      { Janvier: 100, Février: 50 }
    );

    // 0,14 × 150 kWh × 1000 × (100 / 400) = 5250 Wh => 5,25 kWh
    expect(conso).toBeCloseTo(5.25, 9);
  });

  test('réseau avec traçage sans surfaces renseignées : ratio de surface nul', () => {
    const conso = consoAuxDistribution(
      { enum_type_installation_id: '3', enum_bouclage_reseau_ecs_id: '3' },
      { Janvier: 100 },
      null
    );

    // surface_habitable absente => 0 ; surface de l'immeuble absente => 1
    expect(conso).toBe(0);
  });

  test('réseau bouclé sans besoin : puissance minimale du circulateur de 20 W', () => {
    const conso = consoAuxDistribution(
      { enum_type_installation_id: '2', enum_bouclage_reseau_ecs_id: '2', surface_habitable: 100 },
      { Janvier: 0 }
    );

    // Pcirb = 20 W chaque mois : (5 × 20 + 19 × 20) × (31 + 28) jours = 28320 Wh
    expect(conso).toBeCloseTo(28.32, 9);
  });

  test('réseau bouclé à faible besoin : puissance du circulateur ramenée au minimum de 20 W', () => {
    const conso = consoAuxDistribution(
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '2',
        surface_habitable: 100,
        nombre_niveau_installation_ecs: 2
      },
      { Janvier: 1000, Février: 1000 }
    );

    // Phyd / Effcirb < 20 W => Pcirb = 20 W, identique au cas sans besoin
    expect(conso).toBeCloseTo(28.32, 9);
  });

  test('réseau bouclé : calcul complet de la consommation du circulateur', () => {
    const conso = consoAuxDistribution(
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '2',
        surface_habitable: 100,
        nombre_niveau_installation_ecs: '2'
      },
      { Janvier: 10000 }
    );

    // Lb = 1,2 × (1,1 × 100 / 2 + 4 × 2) = 75,6 m ; ΔPb = 0,2 × Lb + 10 = 25,12 kPa
    // Janvier : Phyd ≈ 4,645 W => Pcirb ≈ 66,49 W ; Février (besoin absent) : Pcirb = 20 W
    // Référence de régression (calcul des 9 étapes de la méthode) : 35526,3879475995 Wh
    expect(conso).toBeCloseTo(35.526387947599495, 9);
  });

  test('réseau bouclé sans nombre de niveaux : un seul niveau par défaut', () => {
    const avecUnNiveau = consoAuxDistribution(
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '2',
        surface_habitable: 100,
        nombre_niveau_installation_ecs: 1
      },
      { Janvier: 10000 }
    );
    const sansNiveau = consoAuxDistribution(
      { enum_type_installation_id: '2', enum_bouclage_reseau_ecs_id: '2', surface_habitable: 100 },
      { Janvier: 10000 }
    );

    expect(sansNiveau).toBe(avecUnNiveau);
  });
});
