import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * `engine.js` est l'orchestrateur du moteur. Il enchaîne de nombreux sous-modules
 * de calcul (déperdition, apport/besoin, ecs, chauffage, conso, ...). Pour le
 * tester **unitairement**, TOUS ces sous-modules sont mockés : ils renvoient des
 * valeurs contrôlées, ce qui permet de piloter chacune des branches de
 * l'orchestrateur sans exécuter la moindre logique métier.
 *
 * On vérifie que l'orchestrateur :
 *  - garde-fou sur le modèle / l'enveloppe (retours `null`) ;
 *  - choisit les bonnes surfaces (Sh / Sh immeuble) selon `th` et le map_id ;
 *  - construit et transmet les bons arguments aux sous-modules ;
 *  - agrège correctement les sorties (`sortie`, `ep_conso`, coefficients).
 */

// Drapeaux mutables pilotant les constantes de configuration importées depuis utils.
// Les getters garantissent une lecture « live » côté module testé.
let bugForBugCompat = false;
let useEnumAsStringFlag = false;

vi.mock('./utils.js', () => ({
  add_references: vi.fn(),
  get bug_for_bug_compat() {
    return bugForBugCompat;
  },
  collectionCanBeEmpty: vi.fn(),
  containsAnySubstring: vi.fn(),
  isEffetJoule: vi.fn(),
  get use_enum_as_string() {
    return useEnumAsStringFlag;
  },
  useEnumAsString: vi.fn(),
  xmlParser: { parse: vi.fn() }
}));

vi.mock('./enums.js', () => ({
  default: {
    methode_application_dpe_log: {},
    modele_dpe: {},
    orientation: {},
    type_vitrage: {},
    type_baie: {},
    type_materiaux_menuiserie: {},
    type_generateur_ch: {},
    type_generateur_ecs: {}
  }
}));

vi.mock('./conso.js', () => ({
  default: vi.fn(),
  classe_bilan_dpe: vi.fn(),
  classe_emission_ges: vi.fn(),
  coef_ep: { tag: 'coef_ep' },
  coef_ep_1_7: { tag: 'coef_ep_1_7' },
  coef_ep_2_3: { tag: 'coef_ep_2_3' },
  COEFF_EP_1_7: 1.7,
  COEFF_EP_2_3: 2.3
}));

// Dépendances de calcul mockées : elles ne doivent pas s'exécuter réellement.
vi.mock('./3_deperdition.js', () => ({ default: vi.fn() }));
vi.mock('./apport_et_besoin.js', () => ({ default: vi.fn() }));
vi.mock('./10_clim.js', () => ({ default: vi.fn() }));
vi.mock('./11_ecs.js', () => ({ default: vi.fn() }));
vi.mock('./9_besoin_ch.js', () => ({ default: vi.fn() }));
vi.mock('./9_chauffage.js', () => ({ default: vi.fn(), tauxChargeForGenerator: vi.fn() }));
vi.mock('./2021_04_13_confort_ete.js', () => ({ default: vi.fn() }));
vi.mock('./2021_04_13_qualite_isolation.js', () => ({ default: vi.fn() }));
vi.mock('./ficheTechnique.js', () => ({ default: vi.fn() }));

// Les instances Inertie / ProductionENR sont créées au chargement du module.
// On expose des méthodes mockées récupérables dans les tests.
const calculateInertie = vi.fn();
const calculateEnr = vi.fn();
vi.mock('./7_inertie.js', () => ({ Inertie: vi.fn(() => ({ calculateInertie })) }));
vi.mock('./16.2_production_enr.js', () => ({ ProductionENR: vi.fn(() => ({ calculateEnr })) }));

// Le service de sanitisation est instancié au chargement puis appelé : `execute`
// renvoie l'entrée telle quelle.
const sanitizeExecute = vi.fn((dpe) => dpe);
vi.mock('./dpe-sanitizer.service.js', () => ({
  default: vi.fn(() => ({ execute: sanitizeExecute }))
}));

const { getVersion, get_conso_coeff_1_7_2027, get_classe_ges_dpe, calcul_3cl, calcul_3cl_xml } =
  await import('./engine.js');
