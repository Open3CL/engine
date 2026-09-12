import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour `conso_aux_distribution_ch` et `conso_aux_distribution_ecs` :
 * - `enums` : libellés de classe d'altitude / zone climatique ;
 * - `tvs.nref19` : nombre d'heures de fonctionnement mensuel ;
 * - `tvs.tefs` : température d'eau froide sanitaire mensuelle ;
 * - `mois_liste` / `Njj` / `Tbase` : réduits à des valeurs contrôlées.
 * L'année est réduite à un seul mois (Janvier, 31 jours) pour rendre les
 * consommations attendues calculables à la main.
 * `conso_aux_gen` n'utilise aucune de ces dépendances (calcul autonome).
 */
vi.mock('./enums.js', () => ({
  default: {
    classe_altitude: { 1: 'ca1' },
    zone_climatique: { 1: 'h1a' }
  }
}));

vi.mock('./tv.js', () => ({
  default: {
    nref19: { 0: { ca1: { Janvier: { h1a: 100 } } } },
    tefs: { ca1: { Janvier: { h1a: 10 } } }
  }
}));

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  mois_liste: ['Janvier'],
  Njj: { Janvier: 31 },
  Tbase: { ca1: { h1: -9 } }
}));

const { conso_aux_gen, conso_aux_distribution_ch, conso_aux_distribution_ecs } =
  await import('./15_conso_aux.js');

/**
 * 15.1 Consommation des auxiliaires de génération
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.1
 */
describe('conso_aux_gen - auxiliaires de génération', () => {
  let di;

  beforeEach(() => {
    di = { pn: 20000 };
  });

  test('chaudière gaz (chauffage) : facteurs G=20, H=1.6 appliqués', () => {
    const de = { enum_type_generateur_ch_id: '90' };
    conso_aux_gen(di, de, 'ch', 1000, 1200, 100);
    expect(di.conso_auxiliaire_generation_ch).toBeCloseTo(2.6, 10);
    expect(di.conso_auxiliaire_generation_ch_depensier).toBeCloseTo(3.12, 10);
  });

  test('générateur hors des plages connues : consommation nulle (G=H=0)', () => {
    const de = { enum_type_generateur_ch_id: '1' };
    conso_aux_gen(di, de, 'ch', 1000, 1200, 100);
    expect(di.conso_auxiliaire_generation_ch).toBe(0);
    expect(di.conso_auxiliaire_generation_ch_depensier).toBe(0);
  });

  test("chaudière bois : facteurs appliqués seulement en présence d'un ventilateur", () => {
    const avecVentilateur = { pn: 20000 };
    conso_aux_gen(
      avecVentilateur,
      { enum_type_generateur_ch_id: '60', presenceVentilateur: 1 },
      'ch',
      1000,
      1200,
      100
    );
    expect(avecVentilateur.conso_auxiliaire_generation_ch).toBeCloseTo(14.165, 10);

    const sansVentilateur = { pn: 20000 };
    conso_aux_gen(
      sansVentilateur,
      { enum_type_generateur_ch_id: '60', presenceVentilateur: 0 },
      'ch',
      1000,
      1200,
      100
    );
    expect(sansVentilateur.conso_auxiliaire_generation_ch).toBe(0);
  });

  test('chaudière gaz avec Pn > 400 kW : puissance plafonnée à 400 kW', () => {
    const diCap = { pn: 500000 };
    conso_aux_gen(diCap, { enum_type_generateur_ch_id: '90' }, 'ch', 1000, 1200, 100);
    expect(diCap.conso_auxiliaire_generation_ch).toBeCloseTo(1.65, 10);
    expect(diCap.conso_auxiliaire_generation_ch_depensier).toBeCloseTo(1.584, 10);
  });

  test('type ECS : aucun prorata de surface chauffée appliqué', () => {
    const de = { enum_type_generateur_ecs_id: '50' };
    conso_aux_gen(di, de, 'ecs', 800, 1000, 100);
    expect(di.conso_auxiliaire_generation_ecs).toBeCloseTo(2.08, 10);
    expect(di.conso_auxiliaire_generation_ecs_depensier).toBeCloseTo(2.6, 10);
  });

  test('générateur à air chaud avec Pn > 300 kW : puissance plafonnée à 300 kW', () => {
    // enum_type_generateur_ch_id = 50 => générateur à air chaud (H=4), G=0
    const diAir = { pn: 500000 };
    conso_aux_gen(diAir, { enum_type_generateur_ch_id: '50' }, 'ch', 1000, 1200, 100);
    // g=0, h=4, pe plafonné à 300000 => Paux = 0 + 4*300 = 1200
    // conso = (1 * (1200 * 1000 * 1)) / 300000 = 4
    expect(diAir.conso_auxiliaire_generation_ch).toBeCloseTo(4, 10);
    // depensier utilise di.pn (500000, non plafonné) : (1200 * 1200) / 500000 = 2.88
    expect(diAir.conso_auxiliaire_generation_ch_depensier).toBeCloseTo(2.88, 10);
  });

  test('chaudière bois avec ventilateur et Pn > 70 kW : puissance plafonnée à 70 kW', () => {
    // enum_type_generateur_ch_id = 60 => chaudière bois (G=73.3, H=10.5)
    const diBois = { pn: 100000 };
    conso_aux_gen(
      diBois,
      { enum_type_generateur_ch_id: '60', presenceVentilateur: 1 },
      'ch',
      1000,
      1200,
      100
    );
    // pe plafonné à 70000 => Paux = 73.3 + 10.5*70 = 808.3
    // conso = (1 * (808.3 * 1000 * 1)) / 70000
    expect(diBois.conso_auxiliaire_generation_ch).toBeCloseTo((808.3 * 1000) / 70000, 10);
  });

  test('type de générateur inconnu (ni ch ni ecs) : facteurs nuls, consommation nulle', () => {
    // Couvre la branche de repli `values[type] || []` de getFacteur
    const diInconnu = { pn: 20000 };
    conso_aux_gen(diInconnu, {}, 'autre', 1000, 1200, 100);
    expect(diInconnu.conso_auxiliaire_generation_autre).toBe(0);
    expect(diInconnu.conso_auxiliaire_generation_autre_depensier).toBe(0);
  });
});

