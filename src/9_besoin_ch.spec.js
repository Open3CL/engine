import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `9_besoin_ch.js` :
 * - `enums` : mapping altitude / zone climatique / inertie ;
 * - `tvs` : profils mensuels dh19/dh21/nref19/nref21/e (valeurs contrôlées) ;
 * - apports internes/solaires (`calc_ai_j`, `calc_as_j`) et surface sud
 *   équivalente (`calc_sse_j`) : simples fonctions dont on fige le retour ;
 * - besoin ECS journalier (`calc_besoin_ecs_j`) et récupération générateur
 *   (`calc_Qrec_gen_j`) : mockés pour piloter les branches de récupération ;
 * - `mois_liste` réduite à un mois et `bug_for_bug_compat` désactivé.
 */
vi.mock('./enums.js', () => ({
  default: {
    classe_altitude: { 0: 'ca1' },
    zone_climatique: { 0: 'h1a' },
    classe_inertie: { 0: 'moyenne' }
  }
}));

vi.mock('./tv.js', () => ({
  default: {
    dh19: { 0: { ca1: { Janvier: { h1a: 1000 } } } },
    dh21: { 0: { ca1: { Janvier: { h1a: 1200 } } } },
    nref19: { 0: { ca1: { Janvier: { h1a: 100 } } } },
    nref21: { 0: { ca1: { Janvier: { h1a: 120 } } } },
    e: { 0: { ca1: { Janvier: { h1a: 500 } } } }
  }
}));

vi.mock('./6.1_apport_gratuit.js', () => ({
  calc_ai_j: vi.fn(),
  calc_as_j: vi.fn()
}));

vi.mock('./6.2_surface_sud_equivalente.js', () => ({
  calc_sse_j: vi.fn()
}));

vi.mock('./11_besoin_ecs.js', () => ({
  calc_besoin_ecs_j: vi.fn()
}));

vi.mock('./9_generateur_ch.js', () => ({
  calc_Qrec_gen_j: vi.fn(),
  calc_Qrec_gen_ecs_j: vi.fn(),
  isGenerateurEcsSeulRecuperable: vi.fn()
}));

const utilState = vi.hoisted(() => ({ bug: false }));
vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  mois_liste: ['Janvier'],
  get bug_for_bug_compat() {
    return utilState.bug;
  }
}));

const {
  default: calc_besoin_ch,
  calc_Fj,
  calc_bvj,
  isImmeubleMultiEcs,
  isSurfaceEcsParLogement,
  prorataEcsImmeubleMulti
} = await import('./9_besoin_ch.js');
const { default: tvsBch } = await import('./tv.js');
const { calc_ai_j, calc_as_j } = await import('./6.1_apport_gratuit.js');
const { calc_sse_j } = await import('./6.2_surface_sud_equivalente.js');
const { calc_besoin_ecs_j } = await import('./11_besoin_ecs.js');
const { calc_Qrec_gen_j, calc_Qrec_gen_ecs_j, isGenerateurEcsSeulRecuperable } =
  await import('./9_generateur_ch.js');

/**
 * 9. Besoins de chauffage (Bch)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9
 */
describe('calc_Fj - fraction des besoins de chauffage couverte par les apports', () => {
  test('retourne 0 lorsque le nombre de degrés-heures est nul', () => {
    expect(calc_Fj(100, 2000, 5000, 0, 'moyenne')).toBe(0);
  });

  test('valeur de référence de régression (inertie moyenne, alpha = 2.9)', () => {
    expect(calc_Fj(100, 2000, 5000, 1000, 'moyenne')).toBeCloseTo(0.06958364704535852, 9);
  });

  test('une inertie lourde (alpha = 3.6) couvre une part différente de la légère (alpha = 2.5)', () => {
    const lourde = calc_Fj(100, 2000, 5000, 1000, 'lourde');
    const legere = calc_Fj(100, 2000, 5000, 1000, 'légère');
    // valeurs de référence de régression
    expect(lourde).toBeCloseTo(0.06993530568739618, 9);
    expect(legere).toBeCloseTo(0.06879276604754976, 9);
    expect(lourde).not.toBeCloseTo(legere, 9);
  });

  test('les inerties "très lourde" et "lourde" partagent le même alpha', () => {
    expect(calc_Fj(100, 2000, 5000, 1000, 'très lourde')).toBeCloseTo(
      calc_Fj(100, 2000, 5000, 1000, 'lourde'),
      12
    );
  });
});

