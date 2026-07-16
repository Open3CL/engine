import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_clim` :
 * - `tv` : accès à la table de valeurs `seer` (on contrôle la ligne retournée
 *   et donc l'EER forfaitaire) ;
 * - `requestInputID` : passe-plat vers les données d'entrée pour la période
 *   d'installation.
 */
vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInputID: (de, du, field) => {
    const enumName = `enum_${field}_id`;
    du[enumName] = de[enumName];
    return de[enumName];
  }
}));

const { default: calc_clim } = await import('./10_clim.js');
const { tv } = await import('./utils.js');

/** Fabrique un objet climatisation minimal. */
function clim(de) {
  return { donnee_entree: de };
}

beforeEach(() => {
  vi.mocked(tv).mockReset();
});

/**
 * 10. Calcul de la consommation de climatisation (froid)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §10
 */
describe('calc_clim - consommation de climatisation', () => {
  test('prorate le besoin de froid au ratio surface_clim / Sh', () => {
    tv.mockReturnValue({ tv_seer_id: '5', eer: 3 });
    const c = clim({ surface_clim: 50, enum_methode_saisie_carac_sys_id: '1' });

    calc_clim(c, 1000, 1500, '1', 100);

    // rs = 50 / 100 = 0.5
    expect(c.donnee_intermediaire.besoin_fr).toBeCloseTo(500, 9);
    expect(c.donnee_intermediaire.besoin_fr_depensier).toBeCloseTo(750, 9);
  });

  test('EER forfaitaire issu de la table : conso = 0.9 * besoin_fr / eer', () => {
    tv.mockReturnValue({ tv_seer_id: '5', eer: 3 });
    const c = clim({ surface_clim: 50, enum_methode_saisie_carac_sys_id: '1' });

    calc_clim(c, 1000, 1500, '1', 100);

    // valeur de référence de régression : 0.9 * 500 / 3
    expect(c.donnee_intermediaire.conso_fr).toBeCloseTo(150, 9);
    // 0.9 * 750 / 3
    expect(c.donnee_intermediaire.conso_fr_depensier).toBeCloseTo(225, 9);
    expect(c.donnee_entree.tv_seer_id).toBe(5);
    expect(c.donnee_intermediaire.eer).toBe(3);
  });

  test("matcher de la table seer : zone climatique + période d'installation", () => {
    tv.mockReturnValue({ tv_seer_id: '5', eer: 3 });
    const c = clim({
      surface_clim: 50,
      enum_methode_saisie_carac_sys_id: '1',
      enum_periode_installation_fr_id: '4'
    });

    calc_clim(c, 1000, 1500, '2', 100);

    expect(tv).toHaveBeenCalledWith(
      'seer',
      {
        enum_zone_climatique_id: '2',
        enum_periode_installation_fr_id: '4'
      },
      c.donnee_entree
    );
  });

  test.each([['6'], ['7'], ['8']])(
    "méthode de saisie %s avec EER déjà connu : pas d'accès à la table forfaitaire",
    (methode) => {
      const c = {
        donnee_entree: { surface_clim: 50, enum_methode_saisie_carac_sys_id: methode },
        donnee_intermediaire: { eer: 4 }
      };

      calc_clim(c, 1000, 1500, '1', 100);

      expect(tv).not.toHaveBeenCalled();
      // conso calculée avec l'EER saisi : 0.9 * 500 / 4
      expect(c.donnee_intermediaire.conso_fr).toBeCloseTo(112.5, 9);
    }
  );

  test('méthode de saisie caractéristiques (6) mais EER absent : recours à la table', () => {
    tv.mockReturnValue({ tv_seer_id: '5', eer: 3 });
    const c = clim({ surface_clim: 50, enum_methode_saisie_carac_sys_id: '6' });

    calc_clim(c, 1000, 1500, '1', 100);

    expect(tv).toHaveBeenCalled();
    expect(c.donnee_intermediaire.eer).toBe(3);
  });

  test('aucune ligne forfaitaire trouvée : EER indéfini, conso non finie', () => {
    tv.mockReturnValue(null);
    const c = clim({ surface_clim: 50, enum_methode_saisie_carac_sys_id: '1' });

    calc_clim(c, 1000, 1500, '1', 100);

    expect(c.donnee_intermediaire.eer).toBeUndefined();
    expect(Number.isFinite(c.donnee_intermediaire.conso_fr)).toBe(false);
  });
});