const { classe_bilan_dpe, classe_emission_ges } = await import('./conso.js');
const calc_conso = (await import('./conso.js')).default;
const {
  add_references,
  collectionCanBeEmpty,
  containsAnySubstring,
  isEffetJoule,
  useEnumAsString,
  xmlParser
} = await import('./utils.js');
const enums = (await import('./enums.js')).default;
const calc_deperdition = (await import('./3_deperdition.js')).default;
const calc_apport_et_besoin = (await import('./apport_et_besoin.js')).default;
const calc_clim = (await import('./10_clim.js')).default;
const calc_ecs = (await import('./11_ecs.js')).default;
const calc_besoin_ch = (await import('./9_besoin_ch.js')).default;
const { default: calc_chauffage, tauxChargeForGenerator } = await import('./9_chauffage.js');
const calc_confort_ete = (await import('./2021_04_13_confort_ete.js')).default;
const calc_qualite_isolation = (await import('./2021_04_13_qualite_isolation.js')).default;
const getFicheTechnique = (await import('./ficheTechnique.js')).default;

/** Objet conso renvoyé par le mock de `calc_conso` (mêmes réf pour les 3 appels). */
let consoResult;

beforeEach(() => {
  vi.clearAllMocks();
  bugForBugCompat = false;
  useEnumAsStringFlag = false;

  // Enums par défaut : maison, modèle supporté.
  enums.methode_application_dpe_log = { 1: 'dpe maison individuelle' };
  enums.modele_dpe = { 1: 'dpe 3cl 2021 méthode logement', 99: 'modèle non supporté' };
  enums.orientation = { 1: 'sud' };
  enums.type_vitrage = { 1: 'double' };
  enums.type_baie = { 1: 'fenetre' };
  enums.type_materiaux_menuiserie = { 1: 'pvc' };
  enums.type_generateur_ch = {};
  enums.type_generateur_ecs = {};

  // Retours par défaut des sous-modules (chemin nominal).
  vi.mocked(sanitizeExecute).mockImplementation((dpe) => dpe);
  vi.mocked(collectionCanBeEmpty).mockReturnValue(true);
  vi.mocked(isEffetJoule).mockReturnValue(false);
  vi.mocked(getFicheTechnique).mockReturnValue(undefined);
  vi.mocked(containsAnySubstring).mockReturnValue(false);
  vi.mocked(calc_deperdition).mockReturnValue({ deperdition_enveloppe: 300 });
  vi.mocked(calculateInertie).mockReturnValue({ enum_classe_inertie_id: '3' });
  vi.mocked(calc_apport_et_besoin).mockReturnValue({
    besoin_fr: 1,
    besoin_fr_depensier: 2,
    besoin_ecs: 100,
    besoin_ecs_depensier: 120,
    nadeq: 2
  });
  vi.mocked(calc_besoin_ch).mockReturnValue({
    besoin_ch: 50,
    besoin_ch_depensier: 60,
    besoin_ch_mois: { m1: 10, m2: 20 }
  });
  consoResult = {
    ep_conso: { classe_bilan_dpe: 'D', ep_conso_5_usages: 100, ep_conso_5_usages_m2: 5 },
    ef_conso: {}
  };
  vi.mocked(calc_conso).mockReturnValue(consoResult);
  vi.mocked(calculateEnr).mockReturnValue({ pv: 1 });
  vi.mocked(calc_confort_ete).mockReturnValue('confort');
  vi.mocked(calc_qualite_isolation).mockReturnValue('qualite');
});

/** Construit un DPE complet exploitable par un run intégral de `calcul_3cl`. */
function makeDpe() {
  return {
    administratif: {
      enum_modele_dpe_id: '1',
      date_etablissement_dpe: '2024-01-01'
    },
    logement: {
      meteo: {
        enum_zone_climatique_id: 'zc1',
        enum_classe_altitude_id: 'ca1',
        batiment_materiaux_anciens: 0
      },
      caracteristique_generale: {
        enum_methode_application_dpe_log_id: '1',
        surface_habitable_logement: 80,
        surface_habitable_immeuble: 200,
        nombre_appartement: 4,
        hsp: 2.5,
        annee_construction: 1990
      },
      enveloppe: {
        mur_collection: { mur: [{ donnee_entree: {} }] },
        plancher_haut_collection: { plancher_haut: [{ donnee_entree: {} }] },
        plancher_bas_collection: { plancher_bas: [{ donnee_entree: {} }] },
        baie_vitree_collection: { baie_vitree: [{ donnee_entree: { presence_joint: 1 } }] },
        ets_collection: { ets: [] },
        inertie: { enum_classe_inertie_id: '3' }
      },
      installation_chauffage_collection: {
        installation_chauffage: [
          { donnee_entree: {}, generateur_chauffage_collection: { generateur_chauffage: [] } }
        ]
      },
      installation_ecs_collection: {
        installation_ecs: [
          {
            donnee_entree: { enum_type_installation_id: '1' },
            generateur_ecs_collection: { generateur_ecs: [] }
          }
        ]
      },
      climatisation_collection: { climatisation: [{ donnee_entree: {} }] },
      ventilation_collection: { ventilation: [{ donnee_entree: {} }] },
      production_elec_enr: { some: 'pv' }
    }
  };
}

