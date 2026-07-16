import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * `engine.js` est l'orchestrateur du moteur. On ne teste pas `calcul_3cl` de bout
 * en bout : on isole les fonctions unitairement testables (`getVersion`,
 * `get_conso_coeff_1_9_2026`, `get_classe_ges_dpe`) et on ajoute un test de garde
 * léger sur `calcul_3cl` / `calcul_3cl_xml`.
 *
 * Toutes les dépendances importées par le module sont mockées : les calculs
 * métier (déperdition, conso, ecs, ...) ne doivent pas s'exécuter, seules les
 * fonctions et enums réellement sollicitées par les fonctions testées sont
 * contrôlées.
 */
vi.mock('./conso.js', () => ({
  default: vi.fn(),
  classe_bilan_dpe: vi.fn(),
  classe_emission_ges: vi.fn(),
  coef_ep: vi.fn(),
  coef_ep_2_3: vi.fn()
}));

vi.mock('./utils.js', () => ({
  add_references: vi.fn(),
  bug_for_bug_compat: false,
  collectionCanBeEmpty: vi.fn(),
  containsAnySubstring: vi.fn(),
  isEffetJoule: vi.fn(),
  use_enum_as_string: false,
  useEnumAsString: vi.fn(),
  xmlParser: { parse: vi.fn() }
}));

vi.mock('./enums.js', () => ({
  default: {
    methode_application_dpe_log: {},
    modele_dpe: {}
  }
}));

// Dépendances de calcul mockées à vide : elles ne doivent pas s'exécuter.
vi.mock('./3_deperdition.js', () => ({ default: vi.fn() }));
vi.mock('./apport_et_besoin.js', () => ({ default: vi.fn() }));
vi.mock('./10_clim.js', () => ({ default: vi.fn() }));
vi.mock('./11_ecs.js', () => ({ default: vi.fn() }));
vi.mock('./9_besoin_ch.js', () => ({ default: vi.fn() }));
vi.mock('./9_chauffage.js', () => ({ default: vi.fn(), tauxChargeForGenerator: vi.fn() }));
vi.mock('./2021_04_13_confort_ete.js', () => ({ default: vi.fn() }));
vi.mock('./2021_04_13_qualite_isolation.js', () => ({ default: vi.fn() }));
vi.mock('./7_inertie.js', () => ({ Inertie: vi.fn() }));
vi.mock('./ficheTechnique.js', () => ({ default: vi.fn() }));
vi.mock('./16.2_production_enr.js', () => ({ ProductionENR: vi.fn() }));

// Le service de sanitisation est instancié au chargement puis appelé : on fournit
// une instance dont `execute` renvoie l'entrée telle quelle.
const sanitizeExecute = vi.fn((dpe) => dpe);
vi.mock('./dpe-sanitizer.service.js', () => ({
  default: vi.fn(() => ({ execute: sanitizeExecute }))
}));

const { getVersion, get_conso_coeff_1_9_2026, get_classe_ges_dpe, calcul_3cl, calcul_3cl_xml } =
  await import('./engine.js');
const { classe_bilan_dpe, classe_emission_ges } = await import('./conso.js');
const { xmlParser } = await import('./utils.js');
const enums = (await import('./enums.js')).default;

beforeEach(() => {
  vi.mocked(classe_bilan_dpe).mockReset();
  vi.mocked(classe_emission_ges).mockReset();
  vi.mocked(xmlParser.parse).mockReset();
  enums.methode_application_dpe_log = { 1: 'dpe maison individuelle' };
  enums.modele_dpe = { 1: 'dpe 3cl 2021 méthode logement', 99: 'modèle non supporté' };
});

/** Construit un DPE minimal exploitable par les fonctions de sortie. */
function dpeMinimal(overrides = {}) {
  return {
    logement: {
      meteo: { enum_zone_climatique_id: '1', enum_classe_altitude_id: '1' },
      caracteristique_generale: {
        enum_methode_application_dpe_log_id: '1',
        surface_habitable_logement: 80,
        surface_habitable_immeuble: 200
      },
      sortie: {
        ep_conso: { ep_conso_5_usages: 10000, ep_conso_5_usages_m2: 125 },
        ef_conso: { conso_5_usages: 6000 },
        emission_ges: { emission_ges_5_usages_m2: 30 }
      }
    },
    ...overrides
  };
}

