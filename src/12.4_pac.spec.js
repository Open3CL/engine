import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `scopOrCop` :
 * - `tv` : accès à la table `scop` (on contrôle la ligne retournée) ;
 * - `requestInputID` : simple passe-plat renvoyant l'identifiant demandé et le recopiant.
 * Le comportement de ces utilitaires n'est pas testé ici, seulement la logique du module.
 */
vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInputID: vi.fn((de, du, field) => {
    const enumName = `enum_${field}_id`;
    du[enumName] = de[enumName];
    return de[enumName];
  })
}));

const { scopOrCop } = await import('./12.4_pac.js');
const { tv, requestInputID } = await import('./utils.js');

beforeEach(() => {
  vi.mocked(tv).mockReset();
  vi.mocked(requestInputID).mockClear();
});

/**
 * 12.4 - Détermination du SCOP / COP des pompes à chaleur.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §12.4
 */
describe('scopOrCop - méthode de saisie "caractéristiques saisies" (id 6)', () => {
  test('SCOP renseigné : rg et rg_dep prennent la valeur du SCOP sans accès à la table', () => {
    const di = { scop: 3.5 };
    const de = { enum_methode_saisie_carac_sys_id: '6' };
    scopOrCop(di, de, {}, 'zc', null, 'ch');
    expect(di.rg).toBe(3.5);
    expect(di.rg_dep).toBe(3.5);
    expect(tv).not.toHaveBeenCalled();
  });

  test('SCOP absent : repli sur le COP', () => {
    const di = { cop: 2.8 };
    const de = { enum_methode_saisie_carac_sys_id: '6' };
    scopOrCop(di, de, {}, 'zc', null, 'ch');
    expect(di.rg).toBe(2.8);
    expect(di.rg_dep).toBe(2.8);
  });
});

describe('scopOrCop - valeur forfaitaire (table scop)', () => {
  test('matcher sans identifiant d’émission : zone climatique + type de générateur', () => {
    tv.mockReturnValue({ scop_ou_cop: 'scop', scop: '4.2', tv_scop_id: '15' });
    const di = {};
    const de = { enum_type_generateur_ch_id: '160' };

    scopOrCop(di, de, {}, 'h1a', null, 'ch');

    expect(tv).toHaveBeenCalledWith(
      'scop',
      {
        enum_zone_climatique_id: 'h1a',
        enum_type_generateur_ch_id: '160'
      },
      de
    );
    expect(di.scop).toBe(4.2);
    expect(di.rg).toBe(4.2);
    expect(di.rg_dep).toBe(4.2);
    expect(de.tv_scop_id).toBe(15);
  });

  test('identifiant d’émission fourni : ajouté au matcher', () => {
    tv.mockReturnValue({ scop_ou_cop: 'cop', scop: '3.1', tv_scop_id: '20' });
    const di = {};
    const de = { enum_type_generateur_ecs_id: '10' };

    scopOrCop(di, de, {}, 'h2b', '5', 'ecs');

    expect(tv).toHaveBeenCalledWith(
      'scop',
      {
        enum_zone_climatique_id: 'h2b',
        enum_type_generateur_ecs_id: '10',
        enum_type_emission_distribution_id: '5'
      },
      de
    );
    // scop_ou_cop vaut 'cop' : la valeur est stockée sous di.cop
    expect(di.cop).toBe(3.1);
    expect(di.rg).toBe(3.1);
  });

  test('aucune ligne trouvée : ni rg ni rg_dep ne sont définis', () => {
    tv.mockReturnValue(null);
    const di = {};
    const de = { enum_type_generateur_ch_id: '160' };

    scopOrCop(di, de, {}, 'h1a', null, 'ch');

    expect(di.rg).toBeUndefined();
    expect(di.rg_dep).toBeUndefined();
  });
});