/** Construit un générateur ECS pour les tests du bloc `bug_for_bug_compat`. */
function genEcs(overrides = {}) {
  return { donnee_entree: { ...overrides } };
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

    const dpe = makeDpe();
    dpe.logement.sortie = {
      ep_conso: { ep_conso_5_usages_m2: 125 },
      emission_ges: { emission_ges_5_usages_m2: 30 }
    };
    const res = get_classe_ges_dpe(dpe);

    expect(res).toEqual({ dpeClass: 'D', gesClass: 'C' });
    // Sh = surface_habitable_logement pour une maison
    expect(classe_bilan_dpe).toHaveBeenCalledWith(125, 'zc1', 'ca1', 80);
    expect(classe_emission_ges).toHaveBeenCalledWith(30, 'zc1', 'ca1', 80);
  });

  test("utilise la surface de l'immeuble pour un modèle immeuble", () => {
    enums.methode_application_dpe_log = { 1: 'dpe immeuble collectif' };
    vi.mocked(classe_bilan_dpe).mockReturnValue('E');

    const dpe = makeDpe();
    dpe.logement.sortie = {
      ep_conso: { ep_conso_5_usages_m2: 125 },
      emission_ges: { emission_ges_5_usages_m2: 30 }
    };
    get_classe_ges_dpe(dpe);

    // Sh = surface_habitable_immeuble
    expect(classe_bilan_dpe).toHaveBeenCalledWith(125, 'zc1', 'ca1', 200);
  });

  test('méthode application inconnue : th null, surface indéterminée', () => {
    // calc_th ne reconnaît ni maison ni appartement ni immeuble => null
    enums.methode_application_dpe_log = { 1: 'méthode farfelue' };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(classe_bilan_dpe).mockReturnValue('G');
    vi.mocked(classe_emission_ges).mockReturnValue('G');

    const dpe = makeDpe();
    dpe.logement.sortie = {
      ep_conso: { ep_conso_5_usages_m2: 400 },
      emission_ges: { emission_ges_5_usages_m2: 80 }
    };
    get_classe_ges_dpe(dpe);

    // th null => Sh reste indéfini
    expect(classe_bilan_dpe).toHaveBeenCalledWith(400, 'zc1', 'ca1', undefined);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('calcul_3cl - garde-fous précoces', () => {
  test('retourne null pour un modèle de DPE non supporté', () => {
    const dpe = { administratif: { enum_modele_dpe_id: '99' } };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = calcul_3cl(dpe, { sanitize: false });

    expect(res).toBeNull();
    errSpy.mockRestore();
  });

  test("sanitise l'entrée par défaut avant de vérifier le modèle", () => {
    const dpe = { administratif: { enum_modele_dpe_id: '99' } };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = calcul_3cl(dpe); // pas d'options => sanitize par défaut

    expect(sanitizeExecute).toHaveBeenCalledWith(dpe);
    expect(res).toBeNull();
    errSpy.mockRestore();
  });

  test("sans sanitisation, applique useEnumAsString si l'option globale est active", () => {
    useEnumAsStringFlag = true;
    const dpe = { administratif: { enum_modele_dpe_id: '99' } };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    calcul_3cl(dpe, { sanitize: false });

    expect(sanitizeExecute).not.toHaveBeenCalled();
    expect(useEnumAsString).toHaveBeenCalledWith(dpe);
    errSpy.mockRestore();
  });

  test('retourne null si enveloppe absente', () => {
    const dpe = makeDpe();
    delete dpe.logement.enveloppe;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(calcul_3cl(dpe, { sanitize: false })).toBeNull();
    warnSpy.mockRestore();
  });

  test('retourne null si mur_collection absent', () => {
    const dpe = makeDpe();
    dpe.logement.enveloppe.mur_collection = undefined;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(calcul_3cl(dpe, { sanitize: false })).toBeNull();
    warnSpy.mockRestore();
  });

  test('plancher_haut vide + non-vidable => null', () => {
    vi.mocked(collectionCanBeEmpty).mockReturnValue(false);
    const dpe = makeDpe();
    dpe.logement.enveloppe.plancher_haut_collection = { plancher_haut: [] };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(calcul_3cl(dpe, { sanitize: false })).toBeNull();
    expect(collectionCanBeEmpty).toHaveBeenCalledWith(dpe.logement, 'plancher_haut', 3);
    errSpy.mockRestore();
  });

  test('plancher_bas vide + non-vidable => null', () => {
    vi.mocked(collectionCanBeEmpty).mockReturnValue(false);
    const dpe = makeDpe();
    // plancher_haut non vide pour atteindre le contrôle plancher_bas
    dpe.logement.enveloppe.plancher_bas_collection = { plancher_bas: [] };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(calcul_3cl(dpe, { sanitize: false })).toBeNull();
    expect(collectionCanBeEmpty).toHaveBeenCalledWith(dpe.logement, 'plancher_bas', 1);
    errSpy.mockRestore();
  });
});

describe('calcul_3cl_xml - garde sur le modèle de DPE', () => {
  test('parse le XML puis retourne null pour un modèle non supporté', () => {
    const dpe = { administratif: { enum_modele_dpe_id: '99' } };
    vi.mocked(xmlParser.parse).mockReturnValue({ dpe });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = calcul_3cl_xml('<dpe/>', { sanitize: false });

    expect(xmlParser.parse).toHaveBeenCalledWith('<dpe/>');
    expect(res).toBeNull();
    errSpy.mockRestore();
  });
});

describe('calcul_3cl - run intégral (maison)', () => {
  test('orchestre les sous-modules et agrège la sortie', () => {
    const dpe = makeDpe();

    const res = calcul_3cl(dpe, { sanitize: false });

    // Le DPE (muté) est retourné.
    expect(res).toBe(dpe);

    // Surfaces : maison => Sh = surface_habitable_logement ; map '1' hors liste
    // immeuble => ShChauffageAndEcs = Sh.
    expect(calc_deperdition).toHaveBeenCalledWith(
      dpe.logement.caracteristique_generale,
      'zc1',
      'maison',
      false,
      dpe,
      80
    );

    // Références ajoutées à l'enveloppe.
    expect(add_references).toHaveBeenCalledWith(dpe.logement.enveloppe);

    // Version moteur injectée.
    expect(dpe.administratif.diagnostiqueur).toEqual({
      version_moteur_calcul: 'Open3CL OPEN3CL_VERSION'
    });

    // besoin_ch fusionné, besoin_ch_mois retiré de apport_et_besoin.
    expect(dpe.logement.sortie.apport_et_besoin.besoin_ch).toBe(50);
    expect(dpe.logement.sortie.apport_et_besoin.besoin_ch_mois).toBeUndefined();

    // Taux de charge appelé avant la 2ᵉ passe chauffage.
    expect(tauxChargeForGenerator).toHaveBeenCalledWith(
      dpe.logement.installation_chauffage_collection.installation_chauffage,
      300,
      'ca1',
      'zc1',
      'maison'
    );

    // calc_chauffage appelé 2 fois par installation (1ʳᵉ et 2ᵉ passe).
    expect(calc_chauffage).toHaveBeenCalledTimes(2);
    // Première passe : besoins à 0.
    expect(calc_chauffage.mock.calls[0][6]).toBe(0);
    expect(calc_chauffage.mock.calls[0][7]).toBe(0);
    // Deuxième passe : besoins réels + besoin_ch_mois.
    expect(calc_chauffage.mock.calls[1][6]).toBe(50);
    expect(calc_chauffage.mock.calls[1][7]).toBe(60);
    expect(calc_chauffage.mock.calls[1][13]).toEqual({ m1: 10, m2: 20 });
    // ilpa = '0' (materiaux anciens = 0).
    expect(calc_chauffage.mock.calls[0][12]).toBe('0');

    // 3 calculs de conso (coef_ep, coef_ep_1_7, coef_ep_2_3).
    expect(calc_conso).toHaveBeenCalledTimes(3);
    expect(calc_conso.mock.calls[0][10]).toEqual({ tag: 'coef_ep' });
    expect(calc_conso.mock.calls[1][10]).toEqual({ tag: 'coef_ep_1_7' });
    expect(calc_conso.mock.calls[2][10]).toEqual({ tag: 'coef_ep_2_3' });
    // prorata ECS / chauffage neutres pour une maison.
    expect(calc_conso.mock.calls[0][7]).toBe(1);
    expect(calc_conso.mock.calls[0][8]).toBe(1);

    // 3 calculs de production ENR ; le 1ᵉʳ sans coefficient.
    expect(calculateEnr).toHaveBeenCalledTimes(3);
    expect(calculateEnr.mock.calls[0]).toEqual([
      dpe.logement.production_elec_enr,
      consoResult,
      80,
      'maison',
      'zc1'
    ]);
    expect(calculateEnr.mock.calls[1][5]).toBe(1.7);
    expect(calculateEnr.mock.calls[2][5]).toBe(2.3);

    // Sorties agrégées.
    expect(dpe.logement.sortie.deperdition).toEqual({ deperdition_enveloppe: 300 });
    expect(dpe.logement.sortie.confort_ete).toBe('confort');
    expect(dpe.logement.sortie.qualite_isolation).toBe('qualite');
    expect(dpe.logement.sortie.production_electricite).toEqual({ pv: 1 });
    expect(calc_confort_ete).toHaveBeenCalledWith(
      '3',
      dpe.logement.enveloppe.baie_vitree_collection.baie_vitree,
      [dpe.logement.enveloppe.plancher_haut_collection.plancher_haut[0]]
    );

    // ep_conso enrichi des coefficients 1.7 / 2.3 et de la projection 2027.
    expect(dpe.logement.sortie.ep_conso.coeff_2_3_classe_bilan_dpe).toBe('D');
    expect(dpe.logement.sortie.ep_conso.coeff_1_7_ep_conso_5_usages).toBe(100);
    expect(dpe.logement.sortie.ep_conso.classe_bilan_dpe_2027).toBe('D');
    expect(dpe.logement.sortie.ep_conso.ep_conso_5_usages_2027).toBe(100);

    // ECS individuelle unique : calc_ecs appelé une fois, sans division du besoin.
    expect(calc_ecs).toHaveBeenCalledTimes(1);
    expect(calc_ecs.mock.calls[0][2]).toBe(100);
    expect(calc_ecs.mock.calls[0][11]).toBe(false);

    // Climatisation présente : calc_clim appelé.
    expect(calc_clim).toHaveBeenCalledTimes(1);
  });

  test('bâtiment matériaux anciens => ilpa = 1 ; incohérence inertie => erreur loggée', () => {
    const dpe = makeDpe();
    dpe.logement.meteo.batiment_materiaux_anciens = 1;
    vi.mocked(calculateInertie).mockReturnValue({ enum_classe_inertie_id: '2' }); // != '3'
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    calcul_3cl(dpe, { sanitize: false });

    expect(calc_chauffage.mock.calls[0][12]).toBe('1');
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  test('collections ECS/clim absentes et nombre_appartement absent => valeurs par défaut', () => {
    const dpe = makeDpe();
    dpe.logement.installation_ecs_collection.installation_ecs = undefined;
    dpe.logement.climatisation_collection.climatisation = undefined;
    dpe.logement.caracteristique_generale.nombre_appartement = undefined;

    calcul_3cl(dpe, { sanitize: false });

    // Nb_lgt par défaut = 1 (6ᵉ argument d'apport_et_besoin).
    expect(calc_apport_et_besoin.mock.calls[0][5]).toBe(1);
    // Pas d'ECS ni de clim à traiter.
    expect(calc_ecs).not.toHaveBeenCalled();
    expect(calc_clim).not.toHaveBeenCalled();
  });
});

describe('calcul_3cl - collections vidables (poursuite du calcul)', () => {
  test('plancher_haut vide mais vidable : réinitialisé et calcul poursuivi', () => {
    const dpe = makeDpe();
    dpe.logement.enveloppe.plancher_haut_collection = { plancher_haut: [] };

    const res = calcul_3cl(dpe, { sanitize: false });

    expect(res).toBe(dpe);
    expect(collectionCanBeEmpty).toHaveBeenCalledWith(dpe.logement, 'plancher_haut', 3);
    expect(dpe.logement.enveloppe.plancher_haut_collection).toEqual({ plancher_haut: [] });
    // ph_list vide passé au confort d'été.
    expect(calc_confort_ete.mock.calls[0][2]).toEqual([]);
  });

  test('plancher_bas vide mais vidable : réinitialisé et calcul poursuivi', () => {
    const dpe = makeDpe();
    dpe.logement.enveloppe.plancher_bas_collection = { plancher_bas: [] };

    const res = calcul_3cl(dpe, { sanitize: false });

    expect(res).toBe(dpe);
    expect(collectionCanBeEmpty).toHaveBeenCalledWith(dpe.logement, 'plancher_bas', 1);
    expect(dpe.logement.enveloppe.plancher_bas_collection).toEqual({ plancher_bas: [] });
  });
});

describe('calcul_3cl - surfaces immeuble / appartement et prorata', () => {
  test('immeuble : Sh = surface immeuble ; ECS collective individualisée non divisée', () => {
    enums.methode_application_dpe_log = { 1: 'dpe immeuble collectif' };
    const dpe = makeDpe();
    // Deux systèmes ECS individuels en immeuble => pas de division du besoin.
    dpe.logement.installation_ecs_collection.installation_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '1' },
        generateur_ecs_collection: { generateur_ecs: [] }
      },
      {
        donnee_entree: { enum_type_installation_id: '1' },
        generateur_ecs_collection: { generateur_ecs: [] }
      }
    ];

    calcul_3cl(dpe, { sanitize: false });

    // th immeuble => Sh = surface_habitable_immeuble.
    expect(calc_deperdition.mock.calls[0][5]).toBe(200);
    expect(calc_deperdition.mock.calls[0][2]).toBe('immeuble');
    // isImmeubleSystemEcsIndividuels = true, besoin non divisé.
    expect(calc_ecs.mock.calls[0][11]).toBe(true);
    expect(calc_ecs.mock.calls[0][2]).toBe(100);
  });

  test('immeuble : systèmes ECS non tous individuels => besoin divisé par deux', () => {
    enums.methode_application_dpe_log = { 1: 'dpe immeuble collectif' };
    const dpe = makeDpe();
    dpe.logement.installation_ecs_collection.installation_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '1' },
        generateur_ecs_collection: { generateur_ecs: [] }
      },
      {
        donnee_entree: { enum_type_installation_id: '2' },
        generateur_ecs_collection: { generateur_ecs: [] }
      }
    ];

    calcul_3cl(dpe, { sanitize: false });

    expect(calc_ecs.mock.calls[0][11]).toBe(false);
    expect(calc_ecs.mock.calls[0][2]).toBe(50); // 100 / 2
  });

  test('maison avec deux systèmes ECS => besoin divisé par deux', () => {
    const dpe = makeDpe();
    dpe.logement.installation_ecs_collection.installation_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '1' },
        generateur_ecs_collection: { generateur_ecs: [] }
      },
      {
        donnee_entree: { enum_type_installation_id: '1' },
        generateur_ecs_collection: { generateur_ecs: [] }
      }
    ];

    calcul_3cl(dpe, { sanitize: false });

    // th != immeuble => isImmeubleSystemEcsIndividuels false, besoin divisé.
    expect(calc_ecs.mock.calls[0][11]).toBe(false);
    expect(calc_ecs.mock.calls[0][2]).toBe(50);
  });

  test('appartement issu immeuble (map 15) : Sh immeuble pour chauffage/ECS et prorata surfacique', () => {
    enums.methode_application_dpe_log = { 15: 'dpe appartement collectif' };
    const dpe = makeDpe();
    dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id = '15';

    calcul_3cl(dpe, { sanitize: false });

    // ShChauffageAndEcs = surface immeuble (200) pour la déperdition.
    expect(calc_deperdition.mock.calls[0][5]).toBe(200);
    // conso : Sh = surface logement (80) et prorata = 80/200 = 0.4.
    expect(calc_conso.mock.calls[0][0]).toBe(80);
    expect(calc_conso.mock.calls[0][7]).toBeCloseTo(0.4, 9); // prorataECS
    expect(calc_conso.mock.calls[0][8]).toBeCloseTo(0.4, 9); // prorataChauffage
  });
});

