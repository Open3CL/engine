import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées :
 * - `bug_for_bug_compat` (utils.js) : piloté par le test ;
 * - `logger` : traces de déduction de la période des émetteurs (issue #220).
 */
const state = vi.hoisted(() => ({ bug: false }));

vi.mock('../../../../utils.js', async (importOriginal) => ({
  ...(await importOriginal()),
  get bug_for_bug_compat() {
    return state.bug;
  }
}));

vi.mock('../../../../core/util/logger/log-service.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

const { ChTvStore } = await import('../../../dpe/infrastructure/ch/chTv.store.js');
const { EmetteurChService, PERIODES_INSTALLATION_EMETTEUR } =
  await import('./emetteur-ch.service.js');
const { logger } = await import('../../../../core/util/logger/log-service.js');

/** @type {EmetteurChService} **/
let service;

/** @type {ChTvStore} **/
let chTvStore;

describe('Calcul des caractéristiques des générateurs de chauffage', () => {
  beforeEach(() => {
    state.bug = false;
    chTvStore = new ChTvStore();
    service = new EmetteurChService(chTvStore);
  });

  test("Determination de l'année d'installation des emetteurs", () => {
    /** @type {EmetteurChauffage} **/
    const emetteurChauffage = {
      donnee_entree: {}
    };

    expect(
      service.periodeInstallationEmetteur({ anneeConstruction: 1850 }, emetteurChauffage)
    ).toBe(1);
    expect(
      service.periodeInstallationEmetteur({ anneeConstruction: 1985 }, emetteurChauffage)
    ).toBe(2);
    expect(
      service.periodeInstallationEmetteur({ anneeConstruction: 2002 }, emetteurChauffage)
    ).toBe(3);

    emetteurChauffage.donnee_entree.enum_periode_installation_emetteur_id = 3;

    expect(
      service.periodeInstallationEmetteur({ anneeConstruction: 1850 }, emetteurChauffage)
    ).toBe(3);
  });

  test("Période par défaut (déduite) utilisée uniquement si la période n'est pas saisie", () => {
    expect(
      service.periodeInstallationEmetteur({ anneeConstruction: 1850 }, { donnee_entree: {} }, 3)
    ).toBe(3);
    expect(
      service.periodeInstallationEmetteur(
        { anneeConstruction: 1850 },
        { donnee_entree: { enum_periode_installation_emetteur_id: 1 } },
        3
      )
    ).toBe(1);
  });

  test('Détermination des températures de fonctionnement à 30 et 100% de charge', () => {
    vi.spyOn(chTvStore, 'temperatureFonctionnement')
      .mockReturnValueOnce(25)
      .mockReturnValueOnce(32)
      .mockReturnValueOnce(27)
      .mockReturnValueOnce(31);

    vi.spyOn(chTvStore, 'temperatureFonctionnement').mockReturnValue(32);
    /** @type {GenerateurChauffageDE} */
    const generateurChauffageDE = {
      enum_type_generateur_ch_id: 80
    };

    /** @type {EmetteurChauffage[]} */
    const emetteursChauffage = [
      {
        donnee_entree: { enum_temp_distribution_ch_id: 1 }
      },
      {
        donnee_entree: { enum_temp_distribution_ch_id: 2, enum_periode_installation_emetteur_id: 1 }
      },
      {
        donnee_entree: { enum_temp_distribution_ch_id: 2, enum_periode_installation_emetteur_id: 2 }
      }
    ];

    expect(
      service.temperatureFonctionnement({}, generateurChauffageDE, emetteursChauffage)
    ).toStrictEqual({
      temp_fonc_30: 27,
      temp_fonc_100: 32
    });
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledTimes(4);
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledWith('30', 80, 2, 1);
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledWith('100', 80, 2, 1);
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledWith('30', 80, 2, 2);
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledWith('100', 80, 2, 2);
  });
});

/**
 * Issue #220 - période d'installation des émetteurs absente du DPE.
 * Mode strict : année de construction. Mode bug_for_bug_compat : période retrouvée à partir des
 * temp_fonc_30 / temp_fonc_100 d'origine du DPE.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.5
 */
describe('Déduction de la période des émetteurs depuis les données du DPE (issue #220)', () => {
  /**
   * Table de test contrôlée (chaudière à condensation) :
   * [température de distribution][période] -> [temp_fonc_30, temp_fonc_100].
   */
  const TABLE = {
    2: { 1: [32, 60], 2: [24.5, 35], 3: [24.5, 35] },
    3: { 1: [38, 80], 2: [35, 70], 3: [32, 60] },
    4: { 1: [38, 80], 2: [35, 70], 3: [35, 70] }
  };

  const generateurDE = { enum_type_generateur_ch_id: '97' };

  function emetteur(tempDistribution, periode) {
    const de = { enum_temp_distribution_ch_id: tempDistribution };
    if (periode) de.enum_periode_installation_emetteur_id = periode;
    return { donnee_entree: de };
  }

  beforeEach(() => {
    state.bug = true;
    vi.mocked(logger.info).mockReset();
    vi.mocked(logger.warn).mockReset();
    chTvStore = new ChTvStore();
    service = new EmetteurChService(chTvStore);
    vi.spyOn(chTvStore, 'temperatureFonctionnement').mockImplementation(
      (pourcentage, _type, tempDistribution, periode) =>
        TABLE[tempDistribution]?.[periode]?.[pourcentage === '30' ? 0 : 1]
    );
  });

  test('périodes candidates ordonnées de la plus ancienne à la plus récente', () => {
    expect(PERIODES_INSTALLATION_EMETTEUR).toStrictEqual([1, 2, 3]);
  });

  test('T1 strict : bug_for_bug_compat désactivé -> aucune déduction (année de construction)', () => {
    state.bug = false;
    const ctx = { anneeConstruction: 1900 };
    const periode = service.periodeInstallationEmetteurDeduite(ctx, generateurDE, [emetteur(3)], {
      temp_fonc_30: 32,
      temp_fonc_100: 60
    });
    expect(periode).toBeUndefined();
    expect(chTvStore.temperatureFonctionnement).not.toHaveBeenCalled();
    expect(
      service.temperatureFonctionnement(ctx, generateurDE, [emetteur(3)], periode)
    ).toStrictEqual({ temp_fonc_30: 38, temp_fonc_100: 80 });
  });

  test('T2 bug_for_bug_compat : DPE 32/60, construction 1900 -> période « après 2000 » (3)', () => {
    const ctx = { anneeConstruction: 1900 };
    const periode = service.periodeInstallationEmetteurDeduite(ctx, generateurDE, [emetteur(3)], {
      temp_fonc_30: 32,
      temp_fonc_100: 60
    });
    expect(periode).toBe(3);
    expect(
      service.temperatureFonctionnement(ctx, generateurDE, [emetteur(3)], periode)
    ).toStrictEqual({ temp_fonc_30: 32, temp_fonc_100: 60 });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        "période d'installation des émetteurs déduite des données intermédiaires du DPE"
      )
    );
  });

  test('T2 bis bug_for_bug_compat : valeurs du DPE sous forme de chaînes acceptées', () => {
    expect(
      service.periodeInstallationEmetteurDeduite(
        { anneeConstruction: 1900 },
        generateurDE,
        [emetteur(3)],
        { temp_fonc_30: '32', temp_fonc_100: '60' }
      )
    ).toBe(3);
  });

  test('T3 bug_for_bug_compat : période saisie -> aucune déduction, période saisie conservée', () => {
    const ctx = { anneeConstruction: 1900 };
    const emetteurs = [emetteur(3, 1)];
    const periode = service.periodeInstallationEmetteurDeduite(ctx, generateurDE, emetteurs, {
      temp_fonc_30: 32,
      temp_fonc_100: 60
    });
    expect(periode).toBeUndefined();
    expect(service.temperatureFonctionnement(ctx, generateurDE, emetteurs, 3)).toStrictEqual({
      temp_fonc_30: 38,
      temp_fonc_100: 80
    });
  });

  test('T4 bug_for_bug_compat : distribution haute, construction 1990, DPE 35/70 -> période de construction (2)', () => {
    expect(
      service.periodeInstallationEmetteurDeduite(
        { anneeConstruction: 1990 },
        generateurDE,
        [emetteur(4)],
        { temp_fonc_30: 35, temp_fonc_100: 70 }
      )
    ).toBe(2);
  });

  test('T5 bug_for_bug_compat : DPE 33/62 hors tables -> aucune candidate, avertissement', () => {
    expect(
      service.periodeInstallationEmetteurDeduite(
        { anneeConstruction: 1990 },
        generateurDE,
        [emetteur(3)],
        { temp_fonc_30: 33, temp_fonc_100: 62 }
      )
    ).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("valeurs hors tables / donnée d'entrée incohérente")
    );
  });

  test.each([
    ['données intermédiaires absentes', undefined],
    ['temp_fonc_100 absente', { temp_fonc_30: 32 }],
    ['temp_fonc_30 absente', { temp_fonc_100: 60 }],
    ['temp_fonc_30 non numérique', { temp_fonc_30: 'abc', temp_fonc_100: 60 }],
    ['temp_fonc_100 vide', { temp_fonc_30: 32, temp_fonc_100: '' }],
    ['temp_fonc_30 nulle', { temp_fonc_30: null, temp_fonc_100: 60 }]
  ])('T6 bug_for_bug_compat : %s -> aucune déduction', (_, di) => {
    expect(
      service.periodeInstallationEmetteurDeduite(
        { anneeConstruction: 1900 },
        generateurDE,
        [emetteur(3)],
        di
      )
    ).toBeUndefined();
    expect(chTvStore.temperatureFonctionnement).not.toHaveBeenCalled();
  });

  test('T7 bug_for_bug_compat : deux émetteurs sans période (moyenne + haute), DPE 35/70 -> règle du maximum, période la plus récente', () => {
    /**
     * 1 : max(38, 38) / max(80, 80) -> rejetée ; 2 : 35/70 -> candidate ;
     * 3 : max(32, 35) / max(60, 70) = 35/70 -> candidate.
     * Construction 1900 (période 1) hors candidates -> la plus récente : 3.
     */
    const ctx = { anneeConstruction: 1900 };
    const emetteurs = [emetteur(3), emetteur(4)];
    const periode = service.periodeInstallationEmetteurDeduite(ctx, generateurDE, emetteurs, {
      temp_fonc_30: 35,
      temp_fonc_100: 70
    });
    expect(periode).toBe(3);
    expect(service.temperatureFonctionnement(ctx, generateurDE, emetteurs, periode)).toStrictEqual({
      temp_fonc_30: 35,
      temp_fonc_100: 70
    });
  });

  test('bug_for_bug_compat : seul un émetteur sans réseau de distribution est sans période -> aucune déduction', () => {
    expect(
      service.periodeInstallationEmetteurDeduite(
        { anneeConstruction: 1900 },
        generateurDE,
        [emetteur(1), emetteur(3, 1)],
        { temp_fonc_30: 32, temp_fonc_100: 60 }
      )
    ).toBeUndefined();
  });

  test('bug_for_bug_compat : aucune valeur de table trouvée -> aucune candidate', () => {
    vi.mocked(chTvStore.temperatureFonctionnement).mockReturnValue(undefined);
    expect(
      service.periodeInstallationEmetteurDeduite(
        { anneeConstruction: 1900 },
        generateurDE,
        [emetteur(3)],
        { temp_fonc_30: 32, temp_fonc_100: 60 }
      )
    ).toBeUndefined();
  });

  test('bug_for_bug_compat : une seule des deux valeurs reproduite -> période rejetée (tolérance 0,01 °C)', () => {
    expect(
      service.periodeInstallationEmetteurDeduite(
        { anneeConstruction: 1900 },
        generateurDE,
        [emetteur(3)],
        { temp_fonc_30: 32, temp_fonc_100: 60.02 }
      )
    ).toBeUndefined();
    expect(
      service.periodeInstallationEmetteurDeduite(
        { anneeConstruction: 1900 },
        generateurDE,
        [emetteur(3)],
        { temp_fonc_30: 32.005, temp_fonc_100: 59.995 }
      )
    ).toBe(3);
  });
});
