import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler la logique du module :
 * - `tv` : accès à la table `generateur_combustion` (ligne contrôlée) ;
 * - `tvColumnLines` : liste des critères de puissance (vidée pour neutraliser le critère Pn) ;
 * - `convertExpression` : non utilisée dans le chemin testé (critères vides) ;
 * - `bug_for_bug_compat` : désactivé pour isoler le comportement nominal ;
 * - `enums` : mapping minimal ;
 * - les modules de substitution de générateurs (bouilleur / chaudière / pac) : simples espions ;
 * - `getFicheTechnique` : présence d'un ventilateur.
 * La bibliothèque `mathjs` (evaluate) n'est pas mockée : c'est une fonction pure déterministe.
 */
const state = vi.hoisted(() => ({ bug: false }));

vi.mock('./utils.js', () => ({
  get bug_for_bug_compat() {
    return state.bug;
  },
  tv: vi.fn(),
  tvColumnLines: vi.fn(() => []),
  convertExpression: vi.fn((x) => x)
}));

vi.mock('./enums.js', () => ({
  default: {
    type_generateur_ch: {
      89: 'chaudière gaz standard 2001-2015',
      X: 'chaudière fioul',
      Y: 'chaudière gaz'
    },
    type_generateur_ecs: {
      50: 'chaudière gaz standard',
      A: 'chaudière gaz',
      B: 'chaudière fioul',
      84: "système collectif par défaut en abscence d'information"
    }
  }
}));

vi.mock('./13.2_generateur_combustion_bouilleur.js', () => ({
  updateGenerateurBouilleurs: vi.fn()
}));
vi.mock('./13.2_generateur_combustion_chaudiere.js', () => ({
  updateGenerateurChaudieres: vi.fn()
}));
vi.mock('./13.2_generateur_pac.js', () => ({
  updateGenerateurPacs: vi.fn()
}));
vi.mock('./ficheTechnique.js', () => ({
  default: vi.fn()
}));

const { tv_generateur_combustion, updateGenerateurCombustion } = await import(
  './13.2_generateur_combustion.js'
);
const { tv, tvColumnLines } = await import('./utils.js');
const { updateGenerateurBouilleurs } = await import('./13.2_generateur_combustion_bouilleur.js');
const { updateGenerateurChaudieres } = await import('./13.2_generateur_combustion_chaudiere.js');
const { updateGenerateurPacs } = await import('./13.2_generateur_pac.js');
const { default: getFicheTechnique } = await import('./ficheTechnique.js');

beforeEach(() => {
  vi.mocked(tv).mockReset();
  vi.mocked(tvColumnLines).mockReset();
  vi.mocked(tvColumnLines).mockReturnValue([]);
  vi.mocked(updateGenerateurBouilleurs).mockReset();
  vi.mocked(updateGenerateurChaudieres).mockReset();
  vi.mocked(updateGenerateurPacs).mockReset();
  vi.mocked(getFicheTechnique).mockReset();
  state.bug = false;
});

const ROW_DEFAUT = {
  tv_generateur_combustion_id: '42',
  rpn: '90',
  rpint: '85',
  qp0_perc: '5',
  pveil: '10'
};

/**
 * 13.2 - Récupération des caractéristiques forfaitaires d'un générateur à combustion.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2
 */
