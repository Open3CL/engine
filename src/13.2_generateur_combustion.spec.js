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
  set_bug_for_bug_compat: vi.fn(),
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
/**
 * Détection de la convention de puissance (issue #124) : testée dans son propre spec. Par défaut,
 * le double renvoie la convention individualisée (pn et ratio inchangés).
 */
vi.mock('./13.2_generateur_combustion_pn.js', () => ({
  conventionPuissanceNominale: vi.fn((pn, ratio) => ({ pn, ratio, convention: 'individualisee' }))
}));

const {
  tv_generateur_combustion,
  findGenerateurChMixteJumeau,
  updateGenerateurCombustion,
  caracteristiquesGenerateurCombustion
} = await import('./13.2_generateur_combustion.js');
const { tv, tvColumnLines } = await import('./utils.js');
const { conventionPuissanceNominale } = await import('./13.2_generateur_combustion_pn.js');
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
  vi.mocked(conventionPuissanceNominale).mockReset();
  vi.mocked(conventionPuissanceNominale).mockImplementation((pn, ratio) => ({
    pn,
    ratio,
    convention: 'individualisee'
  }));
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
 * Issue #210 : l'ECS mixte doit être appariée avec SON générateur de chauffage mixte (même appareil),
 * et non avec le premier générateur de chauffage mixte du DPE.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2 et §14
 */
