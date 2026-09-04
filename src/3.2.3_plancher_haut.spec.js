import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_ph` :
 * - `enums` : mapping minimal période de construction / période d'isolation ;
 * - `b` (3.1_b.js) : simple espion (le coefficient b n'intervient pas dans le calcul de Uph ici) ;
 * - `tv` : accès aux tables `uph0` / `uph`, on contrôle la ligne retournée par table ;
 * - `requestInput` : passe-plat renvoyant la donnée d'entrée demandée ;
 * - `getKeyByValue` : implémentation déterministe (pas de dépendance aux vraies enums) ;
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
  getKeyByValue: (object, value) => Object.keys(object).find((key) => object[key] === value),
  get bug_for_bug_compat() {
    return bugForBugCompat;
  }
}));

const { default: calc_ph } = await import('./3.2.3_plancher_haut.js');
const { tv } = await import('./utils.js');

/** Table `uph0` figée : U0 forfaitaire de la paroi nue. */
const ROW_UPH0 = { uph0: '2', tv_uph0_id: '5' };
/** Table `uph` figée : U forfaitaire de la paroi isolée. */
const ROW_UPH = { uph: '0.3', tv_uph_id: '7' };

beforeEach(() => {
  bugForBugCompat = false;
  tv.mockReset();
  tv.mockImplementation((table) => {
    if (table === 'uph0') return { ...ROW_UPH0 };
    if (table === 'uph') return { ...ROW_UPH };
    return null;
  });
});

/**
 * 3.2.3 Coefficient de transmission des planchers hauts (Uph)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.2.3
 */
describe('calc_ph - plancher non isolé', () => {
  test('Uph égal à Uph0 (paroi nue)', () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_plancher_haut: 'terrasse'
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(ph.donnee_intermediaire.uph0).toBe(2);
    expect(ph.donnee_intermediaire.uph).toBe(2);
  });

  test('Uph0 initialisé depuis une donnée intermédiaire préexistante', () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0: 'u0 non saisi car le u est saisi connu et justifié.'
      },
      donnee_intermediaire: { uph0: 1.5 }
    };

    calc_ph(ph, 'h1a', '1', '0');

    // Aucune méthode ne recalcule Uph0 ici : la valeur préexistante est conservée
    expect(ph.donnee_intermediaire.uph0).toBe(1.5);
    expect(ph.donnee_intermediaire.uph).toBe(1.5);
  });

  test('Uph0 introuvable dans la table : erreur émise et uph0 non défini', () => {
    tv.mockReturnValue(null);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        type_plancher_haut: 'terrasse'
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(ph.donnee_intermediaire.uph0).toBeUndefined();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('uph0'));
    error.mockRestore();
  });
});

describe('calc_ph - calcul de Uph0 (calc_uph0)', () => {
  test('saisie directe de Uph0 : valeur reprise depuis uph0_saisi sans accès table', () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0:
          'saisie direct u0 justifiée à partir des documents justificatifs autorisés',
        uph0_saisi: 0.9
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(tv).not.toHaveBeenCalled();
    expect(ph.donnee_intermediaire.uph0).toBe(0.9);
    expect(ph.donnee_intermediaire.uph).toBe(0.9);
  });

  test('Uph0 non saisi car U est saisi : ni accès table, ni valeur Uph0', () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0: 'u0 non saisi car le u est saisi connu et justifié.'
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(tv).not.toHaveBeenCalled();
    expect(ph.donnee_intermediaire.uph0).toBeUndefined();
    expect(ph.donnee_intermediaire.uph).toBeUndefined();
  });

  test('methode_saisie_u0 inconnue : avertissement émis et Uph0 non calculé', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'non isolé',
        methode_saisie_u0: 'valeur inexistante'
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(warn).toHaveBeenCalledWith('methode_saisie_u0 inconnue:', 'valeur inexistante');
    expect(ph.donnee_intermediaire.uph0).toBeUndefined();
    warn.mockRestore();
  });
});

describe("calc_ph - ajout d'une isolation par épaisseur ou résistance", () => {
  test("épaisseur d'isolation saisie : Uph = 1 / (1/Uph0 + e/0,04)", () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'epaisseur isolation saisie justifiée par mesure ou observation',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_plancher_haut: 'terrasse',
        epaisseur_isolation: 10
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    // Uph0 = 2 ; e = 10 * 0,01 = 0,1 m ; Uph = 1 / (1/2 + 0,1/0,04) = 1/3
    // valeur de référence de régression
    expect(ph.donnee_intermediaire.uph).toBeCloseTo(0.3333333333333333, 9);
  });

  test("résistance d'isolation saisie : Uph = 1 / (1/Uph0 + R)", () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u:
          "resistance isolation saisie justifiée observation de l'isolant installé et mesure de son épaisseur",
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_plancher_haut: 'terrasse',
        resistance_isolation: 1
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    // Uph0 = 2 ; R = 1 ; Uph = 1 / (1/2 + 1) = 2/3
    // valeur de référence de régression
    expect(ph.donnee_intermediaire.uph).toBeCloseTo(0.6666666666666666, 9);
  });
});

describe('calc_ph - saisie directe de Uph', () => {
  test('Uph pris depuis la valeur saisie, sans accès aux tables', () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u:
          'saisie direct u justifiée  (à partir des documents justificatifs autorisés)',
        uph_saisi: 0.18
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(tv).not.toHaveBeenCalled();
    expect(ph.donnee_intermediaire.uph).toBe(0.18);
  });
});

describe('calc_ph - isolation inconnue (table forfaitaire)', () => {
  test('Uph = min(Uph table, Uph0) : la paroi isolée ne peut être plus déperditive que nue', () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'isolation inconnue  (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_adjacence: 'extérieur',
        type_plancher_haut: 'terrasse'
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    // min(0,3 ; 2) = 0,3
    expect(ph.donnee_intermediaire.uph).toBe(0.3);
  });

  test('Uph introuvable dans la table : erreur émise et uph non défini par tv_uph', () => {
    tv.mockImplementation((table) => (table === 'uph0' ? { ...ROW_UPH0 } : null));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'isolation inconnue  (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_adjacence: 'extérieur',
        type_plancher_haut: 'terrasse'
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('uph'));
    // di.uph vaut undefined avant le Math.min => min(undefined, 2) = NaN
    expect(ph.donnee_intermediaire.uph).toBeNaN();
    error.mockRestore();
  });

  /**
   * Détermination du type de toiture (matcher de la table `uph`) selon l'adjacence.
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - page 21
   */
  test.each([
    ['locaux non chauffés non accessible', 'terrasse', 'terrasse'],
    ['garage', 'terrasse', 'combles'],
    ['extérieur', 'combles aménagés sous rampant', 'combles'],
    ['extérieur', 'terrasse', 'terrasse']
  ])(
    'adjacence "%s" + type "%s" => type_toiture "%s" dans le matcher',
    (typeAdjacence, typePlancherHaut, typeToitureAttendu) => {
      const ph = {
        donnee_entree: {
          methode_saisie_u: 'isolation inconnue  (table forfaitaire)',
          methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
          type_adjacence: typeAdjacence,
          type_plancher_haut: typePlancherHaut
        }
      };

      calc_ph(ph, 'h1a', '1', '0');

      expect(tv).toHaveBeenCalledWith('uph', {
        enum_periode_construction_id: '1',
        enum_zone_climatique_id: 'h1a',
        effet_joule: '0',
        type_toiture: typeToitureAttendu
      });
    }
  );

  test("la période d'isolation, si présente, prime sur la période de construction", () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'isolation inconnue  (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_adjacence: 'extérieur',
        type_plancher_haut: 'terrasse',
        enum_periode_isolation_id: '6'
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(tv).toHaveBeenCalledWith(
      'uph',
      expect.objectContaining({ enum_periode_construction_id: '6' })
    );
  });
});

/**
 * Compatibilité "bug for bug" : lorsque le DPE fournit un `tv_uph_id`, on relit la ligne
 * de la table `uph` pour, le cas échéant, corriger le type de toiture et l'effet Joule.
 */
describe('calc_ph - compatibilité bug for bug (récupération depuis tv_uph_id)', () => {
  beforeEach(() => {
    bugForBugCompat = true;
  });

  test('type_toiture "combles" du DPE : la valeur du DPE prime sur celle calculée', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // La ligne relue via tv_uph_id impose type_toiture = 'combles' et effet_joule = '0'
    tv.mockImplementation((table, matcher) => {
      if (table === 'uph0') return { ...ROW_UPH0 };
      if (table === 'uph' && matcher.tv_uph_id) {
        return { type_toiture: 'combles', effet_joule: '0' };
      }
      if (table === 'uph') {
        // On vérifie ici que le matcher final utilise bien type_toiture = 'combles'
        return matcher.type_toiture === 'combles' ? { ...ROW_UPH } : null;
      }
      return null;
    });

    const ph = {
      donnee_entree: {
        methode_saisie_u: 'isolation inconnue  (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_adjacence: 'extérieur', // calcul => 'terrasse'
        type_plancher_haut: 'terrasse',
        tv_uph_id: 7,
        description: 'PH test'
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(error).toHaveBeenCalled();
    expect(tv).toHaveBeenCalledWith('uph', expect.objectContaining({ type_toiture: 'combles' }));
    expect(ph.donnee_intermediaire.uph).toBe(0.3);
    error.mockRestore();
  });

  test('effet_joule du DPE différent : la valeur du DPE est conservée dans le matcher', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockImplementation((table, matcher) => {
      if (table === 'uph0') return { ...ROW_UPH0 };
      if (table === 'uph' && matcher.tv_uph_id) {
        // type_toiture 'terrasse' => pas de correction du type ; effet_joule différent => correction
        return { type_toiture: 'terrasse', effet_joule: '1' };
      }
      if (table === 'uph') return { ...ROW_UPH };
      return null;
    });

    const ph = {
      donnee_entree: {
        methode_saisie_u: 'isolation inconnue  (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_adjacence: 'extérieur',
        type_plancher_haut: 'terrasse',
        tv_uph_id: 7,
        description: 'PH test'
      }
    };

    calc_ph(ph, 'h1a', '1', '0');

    expect(error).toHaveBeenCalled();
    expect(tv).toHaveBeenCalledWith('uph', expect.objectContaining({ effet_joule: '1' }));
    error.mockRestore();
  });
});

describe('calc_ph - année de construction saisie (table forfaitaire)', () => {
  test("période d'isolation renseignée : elle est utilisée comme période de la table", () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'année de construction saisie (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_adjacence: 'extérieur',
        type_plancher_haut: 'terrasse',
        enum_periode_isolation_id: '6'
      }
    };

    calc_ph(ph, 'h1a', '5', '0');

    expect(tv).toHaveBeenCalledWith(
      'uph',
      expect.objectContaining({ enum_periode_construction_id: '6' })
    );
    expect(ph.donnee_intermediaire.uph).toBe(0.3);
  });

  test.each([
    ['1', 'avant 1948'],
    ['3', '1948-1974']
  ])(
    "période de construction ancienne (%s = %s) sans année d'isolation : isolation forcée à 1975-1977",
    (pcId) => {
      const ph = {
        donnee_entree: {
          methode_saisie_u: 'année de construction saisie (table forfaitaire)',
          methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
          type_adjacence: 'extérieur',
          type_plancher_haut: 'terrasse'
        }
      };

      calc_ph(ph, 'h1a', pcId, '0');

      // getKeyByValue(periode_isolation, '1975-1977') = '2'
      expect(tv).toHaveBeenCalledWith(
        'uph',
        expect.objectContaining({ enum_periode_construction_id: '2' })
      );
    }
  );

  test("période de construction récente sans année d'isolation : période de construction conservée", () => {
    const ph = {
      donnee_entree: {
        methode_saisie_u: 'année de construction saisie (table forfaitaire)',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        type_adjacence: 'extérieur',
        type_plancher_haut: 'terrasse'
      }
    };

    calc_ph(ph, 'h1a', '5', '0');

    // pc = '1989-2000' => pas de forçage, la période de construction '5' est conservée
    expect(tv).toHaveBeenCalledWith(
      'uph',
      expect.objectContaining({ enum_periode_construction_id: '5' })
    );
  });
});

describe('calc_ph - méthode de saisie inconnue', () => {
  test('aucun calcul de Uph et avertissement émis', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ph = { donnee_entree: { methode_saisie_u: 'valeur inexistante' } };

    calc_ph(ph, 'h1a', '1', '0');

    expect(ph.donnee_intermediaire.uph).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
