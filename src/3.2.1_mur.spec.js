import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_mur` :
 * - `enums` : mapping minimal période de construction / période d'isolation ;
 * - `b` (3.1_b.js) : simple espion (le coefficient b n'intervient pas dans le calcul de Umur ici) ;
 * - `tv` : accès aux tables `umur0` / `umur`, on contrôle la ligne retournée par table ;
 * - `requestInput` / `requestInputID` : passe-plats vers les données d'entrée ;
 * - `getKeyByValue` : implémentation déterministe (indépendante des vraies enums) ;
 * - `getThicknessFromDescription` : contrôlé par test (épaisseur extraite de la description) ;
 * - `bug_for_bug_compat` : exposé via un getter afin de pouvoir le basculer par test.
 */
let bugForBugCompat = false;

vi.mock('./enums.js', () => ({
  default: {
    periode_construction: { 1: 'avant 1948', 3: '1948-1974', 5: '1989-2000' },
    periode_isolation: { 2: '1975-1977', 6: '2006-2012' }
  }
}));

vi.mock('./3.1_b.js', () => ({
  default: vi.fn()
}));

vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInput: (de, du, field) => de[field],
  requestInputID: (de, du, field) => de[`enum_${field}_id`],
  getKeyByValue: (object, value) => Object.keys(object).find((key) => object[key] === value),
  getThicknessFromDescription: vi.fn(() => 0),
  get bug_for_bug_compat() {
    return bugForBugCompat;
  }
}));

const { default: calc_mur } = await import('./3.2.1_mur.js');
const { tv, getThicknessFromDescription } = await import('./utils.js');

/** Table `umur0` figée : U0 forfaitaire de la paroi nue. */
const ROW_UMUR0 = { umur0: '2', tv_umur0_id: '1' };
/** Table `umur` figée : U forfaitaire de la paroi isolée. */
const ROW_UMUR = { umur: '0.5', tv_umur_id: '6' };

beforeEach(() => {
  bugForBugCompat = false;
  tv.mockReset();
  getThicknessFromDescription.mockReset();
  getThicknessFromDescription.mockReturnValue(0);
  tv.mockImplementation((table) => {
    if (table === 'umur0') return { ...ROW_UMUR0 };
    if (table === 'umur') return { ...ROW_UMUR };
    return null;
  });
});

/**
 * 3.2.1 Coefficient de transmission des murs (Umur)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.2.1
 */
describe('calc_mur - mur non isolé', () => {
  test('type de paroi inconnu : Umur0 = 2,5 et Umur = min(Umur0 ; 2,5)', () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(mur.donnee_intermediaire.umur0).toBe(2.5);
    expect(mur.donnee_intermediaire.umur).toBe(2.5);
  });
});

describe('calc_mur - calcul de Umur0 par table forfaitaire (tv_umur0)', () => {
  test('matériau concerné par les épaisseurs : épaisseur intégrée au matcher', () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        epaisseur_structure: 30,
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(tv).toHaveBeenCalledWith('umur0', {
      enum_materiaux_structure_mur_id: '5',
      epaisseur_structure: 30
    });
    expect(mur.donnee_intermediaire.umur0).toBe(2);
    expect(mur.donnee_intermediaire.umur).toBe(2);
  });

  test.each([['1'], ['6'], ['20'], ['27']])(
    'matériau %s non concerné par les épaisseurs : matcher sans épaisseur',
    (materiau) => {
      const mur = {
        donnee_entree: {
          methode_saisie_u: 'non isolé',
          methode_saisie_u0:
            'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
          enum_materiaux_structure_mur_id: materiau,
          epaisseur_structure: 30,
          enum_type_doublage_id: '2'
        }
      };

      calc_mur(mur, 'h1a', '1', '0');

      expect(tv).toHaveBeenCalledWith('umur0', {
        enum_materiaux_structure_mur_id: materiau
      });
    }
  );

  test('épaisseur absente : récupération depuis la description', () => {
    getThicknessFromDescription.mockReturnValue(25);
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        description: 'mur de 25 cm',
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(getThicknessFromDescription).toHaveBeenCalledWith('mur de 25 cm');
    expect(tv).toHaveBeenCalledWith('umur0', {
      enum_materiaux_structure_mur_id: '5',
      epaisseur_structure: 25
    });
  });

  test('bug_for_bug : épaisseur absente et introuvable dans la description, reprise depuis tv_umur0_id', () => {
    bugForBugCompat = true;
    getThicknessFromDescription.mockReturnValue(0);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockImplementation((table, matcher) => {
      if (table === 'umur0' && matcher.tv_umur0_id) {
        return { epaisseur_structure: 18, tv_umur0_id: '1' };
      }
      if (table === 'umur0') return { ...ROW_UMUR0, tv_umur0_id: matcher.tv_umur0_id ?? '1' };
      return null;
    });
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        description: 'mur sans épaisseur',
        tv_umur0_id: 1,
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    // L'épaisseur 18 est récupérée depuis la ligne tv_umur0_id puis utilisée dans le matcher final
    expect(error).toHaveBeenCalled();
    expect(tv).toHaveBeenLastCalledWith('umur0', {
      enum_materiaux_structure_mur_id: '5',
      epaisseur_structure: 18
    });
    error.mockRestore();
  });

  test('bug_for_bug : épaisseur > 80 recalculée en la divisant par 10 (valeur en millimètres)', () => {
    bugForBugCompat = true;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // du.tv_umur0_id_avant = mur.donnee_entree.tv_umur0_id = 5.
    // Le 1er appel (épaisseur 200) renvoie tv_umur0_id 1 (mismatch) => recalcul avec épaisseur 20.
    tv.mockImplementation((table, matcher) => {
      if (table !== 'umur0') return null;
      return { umur0: '2', tv_umur0_id: matcher.epaisseur_structure === 20 ? '5' : '1' };
    });
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        epaisseur_structure: 200,
        tv_umur0_id: 5,
        enum_type_doublage_id: '2',
        description: 'mur'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('epaisseur > 80'));
    // Après division par 10, l'épaisseur 20 donne la bonne ligne (tv_umur0_id 5)
    expect(mur.donnee_entree.tv_umur0_id).toBe(5);
    expect(mur.donnee_intermediaire.umur0).toBe(2);
    error.mockRestore();
  });

  test('bug_for_bug : épaisseur > 80 toujours incohérente après division : Umur0 non trouvé', () => {
    bugForBugCompat = true;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Aucun appel ne renvoie tv_umur0_id = 5 : la ligne finit par être invalidée (row = undefined)
    tv.mockImplementation((table) => (table === 'umur0' ? { umur0: '2', tv_umur0_id: '1' } : null));
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        epaisseur_structure: 200,
        tv_umur0_id: 5,
        enum_type_doublage_id: '2',
        description: 'mur'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('umur0'));
    // di.umur0 n'est jamais défini par tv_umur0 => Math.min(2.5, undefined) = NaN
    expect(mur.donnee_intermediaire.umur0).toBeNaN();
    error.mockRestore();
  });

  test('Umur0 introuvable dans la table : erreur émise', () => {
    tv.mockImplementation((table) => (table === 'umur0' ? null : { ...ROW_UMUR }));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        epaisseur_structure: 30,
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('umur0'));
    error.mockRestore();
  });
});

describe('calc_mur - saisie de Umur0 (calc_umur0)', () => {
  test('saisie directe de Umur0 : valeur reprise depuis umur0_saisi', () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'saisie direct u0 justifiée à partir des documents justificatifs autorisés',
        umur0_saisi: 1.2,
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(mur.donnee_intermediaire.umur0).toBe(1.2);
    expect(mur.donnee_intermediaire.umur).toBe(1.2);
  });

  test('Umur0 non saisi car U saisi : Umur0 non défini par la méthode', () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0: 'u0 non saisi car le u est saisi connu et justifié.',
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    // di.umur0 reste indéfini => Math.min(2.5, undefined) = NaN
    expect(mur.donnee_intermediaire.umur0).toBeNaN();
  });

  test('methode_saisie_u0 inconnue : avertissement émis', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0: 'valeur inexistante',
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(warn).toHaveBeenCalledWith('methode_saisie_u0 inconnue:', 'valeur inexistante');
    warn.mockRestore();
  });
});

describe('calc_mur - prise en compte du doublage', () => {
  test("doublage indéterminé ou lame d'air < 15 mm (type 3) : +0,1 de résistance", () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        epaisseur_structure: 30,
        enum_type_doublage_id: '3'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    // Umur0 table = 2 ; 1 / (1/2 + 0,1) = 1,6666...
    // valeur de référence de régression
    expect(mur.donnee_intermediaire.umur0).toBeCloseTo(1.6666666666666667, 9);
  });

  test.each([['4'], ['5']])(
    "doublage avec lame d'air ou connu (type %s) : +0,21 de résistance",
    (typeDoublage) => {
      const mur = {
        donnee_entree: {
          methode_saisie_u: 'non isolé',
          methode_saisie_u0:
            'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
          enum_materiaux_structure_mur_id: '5',
          epaisseur_structure: 30,
          enum_type_doublage_id: typeDoublage
        }
      };

      calc_mur(mur, 'h1a', '1', '0');

      // Umur0 table = 2 ; 1 / (1/2 + 0,21) = 1,40845...
      // valeur de référence de régression
      expect(mur.donnee_intermediaire.umur0).toBeCloseTo(1.4084507042253522, 9);
    }
  );

  test.each([
    ['doublage connu (plâtre, brique...)', 5],
    ["doublage indéterminé avec lame d'air", 4],
    ["doublage indéterminé ou lame d'air", 3]
  ])(
    'bug_for_bug : type de doublage déduit de la description "%s"',
    (description, resistanceType) => {
      bugForBugCompat = true;
      const mur = {
        donnee_entree: {
          methode_saisie_u: 'non isolé',
          methode_saisie_u0:
            'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
          enum_materiaux_structure_mur_id: '5',
          epaisseur_structure: 30,
          enum_type_doublage_id: '1',
          description
        }
      };

      calc_mur(mur, 'h1a', '1', '0');

      const attendu = resistanceType === 3 ? 1 / (1 / 2 + 0.1) : 1 / (1 / 2 + 0.21);
      expect(mur.donnee_intermediaire.umur0).toBeCloseTo(attendu, 9);
    }
  );

  test('bug_for_bug : DPE minorant Umur0 à 2,5 avant doublage : avertissement (Umur0 avant)', () => {
    bugForBugCompat = true;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // umur0_avant est aligné sur le Umur0 minoré à 2,5 avec doublage type 3 => 1/(1/2 + 0,1)
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        epaisseur_structure: 30,
        enum_type_doublage_id: '3'
      },
      donnee_intermediaire: { umur0: 1 / (1 / 2 + 0.1) }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('minoré à 2.5'));
    error.mockRestore();
  });

  test('bug_for_bug : DPE minorant Umur0 à 2,5 avant doublage : avertissement (Umur avant)', () => {
    bugForBugCompat = true;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // umur_avant est aligné sur le Umur0 minoré à 2,5 avec doublage type 4 => 1/(1/2 + 0,21)
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        epaisseur_structure: 30,
        enum_type_doublage_id: '4'
      },
      donnee_intermediaire: { umur: 1 / (1 / 2 + 0.21) }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('minoré à 2.5'));
    error.mockRestore();
  });
});

describe('calc_mur - enduit isolant sur paroi ancienne', () => {
  test('paroi ancienne avec enduit : +0,7 de résistance', () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        epaisseur_structure: 30,
        enum_type_doublage_id: '2',
        paroi_ancienne: 1, // renommé en enduit_isolant_paroi_ancienne
        enduit_isolant_paroi_ancienne: 1
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    // Umur0 = 2 ; 1 / (1/2 + 0,7) = 0,8333...
    // valeur de référence de régression
    expect(mur.donnee_intermediaire.umur0).toBeCloseTo(0.8333333333333334, 9);
    expect(mur.donnee_intermediaire.umur0Enduit).toBeCloseTo(0.8333333333333334, 9);
  });

  test("bug_for_bug : le DPE ignore l'enduit, la valeur Umur0 d'origine est conservée", () => {
    bugForBugCompat = true;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // umur0_avant = min(2.5, umur0) = 2 (Umur0 table), le DPE n'a pas appliqué l'enduit
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_materiaux_structure_mur_id: '5',
        epaisseur_structure: 30,
        enum_type_doublage_id: '2',
        enduit_isolant_paroi_ancienne: 1,
        description: 'mur'
      },
      donnee_intermediaire: { umur0: 2 }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('paroi ancienne'));
    // La valeur d'origine (2) est conservée, bornée à 2,5
    expect(mur.donnee_intermediaire.umur0).toBe(2);
    error.mockRestore();
  });
});

describe('calc_mur - isolation par épaisseur ou résistance', () => {
  test("épaisseur d'isolation saisie : Umur = 1 / (1/Umur0 + e/0,04)", () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'epaisseur isolation saisie justifiée par mesure ou observation',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2',
        epaisseur_isolation: 10
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    // Umur0 = 2,5 ; e = 0,1 ; 1 / (1/2,5 + 0,1/0,04) = 0,3448...
    // valeur de référence de régression
    expect(mur.donnee_intermediaire.umur).toBeCloseTo(0.3448275862068966, 9);
  });

  test("épaisseur d'isolation absente : repli sur Umur = min(Umur0 ; 2,5) et erreur", () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mur = {
      donnee_entree: {
        methode_saisie_u:
          'epaisseur isolation saisie justifiée à partir des documents justificatifs autorisés',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2',
        description: 'mur sans épaisseur isolation'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('epaisseur_isolation'));
    expect(mur.donnee_intermediaire.umur).toBe(2.5);
    error.mockRestore();
  });

  test("résistance d'isolation saisie : Umur = 1 / (1/Umur0 + R)", () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u:
          "resistance isolation saisie justifiée observation de l'isolant installé et mesure de son épaisseur",
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2',
        resistance_isolation: 1
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    // Umur0 = 2,5 ; R = 1 ; 1 / (1/2,5 + 1) = 0,7142...
    // valeur de référence de régression
    expect(mur.donnee_intermediaire.umur).toBeCloseTo(0.7142857142857143, 9);
  });

  test("résistance d'isolation absente : repli sur Umur = min(Umur0 ; 2,5) et erreur", () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mur = {
      donnee_entree: {
        methode_saisie_u:
          'resistance isolation saisie justifiée  à partir des documents justificatifs autorisés',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2',
        description: 'mur sans résistance isolation'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('resistance_isolation'));
    expect(mur.donnee_intermediaire.umur).toBe(2.5);
    error.mockRestore();
  });
});

describe('calc_mur - table forfaitaire (Umur)', () => {
  test('isolation inconnue : Umur = min(Umur table ; Umur0)', () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'isolation inconnue  (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(tv).toHaveBeenCalledWith(
      'umur',
      expect.objectContaining({
        enum_periode_construction_id: '1',
        enum_zone_climatique_id: 'h1a',
        effet_joule: '0'
      }),
      mur.donnee_entree
    );
    // min(0,5 ; 2,5) = 0,5
    expect(mur.donnee_intermediaire.umur).toBe(0.5);
  });

  test("année d'isolation différente : la période d'isolation renseignée est utilisée", () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u:
          "année d'isolation différente de l'année de construction saisie justifiée (table forfaitaire)",
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2',
        enum_periode_isolation_id: '6'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(tv).toHaveBeenCalledWith(
      'umur',
      expect.objectContaining({ enum_periode_construction_id: '6' }),
      mur.donnee_entree
    );
  });

  test("année d'isolation différente sans période d'isolation : repli sur la période de construction", () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u:
          "année d'isolation différente de l'année de construction saisie justifiée (table forfaitaire)",
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '5', '0');

    expect(tv).toHaveBeenCalledWith(
      'umur',
      expect.objectContaining({ enum_periode_construction_id: '5' }),
      mur.donnee_entree
    );
  });

  test('Umur introuvable dans la table : erreur émise', () => {
    tv.mockImplementation((table) => (table === 'umur' ? null : { ...ROW_UMUR0 }));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'isolation inconnue  (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('umur'));
    error.mockRestore();
  });
});

describe('calc_mur - année de construction saisie (table forfaitaire)', () => {
  test("période d'isolation renseignée : elle est utilisée", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'année de construction saisie (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2',
        enum_periode_isolation_id: '6'
      }
    };

    calc_mur(mur, 'h1a', '5', '0');

    expect(tv).toHaveBeenCalledWith(
      'umur',
      expect.objectContaining({ enum_periode_construction_id: '6' }),
      mur.donnee_entree
    );
    warn.mockRestore();
  });

  test.each([
    ['1', 'avant 1948'],
    ['3', '1948-1974']
  ])(
    "construction ancienne (%s = %s) sans année d'isolation : isolation forcée à 1975-1977 + avertissement",
    (pcId) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // pi_id est parseInt(getKeyByValue(...)) = 2 (nombre) ; on renvoie un tv_umur_id différent
      tv.mockImplementation((table, matcher) => {
        if (table === 'umur0') return { ...ROW_UMUR0 };
        if (table === 'umur') {
          return {
            umur: '0.5',
            tv_umur_id: matcher.enum_periode_construction_id === 2 ? '9' : '6'
          };
        }
        return null;
      });
      const mur = {
        donnee_entree: {
          methode_saisie_u: 'année de construction saisie (table forfaitaire)',
          methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
          enum_type_doublage_id: '2'
        }
      };

      calc_mur(mur, 'h1a', pcId, '0');

      // parseInt(getKeyByValue(periode_isolation, '1975-1977'), 10) = 2 (nombre)
      expect(tv).toHaveBeenCalledWith(
        'umur',
        expect.objectContaining({ enum_periode_construction_id: 2 }),
        mur.donnee_entree
      );
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    }
  );

  test('bug_for_bug : second appel forfaitaire avec la période de construction', () => {
    bugForBugCompat = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    tv.mockImplementation((table, matcher) => {
      if (table === 'umur0') return { ...ROW_UMUR0 };
      // Relecture via tv_umur_id : effet Joule et période cohérents (pas de correction)
      if (table === 'umur' && matcher.tv_umur_id) {
        return { effet_joule: '0', enum_periode_construction_id: '1' };
      }
      if (table === 'umur') {
        // 1er appel : période d'isolation (2) => tv_umur_id 9 ; 2e appel bug : période '1' => 3
        return {
          umur: '0.5',
          tv_umur_id: matcher.enum_periode_construction_id === '1' ? '3' : '9'
        };
      }
      return null;
    });
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'année de construction saisie (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2',
        description: 'mur'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    // Le dernier appel forfaitaire réutilise la période de construction d'origine ('1')
    expect(tv).toHaveBeenLastCalledWith(
      'umur',
      expect.objectContaining({ enum_periode_construction_id: '1' }),
      mur.donnee_entree
    );
    warn.mockRestore();
  });

  test("construction récente sans année d'isolation : pas de bascule ni d'avertissement", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'année de construction saisie (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2'
      }
    };

    calc_mur(mur, 'h1a', '5', '0');

    expect(tv).toHaveBeenCalledWith(
      'umur',
      expect.objectContaining({ enum_periode_construction_id: '5' }),
      mur.donnee_entree
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

/**
 * Compatibilité "bug for bug" du calcul forfaitaire de Umur : la ligne relue via `tv_umur_id`
 * peut corriger l'effet Joule et la période de construction utilisés.
 */
describe('calc_mur - bug_for_bug sur tv_umur (récupération depuis tv_umur_id)', () => {
  beforeEach(() => {
    bugForBugCompat = true;
  });

  test('effet_joule et période de construction du DPE conservés', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockImplementation((table, matcher) => {
      if (table === 'umur0') return { ...ROW_UMUR0 };
      if (table === 'umur' && matcher.tv_umur_id) {
        return { effet_joule: '1', enum_periode_construction_id: '5|6' };
      }
      if (table === 'umur') return { ...ROW_UMUR };
      return null;
    });
    const mur = {
      donnee_entree: {
        methode_saisie_u: 'isolation inconnue  (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_doublage_id: '2',
        tv_umur_id: 6,
        description: 'mur test'
      }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(error).toHaveBeenCalled();
    // Le matcher final utilise l'effet Joule ('1') et la période ('5') issus du DPE
    expect(tv).toHaveBeenLastCalledWith(
      'umur',
      expect.objectContaining({ effet_joule: '1', enum_periode_construction_id: '5' }),
      mur.donnee_entree
    );
    error.mockRestore();
  });
});

describe('calc_mur - saisie directe de Umur', () => {
  test('Umur pris depuis umur_saisi et Umur0 depuis la donnée intermédiaire', () => {
    const mur = {
      donnee_entree: {
        methode_saisie_u:
          'saisie direct u justifiée  (à partir des documents justificatifs autorisés)',
        umur_saisi: 0.15
      },
      donnee_intermediaire: { umur0: 1.8 }
    };

    calc_mur(mur, 'h1a', '1', '0');

    expect(mur.donnee_intermediaire.umur).toBe(0.15);
    expect(mur.donnee_intermediaire.umur0).toBe(1.8);
  });
});

describe('calc_mur - méthode de saisie de U inconnue', () => {
  test('aucun calcul de Umur et avertissement émis', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mur = { donnee_entree: { methode_saisie_u: 'valeur inexistante' } };

    calc_mur(mur, 'h1a', '1', '0');

    expect(mur.donnee_intermediaire.umur).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('methode_saisie_u inconnue:', 'valeur inexistante');
    warn.mockRestore();
  });

  /**
   * @see https://github.com/Open3CL/engine/issues/146
   * Le doublage NE doit PAS être cumulé à une isolation ITE ou ITI.
   */
  describe('[MURS] Doublage non cumulé à une isolation ITE/ITI (#146)', () => {
    const baseDE = {
      enum_type_adjacence_id: '1', // Paroi sur l'extérieur (b=1)
      enum_materiaux_structure_mur_id: '11', // Béton ≤20 cm
      epaisseur_structure: 20,
      enum_methode_saisie_u0_id: '2',
      paroi_ancienne: 0
    };

    test('doublage avec ITI : le doublage ne doit pas être pris en compte dans Umur0', () => {
      const zc = 3; // H2a
      const pc_id = 6;
      const ej = 0;
      // Mur béton 20 cm (umur0 ~ 2.5), avec doublage connu (type 5) ET isolation ITI (type 3)
      const mur = {
        donnee_entree: {
          ...baseDE,
          description: 'Mur béton avec doublage et ITI',
          enum_methode_saisie_u_id: '3', // épaisseur isolation saisie
          epaisseur_isolation: 10, // 10 cm
          enum_type_doublage_id: '5', // doublage connu (plâtre brique bois)
          enum_type_isolation_id: '3' // ITI
        },
        donnee_intermediaire: {}
      };
      calc_mur(mur, zc, pc_id, ej);

      // Sans doublage cumulé, umur0 = 2.5 (valeur brute du mur béton ≤20cm)
      // Avec doublage cumulé à tort : umur0 = 1 / (1/2.5 + 0.21) ≈ 1.724
      expect(mur.donnee_intermediaire.umur0).toBeCloseTo(2.5, 2);
    });

    test('doublage avec ITE : le doublage ne doit pas être pris en compte dans Umur0', () => {
      const zc = 3;
      const pc_id = 6;
      const ej = 0;
      const mur = {
        donnee_entree: {
          ...baseDE,
          description: 'Mur béton avec doublage et ITE',
          enum_methode_saisie_u_id: '3',
          epaisseur_isolation: 8,
          enum_type_doublage_id: '4', // doublage indéterminé lame d'air sup 15mm
          enum_type_isolation_id: '4' // ITE
        },
        donnee_intermediaire: {}
      };
      calc_mur(mur, zc, pc_id, ej);

      // umur0 = 2.5 (béton ≤20cm, doublage ignoré car ITE présent)
      expect(mur.donnee_intermediaire.umur0).toBeCloseTo(2.5, 2);
    });

    test('doublage avec ITR seule : le doublage DOIT être pris en compte dans Umur0', () => {
      const zc = 3;
      const pc_id = 6;
      const ej = 0;
      const mur = {
        donnee_entree: {
          ...baseDE,
          description: 'Mur béton avec doublage et ITR',
          enum_methode_saisie_u_id: '1', // non isolé
          enum_type_doublage_id: '5', // doublage connu
          enum_type_isolation_id: '5' // ITR
        },
        donnee_intermediaire: {}
      };
      calc_mur(mur, zc, pc_id, ej);

      // ITR seule → le doublage est pris en compte : umur0 < 2.5
      expect(mur.donnee_intermediaire.umur0).toBeLessThan(2.5);
    });

    test('doublage sans isolation : le doublage DOIT être pris en compte dans Umur0', () => {
      const zc = 3;
      const pc_id = 6;
      const ej = 0;
      const mur = {
        donnee_entree: {
          ...baseDE,
          description: 'Mur béton avec doublage sans isolation',
          enum_methode_saisie_u_id: '1', // non isolé
          enum_type_doublage_id: '5',
          enum_type_isolation_id: '2' // non isolé
        },
        donnee_intermediaire: {}
      };
      calc_mur(mur, zc, pc_id, ej);

      // Non isolé → doublage pris en compte : umur0 < umur0_nu_brut (le doublage réduit bien la valeur)
      expect(mur.donnee_intermediaire.umur0).toBeLessThan(2.5);
    });
  });
});