describe('calc_bvj - déperditions corrigées de la fraction récupérée', () => {
  test('bvj = GV * (1 - Fj)', () => {
    expect(calc_bvj(100, 0.3)).toBe(70);
    expect(calc_bvj(100, 0)).toBe(100);
  });
});

describe('calc_besoin_ch - agrégation mensuelle du besoin de chauffage', () => {
  beforeEach(() => {
    vi.mocked(calc_ai_j).mockReset();
    vi.mocked(calc_as_j).mockReset();
    vi.mocked(calc_sse_j).mockReset();
    vi.mocked(calc_besoin_ecs_j).mockReset();
    vi.mocked(calc_Qrec_gen_j).mockReset();
    vi.mocked(calc_ai_j).mockReturnValue(5000);
    vi.mocked(calc_as_j).mockReturnValue(2000);
    vi.mocked(calc_sse_j).mockReturnValue(10);
    vi.mocked(calc_besoin_ecs_j).mockReturnValue(10);
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(0);
  });

  /** Appel nominal sans installation (pas de récupération d'énergie). */
  function appelSansRecup() {
    return calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], [], [], null, 'maison', 1);
  }

  test('valeurs de référence de régression sans récupération (ECS/générateur)', () => {
    const ret = appelSansRecup();
    expect(ret.besoin_ch).toBeCloseTo(93.04163529546415, 9);
    expect(ret.besoin_ch_depensier).toBeCloseTo(113.0298092944794, 9);
  });

  test('la fraction des apports gratuits est ramenée à la moyenne pondérée par les degrés-heures', () => {
    const ret = appelSansRecup();
    // sur un seul mois : fraction = Fj
    expect(ret.fraction_apport_gratuit_ch).toBeCloseTo(0.06958364704535852, 9);
    expect(ret.fraction_apport_gratuit_depensier_ch).toBeCloseTo(0.05808492254600494, 9);
  });

  /**
   * La fraction des apports gratuits est une moyenne pondérée des Fj :
   * elle reste dans [0, 1] et n'est jamais arrondie à 1 (cf. issue #51).
   */
  test("la fraction des apports gratuits n'est pas arrondie à 1 et reste dans [0, 1]", () => {
    const ret = appelSansRecup();
    const Fj = calc_Fj(100, 2000, 5000, 1000, 'moyenne');
    const FjDep = calc_Fj(100, 2000, 5000, 1200, 'moyenne');

    // sur un seul mois, la moyenne pondérée vaut exactement Fj
    expect(ret.fraction_apport_gratuit_ch).toBeCloseTo(Fj, 12);
    expect(ret.fraction_apport_gratuit_depensier_ch).toBeCloseTo(FjDep, 12);
    for (const fraction of [
      ret.fraction_apport_gratuit_ch,
      ret.fraction_apport_gratuit_depensier_ch
    ]) {
      expect(fraction).toBeGreaterThan(0);
      expect(fraction).toBeLessThan(1);
    }
  });

  test('sans récupération, toutes les pertes récupérées retournées sont nulles', () => {
    const ret = appelSansRecup();
    expect(ret.pertes_distribution_ecs_recup).toBe(0);
    expect(ret.pertes_stockage_ecs_recup).toBe(0);
    expect(ret.pertes_generateur_ch_recup).toBe(0);
    expect(ret.pertes_generateur_ch_recup_depensier).toBe(0);
  });

  test('le besoin mensuel est exposé (en Wh) pour chaque mois calculé', () => {
    const ret = appelSansRecup();
    expect(ret.besoin_ch_mois.Janvier).toBeCloseTo(93041.63529546415, 6);
  });

  /**
   * 9.1.1 - Un générateur en volume chauffé avec pertes à l'arrêt (qp0) donne
   * lieu à une récupération d'énergie qui diminue le besoin de chauffage.
   */
  test('la récupération générateur diminue le besoin et appelle calc_Qrec_gen_j', () => {
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(1000);
    const instal_ch = [
      {
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_intermediaire: { qp0: 1 },
              donnee_entree: { position_volume_chauffe: 1 }
            }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], instal_ch, [], null, 'maison', 1);

    expect(calc_Qrec_gen_j).toHaveBeenCalled();
    expect(ret.pertes_generateur_ch_recup).toBeCloseTo(1000, 6);
    // 93041.635 Wh de besoin - 1000 Wh récupérés = 92041.635 Wh
    expect(ret.besoin_ch).toBeCloseTo(92.04163529546415, 6);
  });

  test("un générateur sans pertes à l'arrêt (qp0) n'est pas retenu pour la récupération", () => {
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(1000);
    const instal_ch = [
      {
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_intermediaire: { qp0: 0 },
              donnee_entree: { position_volume_chauffe: 1 }
            }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], instal_ch, [], null, 'maison', 1);
    expect(calc_Qrec_gen_j).not.toHaveBeenCalled();
    expect(ret.pertes_generateur_ch_recup).toBe(0);
  });

  test('le besoin mensuel de chauffage est borné à zéro (Math.max)', () => {
    // récupération générateur démesurée => besoin mensuel négatif ramené à 0
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(1e9);
    const instal_ch = [
      {
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_intermediaire: { qp0: 1 },
              donnee_entree: { position_volume_chauffe: 1 }
            }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], instal_ch, [], null, 'maison', 1);
    expect(ret.besoin_ch).toBe(0);
    expect(ret.besoin_ch_mois.Janvier).toBe(0);
  });

  /**
   * 11.4 - En présence d'une installation ECS, la récupération de distribution
   * ECS (Qrec) diminue le besoin de chauffage et le besoin ECS journalier est
   * sollicité pour chaque mois.
   */
  test('une installation ECS collective alimente la récupération de distribution', () => {
    const instal_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '2', rdim: 1 },
        generateur_ecs_collection: { generateur_ecs: [] }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, instal_ecs, [], [], null, 'maison', 1);

    expect(calc_besoin_ecs_j).toHaveBeenCalled();
    expect(ret.pertes_distribution_ecs_recup).toBeGreaterThan(0);
    // la récupération ECS réduit le besoin sous la valeur sans récupération
    expect(ret.besoin_ch).toBeLessThan(93.04163529546415);
  });
});

