import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_pb` :
 * - `enums` : mapping minimal type d'adjacence / période de construction / période d'isolation ;
 * - `b` (3.1_b.js) : simple espion (le coefficient b n'intervient pas dans le calcul de Upb ici) ;
 * - `tv` : accès aux tables `upb0` / `upb` / `ue`, on contrôle la ligne retournée par table ;
 * - `requestInput` : passe-plat renvoyant la donnée d'entrée demandée ;
 * - `getKeyByValue` : implémentation déterministe (indépendante des vraies enums) ;
 * - `getRange` : contrôlé par test pour fournir l'encadrement de Upb dans le calcul de Ue ;
 * - `bug_for_bug_compat` : exposé via un getter afin de pouvoir le basculer par test.
 */
let bugForBugCompat = false;

vi.mock('./enums.js', () => ({
  default: {
    type_adjacence: {
      5: 'terre-plein',
      6: 'sous-sol non chauffé',
      7: 'vide sanitaire',
      8: 'extérieur'
    },
    periode_construction: { 1: 'avant 1948', 3: '1948-1974', 5: '1989-2000' },
    periode_isolation: { 2: '1975-1977', 6: '2006-2012' }
  }
}));

vi.mock('./3.1_b.js', () => ({
  default: vi.fn()
}));

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  tv: vi.fn(),
  requestInput: (de, du, field) => de[field],
  getKeyByValue: (object, value) => Object.keys(object).find((key) => object[key] === value),
  getRange: vi.fn(),
  get bug_for_bug_compat() {
    return bugForBugCompat;
  }
}));

const { default: calc_pb } = await import('./3.2.2_plancher_bas.js');
const { tv, getRange } = await import('./utils.js');

/** Table `upb0` figée : U0 forfaitaire de la paroi nue. */
const ROW_UPB0 = { upb0: '2', tv_upb0_id: '9' };
/** Table `upb` figée : U forfaitaire de la paroi isolée. */
const ROW_UPB = { upb: '0.3', tv_upb_id: '2' };

beforeEach(() => {
  bugForBugCompat = false;
  tv.mockReset();
  getRange.mockReset();
  tv.mockImplementation((table) => {
    if (table === 'upb0') return { ...ROW_UPB0 };
    if (table === 'upb') return { ...ROW_UPB };
    return null;
  });
});

/**
 * 3.2.2 Coefficient de transmission des planchers bas (Upb)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.2.2
 */
describe('calc_pb - plancher non isolé (methode 1)', () => {
  test('Upb égal à Upb0 (paroi nue) et adjacence non déperditive => upb_final = upb', () => {
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(pb.donnee_intermediaire.upb0).toBe(2);
    expect(pb.donnee_intermediaire.upb).toBe(2);
    expect(pb.donnee_intermediaire.upb_final).toBe(2);
  });

  test('Upb0 initialisé depuis une donnée intermédiaire préexistante', () => {
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0: 'u0 non saisi car le u est saisi connu et justifié.',
        type_adjacence: 'extérieur'
      },
      donnee_intermediaire: { upb0: 1.4 }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    // 'u0 non saisi' ne recalcule pas Upb0 : la valeur préexistante est conservée
    expect(pb.donnee_intermediaire.upb0).toBe(1.4);
    expect(pb.donnee_intermediaire.upb).toBe(1.4);
  });

  test('Upb0 introuvable dans la table : erreur émise', () => {
    tv.mockReturnValue(null);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('upb0'));
    expect(pb.donnee_intermediaire.upb0).toBeUndefined();
    error.mockRestore();
  });
});

describe('calc_pb - calcul de Upb0 (calc_upb0)', () => {
  test('saisie directe de Upb0 : valeur reprise depuis upb0_saisi sans accès table', () => {
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0:
          'saisie direct u0 justifiée à partir des documents justificatifs autorisés',
        upb0_saisi: 0.8,
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(tv).not.toHaveBeenCalled();
    expect(pb.donnee_intermediaire.upb0).toBe(0.8);
    expect(pb.donnee_intermediaire.upb).toBe(0.8);
  });

  test('methode_saisie_u0 inconnue : avertissement émis', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0: 'valeur inexistante',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(warn).toHaveBeenCalledWith('methode_saisie_u0 inconnue:', 'valeur inexistante');
    warn.mockRestore();
  });
});

describe('calc_pb - isolation par épaisseur / résistance', () => {
  test.each([['3'], ['4']])(
    "épaisseur d'isolation saisie (methode %s) : Upb = 1 / (1/Upb0 + e/0,042)",
    (methode) => {
      const pb = {
        donnee_entree: {
          enum_methode_saisie_u_id: methode,
          methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
          enum_type_plancher_bas_id: '9',
          epaisseur_isolation: '5',
          type_adjacence: 'extérieur'
        }
      };

      calc_pb(pb, 'h1a', '1', '0', [pb]);

      // Upb0 = 2 ; e = 5 * 0,01 = 0,05 m ; Upb = 1 / (1/2 + 0,05/0,042)
      // valeur de référence de régression
      expect(pb.donnee_intermediaire.upb).toBeCloseTo(0.5915492957746479, 9);
    }
  );

  test.each([['5'], ['6']])(
    "résistance d'isolation saisie (methode %s) : Upb = 1 / (1/Upb0 + R)",
    (methode) => {
      const pb = {
        donnee_entree: {
          enum_methode_saisie_u_id: methode,
          methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
          enum_type_plancher_bas_id: '9',
          resistance_isolation: '1',
          type_adjacence: 'extérieur'
        }
      };

      calc_pb(pb, 'h1a', '1', '0', [pb]);

      // Upb0 = 2 ; R = 1 ; Upb = 1 / (1/2 + 1)
      // valeur de référence de régression
      expect(pb.donnee_intermediaire.upb).toBeCloseTo(0.6666666666666666, 9);
    }
  );
});

describe('calc_pb - isolation inconnue / table forfaitaire (methodes 2 et 7)', () => {
  test("Upb = min(Upb table, Upb0) et la période d'isolation prime", () => {
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '2',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        enum_periode_isolation_id: '6',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    // La période d'isolation renseignée est utilisée comme période de la table
    expect(tv).toHaveBeenCalledWith(
      'upb',
      expect.objectContaining({ enum_periode_construction_id: '6' }),
      pb.donnee_entree
    );
    // min(0,3 ; 2) = 0,3
    expect(pb.donnee_intermediaire.upb).toBe(0.3);
  });

  test("sans période d'isolation, la période de construction est utilisée", () => {
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '7',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '5', '0', [pb]);

    expect(tv).toHaveBeenCalledWith(
      'upb',
      expect.objectContaining({ enum_periode_construction_id: '5' }),
      pb.donnee_entree
    );
  });

  test('Upb introuvable dans la table forfaitaire : erreur émise', () => {
    tv.mockImplementation((table) => (table === 'upb0' ? { ...ROW_UPB0 } : null));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '2',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('upb'));
    error.mockRestore();
  });
});

describe('calc_pb - année de construction saisie (methode 8)', () => {
  test("période d'isolation renseignée : elle est utilisée", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '8',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        enum_periode_isolation_id: '6',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '5', '0', [pb]);

    expect(tv).toHaveBeenCalledWith(
      'upb',
      expect.objectContaining({ enum_periode_construction_id: '6' }),
      pb.donnee_entree
    );
    warn.mockRestore();
  });

  test.each([
    ['1', 'avant 1948'],
    ['3', '1948-1974']
  ])(
    "construction ancienne (%s = %s) sans année d'isolation : isolation forcée à 1975-1977",
    (pcId) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const pb = {
        donnee_entree: {
          enum_methode_saisie_u_id: '8',
          methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
          enum_type_plancher_bas_id: '9',
          type_adjacence: 'extérieur'
        }
      };

      calc_pb(pb, 'h1a', pcId, '0', [pb]);

      // getKeyByValue(periode_isolation, '1975-1977') = '2' (différent de pc_id) => avertissement
      expect(tv).toHaveBeenCalledWith(
        'upb',
        expect.objectContaining({ enum_periode_construction_id: '2' }),
        pb.donnee_entree
      );
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    }
  );

  test('construction ancienne + bug_for_bug : second appel avec la période de construction', () => {
    bugForBugCompat = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // 1er appel (période 1975-1977) renvoie tv_upb_id = 2 ; l'appel avec la période de
    // construction ('1') renvoie tv_upb_id = 3 (valeur différente => déclenche le recalcul).
    tv.mockImplementation((table, matcher) => {
      if (table === 'upb0') return { ...ROW_UPB0 };
      if (table === 'upb') {
        return {
          upb: '0.3',
          effet_joule: '0',
          tv_upb_id: matcher.enum_periode_construction_id === '1' ? '3' : '2'
        };
      }
      return null;
    });
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '8',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    // L'avertissement de bascule d'année d'isolation est émis
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Année d'));
    // Le dernier appel forfaitaire utilise la période de construction d'origine ('1')
    expect(tv).toHaveBeenLastCalledWith(
      'upb',
      expect.objectContaining({ enum_periode_construction_id: '1' }),
      pb.donnee_entree
    );
    warn.mockRestore();
    error.mockRestore();
  });

  test("construction récente sans année d'isolation : pas de forçage ni d'avertissement", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '8',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '5', '0', [pb]);

    expect(tv).toHaveBeenCalledWith(
      'upb',
      expect.objectContaining({ enum_periode_construction_id: '5' }),
      pb.donnee_entree
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('calc_pb - saisie directe de Upb (methodes 9 et 10)', () => {
  test.each([['9'], ['10']])('Upb pris depuis upb_saisi (methode %s)', (methode) => {
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: methode,
        upb_saisi: 0.22,
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(pb.donnee_intermediaire.upb).toBe(0.22);
  });
});

describe('calc_pb - méthode de saisie de U inconnue', () => {
  test('aucun calcul de Upb et avertissement émis', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '99',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(warn).toHaveBeenCalledWith('methode_saisie_u inconnue:', 99);
    warn.mockRestore();
  });
});

/**
 * Compatibilité "bug for bug" : la méthode de saisie de U est forcée quand une donnée d'entrée
 * (résistance, épaisseur ou Upb saisi) est présente mais incohérente avec la méthode déclarée.
 */
describe('calc_pb - compatibilité bug for bug (forçage de la méthode de saisie)', () => {
  beforeEach(() => {
    bugForBugCompat = true;
  });

  test('résistance connue mais methode != 5/6 : méthode forcée à 5', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        resistance_isolation: '1',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('resistance isolation saisie'));
    // Upb calculé comme en methode 5 : 1 / (1/2 + 1)
    expect(pb.donnee_intermediaire.upb).toBeCloseTo(0.6666666666666666, 9);
    error.mockRestore();
  });

  test('épaisseur connue mais methode != 3/4 : méthode forcée à 3', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        epaisseur_isolation: '5',
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('epaisseur isolation saisie'));
    expect(pb.donnee_intermediaire.upb).toBeCloseTo(0.5915492957746479, 9);
    error.mockRestore();
  });

  test('Upb saisi mais methode != 9/10 : méthode forcée à 9', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        upb_saisi: 0.25,
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('saisie direct u'));
    expect(pb.donnee_intermediaire.upb).toBe(0.25);
    error.mockRestore();
  });

  test('effet_joule du DPE différent de celui attendu : valeur du DPE conservée dans le matcher', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // La relecture via tv_upb_id renvoie effet_joule = '1' alors que l'effet Joule attendu est '0'
    tv.mockImplementation((table, matcher) => {
      if (table === 'upb0') return { ...ROW_UPB0 };
      if (table === 'upb' && matcher.tv_upb_id) return { effet_joule: '1', tv_upb_id: '2' };
      if (table === 'upb') return { ...ROW_UPB };
      return null;
    });
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '2',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        tv_upb_id: 2,
        type_adjacence: 'extérieur',
        description: 'PB test'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('effet_joule'));
    // Le matcher forfaitaire final utilise l'effet Joule '1' issu du DPE
    expect(tv).toHaveBeenLastCalledWith(
      'upb',
      expect.objectContaining({ effet_joule: '1' }),
      pb.donnee_entree
    );
    error.mockRestore();
  });

  test('données cohérentes avec la méthode : aucun forçage', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '5',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        resistance_isolation: '1',
        epaisseur_isolation: '5',
        upb_saisi: 0.25,
        type_adjacence: 'extérieur'
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    // methode 5 cohérente avec resistance_isolation => pas d'erreur de forçage de résistance,
    // mais épaisseur et upb_saisi présents restent incohérents (couverture des branches vraies)
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

/**
 * Calcul de la déperdition Ue vers un plancher bas sur terre-plein / vide sanitaire / sous-sol.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.2.2 (Ue)
 */
describe('calc_pb - calcul de Ue (tv_ue)', () => {
  /** Renvoie une ue interpolée selon la valeur de upb du matcher. */
  const mockTvUe = (ueForUpb) => {
    tv.mockImplementation((table, matcher) => {
      if (table === 'upb0') return { ...ROW_UPB0, upb0: '0.4' };
      if (table === 'ue') return { ue: String(ueForUpb[matcher.upb]) };
      return null;
    });
  };

  test('terre-plein, bâtiment avant 2001 (pc < 7) : interpolation linéaire de Ue', () => {
    getRange.mockReturnValue([0.3, 0.5]);
    mockTvUe({ 0.3: 0.2, 0.5: 0.4 });

    // Deux planchers de même adjacence + un plancher d'adjacence différente (ignoré)
    const autre = {
      donnee_entree: { enum_type_adjacence_id: '8', surface_paroi_opaque: 99, perimetre_ue: 99 }
    };
    const pb1 = {
      donnee_entree: { enum_type_adjacence_id: '5', surface_ue: 20, perimetre_ue: 12 }
    };
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'terre-plein',
        enum_type_adjacence_id: '5',
        surface_paroi_opaque: 4, // pas de surface_ue => fallback
        perimetre_ue: 2
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb1, pb, autre]);

    // Calcul plancher par plancher (#46) : les autres planchers (pb1, autre) sont ignorés.
    // Ce test encodait auparavant la somme par adjacence (S = 20 + 4, P = 12 + 0) ; perimetre_ue
    // est désormais porté par le plancher courant pour conserver 2S/P = 4.
    // surfaceUe = 4 (pb.surface_paroi_opaque) ; perimetreUe = 2 => 2S/P = round(8/2) = 4
    expect(tv).toHaveBeenCalledWith('ue', {
      type_adjacence_plancher: 'terre plein bâtiment construit avant 2001',
      '2s_p': '^4$',
      upb: '0.3'
    });
    // di.upb = 0,4 ; interpolation : 0,2 + (0,4-0,3)*(0,4-0,2)/(0,5-0,3) = 0,3
    // valeur de référence de régression
    expect(pb.donnee_entree.ue).toBeCloseTo(0.3, 9);
    expect(pb.donnee_intermediaire.upb_final).toBeCloseTo(0.3, 9);
  });

  test('terre-plein, bâtiment à partir de 2001 (pc >= 7) : catégorie adaptée', () => {
    getRange.mockReturnValue([0.31, 0.31]);
    mockTvUe({ 0.31: 0.25 });
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'terre-plein',
        enum_type_adjacence_id: '5',
        surface_ue: 10,
        perimetre_ue: 10
      }
    };

    calc_pb(pb, 'h1a', '8', '0', [pb]);

    expect(tv).toHaveBeenCalledWith(
      'ue',
      expect.objectContaining({
        type_adjacence_plancher: 'terre plein bâtiment construit à partir de 2001'
      })
    );
    // delta_upb = 0 => ue = ue de la borne inférieure = 0,25
    expect(pb.donnee_entree.ue).toBe(0.25);
  });

  test('vide sanitaire / sous-sol non chauffé : catégorie plancher sur vide sanitaire', () => {
    getRange.mockReturnValue([0.31, 0.31]);
    mockTvUe({ 0.31: 0.18 });
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'vide sanitaire',
        enum_type_adjacence_id: '7',
        surface_ue: 10,
        perimetre_ue: 10
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(tv).toHaveBeenCalledWith(
      'ue',
      expect.objectContaining({
        type_adjacence_plancher: 'plancher sur vide sanitaire ou sous-sol non chauffé'
      })
    );
    expect(pb.donnee_intermediaire.upb_final).toBe(0.18);
  });

  test('adjacence sous-sol non chauffé : upb_final = Ue', () => {
    getRange.mockReturnValue([0.31, 0.31]);
    mockTvUe({ 0.31: 0.19 });
    const pb = {
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0: 'type de paroi inconnu (valeur par défaut)',
        enum_type_plancher_bas_id: '9',
        type_adjacence: 'sous-sol non chauffé',
        enum_type_adjacence_id: '6',
        surface_ue: 10,
        perimetre_ue: 10
      }
    };

    calc_pb(pb, 'h1a', '1', '0', [pb]);

    expect(pb.donnee_intermediaire.upb_final).toBe(0.19);
  });

  /**
   * Issue #46 : ue calculé plancher par plancher, 2S/P issu du seul plancher courant.
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.2.2 (tableau ue : « Les données ne figurant
   * pas dans le tableau peuvent être obtenues par interpolation et extrapolation »)
   */
  describe('calcul plancher par plancher (#46)', () => {
    /** Plancher non isolé (methode 1) dont upb = upb0 = 1,45. */
    const plancher = (donnees) => ({
      donnee_entree: {
        enum_methode_saisie_u_id: '1',
        methode_saisie_u0:
          'déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire',
        enum_type_plancher_bas_id: '2',
        type_adjacence: 'terre-plein',
        enum_type_adjacence_id: '5',
        ...donnees
      }
    });

    /** Table ue mockée par couple (2s_p, upb) : terre-plein avant 2001. */
    const UE = {
      '^7$': { 0.85: 0.33, 1.5: 0.39 },
      '^2$': { 0.85: 0.55, 1.5: 0.8 },
      '^1$': { 0.85: 0.7, 1.5: 0.9 },
      '^4$': { 0.85: 0.45, 1.5: 0.6 }
    };

    beforeEach(() => {
      getRange.mockReturnValue([0.85, 1.5]);
      tv.mockImplementation((table, matcher) => {
        if (table === 'upb0') return { upb0: '1.45', tv_upb0_id: '2' };
        if (table === 'ue') return { ue: String(UE[matcher['2s_p']][matcher.upb]) };
        return null;
      });
    });

    test('2187E0982591I plancher 1 : 2S/P = 7 et ue = 0,385384615 malgré un autre terre-plein', () => {
      const pb1 = plancher({ surface_paroi_opaque: 44.8, perimetre_ue: 12.8 });
      const pb3 = plancher({ surface_paroi_opaque: 10.5, perimetre_ue: 10 });

      calc_pb(pb1, 'h1a', '1', '0', [pb1, pb3]);

      // 2S/P = 2 * 44,8 / 12,8 = 7 (somme par adjacence : 2 * 55,3 / 22,8 ≈ 4,85 => 5)
      expect(tv).toHaveBeenCalledWith('ue', {
        type_adjacence_plancher: 'terre plein bâtiment construit avant 2001',
        '2s_p': '^7$',
        upb: '0.85'
      });
      expect(tv).toHaveBeenCalledWith('ue', {
        type_adjacence_plancher: 'terre plein bâtiment construit avant 2001',
        '2s_p': '^7$',
        upb: '1.5'
      });
      expect(tv).not.toHaveBeenCalledWith('ue', expect.objectContaining({ '2s_p': '^5$' }));
      // ue = 0,33 + (0,39 - 0,33) * (1,45 - 0,85) / (1,5 - 0,85) = 0,385384615 (valeur ADEME)
      expect(pb1.donnee_entree.ue).toBeCloseTo(0.385384615, 9);
      expect(pb1.donnee_intermediaire.upb_final).toBeCloseTo(0.385384615, 9);
    });

    test('deux planchers de même adjacence avec surface_ue / perimetre_ue différents : ue différents', () => {
      const pbA = plancher({ surface_paroi_opaque: 50, surface_ue: 70, perimetre_ue: 20 });
      const pbB = plancher({ surface_paroi_opaque: 50, surface_ue: 10, perimetre_ue: 10 });
      const liste = [pbA, pbB];

      liste.forEach((pb) => calc_pb(pb, 'h1a', '1', '0', liste));

      // pbA : 2 * 70 / 20 = 7 => ue interpolé entre 0,33 et 0,39
      expect(pbA.donnee_entree.ue).toBeCloseTo(0.385384615, 9);
      // pbB : 2 * 10 / 10 = 2 => 0,55 + 0,25 * 0,6 / 0,65 (valeur de référence de régression)
      expect(pbB.donnee_entree.ue).toBeCloseTo(0.780769231, 9);
      expect(pbA.donnee_entree.ue).not.toBeCloseTo(pbB.donnee_entree.ue, 3);
    });

    test('surface_ue absente : surface_paroi_opaque du plancher courant utilisée', () => {
      const pb = plancher({ surface_paroi_opaque: 20, perimetre_ue: 10 });
      const autre = plancher({ surface_ue: 500, surface_paroi_opaque: 500, perimetre_ue: 10 });

      calc_pb(pb, 'h1a', '1', '0', [pb, autre]);

      // 2S/P = 2 * 20 / 10 = 4
      expect(tv).toHaveBeenCalledWith('ue', expect.objectContaining({ '2s_p': '^4$' }));
      // ue = 0,45 + 0,15 * 0,6 / 0,65 (valeur de référence de régression)
      expect(pb.donnee_entree.ue).toBeCloseTo(0.588461538, 9);
    });

    test('surface_ue prioritaire sur surface_paroi_opaque', () => {
      const pb = plancher({ surface_paroi_opaque: 20, surface_ue: 35, perimetre_ue: 10 });

      calc_pb(pb, 'h1a', '1', '0', [pb]);

      // 2S/P = 2 * 35 / 10 = 7
      expect(tv).toHaveBeenCalledWith('ue', expect.objectContaining({ '2s_p': '^7$' }));
    });

    test('perimetre_ue absent : comportement inchangé (division par 0 => 2S/P = 1), même si un autre plancher en a un', () => {
      const pb = plancher({ surface_paroi_opaque: 20 });
      const autre = plancher({ surface_paroi_opaque: 20, perimetre_ue: 10 });

      calc_pb(pb, 'h1a', '1', '0', [pb, autre]);

      expect(tv).toHaveBeenCalledWith('ue', expect.objectContaining({ '2s_p': '^1$' }));
      expect(pb.donnee_entree.ue).toBeCloseTo(0.884615385, 9);
    });
  });
});