describe('calcul_3cl - présence de joint des baies vitrées', () => {
  function dpeAvecBaieSansJoint() {
    const dpe = makeDpe();
    dpe.logement.enveloppe.baie_vitree_collection = {
      baie_vitree: [
        {
          donnee_entree: {
            description: 'baie 1',
            enum_orientation_id: '1',
            enum_type_vitrage_id: '1',
            enum_type_baie_id: '1',
            enum_type_materiaux_menuiserie_id: '1'
            // presence_joint absent
          }
        }
      ]
    };
    return dpe;
  }

  test('fiche technique "Oui" => présence de joint = 1', () => {
    vi.mocked(getFicheTechnique).mockImplementation((d, id, key) =>
      id === '4' && key === 'joint' ? { valeur: 'Oui' } : undefined
    );
    const dpe = dpeAvecBaieSansJoint();

    calcul_3cl(dpe, { sanitize: false });

    expect(
      dpe.logement.enveloppe.baie_vitree_collection.baie_vitree[0].donnee_entree.presence_joint
    ).toBe(1);
  });

  test('fiche technique "Non" => présence de joint = 0', () => {
    vi.mocked(getFicheTechnique).mockImplementation((d, id, key) =>
      id === '4' && key === 'joint' ? { valeur: 'Non' } : undefined
    );
    const dpe = dpeAvecBaieSansJoint();

    calcul_3cl(dpe, { sanitize: false });

    expect(
      dpe.logement.enveloppe.baie_vitree_collection.baie_vitree[0].donnee_entree.presence_joint
    ).toBe(0);
  });

  test('fiche technique de valeur inconnue => avertissement, présence de joint inchangée', () => {
    vi.mocked(getFicheTechnique).mockImplementation((d, id, key) =>
      id === '4' && key === 'joint' ? { valeur: 'Peut-être' } : undefined
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dpe = dpeAvecBaieSansJoint();

    calcul_3cl(dpe, { sanitize: false });

    expect(
      dpe.logement.enveloppe.baie_vitree_collection.baie_vitree[0].donnee_entree.presence_joint
    ).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('absence de fiche technique => présence de joint reste indéterminée', () => {
    // getFicheTechnique renvoie undefined (défaut)
    const dpe = dpeAvecBaieSansJoint();

    calcul_3cl(dpe, { sanitize: false });

    expect(
      dpe.logement.enveloppe.baie_vitree_collection.baie_vitree[0].donnee_entree.presence_joint
    ).toBeUndefined();
  });
});

describe('calcul_3cl - réalignements ECS (bug_for_bug_compat)', () => {
  test('réaligne position_volume_chauffe et type de générateur ECS depuis le mixte de chauffage', () => {
    bugForBugCompat = true;
    enums.type_generateur_ch = { CH1: 'chaudiere gaz' };
    enums.type_generateur_ecs = { ECS9: 'chaudiere gaz' };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // La fiche technique '8' impose "hors volume habitable" => position 0.
    vi.mocked(getFicheTechnique).mockImplementation((d, id) =>
      id === '8' ? { valeur: 'hors volume habitable', description: 'ft8' } : undefined
    );
    vi.mocked(containsAnySubstring).mockReturnValue(true); // => pvc = 0

    const dpe = makeDpe();
    dpe.logement.installation_chauffage_collection.installation_chauffage = [
      {
        donnee_entree: {},
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_entree: {
                reference_generateur_mixte: 'MX1',
                enum_type_generateur_ch_id: 'CH1'
              }
            }
          ]
        }
      }
    ];
    const generateur = genEcs({
      description: 'gen1',
      position_volume_chauffe: 1,
      enum_usage_generateur_id: '3',
      reference_generateur_mixte: 'MX1',
      enum_type_generateur_ecs_id: 'OLD'
    });
    dpe.logement.installation_ecs_collection.installation_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '1' },
        generateur_ecs_collection: { generateur_ecs: [generateur] }
      }
    ];

    calcul_3cl(dpe, { sanitize: false });

    // position réalignée à 0 et type ECS aligné sur le libellé du générateur mixte.
    expect(generateur.donnee_entree.position_volume_chauffe).toBe(0);
    expect(generateur.donnee_entree.enum_type_generateur_ecs_id).toBe('ECS9');
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  test('couvre les branches sans réalignement (fiche absente, mixte introuvable, libellés non résolus)', () => {
    bugForBugCompat = true;
    enums.type_generateur_ch = { CH1: 'chaudiere gaz', CHX: 'labelX' };
    enums.type_generateur_ecs = { SAME: 'labelX' };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Fiche '8' uniquement pour la description 'withFiche' ; valeur non "hors volume".
    vi.mocked(getFicheTechnique).mockImplementation((d, id, key, arr) => {
      if (id === '8' && arr?.[0] === 'withFiche') return { valeur: 'oui', description: 'ft8' };
      return undefined;
    });
    // containsAnySubstring false => pvc = 1 (égal à la position courante => pas de réalignement).
    vi.mocked(containsAnySubstring).mockReturnValue(false);

    const dpe = makeDpe();
    dpe.logement.installation_chauffage_collection.installation_chauffage = [
      {
        donnee_entree: {},
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_entree: {
                reference_generateur_mixte: 'MX_labelnull',
                enum_type_generateur_ch_id: 'INCONNU'
              }
            },
            {
              donnee_entree: {
                reference_generateur_mixte: 'MX_chgaz',
                enum_type_generateur_ch_id: 'CH1'
              }
            },
            {
              donnee_entree: {
                reference_generateur_mixte: 'MX_X',
                enum_type_generateur_ch_id: 'CHX'
              }
            }
          ]
        }
      }
    ];

    const generateurs = [
      // Fiche présente, pvc calculé (=1) égal à la position => pas de réalignement ;
      // usage '3' mais mixte introuvable (ref inconnue).
      genEcs({
        description: 'withFiche',
        position_volume_chauffe: 1,
        enum_usage_generateur_id: '3',
        reference_generateur_mixte: 'AUCUN'
      }),
      // Pas de description (fiche ignorée) ; usage != 3.
      genEcs({ enum_usage_generateur_id: '1' }),
      // Description sans fiche ; usage '3' mais pas de référence mixte.
      genEcs({ description: 'noFiche', enum_usage_generateur_id: '3' }),
      // Mixte trouvé mais libellé de générateur de chauffage non résolu.
      genEcs({
        enum_usage_generateur_id: '3',
        reference_generateur_mixte: 'MX_labelnull',
        enum_type_generateur_ecs_id: 'X0'
      }),
      // Mixte + libellé résolus mais aucun type ECS correspondant => pas de réalignement.
      genEcs({
        enum_usage_generateur_id: '3',
        reference_generateur_mixte: 'MX_chgaz',
        enum_type_generateur_ecs_id: 'X1'
      }),
      // Mixte + libellé + type ECS correspondant identique à l'actuel => pas de réalignement.
      genEcs({
        enum_usage_generateur_id: '3',
        reference_generateur_mixte: 'MX_X',
        enum_type_generateur_ecs_id: 'SAME'
      })
    ];
    dpe.logement.installation_ecs_collection.installation_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '1' },
        generateur_ecs_collection: { generateur_ecs: generateurs }
      }
    ];

    calcul_3cl(dpe, { sanitize: false });

    // Aucun réalignement effectif.
    expect(generateurs[0].donnee_entree.position_volume_chauffe).toBe(1);
    expect(generateurs[3].donnee_entree.enum_type_generateur_ecs_id).toBe('X0');
    expect(generateurs[4].donnee_entree.enum_type_generateur_ecs_id).toBe('X1');
    expect(generateurs[5].donnee_entree.enum_type_generateur_ecs_id).toBe('SAME');
    errSpy.mockRestore();
  });
});

