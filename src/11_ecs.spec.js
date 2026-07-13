import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_ecs` :
 * - `enums.type_installation` : libellé du type d'installation (individuelle / collective) ;
 * - `tv` : accès à la table rendement_distribution_ecs (ligne contrôlée) ;
 * - `requestInput` : passe-plat vers les données d'entrée pour le réseau collectif ;
 * - `calc_gen_ecs` : calcul par générateur, neutralisé (les consommations sont pré-remplies).
 * Aucune vraie table de valeurs n'est sollicitée : les tests restent stables si les données changent.
 */
vi.mock('./enums.js', () => ({
  default: {
    type_installation: {
      1: 'installation individuelle',
      2: 'installation collective',
      3: 'installation collective multi-bâtiment'
    }
  }
}));

vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInput: vi.fn()
}));

vi.mock('./14_generateur_ecs.js', () => ({
  default: vi.fn()
}));

const { default: calc_ecs } = await import('./11_ecs.js');
const { tv, requestInput } = await import('./utils.js');
const { default: calc_gen_ecs } = await import('./14_generateur_ecs.js');

/** Fabrique une installation ECS avec un générateur dont la consommation est pré-remplie. */
function makeEcs(de, gens) {
  return {
    donnee_entree: de,
    generateur_ecs_collection: {
      generateur_ecs: gens ?? [
        {
          donnee_entree: { position_volume_chauffe: 1 },
          donnee_intermediaire: { conso_ecs: 10, conso_ecs_depensier: 20 }
        }
      ]
    }
  };
}

beforeEach(() => {
  vi.mocked(tv).mockReset();
  vi.mocked(requestInput).mockReset();
  vi.mocked(calc_gen_ecs).mockReset();
  // ligne forfaitaire de rendement de distribution par défaut
  vi.mocked(tv).mockReturnValue({ rd: '0.9', tv_rendement_distribution_ecs_id: '5' });
});

/**
 * 11. Prise en compte de l'ECS (ratio de besoin + rendement de distribution)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §11 / §17.2.1
 */
describe('calc_ecs - ratio de besoin ECS', () => {
  test('virtualisation : le ratio est la clé de répartition ECS', () => {
    const de = { tv_rendement_distribution_ecs_id: '5', cle_repartition_ecs: 0.5 };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', true, null, null, false);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(0.5);
    expect(ecs.donnee_intermediaire.besoin_ecs).toBeCloseTo(50, 9);
    expect(ecs.donnee_intermediaire.besoin_ecs_depensier).toBeCloseTo(100, 9);
  });

  test('immeuble à systèmes ECS individuels : ratio = 1 / nombre d’appartements', () => {
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'immeuble', false, null, 4, true);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(0.25);
    expect(ecs.donnee_intermediaire.besoin_ecs).toBeCloseTo(25, 9);
  });

  test('présence de rdim : ratio = 1 / rdim', () => {
    const de = { tv_rendement_distribution_ecs_id: '5', rdim: 2 };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(0.5);
    expect(ecs.donnee_intermediaire.besoin_ecs).toBeCloseTo(50, 9);
  });

  test('cas par défaut : ratio = 1 (aucune proratisation)', () => {
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(ecs.donnee_intermediaire.ratio_besoin_ecs).toBe(1);
    expect(ecs.donnee_intermediaire.besoin_ecs).toBe(100);
    expect(ecs.donnee_intermediaire.besoin_ecs_depensier).toBe(200);
  });
});

describe('calc_ecs - rendement de distribution', () => {
  test('la ligne forfaitaire alimente rendement_distribution et l’identifiant de table', () => {
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const ecs = makeEcs(de);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(ecs.donnee_intermediaire.rendement_distribution).toBe(0.9);
    expect(de.tv_rendement_distribution_ecs_id).toBe(5);
  });

  test('installation individuelle, production dans le volume chauffé : matcher de configuration', () => {
    const de = { enum_type_installation_id: '1' };
    const ecs = makeEcs(de, [
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 0, conso_ecs_depensier: 0 }
      }
    ]);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(tv).toHaveBeenCalledWith('rendement_distribution_ecs', {
      configuration_logement: 'production volume habitable [+] pièces alimentées contiguës'
    });
  });

  test('installation individuelle, production hors volume chauffé : configuration adaptée', () => {
    const de = { enum_type_installation_id: '1' };
    const ecs = makeEcs(de, [
      {
        donnee_entree: { position_volume_chauffe: 0 },
        donnee_intermediaire: { conso_ecs: 0, conso_ecs_depensier: 0 }
      }
    ]);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(tv).toHaveBeenCalledWith('rendement_distribution_ecs', {
      configuration_logement: 'production hors volume habitable'
    });
  });

  test('installation collective non isolée : matcher type de réseau + configuration', () => {
    vi.mocked(requestInput).mockImplementation((de, du, field) =>
      field === 'reseau_distribution_isole' ? 0 : undefined
    );
    const de = { enum_type_installation_id: '2' };
    const ecs = makeEcs(de, [
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 0, conso_ecs_depensier: 0 }
      }
    ]);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'immeuble', false, null, null, false);

    expect(tv).toHaveBeenCalledWith('rendement_distribution_ecs', {
      type_reseau_collectif: 'Réseau collectif non isolé',
      configuration_logement: 'majorité des logements avec pièces alimentées contiguës'
    });
  });
});

describe('calc_ecs - agrégation des consommations', () => {
  test('somme les consommations des générateurs et invoque calc_gen_ecs par générateur', () => {
    const de = { tv_rendement_distribution_ecs_id: '5' };
    const gens = [
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 10, conso_ecs_depensier: 20 }
      },
      {
        donnee_entree: { position_volume_chauffe: 1 },
        donnee_intermediaire: { conso_ecs: 5, conso_ecs_depensier: 8 }
      }
    ];
    const ecs = makeEcs(de, gens);
    calc_ecs({}, ecs, 100, 200, 1, 'ca1', 'h1a', 'maison', false, null, null, false);

    expect(calc_gen_ecs).toHaveBeenCalledTimes(2);
    expect(ecs.donnee_intermediaire.conso_ecs).toBe(15);
    expect(ecs.donnee_intermediaire.conso_ecs_depensier).toBe(28);
  });
});