describe('findGenerateurChMixteJumeau - appariement ECS / chauffage mixte (issue #210)', () => {
  const ch = (donnees) => ({ donnee_entree: { enum_usage_generateur_id: '3', ...donnees } });

  test('même reference_generateur_mixte : prioritaire sur le tv_generateur_combustion_id', () => {
    const chTv = ch({ tv_generateur_combustion_id: '11' });
    const chRef = ch({ reference_generateur_mixte: 'GEN#1', tv_generateur_combustion_id: '13' });
    const de = { reference_generateur_mixte: 'GEN#1', tv_generateur_combustion_id: '11' };
    expect(findGenerateurChMixteJumeau([chTv, chRef], de)).toBe(chRef);
  });

  test('reference_generateur_mixte sans correspondance : repli sur le tv_generateur_combustion_id', () => {
    const chElec = ch({ reference_generateur_mixte: 'AUTRE', tv_generateur_combustion_id: null });
    const chGaz = ch({ tv_generateur_combustion_id: 11 });
    const de = { reference_generateur_mixte: 'GEN#1', tv_generateur_combustion_id: '11' };
    // Comparaison insensible au type (nombre / chaîne)
    expect(findGenerateurChMixteJumeau([chElec, chGaz], de)).toBe(chGaz);
  });

  test('cas 2448E4606320D : ECS gaz (tv 11) appariée au CH 95 (tv 11) et non au premier CH mixte (106, électrique)', () => {
    const ch106 = ch({ enum_type_generateur_ch_id: '106', enum_type_energie_id: '1' });
    const ch95 = ch({
      enum_type_generateur_ch_id: '95',
      tv_generateur_combustion_id: '11',
      enum_type_energie_id: '2'
    });
    const de = {
      enum_type_generateur_ecs_id: '55',
      tv_generateur_combustion_id: '11',
      enum_type_energie_id: '2'
    };
    expect(findGenerateurChMixteJumeau([ch106, ch95], de)).toBe(ch95);
  });

  test('cas 2193E1043519Y : ECS gaz (tv 13) appariée au CH 97 (tv 13) et non au CH 111 (réseau de chaleur)', () => {
    const ch111 = ch({ enum_type_generateur_ch_id: '111', enum_type_energie_id: '2' });
    const ch97 = ch({
      enum_type_generateur_ch_id: '97',
      tv_generateur_combustion_id: '13',
      enum_type_energie_id: '2'
    });
    const de = {
      enum_type_generateur_ecs_id: '57',
      tv_generateur_combustion_id: '13',
      enum_type_energie_id: '2'
    };
    expect(findGenerateurChMixteJumeau([ch111, ch97], de)).toBe(ch97);
  });

  test('pas de référence ni de tv commun : un seul générateur de même énergie → retenu', () => {
    const chElec = ch({ enum_type_energie_id: '1' });
    const chFioul = ch({ enum_type_energie_id: '3' });
    const de = { tv_generateur_combustion_id: '99', enum_type_energie_id: '3' };
    expect(findGenerateurChMixteJumeau([chElec, chFioul], de)).toBe(chFioul);
  });

  test('plusieurs générateurs de même énergie sans autre critère : ambiguïté → aucun appariement', () => {
    const de = { enum_type_energie_id: '2' };
    const generateurs = [ch({ enum_type_energie_id: '2' }), ch({ enum_type_energie_id: '2' })];
    expect(findGenerateurChMixteJumeau(generateurs, de)).toBeNull();
  });

  test('plusieurs générateurs de même énergie et de types différents : ambiguïté → aucun appariement', () => {
    const de = { enum_type_energie_id: '13' };
    const generateurs = [
      ch({ enum_type_generateur_ch_id: '134', enum_type_energie_id: '13' }),
      ch({ enum_type_generateur_ch_id: '92', enum_type_energie_id: '13' })
    ];
    expect(findGenerateurChMixteJumeau(generateurs, de)).toBeNull();
  });

  test('cas 2275E1945671L : plusieurs générateurs de même énergie et de même type → le premier est retenu', () => {
    const ch1 = ch({
      enum_type_generateur_ch_id: '134',
      enum_type_energie_id: '13',
      tv_generateur_combustion_id: '8'
    });
    const ch2 = ch({
      enum_type_generateur_ch_id: 134,
      enum_type_energie_id: 13,
      tv_generateur_combustion_id: '8'
    });
    const de = {
      enum_type_generateur_ecs_id: '92',
      tv_generateur_combustion_id: '1',
      enum_type_energie_id: '13'
    };
    expect(findGenerateurChMixteJumeau([ch1, ch2], de)).toBe(ch1);
  });

  test('générateur de chauffage mixte unique sans énergie renseignée : retenu (comportement historique)', () => {
    const unique = ch({ enum_type_generateur_ch_id: 'X' });
    expect(findGenerateurChMixteJumeau([unique], { enum_type_energie_id: '2' })).toBe(unique);
    expect(findGenerateurChMixteJumeau([unique], {})).toBe(unique);
  });

  test('générateur de chauffage mixte unique d’une autre énergie : pas son jumeau → aucun appariement', () => {
    const unique = ch({ enum_type_energie_id: '1' });
    expect(findGenerateurChMixteJumeau([unique], { enum_type_energie_id: '2' })).toBeNull();
  });

  test('aucun générateur de chauffage mixte : aucun appariement', () => {
    expect(findGenerateurChMixteJumeau([], { tv_generateur_combustion_id: '11' })).toBeNull();
  });
});