describe('get_conso_coeff_1_7_2027', () => {
  test('projette la conso EP 2027 pour une maison', () => {
    vi.mocked(classe_bilan_dpe).mockReturnValue('C');
    const dpe = makeDpe();
    dpe.logement.sortie = {
      ep_conso: { ep_conso_5_usages: 10000 },
      ef_conso: { conso_5_usages: 6000 }
    };

    const res = get_conso_coeff_1_7_2027(dpe);

    // ep = (0.7/0.9) * (10000 - 6000) + 6000 = 9111.11...
    // Valeur de référence de régression.
    expect(res.ep_conso_5_usages_2027).toBeCloseTo(9111.111111111, 6);
    // m2 = floor(9111.11 / 80) = 113
    expect(res.ep_conso_5_usages_m2_2027).toBe(113);
    expect(res.classe_bilan_dpe_2027).toBe('C');
    expect(classe_bilan_dpe).toHaveBeenCalledWith(113, 'zc1', 'ca1', 80);
  });

  test("utilise la surface d'immeuble pour un modèle immeuble", () => {
    enums.methode_application_dpe_log = { 1: 'dpe immeuble collectif' };
    vi.mocked(classe_bilan_dpe).mockReturnValue('E');
    const dpe = makeDpe();
    dpe.logement.sortie = {
      ep_conso: { ep_conso_5_usages: 30000 },
      ef_conso: { conso_5_usages: 12000 }
    };

    const res = get_conso_coeff_1_7_2027(dpe);

    // Sh = 200 => m2 = floor(ep / 200).
    const ep = (0.7 / 0.9) * (30000 - 12000) + 12000;
    expect(res.ep_conso_5_usages_2027).toBeCloseTo(ep, 6);
    expect(classe_bilan_dpe).toHaveBeenCalledWith(Math.floor(ep / 200), 'zc1', 'ca1', 200);
  });
});