/**
 * 15.2 Consommation des auxiliaires de distribution de chauffage
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.2
 */
describe('conso_aux_distribution_ch - auxiliaires de distribution', () => {
  const emCh = [
    {
      donnee_entree: {
        enum_type_emission_distribution_id: '10',
        enum_temp_distribution_ch_id: '3'
      }
    }
  ];

  test('puissance de circulateur plafonnée à 30 W pour une faible déperdition', () => {
    const di = {};
    // GV très faible => la puissance calculée reste sous le plancher de 30 W
    conso_aux_distribution_ch(emCh, {}, di, {}, 100, 1, 1, '0', 1);
    // Pcircem19 = 30 (plancher), nref19 = 100 => 30 * 100 / 1000 = 3
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(3, 10);
  });

  test('une déperdition élevée augmente la consommation au-dessus du plancher', () => {
    const di = {};
    conso_aux_distribution_ch(emCh, {}, di, {}, 100, 1, 1, '0', 100000);
    expect(di.conso_auxiliaire_distribution_ch).toBeGreaterThan(3);
  });

  test('émetteur plancher/plafond chauffant (deltaPem=15, Fcot=0,156)', () => {
    // Type 6 => première liste : deltaPem=15, Fcot=0,156, deltaDim=7,5 (temp id 3)
    const em = [
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '6',
          enum_temp_distribution_ch_id: '3'
        }
      }
    ];
    const di = {};
    conso_aux_distribution_ch(em, {}, di, {}, 100, 1, 1, '0', 100000);
    // valeur de référence de régression
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(215.1781621610199, 9);
  });

  test('émetteur radiateur monotube (deltaPem=30)', () => {
    // Type 24 => deuxième liste : deltaPem=30
    const em = [
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '24',
          enum_temp_distribution_ch_id: '3'
        }
      }
    ];
    const di = {};
    conso_aux_distribution_ch(em, {}, di, {}, 100, 1, 1, '0', 100000);
    // valeur de référence de régression
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(372.082418731648, 9);
  });

  test('plusieurs émetteurs : Fcot forcé à 0,802 (cas le plus défavorable)', () => {
    // Deux émetteurs de type plancher chauffant : sans le forçage, Fcot=0,156.
    const em = [
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '6',
          enum_temp_distribution_ch_id: '3'
        }
      },
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '6',
          enum_temp_distribution_ch_id: '3'
        }
      }
    ];
    const di = {};
    conso_aux_distribution_ch(em, {}, di, {}, 100, 1, 1, '0', 100000);
    // valeur de référence de régression (Fcot=0,802 malgré des planchers chauffants)
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(260.5604692803713, 9);
  });

  test('température de distribution haute (id 4) : deltaDim = 15', () => {
    const em = [
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '10',
          enum_temp_distribution_ch_id: '4'
        }
      }
    ];
    const di = {};
    conso_aux_distribution_ch(em, {}, di, {}, 100, 1, 1, '0', 100000);
    // valeur de référence de régression
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(136.51553416032854, 9);
  });
});

