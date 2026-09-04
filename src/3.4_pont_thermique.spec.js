import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_pont_thermique` :
 * - `enums` : mapping minimal période de construction ;
 * - `isNil` (lodash-es) : implémentation déterministe ;
 * - `tv` : accès à la table `pont_thermique`, on contrôle la ligne retournée ;
 * - `requestInput` : passe-plat vers les données d'entrée ;
 * - `compareReferences` : comparaison stricte des références (pas de nettoyage réel) ;
 * - `bug_for_bug_compat` : désactivé pour isoler le comportement nominal.
 */
vi.mock('./enums.js', () => ({
  default: {
    periode_construction: { 1: 'avant 1948', 5: '1989-2000' }
  }
}));

vi.mock('lodash-es', () => ({
  isNil: (value) => value === null || value === undefined
}));

/**
 * `bug_for_bug_compat` est exposé via un accesseur adossé à un état hoisté, afin de pouvoir
 * l'activer dans certains tests (reproduction de comportements bugués des DPE réels) tout en
 * restant désactivé par défaut.
 */
const state = vi.hoisted(() => ({ bug: false }));

vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInput: (de, du, field) => de[field],
  compareReferences: (a, b) => a === b,
  get bug_for_bug_compat() {
    return state.bug;
  }
}));

const { default: calc_pont_thermique } = await import('./3.4_pont_thermique.js');
const { tv } = await import('./utils.js');

/** Enveloppe minimale avec collections contrôlées. */
function logement({ mur = [], pb = [], ph = [], bv = [], porte = [] } = {}) {
  return {
    enveloppe: {
      mur_collection: { mur },
      plancher_bas_collection: { plancher_bas: pb },
      plancher_haut_collection: { plancher_haut: ph },
      baie_vitree_collection: { baie_vitree: bv },
      porte_collection: { porte }
    }
  };
}

/** Pont thermique en méthode de saisie forfaitaire (méthode 1). */
function pontThermique(de = {}, k = 0.9) {
  return {
    donnee_entree: {
      enum_methode_saisie_pont_thermique_id: '1',
      enum_type_liaison_id: '12',
      ...de
    },
    donnee_intermediaire: { k }
  };
}

let errorSpy;
let warnSpy;

beforeEach(() => {
  tv.mockReset();
  state.bug = false;
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  warnSpy.mockRestore();
});

/**
 * 3.4 Calcul des déperditions par les ponts thermiques
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4
 */
describe('calc_pont_thermique - méthode de saisie directe', () => {
  test('k justifié saisi (méthode 2) : k pris directement', () => {
    const pt = { donnee_entree: { enum_methode_saisie_pont_thermique_id: '2', k_saisi: 0.5 } };
    calc_pont_thermique(pt, '1', logement());
    expect(pt.donnee_intermediaire.k).toBe(0.5);
    expect(tv).not.toHaveBeenCalled();
  });

  test('k saisi absent (méthode 3) : erreur et k non défini', () => {
    const pt = { donnee_entree: { enum_methode_saisie_pont_thermique_id: '3' } };
    calc_pont_thermique(pt, '1', logement());
    expect(pt.donnee_intermediaire.k).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });

  test('méthode de saisie non reconnue : erreur et k non défini', () => {
    const pt = { donnee_entree: { enum_methode_saisie_pont_thermique_id: '9' } };
    calc_pont_thermique(pt, '1', logement());
    expect(pt.donnee_intermediaire.k).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('calc_pont_thermique - valeur forfaitaire (méthode 1)', () => {
  test('liaison refend / mur sans mur associé : k lu dans la table avec isolation ITI par défaut', () => {
    tv.mockReturnValue({ k: '0.5', tv_pont_thermique_id: '42' });
    const pt = {
      donnee_entree: {
        enum_methode_saisie_pont_thermique_id: '1',
        enum_type_liaison_id: '12',
        type_liaison: 'refend / mur',
        reference_1: 'M1',
        description: 'refend'
      },
      donnee_intermediaire: { k: 0.9 }
    };

    calc_pont_thermique(pt, '1', logement());

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '12',
      isolation_mur: '^iti'
    });
    expect(pt.donnee_intermediaire.k).toBe(0.5);
    expect(pt.donnee_entree.tv_pont_thermique_id).toBe(42);
  });

  /**
   * Les ponts thermiques des murs de circulation avec k intermédiaire nul restent nuls.
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4 (locaux de circulation)
   */
  test('mur de circulation (adjacence 22) avec k intermédiaire nul : k = 0 sans accès table', () => {
    const mur = [
      { donnee_entree: { reference: 'M1', enum_type_adjacence_id: '22' }, donnee_utilisateur: {} }
    ];
    const pt = {
      donnee_entree: {
        enum_methode_saisie_pont_thermique_id: '1',
        enum_type_liaison_id: '12',
        type_liaison: 'refend / mur',
        reference_1: 'M1',
        description: 'refend'
      },
      donnee_intermediaire: { k: 0 }
    };

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(pt.donnee_intermediaire.k).toBe(0);
    expect(tv).not.toHaveBeenCalled();
  });

  /**
   * 3.4.5 Menuiserie / mur : les ponts thermiques avec les parois en structure bois sont négligés.
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4.5
   */
  test('liaison menuiserie / mur sur structure bois : k = 0', () => {
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          enum_type_adjacence_id: '1',
          enum_materiaux_structure_mur_id: '5',
          type_isolation: 'iti'
        },
        donnee_utilisateur: {}
      }
    ];
    const pt = {
      donnee_entree: {
        enum_methode_saisie_pont_thermique_id: '1',
        enum_type_liaison_id: '20',
        type_liaison: 'menuiserie / mur',
        reference_1: 'M1',
        description: 'menuiserie'
      },
      donnee_intermediaire: { k: 0.3 }
    };

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(pt.donnee_intermediaire.k).toBe(0);
    expect(tv).not.toHaveBeenCalled();
  });
});

/**
 * defaultValue : valeur de repli lorsque la référence ou la paroi associée n'est pas retrouvée.
 * Atteinte ici via une description non reconnue (ni "A / B" ni "A-B").
 */
describe('defaultValue - valeur de repli sur description non reconnue', () => {
  function ptRepli(k, tv_pont_thermique_id = 7, pourcentage) {
    const de = {
      enum_type_liaison_id: '12',
      type_liaison: 'refend / mur',
      description: 'descriptionNonReconnue',
      tv_pont_thermique_id
    };
    if (pourcentage !== undefined) de.pourcentage_valeur_pont_thermique = pourcentage;
    return pontThermique(de, k);
  }

  test('k intermédiaire nul : repli à 0 sans accès à la table', () => {
    const pt = ptRepli(0);
    calc_pont_thermique(pt, '1', logement());
    expect(pt.donnee_intermediaire.k).toBe(0);
    expect(tv).not.toHaveBeenCalled();
  });

  test('valeur tabulée cohérente avec la valeur intermédiaire : valeur tabulée conservée', () => {
    tv.mockReturnValue({ k: '0.9' });
    const pt = ptRepli(0.9);
    calc_pont_thermique(pt, '1', logement());
    expect(tv).toHaveBeenCalledWith('pont_thermique', { tv_pont_thermique_id: 7 });
    expect(pt.donnee_intermediaire.k).toBe('0.9');
  });

  test('valeur tabulée = moitié de la valeur intermédiaire : pas d’incohérence', () => {
    // k = 0,9 et tabulé 1,8 : 0,9 === 1,8 / 2 => cohérent (facteur 0.5)
    tv.mockReturnValue({ k: '1.8' });
    const pt = ptRepli(0.9);
    calc_pont_thermique(pt, '1', logement());
    expect(pt.donnee_intermediaire.k).toBe('1.8');
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('Incohérence'));
  });

  test('valeur tabulée incohérente : valeur intermédiaire conservée et erreur émise', () => {
    // k = 0,9, tabulé 0,45 : 0,9 !== 0,45 et 0,9 !== 0,225 => incohérence
    tv.mockReturnValue({ k: '0.45' });
    const pt = ptRepli(0.9);
    calc_pont_thermique(pt, '1', logement());
    expect(pt.donnee_intermediaire.k).toBe(0.9);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Incohérence'));
  });

  test('aucune ligne tabulée trouvée : la valeur intermédiaire sert de repli', () => {
    tv.mockReturnValue(null);
    const pt = ptRepli(0.9);
    calc_pont_thermique(pt, '1', logement());
    expect(pt.donnee_intermediaire.k).toBe(0.9);
  });
});

/**
 * 3.4 Reconstruction des références manquantes à partir de la description.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4
 */
describe('calc_pont_thermique - reconstruction des références via la description', () => {
  test('description "mur / plancher" : la référence du mur est retrouvée (liaison refend, pas de 2e paroi)', () => {
    tv.mockReturnValue({ k: '0.5', tv_pont_thermique_id: '42' });
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          description: 'Mur Nord donnant sur extérieur',
          enum_type_adjacence_id: '1',
          type_isolation: 'iti'
        },
        donnee_utilisateur: {}
      }
    ];
    const pt = pontThermique({
      type_liaison: 'refend / mur',
      description: 'Mur Nord / Refend intérieur'
    });

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(warnSpy).toHaveBeenCalled();
    expect(pt.donnee_entree.reference_1).toBe('M1');
    expect(pt.donnee_intermediaire.k).toBe(0.5);
  });

  test('description "mur-baie" (séparateur tiret), liaison menuiserie : les deux références sont retrouvées', () => {
    tv.mockReturnValue({ k: '0.3', tv_pont_thermique_id: '50' });
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          description: 'Mur Est',
          enum_type_adjacence_id: '1',
          enum_materiaux_structure_mur_id: '1',
          type_isolation: 'iti'
        },
        donnee_utilisateur: {}
      }
    ];
    const bv = [
      {
        donnee_entree: {
          reference: 'B1',
          description: 'Fenetre salon',
          type_pose: 'tunnel',
          presence_retour_isolation: 1,
          largeur_dormant: 5
        },
        donnee_utilisateur: {}
      }
    ];
    const pt = pontThermique({
      type_liaison: 'menuiserie / mur',
      description: 'Fenetre salon-Mur Est'
    });

    calc_pont_thermique(pt, '1', logement({ mur, bv }));

    expect(pt.donnee_entree.reference_1).toBe('M1');
    expect(pt.donnee_entree.reference_2).toBe('B1');
    expect(pt.donnee_intermediaire.k).toBe(0.3);
  });

  test('description non retrouvée dans les murs : repli sur la valeur intermédiaire', () => {
    tv.mockReturnValue({ k: '0.9' });
    const mur = [
      { donnee_entree: { reference: 'M1', description: 'Mur Sud' }, donnee_utilisateur: {} }
    ];
    const pt = pontThermique({
      type_liaison: 'refend / mur',
      description: 'Mur Absent / Refend',
      tv_pont_thermique_id: 7
    });

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(pt.donnee_intermediaire.k).toBe('0.9');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('2e paroi non retrouvée dans la liaison : repli sur la valeur intermédiaire', () => {
    tv.mockReturnValue({ k: '0.9' });
    const mur = [
      {
        donnee_entree: { reference: 'M1', description: 'Mur Ouest' },
        donnee_utilisateur: {}
      }
    ];
    const pt = pontThermique({
      type_liaison: 'plancher bas / mur',
      description: 'Mur Ouest / Plancher inexistant',
      tv_pont_thermique_id: 7
    });

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(pt.donnee_entree.reference_1).toBe('M1');
    expect(pt.donnee_intermediaire.k).toBe('0.9');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('liaison "plancher intermédiaire lourd / mur" non supportée : avertissement, aucune 2e paroi', () => {
    tv.mockReturnValue({ k: '0.4', tv_pont_thermique_id: '60' });
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          description: 'Mur porteur',
          enum_type_adjacence_id: '1',
          type_isolation: 'iti'
        },
        donnee_utilisateur: {}
      }
    ];
    const pt = pontThermique({
      type_liaison: 'plancher intermédiaire lourd / mur',
      description: 'Mur porteur / Plancher intermédiaire'
    });

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(warnSpy).toHaveBeenCalled();
    expect(pt.donnee_intermediaire.k).toBe(0.4);
  });
});

/**
 * 3.4 Murs de circulation avec pont thermique non nul (cas devant tout de même être pris en compte).
 */
describe('calc_pont_thermique - mur de circulation avec k non nul', () => {
  test("type d'isolation inconnu, période avant 1948 : mur non isolé", () => {
    tv.mockReturnValue({ k: '0.6', tv_pont_thermique_id: '70' });
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          enum_type_adjacence_id: '14',
          type_isolation: 'inconnu',
          periode_isolation: 'avant 1948'
        },
        donnee_utilisateur: {}
      }
    ];
    const pt = pontThermique({
      type_liaison: 'refend / mur',
      reference_1: 'M1',
      description: 'refend'
    });

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '12',
      isolation_mur: '^non isolé$'
    });
    expect(pt.donnee_intermediaire.k).toBe(0.6);
  });

  test("type d'isolation inconnu, période récente (par défaut période de construction) : isolation ITI", () => {
    tv.mockReturnValue({ k: '0.6', tv_pont_thermique_id: '70' });
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          enum_type_adjacence_id: '1',
          type_isolation: 'inconnu'
        },
        donnee_utilisateur: {}
      }
    ];
    const pt = pontThermique({
      type_liaison: 'refend / mur',
      reference_1: 'M1',
      description: 'refend'
    });

    // pc_id = '5' => période de construction '1989-2000' (hors seuils "avant 1948"/"1948-1974")
    calc_pont_thermique(pt, '5', logement({ mur }));

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '12',
      isolation_mur: '^iti$'
    });
  });
});

/**
 * 3.4.1 / 3.4.3 Ponts thermiques plancher bas / mur et plancher haut lourd / mur.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4.1 et §3.4.3
 */
describe('calc_pont_thermique - liaisons plancher / mur', () => {
  function murPlancher(murOverrides = {}, plancherOverrides = {}) {
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          enum_type_adjacence_id: '1',
          type_isolation: 'iti',
          ...murOverrides
        },
        donnee_utilisateur: {}
      }
    ];
    const plancher = {
      donnee_entree: { reference: 'P1', type_isolation: 'ite', ...plancherOverrides },
      donnee_utilisateur: {}
    };
    return { mur, plancher };
  }

  function ptPlancher(type_liaison) {
    return pontThermique({
      type_liaison,
      enum_type_liaison_id: '3',
      reference_1: 'P1',
      reference_2: 'M1',
      description: 'plancher / mur'
    });
  }

  test('plancher non retrouvé : repli sur la valeur intermédiaire', () => {
    tv.mockReturnValue({ k: '0.9' });
    const { mur } = murPlancher();
    const pt = ptPlancher('plancher bas / mur');
    pt.donnee_entree.tv_pont_thermique_id = 7;

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(pt.donnee_intermediaire.k).toBe('0.9');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('plancher haut lourd sur plafond bois (type 9) : pont thermique négligé (k = 0)', () => {
    const { mur, plancher } = murPlancher({}, { enum_type_plancher_haut_id: '9' });
    const pt = ptPlancher('plancher haut lourd / mur');

    calc_pont_thermique(pt, '1', logement({ mur, ph: [plancher] }));

    expect(pt.donnee_intermediaire.k).toBe(0);
    expect(tv).not.toHaveBeenCalled();
  });

  test('plancher haut lourd sur mur ossature bois (matériau 18) : pont thermique négligé (k = 0)', () => {
    const { mur, plancher } = murPlancher(
      { enum_materiaux_structure_mur_id: '18' },
      { enum_type_plancher_haut_id: '1' }
    );
    const pt = ptPlancher('plancher haut lourd / mur');

    calc_pont_thermique(pt, '1', logement({ mur, ph: [plancher] }));

    expect(pt.donnee_intermediaire.k).toBe(0);
  });

  test('plancher bas entre solives bois (type 4) : pont thermique négligé (k = 0)', () => {
    const { mur, plancher } = murPlancher({}, { enum_type_plancher_bas_id: '4' });
    const pt = ptPlancher('plancher bas / mur');

    calc_pont_thermique(pt, '1', logement({ mur, pb: [plancher] }));

    expect(pt.donnee_intermediaire.k).toBe(0);
  });

  test('plancher bas sur mur ossature bois (matériau 16) : pont thermique négligé (k = 0)', () => {
    const { mur, plancher } = murPlancher(
      { enum_materiaux_structure_mur_id: '16' },
      { enum_type_plancher_bas_id: '1' }
    );
    const pt = ptPlancher('plancher bas / mur');

    calc_pont_thermique(pt, '1', logement({ mur, pb: [plancher] }));

    expect(pt.donnee_intermediaire.k).toBe(0);
  });

  test('plancher bas isolation connue : matcher isolation_plancher construit', () => {
    tv.mockReturnValue({ k: '0.35', tv_pont_thermique_id: '80' });
    const { mur, plancher } = murPlancher(
      {},
      { enum_type_plancher_bas_id: '1', type_isolation: 'ite' }
    );
    const pt = ptPlancher('plancher bas / mur');

    calc_pont_thermique(pt, '1', logement({ mur, pb: [plancher] }));

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '3',
      isolation_mur: '^iti$',
      isolation_plancher: '^ite$'
    });
    expect(pt.donnee_intermediaire.k).toBe(0.35);
  });

  test('plancher bas isolation inconnue sur terre-plein ancien : plancher non isolé', () => {
    tv.mockReturnValue({ k: '0.35', tv_pont_thermique_id: '80' });
    const { mur, plancher } = murPlancher(
      {},
      {
        enum_type_plancher_bas_id: '1',
        type_isolation: 'inconnu',
        type_adjacence: 'terre-plein',
        periode_isolation: '1989-2000'
      }
    );
    const pt = ptPlancher('plancher bas / mur');

    calc_pont_thermique(pt, '1', logement({ mur, pb: [plancher] }));

    // terre-plein : le seuil "non isolé" s'étend jusqu'à 1989-2000
    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '3',
      isolation_mur: '^iti$',
      isolation_plancher: 'non isolé'
    });
  });

  test('plancher bas isolation inconnue hors terre-plein, période issue de la construction : plancher ITE', () => {
    tv.mockReturnValue({ k: '0.35', tv_pont_thermique_id: '80' });
    // periode_isolation absente => repli sur la période de construction (pc_id = '5' => 1989-2000)
    const { mur, plancher } = murPlancher(
      {},
      {
        enum_type_plancher_bas_id: '1',
        type_isolation: 'inconnu',
        type_adjacence: 'extérieur'
      }
    );
    const pt = ptPlancher('plancher bas / mur');

    calc_pont_thermique(pt, '5', logement({ mur, pb: [plancher] }));

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '3',
      isolation_mur: '^iti$',
      isolation_plancher: '^ite$'
    });
  });

  test('plancher retrouvé via reference_2 : matcher construit', () => {
    tv.mockReturnValue({ k: '0.35', tv_pont_thermique_id: '80' });
    const { mur, plancher } = murPlancher(
      {},
      { enum_type_plancher_bas_id: '1', type_isolation: 'ite' }
    );
    // reference_1 pointe le mur, reference_2 pointe le plancher
    const pt = pontThermique({
      type_liaison: 'plancher bas / mur',
      enum_type_liaison_id: '3',
      reference_1: 'M1',
      reference_2: 'P1',
      description: 'mur / plancher'
    });

    calc_pont_thermique(pt, '1', logement({ mur, pb: [plancher] }));

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '3',
      isolation_mur: '^iti$',
      isolation_plancher: '^ite$'
    });
  });

  test("plancher bas isolé mais type d'isolation inconnu : plancher ITE", () => {
    tv.mockReturnValue({ k: '0.35', tv_pont_thermique_id: '80' });
    const { mur, plancher } = murPlancher(
      {},
      { enum_type_plancher_bas_id: '1', type_isolation: "isolé mais type d'isolation inconnu" }
    );
    const pt = ptPlancher('plancher bas / mur');

    calc_pont_thermique(pt, '1', logement({ mur, pb: [plancher] }));

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '3',
      isolation_mur: '^iti$',
      isolation_plancher: '^ite$'
    });
  });
});

/**
 * 3.4.5 Menuiserie / mur.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4.5
 */
describe('calc_pont_thermique - liaison menuiserie / mur', () => {
  function murMenuiserie(murOverrides = {}, menuiserieOverrides = {}) {
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          enum_type_adjacence_id: '1',
          enum_materiaux_structure_mur_id: '1',
          type_isolation: 'iti',
          ...murOverrides
        },
        donnee_utilisateur: {}
      }
    ];
    const menuiserie = {
      donnee_entree: {
        reference: 'B1',
        type_pose: 'tunnel',
        presence_retour_isolation: 1,
        largeur_dormant: 5,
        ...menuiserieOverrides
      },
      donnee_utilisateur: {}
    };
    return { mur, menuiserie };
  }

  function ptMenuiserie() {
    return pontThermique({
      type_liaison: 'menuiserie / mur',
      enum_type_liaison_id: '20',
      reference_1: 'B1',
      reference_2: 'M1',
      description: 'menuiserie / mur'
    });
  }

  test('mur en isolation répartie (ITR) : le pont thermique ne dépend pas de la menuiserie', () => {
    tv.mockReturnValue({ k: '0.2', tv_pont_thermique_id: '90' });
    const { mur } = murMenuiserie({ type_isolation: 'itr' });
    const pt = ptMenuiserie();

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '20',
      isolation_mur: '^itr$'
    });
    expect(pt.donnee_intermediaire.k).toBe(0.2);
  });

  test('menuiserie non retrouvée : repli sur la valeur intermédiaire', () => {
    tv.mockReturnValue({ k: '0.9' });
    const { mur } = murMenuiserie();
    const pt = ptMenuiserie();
    pt.donnee_entree.tv_pont_thermique_id = 7;

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(pt.donnee_intermediaire.k).toBe('0.9');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('menuiserie retrouvée : matcher pose / retour isolation / largeur dormant', () => {
    tv.mockReturnValue({ k: '0.25', tv_pont_thermique_id: '91' });
    const { mur, menuiserie } = murMenuiserie();
    const pt = ptMenuiserie();

    calc_pont_thermique(pt, '1', logement({ mur, bv: [menuiserie] }));

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '20',
      isolation_mur: '^iti$',
      type_pose: 'tunnel',
      presence_retour_isolation: 1,
      largeur_dormant: 5
    });
    expect(pt.donnee_intermediaire.k).toBe(0.25);
  });

  test('pose "sans objet" ramenée à une pose tunnel', () => {
    tv.mockReturnValue({ k: '0.25', tv_pont_thermique_id: '91' });
    const { mur, menuiserie } = murMenuiserie({}, { type_pose: 'sans objet' });
    const pt = ptMenuiserie();

    calc_pont_thermique(pt, '1', logement({ mur, bv: [menuiserie] }));

    expect(tv).toHaveBeenCalledWith(
      'pont_thermique',
      expect.objectContaining({ type_pose: 'tunnel' })
    );
  });

  test('type de pose absent (sans compatibilité bug) : pose tunnel par défaut', () => {
    tv.mockReturnValue({ k: '0.25', tv_pont_thermique_id: '91' });
    const { mur, menuiserie } = murMenuiserie({}, { type_pose: undefined });
    const pt = ptMenuiserie();

    calc_pont_thermique(pt, '1', logement({ mur, bv: [menuiserie] }));

    expect(tv).toHaveBeenLastCalledWith(
      'pont_thermique',
      expect.objectContaining({ type_pose: 'tunnel' })
    );
  });

  test('type de pose absent (compatibilité bug) : récupération via tv_pont_thermique_id', () => {
    state.bug = true;
    // 1er appel tv (récupération type_pose), 2e appel tv (ligne pont_thermique)
    tv.mockReturnValueOnce({ type_pose: 'nu extérieur' });
    tv.mockReturnValue({ k: '0.25', tv_pont_thermique_id: '91' });
    const { mur, menuiserie } = murMenuiserie({}, { type_pose: undefined });
    const pt = ptMenuiserie();
    pt.donnee_entree.tv_pont_thermique_id = 7;

    calc_pont_thermique(pt, '1', logement({ mur, bv: [menuiserie] }));

    expect(tv).toHaveBeenLastCalledWith(
      'pont_thermique',
      expect.objectContaining({ type_pose: 'nu extérieur' })
    );
    expect(errorSpy).toHaveBeenCalled();
  });

  test('type de pose absent (compatibilité bug) sans ligne tv : pose tunnel par défaut', () => {
    state.bug = true;
    tv.mockReturnValueOnce(null); // récupération type_pose échoue
    tv.mockReturnValue({ k: '0.25', tv_pont_thermique_id: '91' });
    const { mur, menuiserie } = murMenuiserie({}, { type_pose: undefined });
    const pt = ptMenuiserie();
    pt.donnee_entree.tv_pont_thermique_id = 7;

    calc_pont_thermique(pt, '1', logement({ mur, bv: [menuiserie] }));

    expect(tv).toHaveBeenLastCalledWith(
      'pont_thermique',
      expect.objectContaining({ type_pose: 'tunnel' })
    );
  });
});

/**
 * Recherche du mur par la référence de la baie vitrée (comportement bugué reproduit).
 */
describe('calc_pont_thermique - récupération du mur via la baie vitrée (compatibilité bug)', () => {
  test('mur retrouvé grâce à reference_paroi de la baie vitrée', () => {
    state.bug = true;
    tv.mockReturnValue({ k: '0.5', tv_pont_thermique_id: '42' });
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          enum_type_adjacence_id: '1',
          type_isolation: 'iti'
        },
        donnee_utilisateur: {}
      }
    ];
    const bv = [{ donnee_entree: { reference: 'BV1', reference_paroi: '0' } }];
    const pt = pontThermique({
      type_liaison: 'refend / mur',
      reference_1: 'BV1',
      description: 'refend'
    });

    calc_pont_thermique(pt, '1', logement({ mur, bv }));

    expect(pt.donnee_intermediaire.k).toBe(0.5);
    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '12',
      isolation_mur: '^iti$'
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  test('reference_paroi ne correspondant pas à l’index du mur : aucun mur retrouvé (isolation ITI par défaut)', () => {
    state.bug = true;
    tv.mockReturnValue({ k: '0.5', tv_pont_thermique_id: '42' });
    const mur = [
      {
        donnee_entree: { reference: 'M1', enum_type_adjacence_id: '1', type_isolation: 'iti' },
        donnee_utilisateur: {}
      }
    ];
    // reference_paroi = 5 alors que l'index du mur est 0 => pas de correspondance
    const bv = [{ donnee_entree: { reference: 'BV1', reference_paroi: '5' } }];
    const pt = pontThermique({
      type_liaison: 'refend / mur',
      reference_1: 'BV1',
      description: 'refend'
    });

    calc_pont_thermique(pt, '1', logement({ mur, bv }));

    expect(tv).toHaveBeenCalledWith('pont_thermique', {
      enum_type_liaison_id: '12',
      isolation_mur: '^iti'
    });
    expect(pt.donnee_intermediaire.k).toBe(0.5);
  });
});

/**
 * Collections d'enveloppe absentes et absence de ligne tabulée finale.
 */
describe('calc_pont_thermique - cas limites', () => {
  test('collections absentes : chaque liste retombe sur un tableau vide (repli valeur intermédiaire)', () => {
    tv.mockReturnValue({ k: '0.9' });
    const logementVide = {
      enveloppe: {
        mur_collection: {},
        plancher_bas_collection: {},
        plancher_haut_collection: {},
        baie_vitree_collection: {},
        porte_collection: {}
      }
    };
    const pt = pontThermique({
      type_liaison: 'refend / mur',
      description: 'descriptionNonReconnue',
      tv_pont_thermique_id: 7
    });

    calc_pont_thermique(pt, '1', logementVide);

    expect(pt.donnee_intermediaire.k).toBe('0.9');
  });

  test('aucune ligne tabulée pour le pont thermique : erreur émise', () => {
    tv.mockReturnValue(null);
    const mur = [
      {
        donnee_entree: {
          reference: 'M1',
          enum_type_adjacence_id: '1',
          type_isolation: 'iti'
        },
        donnee_utilisateur: {}
      }
    ];
    const pt = pontThermique({
      type_liaison: 'refend / mur',
      reference_1: 'M1',
      description: 'refend'
    });

    calc_pont_thermique(pt, '1', logement({ mur }));

    expect(errorSpy).toHaveBeenCalledWith(
      '!! pas de valeur forfaitaire trouvée pour pont_thermique (k) !!'
    );
    expect(pt.donnee_intermediaire.k).toBeUndefined();
  });
});
