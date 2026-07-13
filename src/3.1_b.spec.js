import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler la logique de `3.1_b.js` :
 * - `tv` : accès à la table de valeurs coef_reduction_deperdition (on contrôle la ligne retournée) ;
 * - `requestInput` / `requestInputID` : simples passe-plats vers les données d'entrée ;
 * - `bug_for_bug_compat` : désactivé pour isoler le comportement nominal ;
 * - `enums` : mapping minimal nécessaire au calcul.
 */
vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInputID: (de, du, field) => {
    const enumName = `enum_${field}_id`;
    du[enumName] = de[enumName];
    return de[enumName];
  },
  requestInput: (de, du, field) => de[field],
  bug_for_bug_compat: false
}));

vi.mock('./enums.js', () => ({
  default: {
    zone_climatique: { 1: 'h1a', 2: 'h1b', 8: 'h3' },
    type_adjacence: { 8: 'garage', 9: 'cellier', 10: 'espace tampon', 12: 'comble', 21: 'autres' },
    cfg_isolation_lnc: { 1: 'local chauffé non accessible', 2: 'lc non isolé + lnc non isolé' }
  }
}));

const { default: b, findRanges } = await import('./3.1_b.js');
const { tv } = await import('./utils.js');

const TABLE = 'coef_reduction_deperdition';

beforeEach(() => {
  tv.mockReset();
});

/**
 * 3.1 Coefficient de réduction des déperditions (b)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.1
 */
describe('findRanges - encadrement du rapport surface_aiu / surface_aue', () => {
  const ranges = [0.25, 0.5, 0.75, 1, 1.25, 2, 2.5, 3, 3.5, 4, 6, 8, 10, 25, 50];

  test('valeur inférieure à la plus petite borne : borne inférieure nulle', () => {
    expect(findRanges(0.1)).toEqual([null, 0.25]);
  });

  test('valeur supérieure à la plus grande borne : borne supérieure nulle', () => {
    expect(findRanges(60)).toEqual([50, null]);
  });

  test('valeur strictement comprise entre deux bornes : encadrement [inf, sup]', () => {
    expect(findRanges(0.3)).toEqual([0.25, 0.5]);
    expect(findRanges(1.1)).toEqual([1, 1.25]);
    expect(findRanges(9)).toEqual([8, 10]);
  });

  test('valeur égale à une borne intermédiaire : encadrement [borne précédente, borne]', () => {
    expect(findRanges(0.5)).toEqual([0.25, 0.5]);
    expect(findRanges(1)).toEqual([0.75, 1]);
    expect(findRanges(50)).toEqual([25, 50]);
  });

  test('valeur égale à la première borne : un seul élément (pas de borne précédente)', () => {
    // i === 0 : la boucle ne pousse pas de borne inférieure
    expect(findRanges(0.25)).toEqual([0.25]);
  });

  test('toutes les bornes exactes retournent un encadrement cohérent', () => {
    ranges.forEach((value, index) => {
      const result = findRanges(value);
      if (index === 0) {
        expect(result).toEqual([0.25]);
      } else {
        expect(result).toEqual([ranges[index - 1], value]);
      }
    });
  });
});

describe('b - calcul du coefficient de réduction des déperditions', () => {
  /**
   * Local chauffé non accessible / non déperditif avec surface_aue nulle (cf. page 10) :
   * b = 0 et aucun accès à la table de valeurs.
   */
  test.each([
    ['8', 'garage'],
    ['9', 'cellier'],
    ['12', 'comble faiblement ventilé'],
    ['21', 'autres dépendances']
  ])(
    'surface_aue nulle pour une adjacence de type %s (%s) : b = 0 sans accès table',
    (adjacence) => {
      const di = {};
      const de = { enum_type_adjacence_id: adjacence, surface_aue: 0 };
      b(di, de, {}, 1);
      expect(di.b).toBe(0);
      expect(tv).not.toHaveBeenCalled();
    }
  );

  /**
   * Espace tampon solarisé (adjacence 10) : le matcher inclut la zone climatique (2 premiers
   * caractères) et la configuration d'isolation du local non chauffé.
   */
  test('espace tampon solarisé (adjacence 10) : matcher zone climatique + cfg isolation', () => {
    tv.mockReturnValue({ b: '0.58', tv_coef_reduction_deperdition_id: '269' });
    const di = {};
    const de = { enum_type_adjacence_id: '10', enum_cfg_isolation_lnc_id: '7' };

    b(di, de, {}, 1);

    expect(tv).toHaveBeenCalledWith(TABLE, {
      enum_type_adjacence_id: '10',
      zone_climatique: 'h1',
      enum_cfg_isolation_lnc_id: '7'
    });
    expect(di.b).toBe(0.58);
    expect(de.tv_coef_reduction_deperdition_id).toBe(269);
  });

  /**
   * Adjacence de type garage avec surface_aiu === surface_aue :
   * bornes par défaut 0,75 < aiu/aue ≤ 1,00.
   */
  test('garage (adjacence 8), surface_aiu === surface_aue : bornes par défaut', () => {
    tv.mockReturnValue({ b: '0.7', tv_coef_reduction_deperdition_id: '100' });
    const di = {};
    const de = {
      enum_type_adjacence_id: '8',
      enum_cfg_isolation_lnc_id: '2',
      surface_aiu: 20,
      surface_aue: 20
    };

    b(di, de, {}, 1);

    expect(tv).toHaveBeenCalledWith(TABLE, {
      enum_type_adjacence_id: '8',
      enum_cfg_isolation_lnc_id: '2',
      aiu_aue_min: '0,75 <',
      aiu_aue_max: '≤ 1,00'
    });
    expect(di.b).toBe(0.7);
  });

  /**
   * Adjacence de type garage avec rapport surface_aiu / surface_aue = 0.5 :
   * findRanges([0.25, 0.5]) => bornes '0,25 <' et '≤ 0,50'.
   */
  test('garage (adjacence 8), rapport surface_aiu / surface_aue = 0.5 : bornes encadrantes', () => {
    tv.mockReturnValue({ b: '0.8', tv_coef_reduction_deperdition_id: '101' });
    const di = {};
    const de = {
      enum_type_adjacence_id: '8',
      enum_cfg_isolation_lnc_id: '2',
      surface_aiu: 10,
      surface_aue: 20
    };

    b(di, de, {}, 1);

    expect(tv).toHaveBeenCalledWith(TABLE, {
      enum_type_adjacence_id: '8',
      enum_cfg_isolation_lnc_id: '2',
      aiu_aue_min: '0,25 <',
      aiu_aue_max: '≤ 0,50'
    });
    expect(di.b).toBe(0.8);
  });

  test('aucune valeur forfaitaire trouvée : di.b reste indéfini', () => {
    tv.mockReturnValue(null);
    const di = {};
    const de = { enum_type_adjacence_id: '10', enum_cfg_isolation_lnc_id: '7' };

    b(di, de, {}, 1);

    expect(di.b).toBeUndefined();
  });
});