/**
 * 15.2.3 Consommation des auxiliaires de distribution d'ECS
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.2.3
 *
 * Les scénarios ci-dessous s'appuient sur l'année réduite à Janvier (31 jours,
 * tefs = 10 °C) définie par les mocks en tête de fichier :
 * - Nh_puisage = 31 × 5 = 155 h
 * - Nh_mois    = 31 × 24 = 744 h
 */
describe("conso_aux_distribution_ecs - auxiliaires de distribution d'ECS", () => {
  // Consommation du circulateur maintenu à 20 W sur toutes les heures du mois (kWh)
  const CONSO_PLANCHER_20W = (31 * 24 * 20) / 1000; // 14,88 kWh

  test('installation individuelle : consommation nulle', () => {
    const di = {};
    conso_aux_distribution_ecs(
      {},
      { enum_type_installation_id: '1', enum_bouclage_reseau_ecs_id: '2' },
      di,
      50,
      2000,
      1,
      1,
      30
    );
    expect(di.conso_auxiliaire_distribution_ecs).toBe(0);
  });

  test("réseau d'ECS non bouclé (id 1) : consommation nulle", () => {
    const di = {};
    conso_aux_distribution_ecs(
      {},
      { enum_type_installation_id: '2', enum_bouclage_reseau_ecs_id: '1' },
      di,
      50,
      2000,
      1,
      1,
      30
    );
    expect(di.conso_auxiliaire_distribution_ecs).toBe(0);
  });

  test('type de bouclage non renseigné : consommation nulle', () => {
    const di = {};
    conso_aux_distribution_ecs({}, { enum_type_installation_id: '2' }, di, 50, 2000, 1, 1, 30);
    expect(di.conso_auxiliaire_distribution_ecs).toBe(0);
  });

  test('réseau avec traçage (id 3) : 0,14 × BECS × Sh_installation / Sh_logement', () => {
    const di = { besoin_ecs: 1000 };
    conso_aux_distribution_ecs(
      {},
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '3',
        surface_habitable: 60
      },
      di,
      50,
      2000,
      1,
      1,
      30
    );
    // 0,14 × 1000 × 60 / 50
    expect(di.conso_auxiliaire_distribution_ecs).toBeCloseTo(168, 10);
  });

  test("traçage sans surface d'installation : repli sur la surface du logement", () => {
    const di = { besoin_ecs: 1000 };
    conso_aux_distribution_ecs(
      {},
      { enum_type_installation_id: '2', enum_bouclage_reseau_ecs_id: '3' },
      di,
      50,
      2000,
      1,
      1,
      30
    );
    // Sh_install = Sh_logement => 0,14 × 1000
    expect(di.conso_auxiliaire_distribution_ecs).toBeCloseTo(140, 10);
  });

  test('réseau bouclé, faible puissance hydraulique : plancher de 20 W', () => {
    const di = {};
    // Immeuble réduit au logement (18 m²) et nadeq faible : Phyd ≈ 0,07 W, donc
    // Pcirb calculée (≈ 2,6 W) passe sous le plancher de 20 W tous les mois.
    conso_aux_distribution_ecs(
      {},
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '2',
        surface_habitable: 18,
        nombre_niveau_installation_ecs: 1
      },
      di,
      18,
      18,
      1,
      1,
      1.15
    );
    expect(di.conso_auxiliaire_distribution_ecs).toBeCloseTo(CONSO_PLANCHER_20W, 10);
  });

  test('réseau bouclé : consommation ramenée au prorata Sh_logement / Sh_immeuble', () => {
    const di = {};
    // Même régime de plancher (Pcirb ≈ 11 W) : la consommation immeuble (14,88 kWh)
    // est ramenée à l'appartement, soit un dixième ici.
    conso_aux_distribution_ecs(
      {},
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '2',
        surface_habitable: 50,
        nombre_niveau_installation_ecs: 1
      },
      di,
      50,
      500,
      1,
      1,
      0.5
    );
    expect(di.conso_auxiliaire_distribution_ecs).toBeCloseTo((CONSO_PLANCHER_20W * 50) / 500, 10);
  });

  test('réseau bouclé, circulateur au-dessus du plancher de 20 W', () => {
    const di = {};
    conso_aux_distribution_ecs(
      {},
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '2',
        surface_habitable: 50,
        nombre_niveau_installation_ecs: 2
      },
      di,
      50,
      2000,
      1,
      1,
      30
    );
    // valeur de référence de régression (Pcirb ≈ 549 W pendant les heures de puisage)
    expect(di.conso_auxiliaire_distribution_ecs).toBeCloseTo(2.4208575056559525, 9);
  });

  test('plus de niveaux desservis : bouclage plus court, donc consommation plus faible', () => {
    const scenario = (Niv) => {
      const di = {};
      conso_aux_distribution_ecs(
        {},
        {
          enum_type_installation_id: '2',
          enum_bouclage_reseau_ecs_id: '2',
          surface_habitable: 50,
          nombre_niveau_installation_ecs: Niv
        },
        di,
        50,
        2000,
        1,
        1,
        30
      );
      return di.conso_auxiliaire_distribution_ecs;
    };
    // Lb = 4 × (Sh / Niv)^0,5 + 6 × (Niv − 0,5) : sur cet immeuble, Lb décroît avec Niv
    expect(scenario(1)).toBeCloseTo(2.767218880573735, 9);
    expect(scenario(4)).toBeCloseTo(2.2222299894932647, 9);
    expect(scenario(4)).toBeLessThan(scenario(1));
  });

  test("réseau bouclé sans surface ni nombre de niveaux d'installation : valeurs par défaut", () => {
    const diDefaut = {};
    conso_aux_distribution_ecs(
      {},
      { enum_type_installation_id: '2', enum_bouclage_reseau_ecs_id: '2' },
      diDefaut,
      50,
      2000,
      1,
      1,
      30
    );
    const diExplicite = {};
    // Sh_install = Sh_logement et Niv = 1
    conso_aux_distribution_ecs(
      {},
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '2',
        surface_habitable: 50,
        nombre_niveau_installation_ecs: 1
      },
      diExplicite,
      50,
      2000,
      1,
      1,
      30
    );
    expect(diDefaut.conso_auxiliaire_distribution_ecs).toBeCloseTo(
      diExplicite.conso_auxiliaire_distribution_ecs,
      10
    );
  });

  test("installation desservant tout l'immeuble : Sh_installation étendue à l'immeuble", () => {
    const di = {};
    conso_aux_distribution_ecs(
      {},
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '2',
        surface_habitable: 2000,
        nombre_niveau_installation_ecs: 2
      },
      di,
      50,
      2000,
      1,
      1,
      30
    );
    // valeur de référence de régression
    expect(di.conso_auxiliaire_distribution_ecs).toBeCloseTo(72.84189246242042, 9);
  });
});