describe('getVersion', () => {
  test('retourne le jeton de version remplacé au build', () => {
    // En source, le jeton n'est pas encore substitué.
    expect(getVersion()).toBe('OPEN3CL_VERSION');
  });
});

describe('get_classe_ges_dpe', () => {
  test('délègue le classement DPE et GES aux fonctions de conso avec les bons arguments', () => {
    vi.mocked(classe_bilan_dpe).mockReturnValue('D');
    vi.mocked(classe_emission_ges).mockReturnValue('C');

    const dpe = dpeMinimal();
    const res = get_classe_ges_dpe(dpe);

    expect(res).toEqual({ dpeClass: 'D', gesClass: 'C' });
    // Sh = surface_habitable_logement pour une maison
    expect(classe_bilan_dpe).toHaveBeenCalledWith(125, '1', '1', 80);
    expect(classe_emission_ges).toHaveBeenCalledWith(30, '1', '1', 80);
  });

  test("utilise la surface de l'immeuble pour un modèle immeuble", () => {
    enums.methode_application_dpe_log = { 1: 'dpe immeuble collectif' };
    vi.mocked(classe_bilan_dpe).mockReturnValue('E');
    vi.mocked(classe_emission_ges).mockReturnValue('E');

    get_classe_ges_dpe(dpeMinimal());

    // Sh = surface_habitable_immeuble
    expect(classe_bilan_dpe).toHaveBeenCalledWith(125, '1', '1', 200);
  });
});

describe('get_conso_coeff_1_9_2026', () => {
  test('recalcule la conso EP avec le coefficient 0,9 (valeur de référence)', () => {
    vi.mocked(classe_bilan_dpe).mockReturnValue('C');

    const res = get_conso_coeff_1_9_2026(dpeMinimal());

    // Référence figée : (0.9/1.3)*(10000-6000)+6000
    expect(res.ep_conso_5_usages).toBeCloseTo(8769.23076923077, 6);
    // Math.floor(8769.23.../80)
    expect(res.ep_conso_5_usages_m2).toBe(109);
    expect(res.classe_bilan_dpe).toBe('C');
    expect(classe_bilan_dpe).toHaveBeenCalledWith(109, '1', '1', 80);
  });

  test('la conso EP recalculée est inférieure à la conso EP initiale', () => {
    vi.mocked(classe_bilan_dpe).mockReturnValue('C');
    const dpe = dpeMinimal();

    const res = get_conso_coeff_1_9_2026(dpe);

    expect(res.ep_conso_5_usages).toBeLessThan(dpe.logement.sortie.ep_conso.ep_conso_5_usages);
  });
});

describe('calcul_3cl - garde sur le modèle de DPE', () => {
  test('retourne null pour un modèle de DPE non supporté', () => {
    const dpe = { administratif: { enum_modele_dpe_id: '99' } };

    const res = calcul_3cl(dpe, { sanitize: false });

    expect(res).toBeNull();
  });

  test("sanitise l'entrée par défaut avant de vérifier le modèle", () => {
    const dpe = { administratif: { enum_modele_dpe_id: '99' } };

    const res = calcul_3cl(dpe); // pas d'options => sanitize par défaut

    expect(sanitizeExecute).toHaveBeenCalledWith(dpe);
    expect(res).toBeNull();
  });
});

describe('calcul_3cl_xml - garde sur le modèle de DPE', () => {
  test('parse le XML puis retourne null pour un modèle non supporté', () => {
    const dpe = { administratif: { enum_modele_dpe_id: '99' } };
    vi.mocked(xmlParser.parse).mockReturnValue({ dpe });

    const res = calcul_3cl_xml('<dpe/>', { sanitize: false });

    expect(xmlParser.parse).toHaveBeenCalledWith('<dpe/>');
    expect(res).toBeNull();
  });
});
