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

vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInput: (de, du, field) => de[field],
  compareReferences: (a, b) => a === b,
  bug_for_bug_compat: false
}));

const { default: calc_pont_thermique } = await import('./3.4_pont_thermique.js');
const { tv } = await import('./utils.js');

/** Enveloppe minimale avec collections contrôlées. */
function logement({ mur = [] } = {}) {
  return {
    enveloppe: {
      mur_collection: { mur },
      plancher_bas_collection: { plancher_bas: [] },
      plancher_haut_collection: { plancher_haut: [] },
      baie_vitree_collection: { baie_vitree: [] },
      porte_collection: { porte: [] }
    }
  };
}

let errorSpy;
let warnSpy;

beforeEach(() => {
  tv.mockReset();
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