describe('tv_generateur_combustion - caractéristiques du générateur', () => {
  test('puissance nominale calculée à partir de GV et Tbase lorsqu’elle est absente', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = {};
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    // Pn = (1.2 * GV * (19 - Tbase)) / 0.95^3 -- valeur de référence de régression
    expect(di.pn).toBeCloseTo(7837.877241580406, 9);
    expect(de.tv_generateur_combustion_id).toBe(42);
  });

  test('puissance nominale déjà renseignée : non recalculée', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 12345 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.pn).toBe(12345);
  });

  test('méthode forfaitaire (1) en chauffage : rpn, rpint, qp0 et pveil renseignés', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.rpn).toBeCloseTo(0.9, 9);
    expect(di.rpint).toBeCloseTo(0.85, 9);
    // qp0_perc constant '5' (ni Pn ni %) => 5 * 1000 * ratio
    expect(di.qp0).toBe(5000);
    expect(di.pveil).toBe(10);
  });

  test('type ECS : le rendement intermédiaire rpint n’est pas calculé', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ecs_id: '50', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ecs', 200, -9, 1);
    expect(di.rpn).toBeCloseTo(0.9, 9);
    expect(di.rpint).toBeUndefined();
  });

  test('qp0_perc exprimé en fonction de Pn : qp0 proportionnel à la puissance nominale', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT, qp0_perc: 'Pn' });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    // qp0_calc = Pn(kW) = 20 ; inclut 'Pn' => qp0 = 20 * 1000 * ratio = pn
    expect(di.qp0).toBe(20000);
  });

  test('présence d’une ventouse : sélection du couple (E, F) dans la formule de rendement', () => {
    const diSansVentouse = { pn: 20000 };
    tv.mockReturnValue({ ...ROW_DEFAUT, rpn: 'E*40' });
    tv_generateur_combustion(
      {},
      diSansVentouse,
      { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 },
      'ch',
      200,
      -9,
      1
    );
    // E = 2.5 (sans ventouse) => rpn = 2.5*40 / 100 = 1
    expect(diSansVentouse.rpn).toBeCloseTo(1, 9);

    const diVentouse = { pn: 20000 };
    tv.mockReturnValue({ ...ROW_DEFAUT, rpn: 'E*40' });
    tv_generateur_combustion(
      {},
      diVentouse,
      { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 1 },
      'ch',
      200,
      -9,
      1
    );
    // E = 1.75 (avec ventouse) => rpn = 1.75*40 / 100 = 0.7
    expect(diVentouse.rpn).toBeCloseTo(0.7, 9);
  });

  test('méthode 4 : rpn, rpint et qp0 saisis sont conservés (non recalculés)', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000, rpn: 0.5, rpint: 0.4, qp0: 999 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 4);
    expect(di.rpn).toBe(0.5);
    expect(di.rpint).toBe(0.4);
    expect(di.qp0).toBe(999);
  });

  test('puissance de veilleuse saisie prise en compte hors méthode forfaitaire', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000, pveilleuse: 15 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 2);
    expect(di.pveil).toBe(15);
  });

  test('aucune ligne forfaitaire trouvée : arrêt sans identifiant de générateur', () => {
    tv.mockReturnValue(undefined);
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(de.tv_generateur_combustion_id).toBeUndefined();
  });

  test('ratio de virtualisation absent : valeur de repli 1', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT, qp0_perc: 'Pn' });
    const di = { pn: 20000 };
    // pas de ratio_virtualisation -> `|| 1`
    const de = { enum_type_generateur_ch_id: '89', presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    // qp0_perc = 'Pn' => qp0 = Pn(kW) * 1000 * ratio(=1) = pn
    expect(di.qp0).toBe(20000);
  });

  test('qp0_perc exprimé en pourcentage : qp0 proportionnel à la puissance nominale', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT, qp0_perc: '2%' });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    // '2%' => 0.02 (mathjs) ; contient '%' mais pas 'Pn' => qp0 = 0.02 * pn
    expect(di.qp0).toBeCloseTo(400, 9);
  });

  test('qp0_perc absent : qp0 nul', () => {
    const row = { ...ROW_DEFAUT };
    delete row.qp0_perc;
    tv.mockReturnValue(row);
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.qp0).toBe(0);
  });

  test('pveil forfaitaire absent : valeur de repli 0', () => {
    const row = { ...ROW_DEFAUT };
    delete row.pveil;
    tv.mockReturnValue(row);
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.pveil).toBe(0);
  });

  test('critère de puissance : le critère satisfait est renseigné dans le matcher', () => {
    tvColumnLines.mockReturnValue(['Pn ≤ 50', 'Pn > 50']);
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    // Pn = 20000 / (1 * 1000) = 20 ≤ 50 -> premier critère retenu, '≤' restauré
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ critere_pn: 'Pn ≤ 50' })
    );
  });

  test('critère de puissance : aucun critère satisfait -> avertissement et critère nul', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tvColumnLines.mockReturnValue(['Pn > 100']);
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    // Pn = 20 n'est pas > 100 -> aucun critère satisfait (ret reste undefined)
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ critere_pn: undefined })
    );
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

