import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler le module de ventilation :
 * - `tv` : accès aux tables `debits_ventilation` / `q4pa_conv`, on contrôle les lignes ;
 * - `requestInput` / `requestInputID` : passe-plats vers les données d'entrée ;
 * - `bug_for_bug_compat` : désactivé pour isoler le comportement nominal ;
 * - `calc_pvent` (5_conso_ventilation.js) : espion, la conso de ventilation est testée ailleurs.
 */
vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInput: (de, du, field) => de[field],
  requestInputID: (de, du, field) => de[`enum_${field}_id`],
  bug_for_bug_compat: false
}));

vi.mock('./5_conso_ventilation.js', () => ({
  default: vi.fn()
}));

const { default: calc_ventilation, calc_hperm } = await import('./4_ventilation.js');
const { tv } = await import('./utils.js');
const { default: calc_pvent } = await import('./5_conso_ventilation.js');

/** Ligne figée de la table `debits_ventilation`. */
const ROW_DEBITS = {
  qvarep_conv: '1.2',
  qvasouf_conv: '0.5',
  smea_conv: '20',
  tv_debits_ventilation_id: '3'
};

beforeEach(() => {
  tv.mockReset();
  vi.mocked(calc_pvent).mockReset();
  tv.mockImplementation((table) => {
    if (table === 'debits_ventilation') return { ...ROW_DEBITS };
    if (table === 'q4pa_conv') return { q4pa_conv: '1.3', tv_q4pa_conv_id: '9' };
    return null;
  });
});

/**
 * Déperdition par renouvellement d'air dû aux infiltrations (Hperm)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §4
 */
describe('calc_hperm - déperdition par perméabilité', () => {
  test('plusieurs façades exposées (pfe=1) : e=0,07 et f=15', () => {
    const di = { q4pa_conv: 1.3, smea_conv: 20, qvasouf_conv: 0.5, qvarep_conv: 1.2 };
    calc_hperm(di, 100, 2.5, 80, 1);
    // valeur de référence de régression
    expect(di.hperm).toBeCloseTo(124.24055432137072, 9);
  });

  test('une seule façade exposée (pfe=0) : e=0,02 et f=20', () => {
    const di = { q4pa_conv: 1.3, smea_conv: 20, qvasouf_conv: 0.5, qvarep_conv: 1.2 };
    calc_hperm(di, 100, 2.5, 80, 0);
    // valeur de référence de régression
    expect(di.hperm).toBeCloseTo(31.494527138357977, 9);
  });

  test('le nombre de façades exposées modifie le résultat', () => {
    const diMulti = { q4pa_conv: 1.3, smea_conv: 20, qvasouf_conv: 0.5, qvarep_conv: 1.2 };
    const diSingle = { q4pa_conv: 1.3, smea_conv: 20, qvasouf_conv: 0.5, qvarep_conv: 1.2 };
    calc_hperm(diMulti, 100, 2.5, 80, 1);
    calc_hperm(diSingle, 100, 2.5, 80, 0);
    expect(diMulti.hperm).not.toBeCloseTo(diSingle.hperm, 5);
  });
});

/** Fabrique un objet ventilation avec les données d'entrée utiles. */
function ventilation(de = {}) {
  return { donnee_entree: { enum_type_ventilation_id: '1', ...de } };
}

const CG = {
  hsp: 2.5,
  enum_periode_construction_id: '1',
  enum_methode_application_dpe_log_id: '1'
};