/**
 * Branches complémentaires : récupération de stockage ECS, cas immeuble,
 * degrés-heures nuls et compatibilité "bug for bug".
 */
describe('calc_besoin_ch - branches complémentaires', () => {
  beforeEach(() => {
    utilState.bug = false;
    vi.mocked(calc_ai_j).mockReset().mockReturnValue(5000);
    vi.mocked(calc_as_j).mockReset().mockReturnValue(2000);
    vi.mocked(calc_sse_j).mockReset().mockReturnValue(10);
    vi.mocked(calc_besoin_ecs_j).mockReset().mockReturnValue(10);
    vi.mocked(calc_Qrec_gen_j).mockReset().mockReturnValue(0);
  });

  /**
   * 11.4 - Plusieurs systèmes d'ECS : le besoin ECS est proratisé (1 / n).
   */
  test('plusieurs installations ECS : prorata appliqué au besoin ECS', () => {
    const instal_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '2', rdim: 1 },
        generateur_ecs_collection: { generateur_ecs: [] }
      },
      {
        donnee_entree: { enum_type_installation_id: '2', rdim: 1 },
        generateur_ecs_collection: { generateur_ecs: [] }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, instal_ecs, [], [], null, 'maison', 1);
    expect(ret.pertes_distribution_ecs_recup).toBeGreaterThan(0);
  });

  /**
   * 17.2.1.1 - Installation ECS simple en volume chauffé : récupération de
   * stockage (Qgw) prise en compte, sauf ballon/générateur hors volume chauffé.
   */
  test('installation ECS simple : récupération de stockage selon la position du ballon', () => {
    const instal_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '1' }, // rdim absent => repli sur 1
        generateur_ecs_collection: {
          generateur_ecs: [
            {
              // en volume chauffé => récupération comptée
              donnee_entree: { position_volume_chauffe_stockage: 1, position_volume_chauffe: 1 },
              donnee_intermediaire: { Qgw: 100 }
            },
            {
              // stockage hors volume chauffé => ignoré
              donnee_entree: { position_volume_chauffe_stockage: 0, position_volume_chauffe: 1 },
              donnee_intermediaire: { Qgw: 100 }
            },
            {
              // générateur hors volume chauffé => ignoré
              donnee_entree: { position_volume_chauffe_stockage: 1, position_volume_chauffe: 0 },
              donnee_intermediaire: { Qgw: 100 }
            },
            {
              // en volume chauffé mais sans Qgw => contribution nulle (Qgw || 0)
              donnee_entree: { position_volume_chauffe_stockage: 1, position_volume_chauffe: 1 },
              donnee_intermediaire: {}
            }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, instal_ecs, [], [], null, 'maison', 1);
    // un seul ballon récupérable (Qgw = 100) => pertes de stockage strictement positives
    expect(ret.pertes_stockage_ecs_recup).toBeGreaterThan(0);
  });

  /**
   * 9.1.1 - Un générateur sans position en volume chauffé renseignée (?? 0)
   * n'est pas retenu pour la récupération de génération.
   */
  test("générateur sans position en volume chauffé renseignée n'est pas récupéré", () => {
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(1000);
    const instal_ch = [
      {
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_intermediaire: { qp0: 1 },
              donnee_entree: {} // position_volume_chauffe indéfinie => ?? 0 => exclu
            }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], instal_ch, [], null, 'maison', 1);
    expect(calc_Qrec_gen_j).not.toHaveBeenCalled();
    expect(ret.pertes_generateur_ch_recup).toBe(0);
  });

  /**
   * Immeuble : la récupération ECS est mutualisée (prorata rdim / nombre de
   * logements) et le besoin ECS est agrégé avant application du facteur Qrec.
   */
  test('cas immeuble : mutualisation de la récupération ECS (rdim / nbLogements)', () => {
    const instal_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '1', rdim: 2 },
        generateur_ecs_collection: { generateur_ecs: [] }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, instal_ecs, [], [], null, 'immeuble', 4);
    expect(ret.pertes_distribution_ecs_recup).toBeGreaterThan(0);
  });

  /**
   * Un mois sans degrés-heures (dh19/dh21 = 0) donne des déperditions bvj nulles.
   */
  test('degrés-heures mensuels nuls : besoin nul sur le mois', () => {
    const dh19 = tvsBch.dh19[0].ca1.Janvier.h1a;
    const dh21 = tvsBch.dh21[0].ca1.Janvier.h1a;
    tvsBch.dh19[0].ca1.Janvier.h1a = 0;
    tvsBch.dh21[0].ca1.Janvier.h1a = 0;
    try {
      const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], [], [], null, 'maison', 1);
      expect(ret.besoin_ch).toBe(0);
      expect(ret.besoin_ch_depensier).toBe(0);
    } finally {
      tvsBch.dh19[0].ca1.Janvier.h1a = dh19;
      tvsBch.dh21[0].ca1.Janvier.h1a = dh21;
    }
  });

  /**
   * En mode "bug for bug", la récupération de génération est divisée par 1000
   * (reproduction d'une anomalie historique).
   */
  test('compatibilité "bug for bug" : récupération de génération divisée par 1000', () => {
    utilState.bug = true;
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(1000);
    const instal_ch = [
      {
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_intermediaire: { qp0: 1 },
              donnee_entree: { position_volume_chauffe: 1 }
            }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], instal_ch, [], null, 'maison', 1);
    // 1000 / 1000 = 1 Wh récupéré sur le seul mois
    expect(ret.pertes_generateur_ch_recup).toBeCloseTo(1, 9);
  });
});