describe('tv_generateur_combustion - génération mixte avec plusieurs générateurs de chauffage (issue #210)', () => {
  function dpeAvecChMixtes(generateurs) {
    return {
      logement: {
        installation_chauffage_collection: {
          installation_chauffage: generateurs.map((donnees) => ({
            generateur_chauffage_collection: {
              generateur_chauffage: [
                { donnee_entree: { enum_usage_generateur_id: '3', ...donnees } }
              ]
            }
          }))
        }
      }
    };
  }

  test('le type ECS est aligné sur le jumeau (même tv) et non sur le premier générateur mixte', () => {
    state.bug = true;
    tv.mockReturnValue({ ...ROW_DEFAUT });
    // 1er CH mixte 'X' (fioul, autre tv), jumeau 'Y' (gaz, même tv 42) -> ECS 'A' (gaz) conservée
    const dpe = dpeAvecChMixtes([
      { enum_type_generateur_ch_id: 'X', tv_generateur_combustion_id: '7' },
      { enum_type_generateur_ch_id: 'Y', tv_generateur_combustion_id: '42' }
    ]);
    const de = {
      enum_type_generateur_ecs_id: 'A',
      enum_usage_generateur_id: '3',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion(dpe, { pn: 20000 }, de, 'ecs', 200, -9, 1);
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ enum_type_generateur_ecs_id: 'A' })
    );
    expect(tv).not.toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ enum_type_generateur_ecs_id: 'B' })
    );
  });

  test('jumeau non identifiable (ambiguïté) : type ECS conservé', () => {
    state.bug = true;
    tv.mockReturnValue({ ...ROW_DEFAUT });
    // Deux CH mixtes de même énergie mais de types différents : aucun jumeau certain
    const dpe = dpeAvecChMixtes([
      { enum_type_generateur_ch_id: 'X', enum_type_energie_id: '2' },
      { enum_type_generateur_ch_id: 'Z', enum_type_energie_id: '2' }
    ]);
    const de = {
      enum_type_generateur_ecs_id: 'A',
      enum_usage_generateur_id: '3',
      enum_type_energie_id: '2',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    tv_generateur_combustion(dpe, { pn: 20000 }, de, 'ecs', 200, -9, 1);
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ enum_type_generateur_ecs_id: 'A' })
    );
  });

  test('aucune ligne forfaitaire pour un générateur ECS mixte : erreur sans plantage', () => {
    state.bug = true;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockReturnValue(null);
    const de = {
      enum_type_generateur_ecs_id: 'A',
      enum_usage_generateur_id: '3',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 1,
      presence_ventouse: 0
    };
    expect(() =>
      tv_generateur_combustion(dpeAvecChMixtes([]), { pn: 20000 }, de, 'ecs', 200, -9, 1)
    ).not.toThrow();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Pas de valeur forfaitaire'));
    errSpy.mockRestore();
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

/**
 * Issue #124 : générateur collectif virtualisé, puissance saisie collective (Pn) ou individualisée
 * (Pe = a × Pn) selon les logiciels.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2 et §17.2.1
 */
describe('tv_generateur_combustion - convention de puissance d’un générateur virtualisé (#124)', () => {
  const ROW_PN = {
    tv_generateur_combustion_id: '42',
    rpn: '84 + 2 logPn',
    rpint: '80 + 3 logPn',
    qp0_perc: '1%',
    pveil: '0'
  };

  test('la détection reçoit pn, ratio, valeurs du DPE et bug_for_bug_compat', () => {
    state.bug = true;
    tv.mockReturnValue({ ...ROW_PN });
    const di = { pn: 23000, rpn: 0.87, qp0: 0.276 };
    const de = {
      enum_type_generateur_ch_id: '89',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(conventionPuissanceNominale).toHaveBeenCalledWith(
      23000,
      0.1,
      { rpn: 0.87, rpint: undefined, qp0: 0.276 },
      expect.any(Function),
      true,
      expect.any(Function)
    );
  });

  test('formule rpn fournie (4e hypothèse) : ligne sélectionnée sur Pn collectif, rpn en fraction', () => {
    tvColumnLines.mockReturnValue(['Pn ≤ 70', 'Pn > 70']);
    tv.mockReturnValue({ ...ROW_PN });
    let formuleRpn;
    conventionPuissanceNominale.mockImplementation((pn, ratio, _, __, ___, fn) => {
      formuleRpn = fn;
      return { pn, ratio, convention: 'individualisee' };
    });
    const di = { pn: 23000, rpint: 0.85 };
    const de = {
      enum_type_generateur_ch_id: '89',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(conventionPuissanceNominale.mock.calls[0][2]).toEqual({
      rpn: undefined,
      rpint: 0.85,
      qp0: undefined
    });

    tv.mockClear();
    const formule = formuleRpn(696000);
    // Pn collectif = 696 kW (ratio 1) -> critère « Pn > 70 »
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ critere_pn: 'Pn > 70' })
    );
    // Référence de régression : rpn = (84 + 2 log10(696)) / 100
    expect(formule(696000)).toBeCloseTo((84 + 2 * Math.log10(696)) / 100, 9);
  });

  test('formule rpn : ligne absente ou sans rpn -> aucune formule', () => {
    tv.mockReturnValueOnce({ ...ROW_PN });
    let formuleRpn;
    conventionPuissanceNominale.mockImplementation((pn, ratio, _, __, ___, fn) => {
      formuleRpn = fn;
      return { pn, ratio, convention: 'individualisee' };
    });
    const de = {
      enum_type_generateur_ch_id: '89',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, { pn: 23000 }, de, 'ch', 200, -9, 1);
    tv.mockReturnValueOnce(null).mockReturnValueOnce({ ...ROW_PN, rpn: undefined });
    expect(formuleRpn(696000)).toBeUndefined();
    expect(formuleRpn(696000)).toBeUndefined();
  });

  test('pn recalculé depuis rpn : Pe retenu, ligne re-sélectionnée et avertissement explicite', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tv.mockReturnValueOnce({ ...ROW_PN }).mockReturnValue({
      ...ROW_PN,
      tv_generateur_combustion_id: '43'
    });
    conventionPuissanceNominale.mockReturnValue({
      pn: 2300,
      ratio: 0.1,
      convention: 'puissance_depuis_rpn',
      pnCollectif: 23000
    });
    const di = { pn: 230, rpn: 0.8672, rpint: 0.8408 };
    const de = {
      description: 'Chaudière collective',
      enum_type_generateur_ch_id: '89',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.pn).toBe(2300);
    expect(de.tv_generateur_combustion_id).toBe(43);
    // Formules évaluées sur Pn collectif = 2300 / 0.1 = 23 kW
    expect(di.rpn).toBeCloseTo((84 + 2 * Math.log10(23)) / 100, 9);
    const message = warnSpy.mock.calls[0][0];
    expect(message).toContain('(230 W)');
    expect(message).toContain('Pn = 23 kW');
    expect(message).toContain('Pe = a × Pn = 2300 W');
    warnSpy.mockRestore();
  });

  test('fonction de caractéristiques fournie : ligne et formules évaluées sur pn / ratio', () => {
    tvColumnLines.mockReturnValue(['Pn ≤ 70', 'Pn > 70']);
    tv.mockReturnValue({ ...ROW_PN });
    let caracteristiques;
    conventionPuissanceNominale.mockImplementation((pn, ratio, _, fn) => {
      caracteristiques = fn;
      return { pn, ratio, convention: 'individualisee' };
    });
    const di = { pn: 23000 };
    const de = {
      enum_type_generateur_ch_id: '89',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);

    tv.mockClear();
    const hypothese = caracteristiques(2300, 0.1);
    // Pn collectif = 2300 / 0.1 = 23 kW -> critère « Pn ≤ 70 »
    expect(tv).toHaveBeenCalledWith(
      'generateur_combustion',
      expect.objectContaining({ critere_pn: 'Pn ≤ 70' })
    );
    // Référence de régression : rpn = (84 + 2 log10(23)) / 100
    expect(hypothese.rpn).toBeCloseTo((84 + 2 * Math.log10(23)) / 100, 9);
    // qp0 en % : rapporté à la puissance saisie (2300 W)
    expect(hypothese.qp0).toBeCloseTo(23, 9);
  });

  test('aucune ligne pour l’hypothèse testée : repli sur la ligne initiale', () => {
    tv.mockReturnValueOnce({ ...ROW_PN }).mockReturnValue(null);
    let caracteristiques;
    conventionPuissanceNominale.mockImplementation((pn, ratio, _, fn) => {
      caracteristiques = fn;
      return { pn, ratio, convention: 'individualisee' };
    });
    const di = { pn: 23000 };
    const de = {
      enum_type_generateur_ch_id: '89',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(caracteristiques(23000, 1).rpn).toBeCloseTo((84 + 2 * Math.log10(23)) / 100, 9);
  });

  test('convention individualisée : pn, ratio et identifiant inchangés', () => {
    tv.mockReturnValue({ ...ROW_PN });
    const di = { pn: 23000 };
    const de = {
      enum_type_generateur_ch_id: '89',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.pn).toBe(23000);
    // rpn évalué sur Pn collectif = 230 kW
    expect(di.rpn).toBeCloseTo((84 + 2 * Math.log10(230)) / 100, 9);
  });

  test('puissance collective virtualisée : pn ramené à Pe, ligne et identifiant re-sélectionnés', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tv.mockReturnValueOnce({ ...ROW_PN }).mockReturnValue({
      ...ROW_PN,
      tv_generateur_combustion_id: '43'
    });
    conventionPuissanceNominale.mockReturnValue({
      pn: 2300,
      ratio: 0.1,
      convention: 'collective_virtualisee'
    });
    const di = { pn: 23000, rpn: 0.9, qp0: 23 };
    const de = {
      enum_type_generateur_ch_id: '89',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.pn).toBe(2300);
    expect(de.tv_generateur_combustion_id).toBe(43);
    // Formules évaluées sur Pn collectif = 2300 / 0.1 = 23 kW
    expect(di.rpn).toBeCloseTo((84 + 2 * Math.log10(23)) / 100, 9);
    expect(di.rpint).toBeCloseTo((80 + 3 * Math.log10(23)) / 100, 9);
    expect(di.qp0).toBeCloseTo(23, 9);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('puissance collective non virtualisée (bug_for_bug_compat) : calcul sur pn avec ratio 1', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    state.bug = true;
    tv.mockReturnValue({ ...ROW_PN });
    conventionPuissanceNominale.mockReturnValue({
      pn: 23000,
      ratio: 1,
      convention: 'collective_non_virtualisee'
    });
    const di = { pn: 23000, rpn: 0.87, qp0: 0.23 };
    const de = {
      enum_type_generateur_ch_id: '89',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.pn).toBe(23000);
    expect(di.rpn).toBeCloseTo((84 + 2 * Math.log10(23)) / 100, 9);
    expect(di.qp0).toBeCloseTo(230, 9);
    warnSpy.mockRestore();
  });

  test('générateur collectif par défaut (119, tv_generateur_combustion_id) : pas de détection', () => {
    state.bug = true;
    tv.mockReturnValue({ ...ROW_PN });
    const di = { pn: 23000 };
    const de = {
      enum_type_generateur_ch_id: '119',
      tv_generateur_combustion_id: '42',
      ratio_virtualisation: 0.1,
      presence_ventouse: 0
    };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(conventionPuissanceNominale).not.toHaveBeenCalled();
  });
});

describe('caracteristiquesGenerateurCombustion - selon la méthode de saisie', () => {
  const ROW = { rpn: '84 + 2 logPn', rpint: '80 + 3 logPn', qp0_perc: '1%' };

  test('méthode forfaitaire : rpn, rpint et qp0 calculés', () => {
    expect(
      Object.keys(caracteristiquesGenerateurCombustion(ROW, 23000, 1, 2.5, -0.8, 'ch', 1))
    ).toEqual(['rpn', 'rpint', 'qp0']);
  });

  test('méthode 3 : rpn et rpint saisis, seul qp0 calculé', () => {
    expect(caracteristiquesGenerateurCombustion(ROW, 23000, 1, 2.5, -0.8, 'ch', 3)).toEqual({
      qp0: expect.any(Number)
    });
  });

  test('méthodes 4 et 5 : aucune caractéristique calculée', () => {
    expect(caracteristiquesGenerateurCombustion(ROW, 23000, 1, 2.5, -0.8, 'ch', 4)).toEqual({});
    expect(caracteristiquesGenerateurCombustion(ROW, 23000, 1, 2.5, -0.8, 'ch', 5)).toEqual({});
  });

  test('qp0 constant en kW (sans % ni Pn) : ramené au logement par le ratio', () => {
    expect(
      caracteristiquesGenerateurCombustion({ qp0_perc: '0.5' }, 2300, 0.1, 2.5, -0.8, 'ecs', 1).qp0
    ).toBeCloseTo(50, 9);
  });
});
