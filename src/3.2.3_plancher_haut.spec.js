import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_ph` :
 * - `enums` : mapping minimal période de construction / période d'isolation ;
 * - `b` (3.1_b.js) : simple espion (le coefficient b n'intervient pas dans le calcul de Uph ici) ;
 * - `tv` : accès aux tables `uph0` / `uph`, on contrôle la ligne retournée par table ;
 * - `requestInput` : passe-plat renvoyant la donnée d'entrée demandée ;
 * - `getKeyByValue` : implémentation déterministe (pas de dépendance aux vraies enums) ;
 * - `bug_for_bug_compat` : désactivé pour isoler le comportement nominal.
 */
vi.mock('./enums.js', () => ({
  default: {
    periode_construction: { 1: 'avant 1948', 5: '1989-2000' },
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
  bug_for_bug_compat: false
}));

const { default: calc_ph } = await import('./3.2.3_plancher_haut.js');
const { tv } = await import('./utils.js');

/** Table `uph0` figée : U0 forfaitaire de la paroi nue. */
const ROW_UPH0 = { uph0: '2', tv_uph0_id: '5' };
/** Table `uph` figée : U forfaitaire de la paroi isolée. */
const ROW_UPH = { uph: '0.3', tv_uph_id: '7' };

beforeEach(() => {
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