/**
 * 9.1.1 - Pertes récupérées de génération : générateurs de la collection ECS assurant l'ECS
 * uniquement, avec Qp0 > 0 et en volume chauffé (issue #153).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9.1.1
 */
describe('calc_besoin_ch - récupération des pertes des générateurs ECS seuls (#153)', () => {
  const genEcsSeul = {
    donnee_entree: { enum_usage_generateur_id: '2', position_volume_chauffe: 1 },
    donnee_intermediaire: { qp0: 100 }
  };
  const genEcsMixte = {
    donnee_entree: { enum_usage_generateur_id: '3', position_volume_chauffe: 1 },
    donnee_intermediaire: { qp0: 100 }
  };
  const instal_ecs = [
    {
      donnee_entree: { enum_type_installation_id: '2', rdim: 1 },
      generateur_ecs_collection: { generateur_ecs: [genEcsSeul, genEcsMixte] }
    }
  ];

  beforeEach(() => {
    utilState.bug = false;
    vi.mocked(calc_ai_j).mockReset().mockReturnValue(5000);
    vi.mocked(calc_as_j).mockReset().mockReturnValue(2000);
    vi.mocked(calc_sse_j).mockReset().mockReturnValue(10);
    vi.mocked(calc_besoin_ecs_j).mockReset().mockReturnValue(10);
    vi.mocked(calc_Qrec_gen_j).mockReset().mockReturnValue(0);
    vi.mocked(calc_Qrec_gen_ecs_j).mockReset();
    vi.mocked(isGenerateurEcsSeulRecuperable)
      .mockReset()
      .mockImplementation((gen) => gen === genEcsSeul);
  });

  test('seuls les générateurs retenus par isGenerateurEcsSeulRecuperable sont calculés', () => {
    vi.mocked(calc_Qrec_gen_ecs_j).mockReturnValue(500);
    calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, instal_ecs, [], [], null, 'maison', 1);

    // un appel conventionnel (nref19 = 100) et un appel dépensier (nref21 = 120) pour le seul mois
    expect(calc_Qrec_gen_ecs_j).toHaveBeenCalledTimes(2);
    expect(calc_Qrec_gen_ecs_j).toHaveBeenCalledWith(genEcsSeul, 100);
    expect(calc_Qrec_gen_ecs_j).toHaveBeenCalledWith(genEcsSeul, 120);
    expect(calc_Qrec_gen_ecs_j).not.toHaveBeenCalledWith(genEcsMixte, expect.anything());
  });

  test('la récupération du générateur ECS seul s’ajoute aux pertes récupérées et réduit le besoin', () => {
    vi.mocked(isGenerateurEcsSeulRecuperable).mockReturnValue(false);
    const sansRecup = calc_besoin_ch(
      0,
      0,
      0,
      0,
      100,
      100,
      3,
      instal_ecs,
      [],
      [],
      null,
      'maison',
      1
    );

    vi.mocked(isGenerateurEcsSeulRecuperable).mockImplementation((gen) => gen === genEcsSeul);
    vi.mocked(calc_Qrec_gen_ecs_j).mockImplementation((gen, nref) => (nref === 100 ? 500 : 600));
    const avecRecup = calc_besoin_ch(
      0,
      0,
      0,
      0,
      100,
      100,
      3,
      instal_ecs,
      [],
      [],
      null,
      'maison',
      1
    );

    expect(avecRecup.pertes_generateur_ch_recup).toBeCloseTo(500, 9);
    expect(avecRecup.pertes_generateur_ch_recup_depensier).toBeCloseTo(600, 9);
    // 500 Wh récupérés => besoin réduit de 0,5 kWh
    expect(sansRecup.besoin_ch - avecRecup.besoin_ch).toBeCloseTo(0.5, 9);
    expect(sansRecup.besoin_ch_depensier - avecRecup.besoin_ch_depensier).toBeCloseTo(0.6, 9);
  });

  test('cumul avec la récupération des générateurs de chauffage', () => {
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(1000);
    vi.mocked(calc_Qrec_gen_ecs_j).mockReturnValue(500);
    const instal_ch = [
      {
        generateur_chauffage_collection: {
          generateur_chauffage: [
            { donnee_intermediaire: { qp0: 1 }, donnee_entree: { position_volume_chauffe: 1 } }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(
      0,
      0,
      0,
      0,
      100,
      100,
      3,
      instal_ecs,
      instal_ch,
      [],
      null,
      'maison',
      1
    );
    expect(ret.pertes_generateur_ch_recup).toBeCloseTo(1500, 9);
  });

  test('compatibilité "bug for bug" : même facteur 1000 que pour les générateurs de chauffage', () => {
    utilState.bug = true;
    vi.mocked(calc_Qrec_gen_ecs_j).mockReturnValue(500);
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, instal_ecs, [], [], null, 'maison', 1);
    expect(ret.pertes_generateur_ch_recup).toBeCloseTo(0.5, 9);
  });

  test('installation ECS sans générateur : pas de récupération', () => {
    const ret = calc_besoin_ch(
      0,
      0,
      0,
      0,
      100,
      100,
      3,
      [{ donnee_entree: { enum_type_installation_id: '2' }, generateur_ecs_collection: {} }],
      [],
      [],
      null,
      'maison',
      1
    );
    expect(calc_Qrec_gen_ecs_j).not.toHaveBeenCalled();
    expect(ret.pertes_generateur_ch_recup).toBe(0);
  });
});

/**
 * Immeuble à plusieurs installations ECS dont une collective (ex. installation mixte
 * individuelle/collective) : besoin de chaque installation = Becs_immeuble × Sh_ecs / SH, × rdim
 * pour une installation individuelle (Tribu, Calcul_batiment.Calcul_Cecs et l. 374).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9.1.1 et §11.4
 */
describe('calc_besoin_ch - immeuble à installations ECS individuelles et collectives', () => {
  const ecsIndividuelle = (surface_habitable, rdim) => ({
    donnee_entree: { enum_type_installation_id: '1', surface_habitable, rdim },
    generateur_ecs_collection: { generateur_ecs: [] }
  });
  const ecsCollective = (surface_habitable) => ({
    donnee_entree: { enum_type_installation_id: '2', surface_habitable, rdim: 1 },
    generateur_ecs_collection: { generateur_ecs: [] }
  });

  beforeEach(() => {
    utilState.bug = false;
    vi.mocked(calc_ai_j).mockReset().mockReturnValue(5000);
    vi.mocked(calc_as_j).mockReset().mockReturnValue(2000);
    vi.mocked(calc_sse_j).mockReset().mockReturnValue(10);
    vi.mocked(calc_besoin_ecs_j).mockReset().mockReturnValue(10);
    vi.mocked(calc_Qrec_gen_j).mockReset().mockReturnValue(0);
  });

  test('isImmeubleMultiEcs : immeuble, plusieurs installations dont une collective, surfaces renseignées', () => {
    const mixte = [ecsIndividuelle(20, 1), ecsCollective(155)];
    expect(isImmeubleMultiEcs(mixte, 'immeuble', 175)).toBe(true);
    expect(isImmeubleMultiEcs(mixte, 'appartement', 175)).toBe(false);
    expect(isImmeubleMultiEcs([ecsCollective(155)], 'immeuble', 175)).toBe(false);
    expect(
      isImmeubleMultiEcs([ecsIndividuelle(20, 1), ecsIndividuelle(155, 1)], 'immeuble', 175)
    ).toBe(false);
    expect(isImmeubleMultiEcs([ecsIndividuelle(0, 1), ecsCollective(155)], 'immeuble', 175)).toBe(
      false
    );
    expect(isImmeubleMultiEcs(mixte, 'immeuble', 0)).toBe(false);
  });

  test('prorataEcsImmeubleMulti : Sh_ecs / SH, × rdim pour une installation individuelle seulement', () => {
    expect(
      prorataEcsImmeubleMulti(
        { enum_type_installation_id: '1', surface_habitable: 20, rdim: 3 },
        200
      )
    ).toBeCloseTo(0.3, 12);
    expect(
      prorataEcsImmeubleMulti({ enum_type_installation_id: '1', surface_habitable: 20 }, 200)
    ).toBeCloseTo(0.1, 12);
    expect(
      prorataEcsImmeubleMulti(
        { enum_type_installation_id: '2', surface_habitable: 150, rdim: 3 },
        200
      )
    ).toBeCloseTo(0.75, 12);
  });

  test("prorataEcsImmeubleMulti : pas de × rdim si Sh_ecs est la surface totale de l'installation", () => {
    expect(
      prorataEcsImmeubleMulti(
        { enum_type_installation_id: '1', surface_habitable: 3713, rdim: 64 },
        3918,
        false
      )
    ).toBeCloseTo(3713 / 3918, 12);
  });

  test("isSurfaceEcsParLogement : détecte la convention d'export de Sh_ecs", () => {
    // Σ Sh × rdim = 20 × 3 + 115 = 175 = SH → surface d'un logement
    expect(isSurfaceEcsParLogement([ecsIndividuelle(20, 3), ecsCollective(115)], 175)).toBe(true);
    // Σ Sh = 3713 + 205 = 3918 = SH (ex. LICIEL) → surface totale de l'installation
    expect(isSurfaceEcsParLogement([ecsIndividuelle(3713, 64), ecsCollective(205)], 3918)).toBe(
      false
    );
  });

  test('isSurfaceEcsParLogement : surface ou rdim absents comptés 0 et 1', () => {
    const sansRdim = { donnee_entree: { enum_type_installation_id: '1', surface_habitable: 50 } };
    const sansSurface = { donnee_entree: { enum_type_installation_id: '2' } };
    // Σ Sh = Σ Sh × rdim = 50 : égalité → convention « surface de l'installation »
    expect(isSurfaceEcsParLogement([sansRdim, sansSurface], 50)).toBe(false);
    // Σ Sh × rdim = 20 × 3 = 60 = SH, Σ Sh = 20
    expect(isSurfaceEcsParLogement([ecsIndividuelle(20, 3), sansSurface], 60)).toBe(true);
  });

  test('pertes récupérées sans × rdim quand Σ Sh_ecs = SH (DPE 2369E3867365O, LICIEL)', () => {
    const instal_ecs = [ecsIndividuelle(160, 8), ecsCollective(40)];
    const ret = calc_besoin_ch(0, 0, 0, 0, 200, 100, 3, instal_ecs, [], [], null, 'immeuble', 9);
    const total = (0.1 * 10 * (160 / 200) + 0.212 * 10 * (40 / 200)) * 1000;
    expect(ret.pertes_distribution_ecs_recup).toBeCloseTo((0.48 * 100 * total) / 8760, 9);
  });

  test('pertes de distribution ECS récupérées pondérées par Sh_ecs / SH (et rdim en individuel)', () => {
    // Σ Sh × rdim = 20 × 3 + 115 = 175 = SH : Sh_ecs exportée par logement
    const instal_ecs = [ecsIndividuelle(20, 3), ecsCollective(115)];
    const ret = calc_besoin_ch(0, 0, 0, 0, 175, 100, 3, instal_ecs, [], [], null, 'immeuble', 4);
    // Σ Tau × Becs × prorata (Wh) : 0,1 × 10 × (20 / 175 × 3) + 0,212 × 10 × 115 / 175
    const total = (0.1 * 10 * ((20 / 175) * 3) + 0.212 * 10 * (115 / 175)) * 1000;
    // un seul mois : Qrec_j = Qrec = 0,48 × ΣNref19 / 8760 × total
    expect(ret.pertes_distribution_ecs_recup).toBeCloseTo((0.48 * 100 * total) / 8760, 9);
  });
});