/**
 * 13.2 - Comportements spécifiques activés par bug_for_bug_compat (redressement de données DPE).
 */
describe('tv_generateur_combustion - compatibilité bug_for_bug_compat', () => {
  test('générateur ECS collectif par défaut (84) : caractéristiques issues de tv_generateur_combustion_id', () => {
    state.bug = true;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = {
      enum_type_generateur_ecs_id: '84',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ecs', 200, -9, 1);
    // La ligne est récupérée directement via l'identifiant du générateur à combustion
    expect(tv).toHaveBeenCalledWith('generateur_combustion', {
      tv_generateur_combustion_id: '42'
    });
    expect(de.tv_generateur_combustion_id).toBe(42);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('générateur CH collectif par défaut (119) : même récupération directe', () => {
    state.bug = true;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = {
      enum_type_generateur_ch_id: '119',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(tv).toHaveBeenCalledWith('generateur_combustion', {
      tv_generateur_combustion_id: '42'
    });
    vi.restoreAllMocks();
  });

  test('type 84 sans tv_generateur_combustion_id : retour au chemin forfaitaire nominal', () => {
    state.bug = true;
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ecs_id: '84', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ecs', 200, -9, 1);
    // Pas d'identifiant -> matcher forfaitaire construit avec le type de générateur
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ enum_type_generateur_ecs_id: '84' })
    );
  });

  test('ECS : identifiant utilisé différent de celui du DPE non compatible -> erreur signalée', () => {
    state.bug = true;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockImplementation((table, matcher) => {
      // La ligne du DPE (id 99) ne référence pas le type de générateur ECS courant
      if (matcher.tv_generateur_combustion_id === '99') {
        return { tv_generateur_combustion_id: '99', enum_type_generateur_ecs_id: '60|61' };
      }
      return { ...ROW_DEFAUT };
    });
    const di = { pn: 20000 };
    const de = {
      enum_type_generateur_ecs_id: '50',
      tv_generateur_combustion_id: '99',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ecs', 200, -9, 1);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  test('ECS : identifiant du DPE cohérent avec le type de générateur -> aucune erreur', () => {
    state.bug = true;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockImplementation((table, matcher) => {
      if (matcher.tv_generateur_combustion_id === '99') {
        return { tv_generateur_combustion_id: '99', enum_type_generateur_ecs_id: '50|60' };
      }
      return { ...ROW_DEFAUT };
    });
    const di = { pn: 20000 };
    const de = {
      enum_type_generateur_ecs_id: '50',
      tv_generateur_combustion_id: '99',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ecs', 200, -9, 1);
    // '50' figure dans '50|60' -> pas d'incohérence signalée
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  test('ECS : ligne DPE introuvable pour l’identifiant saisi -> aucune erreur', () => {
    state.bug = true;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockImplementation((table, matcher) => {
      if (matcher.tv_generateur_combustion_id === '99') return undefined;
      return { ...ROW_DEFAUT };
    });
    const di = { pn: 20000 };
    const de = {
      enum_type_generateur_ecs_id: '50',
      tv_generateur_combustion_id: '99',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ecs', 200, -9, 1);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

/**
 * 13.2 - Génération mixte Chauffage + ECS : redressement du type de générateur ECS.
 */
describe('tv_generateur_combustion - génération mixte (checkEcsVsChauffageForMixteGeneration)', () => {
  /** Fabrique un dpe contenant un générateur de chauffage mixte (usage 3). */
  function dpeAvecChMixte(chId) {
    return {
      logement: {
        installation_chauffage_collection: {
          installation_chauffage: [
            {
              generateur_chauffage_collection: {
                generateur_chauffage: [
                  {
                    donnee_entree: {
                      enum_usage_generateur_id: '3',
                      enum_type_generateur_ch_id: chId
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    };
  }

  test('types ECS et CH différents : le type de générateur ECS est aligné sur celui du chauffage', () => {
    state.bug = true;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    // ECS 'A' = chaudière gaz ; CH mixte 'X' = chaudière fioul -> alignement sur 'B' (chaudière fioul ECS)
    const de = {
      enum_type_generateur_ecs_id: 'A',
      enum_usage_generateur_id: '3',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion(dpeAvecChMixte('X'), di, de, 'ecs', 200, -9, 1);
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ enum_type_generateur_ecs_id: 'B' })
    );
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  test('types ECS et CH identiques : type de générateur ECS conservé', () => {
    state.bug = true;
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    // ECS 'A' = chaudière gaz ; CH mixte 'Y' = chaudière gaz -> pas de changement
    const de = {
      enum_type_generateur_ecs_id: 'A',
      enum_usage_generateur_id: '3',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion(dpeAvecChMixte('Y'), di, de, 'ecs', 200, -9, 1);
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ enum_type_generateur_ecs_id: 'A' })
    );
  });

  test('aucun générateur de chauffage mixte : type de générateur ECS conservé', () => {
    state.bug = true;
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const dpe = {
      logement: {
        installation_chauffage_collection: {
          installation_chauffage: [
            {
              generateur_chauffage_collection: {
                // usage 1 (non mixte) -> filtré
                generateur_chauffage: [
                  {
                    donnee_entree: {
                      enum_usage_generateur_id: '1',
                      enum_type_generateur_ch_id: 'X'
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    };
    const de = {
      enum_type_generateur_ecs_id: 'A',
      enum_usage_generateur_id: '3',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion(dpe, di, de, 'ecs', 200, -9, 1);
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ enum_type_generateur_ecs_id: 'A' })
    );
  });

  test('générateur ECS par défaut (previous dans la liste d’exclusion) : aucun redressement', () => {
    state.bug = true;
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = {
      enum_type_generateur_ecs_id: 'A',
      previous_enum_type_generateur_ecs_id: '78',
      enum_usage_generateur_id: '3',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion(dpeAvecChMixte('X'), di, de, 'ecs', 200, -9, 1);
    // previous = '78' (autre système à combustion gaz) -> pas assez précis, on conserve 'A'
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ enum_type_generateur_ecs_id: 'A' })
    );
  });
});

/**
 * 13.2 - Orchestration des substitutions de générateurs et enrichissement fiches techniques.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2
 */
describe('updateGenerateurCombustion - orchestration des substitutions', () => {
  test('délègue aux trois routines de substitution avec les mêmes arguments', () => {
    getFicheTechnique.mockReturnValue(undefined);
    const dpe = {};
    const de = { description: 'gen' };
    updateGenerateurCombustion(dpe, de, 'ch');
    expect(updateGenerateurBouilleurs).toHaveBeenCalledWith(dpe, de, 'ch');
    expect(updateGenerateurChaudieres).toHaveBeenCalledWith(dpe, de, 'ch');
    expect(updateGenerateurPacs).toHaveBeenCalledWith(dpe, de, 'ch');
  });

  test('présence d’un ventilateur signalée dans les fiches techniques : presenceVentilateur = 1', () => {
    getFicheTechnique.mockReturnValue({ valeur: 'oui' });
    const de = { description: 'gen' };
    updateGenerateurCombustion({}, de, 'ch');
    expect(de.presenceVentilateur).toBe(1);
  });

  test('absence de ventilateur : presenceVentilateur non renseigné', () => {
    getFicheTechnique.mockReturnValue({ valeur: 'non' });
    const de = { description: 'gen' };
    updateGenerateurCombustion({}, de, 'ch');
    expect(de.presenceVentilateur).toBeUndefined();
  });
});