describe('calc_ventilation - orchestration', () => {
  test('surface ventilée absente : la surface habitable Sh est utilisée', () => {
    const vt = ventilation({ q4pa_conv_saisi: 1.3 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    // Hvent = 0,34 * qvarep_conv * surface_ventile = 0,34 * 1,2 * 100
    expect(vt.donnee_intermediaire.hvent).toBeCloseTo(40.8, 9);
  });

  test('surface ventilée collective : divisée par la clé de répartition', () => {
    const vt = ventilation({
      surface_ventile: 200,
      cle_repartition_ventilation: 2,
      q4pa_conv_saisi: 1.3
    });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    // surface_ventile = 200 / 2 = 100 => Hvent = 0,34 * 1,2 * 100
    expect(vt.donnee_intermediaire.hvent).toBeCloseTo(40.8, 9);
  });

  test('Q4Pa mesuré saisi : utilisé directement, sans lecture de la table q4pa_conv', () => {
    const vt = ventilation({ q4pa_conv_saisi: 0.6 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(vt.donnee_intermediaire.q4pa_conv).toBe(0.6);
    expect(tv).not.toHaveBeenCalledWith('q4pa_conv', expect.anything());
  });

  test('Q4Pa non saisi : lu dans la table q4pa_conv', () => {
    const vt = ventilation();
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(tv).toHaveBeenCalledWith('q4pa_conv', expect.any(Object));
    expect(vt.donnee_intermediaire.q4pa_conv).toBe(1.3);
  });

  test('les débits conventionnels intermédiaires sont supprimés du résultat', () => {
    const vt = ventilation({ q4pa_conv_saisi: 1.3 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(vt.donnee_intermediaire.qvarep_conv).toBeUndefined();
    expect(vt.donnee_intermediaire.qvasouf_conv).toBeUndefined();
    expect(vt.donnee_intermediaire.smea_conv).toBeUndefined();
  });

  test('la consommation de ventilation est déléguée à calc_pvent', () => {
    const vt = ventilation({ q4pa_conv_saisi: 1.3 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(calc_pvent).toHaveBeenCalledWith(
      vt.donnee_intermediaire,
      vt.donnee_entree,
      vt.donnee_utilisateur,
      'th'
    );
  });

  test('surface ventilée différente de Sh sans clé de répartition : divisée par 1', () => {
    // Branche `de.cle_repartition_ventilation || 1` : surface_ventile conservée telle quelle
    const vt = ventilation({ surface_ventile: 50, q4pa_conv_saisi: 1.3 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    // surface_ventile = 50 / 1 => Hvent = 0,34 * 1,2 * 50
    expect(vt.donnee_intermediaire.hvent).toBeCloseTo(0.34 * 1.2 * 50, 9);
  });

  test("débits de ventilation introuvables : message d'erreur, débits non renseignés", () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockImplementation((table) => (table === 'q4pa_conv' ? { q4pa_conv: '1.3' } : null));

    const vt = ventilation({ q4pa_conv_saisi: 1.3 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('debits_ventilation'));
    errorSpy.mockRestore();
  });

  test("valeur forfaitaire q4pa_conv introuvable : message d'erreur", () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockImplementation((table) => (table === 'debits_ventilation' ? { ...ROW_DEBITS } : null));

    const vt = ventilation();
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('q4pa_conv'));
    errorSpy.mockRestore();
  });

  test('classification des surfaces : majorité isolée et joints présents => "1"/"1"', () => {
    const vt = ventilation();
    const murs = [
      // b === 0 => paroi ignorée dans les deux sommes
      {
        donnee_intermediaire: { b: 0 },
        donnee_entree: { enum_type_isolation_id: '3', surface_paroi_opaque: 999 }
      },
      // type inconnu (1) mais période d'isolation >= 3 => considérée isolée
      {
        donnee_intermediaire: { b: 1 },
        donnee_entree: {
          enum_type_isolation_id: '1',
          enum_periode_isolation_id: '3',
          surface_paroi_opaque: 50
        }
      },
      // type isolé connu (3) => isolée
      {
        donnee_intermediaire: { b: 1 },
        donnee_entree: { enum_type_isolation_id: '3', surface_paroi_opaque: 40 }
      }
    ];
    const phs = [
      // type non isolé (2) => non isolée
      {
        donnee_intermediaire: { b: 1 },
        donnee_entree: { enum_type_isolation_id: '2', surface_paroi_opaque: 10 }
      },
      // type inconnu (1) période < 3 => non isolée
      {
        donnee_intermediaire: { b: 1 },
        donnee_entree: {
          enum_type_isolation_id: '1',
          enum_periode_isolation_id: '1',
          surface_paroi_opaque: 5
        }
      }
    ];
    // surface_isolee = 90, surface_non_isolee = 15 => isolation_surfaces = '1'
    const portes = [
      { donnee_entree: { presence_joint: 1, surface_porte: 2 } },
      { donnee_entree: { presence_joint: 0, surface_porte: 1 } }
    ];
    const baies = [
      { donnee_entree: { presence_joint: 1, surface_totale_baie: 5 } },
      { donnee_entree: { presence_joint: 0, surface_totale_baie: 1 } }
    ];
    // avec joint = 7, sans joint = 2 => ratio 7/9 > 0,5 => presence_joints_menuiserie = '1'
    calc_ventilation(vt, CG, 'th', 80, 100, murs, phs, portes, baies);

    expect(tv).toHaveBeenCalledWith('q4pa_conv', {
      enum_periode_construction_id: '1',
      enum_methode_application_dpe_log_id: '1',
      isolation_surfaces: '1',
      presence_joints_menuiserie: '1'
    });
  });

  test('classification des surfaces : majorité non isolée et sans joints => "0"/"0"', () => {
    const vt = ventilation();
    const murs = [
      {
        donnee_intermediaire: { b: 1 },
        donnee_entree: { enum_type_isolation_id: '2', surface_paroi_opaque: 100 }
      }
    ];
    const baies = [{ donnee_entree: { presence_joint: 0, surface_totale_baie: 10 } }];

    calc_ventilation(vt, CG, 'th', 80, 100, murs, [], [], baies);

    expect(tv).toHaveBeenCalledWith(
      'q4pa_conv',
      expect.objectContaining({ isolation_surfaces: '0', presence_joints_menuiserie: '0' })
    );
  });

  test('fiche technique façades exposées incohérente : valeur de la fiche imposée', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Fiche "Non" => pfe = 0, alors que plusieurs_facade_exposee = 1 => incohérence signalée
    const vt = ventilation({
      q4pa_conv_saisi: 1.3,
      plusieurs_facade_exposee: 1,
      ficheTechniqueFacadesExposees: { valeur: 'Non', description: 'FT façades' }
    });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('plusieurs_facade_exposee'));
    errorSpy.mockRestore();
  });

  test('fiche technique façades exposées cohérente : aucun message', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Fiche "Deux" => pfe = 1, cohérent avec plusieurs_facade_exposee = 1
    const vt = ventilation({
      q4pa_conv_saisi: 1.3,
      plusieurs_facade_exposee: 1,
      ficheTechniqueFacadesExposees: { valeur: 'Deux', description: 'FT façades' }
    });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('fiche technique ventilation post 2012 incohérente : valeur forcée à 1', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const vt = ventilation({
      q4pa_conv_saisi: 1.3,
      ventilation_post_2012: 0,
      ficheTechniqueVentilationPost2012: { description: 'FT ventilation' }
    });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('ventilation_post_2012'));
    expect(vt.donnee_entree.ventilation_post_2012).toBe(1);
    errorSpy.mockRestore();
  });
});

/**
 * Comportement historique `bug_for_bug_compat` activé : le seuil des joints devient `>= 0,5`
 * et les incohérences avec la ligne `q4pa_conv` déjà saisie dans le DPE sont signalées.
 */
describe('calc_ventilation - compatibilité bug_for_bug_compat activée', () => {
  /**
   * Recharge le module avec `bug_for_bug_compat = true`. Le double de `tv` renvoie une ligne
   * `q4pa_conv` distincte selon que le matcher cible l'identifiant déjà saisi ou le matcher complet.
   */
  async function chargerAvecBug(rowParId) {
    vi.resetModules();
    const tvBug = vi.fn((table, matcher) => {
      if (table === 'debits_ventilation') return { ...ROW_DEBITS };
      if (table === 'q4pa_conv') {
        if (matcher.tv_q4pa_conv_id) return rowParId;
        return { q4pa_conv: '1.3', tv_q4pa_conv_id: '9' };
      }
      return null;
    });
    vi.doMock('./utils.js', () => ({
      tv: tvBug,
      requestInput: (de, du, field) => de[field],
      requestInputID: (de, du, field) => de[`enum_${field}_id`],
      bug_for_bug_compat: true
    }));
    vi.doMock('./5_conso_ventilation.js', () => ({ default: vi.fn() }));
    const { default: calc_ventilation_bug } = await import('./4_ventilation.js');
    return { calc_ventilation_bug, tvBug };
  }

  afterEach(() => {
    vi.doUnmock('./utils.js');
    vi.doUnmock('./5_conso_ventilation.js');
    vi.resetModules();
  });

  /** Surfaces produisant isolation_surfaces = '1' et joints = '1'. */
  function surfacesIsolantes() {
    return {
      murs: [
        {
          donnee_intermediaire: { b: 1 },
          donnee_entree: { enum_type_isolation_id: '3', surface_paroi_opaque: 100 }
        }
      ],
      baies: [{ donnee_entree: { presence_joint: 1, surface_totale_baie: 10 } }]
    };
  }

  test('ligne DPE incohérente : les deux écarts (isolation et joints) sont signalés', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { calc_ventilation_bug } = await chargerAvecBug({
      q4pa_conv: '1.3',
      tv_q4pa_conv_id: '9',
      isolation_surfaces: '0',
      presence_joints_menuiserie: '0',
      description: 'ventilation'
    });

    const { murs, baies } = surfacesIsolantes();
    const vt = {
      donnee_entree: {
        enum_type_ventilation_id: '1',
        tv_q4pa_conv_id: 9,
        description: 'ventilation'
      }
    };
    calc_ventilation_bug(vt, CG, 'th', 80, 100, murs, [], [], baies);

    // Deux messages : isolation_surfaces et presence_joints_menuiserie
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('isolation_surfaces'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('presence_joints_menuiserie'));
    errorSpy.mockRestore();
  });

  test('ligne DPE cohérente : aucun écart signalé', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { calc_ventilation_bug } = await chargerAvecBug({
      q4pa_conv: '1.3',
      tv_q4pa_conv_id: '9',
      isolation_surfaces: '1',
      presence_joints_menuiserie: '1'
    });

    const { murs, baies } = surfacesIsolantes();
    const vt = {
      donnee_entree: { enum_type_ventilation_id: '1', tv_q4pa_conv_id: 9 }
    };
    calc_ventilation_bug(vt, CG, 'th', 80, 100, murs, [], [], baies);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('ligne DPE saisie introuvable : aucune comparaison effectuée', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // rowParId = null => la branche `if (rowQ4paConv)` est fausse
    const { calc_ventilation_bug } = await chargerAvecBug(null);

    // Baie sans joint => ratio < 0,5 => branche '0' du seuil `>= 0,5` (mode bug)
    const murs = [
      {
        donnee_intermediaire: { b: 1 },
        donnee_entree: { enum_type_isolation_id: '3', surface_paroi_opaque: 100 }
      }
    ];
    const baies = [{ donnee_entree: { presence_joint: 0, surface_totale_baie: 10 } }];
    const vt = {
      donnee_entree: { enum_type_ventilation_id: '1', tv_q4pa_conv_id: 9 }
    };
    calc_ventilation_bug(vt, CG, 'th', 80, 100, murs, [], [], baies);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