/**
 * 15.2.3 - Cas des DPE d'appartement dont `surface_habitable_immeuble` est
 * renseignée avec la surface du logement : l'échelle de l'immeuble est alors
 * reconstruite à partir du ratio de virtualisation de l'installation.
 */
describe("conso_aux_distribution_ecs - surface d'immeuble incohérente", () => {
  const RATIO_VIRTUALISATION = 0.0211;
  const SH_LOGEMENT = 18;
  // 18 / 0,0211 = 853,08 m²
  const SH_IMMEUBLE_RECONSTRUITE = SH_LOGEMENT / RATIO_VIRTUALISATION;

  /** @param de {object} @param Sh_immeuble {number} @param nbNiveauImmeuble {number} */
  const consoEcs = (de, Sh_immeuble, nbNiveauImmeuble) => {
    const di = {};
    conso_aux_distribution_ecs(
      {},
      {
        enum_type_installation_id: '2',
        enum_bouclage_reseau_ecs_id: '2',
        surface_habitable: SH_LOGEMENT,
        nombre_niveau_installation_ecs: 1,
        ...de
      },
      di,
      SH_LOGEMENT,
      Sh_immeuble,
      1,
      1,
      1.15,
      nbNiveauImmeuble
    );
    return di.conso_auxiliaire_distribution_ecs;
  };

  test("surface d'immeuble égale à celle du logement : reconstruite via le ratio de virtualisation", () => {
    const reconstruite = consoEcs(
      { ratio_virtualisation: String(RATIO_VIRTUALISATION) },
      SH_LOGEMENT,
      1
    );

    // Sans reconstruction, le prorata vaut 1 et le circulateur reste au plancher de 20 W
    expect(reconstruite).not.toBeCloseTo((31 * 24 * 20) / 1000, 6);
    expect(reconstruite).toBeCloseTo(0.45766695775765603, 9);

    // Équivalent à une surface d'immeuble correctement renseignée
    const renseignee = consoEcs({}, SH_IMMEUBLE_RECONSTRUITE, 1);
    expect(reconstruite).toBeCloseTo(renseignee, 10);
  });

  test("reconstruction : le nombre de niveaux de l'immeuble prime sur celui de l'installation", () => {
    // nombre_niveau_installation_ecs = 1 est la valeur du logement, incohérente
    // avec la surface d'immeuble reconstruite
    expect(
      consoEcs({ ratio_virtualisation: String(RATIO_VIRTUALISATION) }, SH_LOGEMENT, 6)
    ).toBeCloseTo(0.4237342712345093, 9);
  });

  test("reconstruction sans nombre de niveaux d'immeuble : repli sur celui de l'installation", () => {
    expect(
      consoEcs(
        {
          ratio_virtualisation: String(RATIO_VIRTUALISATION),
          nombre_niveau_installation_ecs: 3
        },
        SH_LOGEMENT,
        undefined
      )
    ).toBeCloseTo(0.4253220756819142, 9);
  });

  test('ratio de virtualisation égal à 1 : aucune reconstruction', () => {
    expect(consoEcs({ ratio_virtualisation: '1' }, SH_LOGEMENT, 6)).toBeCloseTo(
      (31 * 24 * 20) / 1000,
      10
    );
  });

  test("surface d'immeuble cohérente : le ratio de virtualisation est ignoré", () => {
    expect(
      consoEcs({ ratio_virtualisation: String(RATIO_VIRTUALISATION) }, SH_IMMEUBLE_RECONSTRUITE, 6)
    ).toBeCloseTo(consoEcs({}, SH_IMMEUBLE_RECONSTRUITE, 6), 10);
  });
});
