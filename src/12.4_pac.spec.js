import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `scopOrCop` :
 * - `tv` : accès à la table `scop` (on contrôle la ligne retournée) ;
 * - `requestInputID` : simple passe-plat renvoyant l'identifiant demandé et le recopiant ;
 * - `compat_for_corpus_analysis` : piloté par `etat.compat` (faux par défaut).
 * Le comportement de ces utilitaires n'est pas testé ici, seulement la logique du module.
 */
const etat = vi.hoisted(() => ({ compat: false }));

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  get compat_for_corpus_analysis() {
    return etat.compat;
  },
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
  etat.compat = false;
  vi.mocked(tv).mockReset();
  vi.mocked(requestInputID).mockClear();
});

/**
 * 12.4 - Détermination du SCOP / COP des pompes à chaleur.
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §12.4
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

    expect(tv).toHaveBeenCalledWith('scop', {
      enum_zone_climatique_id: 'h1a',
      enum_type_generateur_ch_id: '160'
    });
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

    expect(tv).toHaveBeenCalledWith('scop', {
      enum_zone_climatique_id: 'h2b',
      enum_type_generateur_ecs_id: '10',
      enum_type_emission_distribution_id: '5'
    });
    // scop_ou_cop vaut 'cop' : la valeur est stockée sous di.cop
    expect(di.cop).toBe(3.1);
    expect(di.rg).toBe(3.1);
  });

  test('tv_scop_id du DPE différent de celui de la table : avertissement mais valeur de la table utilisée', () => {
    tv.mockReturnValue({ scop_ou_cop: 'scop', scop: '4.2', tv_scop_id: '15' });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // tv_scop_id renseigné (18) et différent de celui de la ligne (15)
    const di = {};
    const de = { enum_type_generateur_ch_id: '160', tv_scop_id: 18 };

    scopOrCop(di, de, {}, 'h1a', null, 'ch');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    // la valeur de la table prime : tv_scop_id est corrigé
    expect(de.tv_scop_id).toBe(15);
    expect(di.rg).toBe(4.2);
    errorSpy.mockRestore();
  });

  test('tv_scop_id du DPE identique à celui de la table : pas d’avertissement', () => {
    tv.mockReturnValue({ scop_ou_cop: 'scop', scop: '4.2', tv_scop_id: '15' });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const di = {};
    const de = { enum_type_generateur_ch_id: '160', tv_scop_id: 15 };

    scopOrCop(di, de, {}, 'h1a', null, 'ch');

    expect(errorSpy).not.toHaveBeenCalled();
    expect(de.tv_scop_id).toBe(15);
    errorSpy.mockRestore();
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

/**
 * Reprise du COP exporté par le DPE pour l'ECS, en analyse de corpus uniquement.
 * LICIEL exporte pour un CET sur air ambiant après 2014 en H1/H2 le COP « air extrait » (2,8)
 * avec le tv_scop_id 73 (2,5). Tribu retient 2,5 : la table n'est pas modifiée.
 */
describe('scopOrCop - COP exporté par le DPE (compat_for_corpus_analysis)', () => {
  const ligneCet = { scop_ou_cop: 'cop', scop: '2.5', tv_scop_id: '73' };
  let errorSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test('sans compat : la valeur de la table prime sur le COP exporté', () => {
    tv.mockReturnValue(ligneCet);
    const di = { cop: 2.8 };
    const de = { enum_type_generateur_ecs_id: '3', tv_scop_id: 73 };

    scopOrCop(di, de, {}, '1', null, 'ecs');

    expect(di.cop).toBe(2.5);
    expect(di.rg).toBe(2.5);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('avec compat, ECS : le COP exporté différent est repris et signalé', () => {
    etat.compat = true;
    tv.mockReturnValue(ligneCet);
    const di = { cop: '2.8' };
    const de = { enum_type_generateur_ecs_id: '3', tv_scop_id: 73 };

    scopOrCop(di, de, {}, '1', null, 'ecs');

    expect(di.cop).toBe(2.8);
    expect(di.rg).toBe(2.8);
    expect(di.rg_dep).toBe(2.8);
    // la ligne de la table reste celle du DPE
    expect(de.tv_scop_id).toBe(73);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('La valeur du DPE est conservée')
    );
  });

  test('avec compat, ECS : COP exporté identique à la table, pas de message', () => {
    etat.compat = true;
    tv.mockReturnValue(ligneCet);
    const di = { cop: 2.5 };

    scopOrCop(di, { enum_type_generateur_ecs_id: '3', tv_scop_id: 73 }, {}, '1', null, 'ecs');

    expect(di.cop).toBe(2.5);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test.each([
    ['absent', undefined],
    ['nul', 0],
    ['non numérique', 'abc']
  ])('avec compat, ECS : COP exporté %s, valeur de la table utilisée', (_libelle, cop) => {
    etat.compat = true;
    tv.mockReturnValue(ligneCet);
    const di = { cop };

    scopOrCop(di, { enum_type_generateur_ecs_id: '3', tv_scop_id: 73 }, {}, '1', null, 'ecs');

    expect(di.cop).toBe(2.5);
    expect(di.rg).toBe(2.5);
  });

  test('avec compat, ECS : tv_scop_id non exporté, COP du DPE repris', () => {
    etat.compat = true;
    tv.mockReturnValue(ligneCet);
    const di = { cop: 2.2 };

    scopOrCop(di, { enum_type_generateur_ecs_id: '4' }, {}, '1', null, 'ecs');

    expect(di.cop).toBe(2.2);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  test('avec compat, chauffage : le SCOP exporté n’est pas repris', () => {
    etat.compat = true;
    tv.mockReturnValue({ scop_ou_cop: 'scop', scop: '2.6', tv_scop_id: '15' });
    const di = { scop: 3.4 };

    scopOrCop(di, { enum_type_generateur_ch_id: '160', tv_scop_id: 15 }, {}, '1', null, 'ch');

    expect(di.scop).toBe(2.6);
    expect(di.rg).toBe(2.6);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
