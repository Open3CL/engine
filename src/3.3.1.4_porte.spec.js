import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_porte` :
 * - `b` (3.1_b.js) : calcul du coefficient de réduction des déperditions, ici un simple espion ;
 * - `tv` : accès à la table de valeurs `uporte` (on contrôle la ligne retournée) ;
 * - `requestInput` : passe-plat qui renvoie la donnée d'entrée demandée.
 */
vi.mock('./3.1_b.js', () => ({
  default: vi.fn()
}));

vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInput: (de, du, field) => de[field]
}));

const { default: calc_porte } = await import('./3.3.1.4_porte.js');
const { default: b } = await import('./3.1_b.js');
const { tv } = await import('./utils.js');

beforeEach(() => {
  vi.mocked(b).mockReset();
  vi.mocked(tv).mockReset();
});

/**
 * 3.3.1.4 Coefficient de transmission surfacique des portes (Uporte)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.3.1.4
 */
describe('calc_porte - coefficient de transmission des portes', () => {
  test('valeur forfaitaire : Uporte lu dans la table via le type de porte', () => {
    tv.mockReturnValue({ uporte: '2.4', tv_uporte_id: '15' });
    const porte = {
      donnee_entree: {
        surface_porte: 2,
        methode_saisie_uporte: 'valeur forfaitaire',
        enum_type_porte_id: '3'
      }
    };

    calc_porte(porte, 1);

    expect(tv).toHaveBeenCalledWith('uporte', { enum_type_porte_id: '3' }, porte.donnee_entree);
    expect(porte.donnee_intermediaire.uporte).toBe(2.4);
    expect(porte.donnee_entree.tv_uporte_id).toBe(15);
  });

  test('saisie directe : Uporte pris depuis la valeur saisie, sans accès table', () => {
    const porte = {
      donnee_entree: {
        surface_porte: 2,
        methode_saisie_uporte: 'saisie directe',
        uporte_saisi: 1.8
      }
    };

    calc_porte(porte, 1);

    expect(tv).not.toHaveBeenCalled();
    expect(porte.donnee_intermediaire.uporte).toBe(1.8);
  });

  test('le coefficient b est calculé avec la zone climatique fournie', () => {
    tv.mockReturnValue({ uporte: '2.4', tv_uporte_id: '15' });
    const porte = {
      donnee_entree: {
        surface_porte: 2,
        methode_saisie_uporte: 'valeur forfaitaire',
        enum_type_porte_id: '3'
      }
    };

    calc_porte(porte, 8);

    expect(b).toHaveBeenCalledWith(
      porte.donnee_intermediaire,
      porte.donnee_entree,
      porte.donnee_utilisateur,
      8
    );
  });

  test('aucune valeur forfaitaire trouvée : Uporte reste indéfini', () => {
    tv.mockReturnValue(null);
    const porte = {
      donnee_entree: {
        surface_porte: 2,
        methode_saisie_uporte: 'valeur forfaitaire',
        enum_type_porte_id: '3'
      }
    };

    calc_porte(porte, 1);

    expect(porte.donnee_intermediaire.uporte).toBeUndefined();
  });

  test('les objets donnee_utilisateur et donnee_intermediaire sont attachés à la porte', () => {
    tv.mockReturnValue({ uporte: '2.4', tv_uporte_id: '15' });
    const porte = {
      donnee_entree: {
        surface_porte: 2,
        methode_saisie_uporte: 'valeur forfaitaire',
        enum_type_porte_id: '3'
      }
    };

    calc_porte(porte, 1);

    expect(porte.donnee_utilisateur).toBeDefined();
    expect(porte.donnee_intermediaire).toBeDefined();
  });
});
