import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GenerateurChService } from './generateur-ch.service.js';
import { EmetteurChService } from './emetteur-ch.service.js';
import { ChTvStore } from '../../../dpe/infrastructure/ch/chTv.store.js';
import { TvStore } from '../../../dpe/infrastructure/tv.store.js';
import { set_dpe_original } from '../../../../utils.js';

/** @type {GenerateurChService} **/
let service;

/** @type {EmetteurChService} **/
let emetteurChService;

/**
 * Températures de fonctionnement du générateur (délégation au service émetteurs).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.5
 */
describe('Températures de fonctionnement des générateurs de chauffage', () => {
  const ctx = { anneeConstruction: 1900 };
  const emetteurs = [{ donnee_entree: { enum_temp_distribution_ch_id: 3 } }];

  beforeEach(() => {
    emetteurChService = new EmetteurChService(new ChTvStore());
    service = new GenerateurChService(new ChTvStore(), new TvStore(), emetteurChService);
    vi.spyOn(emetteurChService, 'temperatureFonctionnement').mockReturnValue({
      temp_fonc_30: 32,
      temp_fonc_100: 60
    });
    vi.spyOn(emetteurChService, 'periodeInstallationEmetteurDeduite').mockReturnValue(3);
  });

  test('caractéristiques saisies (méthode 5) avec temp_fonc_30 et temp_fonc_100 : valeurs conservées', () => {
    const generateur = {
      donnee_entree: { enum_methode_saisie_carac_sys_id: 5, enum_type_generateur_ch_id: '97' },
      donnee_intermediaire: { temp_fonc_30: 41, temp_fonc_100: 72 }
    };
    expect(service.temperatureFonctionnement(ctx, generateur, emetteurs)).toStrictEqual({
      temp_fonc_30: 41,
      temp_fonc_100: 72
    });
    expect(emetteurChService.periodeInstallationEmetteurDeduite).not.toHaveBeenCalled();
    expect(emetteurChService.temperatureFonctionnement).not.toHaveBeenCalled();
  });

  test('valeurs forfaitaires : période déduite des données intermédiaires du DPE transmise au calcul (issue #220)', () => {
    const generateurDE = { enum_methode_saisie_carac_sys_id: 1, enum_type_generateur_ch_id: '97' };
    const generateurDI = { temp_fonc_30: 32, temp_fonc_100: 60 };
    const generateur = { donnee_entree: generateurDE, donnee_intermediaire: generateurDI };

    expect(service.temperatureFonctionnement(ctx, generateur, emetteurs)).toStrictEqual({
      temp_fonc_30: 32,
      temp_fonc_100: 60
    });
    // Les valeurs d'origine du DPE (di du générateur) servent à la déduction
    expect(emetteurChService.periodeInstallationEmetteurDeduite).toHaveBeenCalledWith(
      ctx,
      generateurDE,
      emetteurs,
      generateurDI
    );
    expect(emetteurChService.temperatureFonctionnement).toHaveBeenCalledWith(
      ctx,
      generateurDE,
      emetteurs,
      3
    );
  });

  test('méthode 5 sans temp_fonc_100 : calcul forfaitaire depuis les émetteurs', () => {
    vi.mocked(emetteurChService.periodeInstallationEmetteurDeduite).mockReturnValue(undefined);
    const generateurDE = { enum_methode_saisie_carac_sys_id: 5, enum_type_generateur_ch_id: '97' };
    const generateur = { donnee_entree: generateurDE, donnee_intermediaire: { temp_fonc_30: 32 } };

    service.temperatureFonctionnement(ctx, generateur, emetteurs);
    expect(emetteurChService.temperatureFonctionnement).toHaveBeenCalledWith(
      ctx,
      generateurDE,
      emetteurs,
      undefined
    );
  });
});

/**
 * Puissance nominale estimée d'un générateur à combustion sans pn.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.2.4
 */
describe('Puissance nominale estimée des générateurs de chauffage (issue #264)', () => {
  /** @type {TvStore} */
  let tvStore;
  const ctx = { altitude: { id: 1 }, zoneClimatique: { id: 1 }, surfaceHabitable: 100 };
  const logement = { sortie: { deperdition: { deperdition_enveloppe: 200 } } };
  // 1,2 × 200 × (19 − (−9)) / 0,95³ -- valeur de référence de régression
  const PCH_LOGEMENT = 7837.877241580406;

  beforeEach(() => {
    tvStore = new TvStore();
    service = new GenerateurChService(new ChTvStore(), tvStore, new EmetteurChService());
    vi.spyOn(tvStore, 'getTempBase').mockReturnValue(-9);
  });

  test('installation desservant tout le logement : Pch sans prorata', () => {
    const installation = { donnee_entree: { surface_chauffee: 100, enum_type_installation_id: 1 } };
    expect(service.pn(ctx, logement, installation)).toBeCloseTo(PCH_LOGEMENT, 9);
    expect(tvStore.getTempBase).toHaveBeenCalledWith(1, 1);
  });

  test('installation desservant 40 % du logement : Pch proratisée à la surface chauffée', () => {
    const installation = { donnee_entree: { surface_chauffee: 40, enum_type_installation_id: 1 } };
    expect(service.pn(ctx, logement, installation)).toBeCloseTo(0.4 * PCH_LOGEMENT, 9);
  });

  test.each([
    ['surface chauffée absente', { donnee_entree: { enum_type_installation_id: 1 } }],
    [
      'installation collective',
      { donnee_entree: { surface_chauffee: 40, enum_type_installation_id: 2 } }
    ],
    ['installation absente', undefined],
    [
      'surface chauffée supérieure à Sh',
      { donnee_entree: { surface_chauffee: 130, enum_type_installation_id: 1 } }
    ],
    [
      'surface chauffée nulle',
      { donnee_entree: { surface_chauffee: 0, enum_type_installation_id: 1 } }
    ]
  ])('%s : pas de prorata', (_libelle, installation) => {
    expect(service.pn(ctx, logement, installation)).toBeCloseTo(PCH_LOGEMENT, 9);
  });
});

/**
 * Puissance nominale estimée par la puissance de dimensionnement : Pdim = max(Pch ; Pecs) puis table
 * Pdim → Pn des chaudières (le calcul de la table est testé dans 13.2_generateur_combustion_pdim.spec.js).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.2.4
 */
describe('Puissance nominale estimée : Pdim et table Pdim → Pn (issue #271)', () => {
  /** @type {TvStore} */
  let tvStore;
  const ctx = {
    altitude: { id: 1 },
    zoneClimatique: { id: 1 },
    surfaceHabitable: 100,
    anneeConstruction: 1975
  };
  const installation = { donnee_entree: { surface_chauffee: 100, enum_type_installation_id: 1 } };
  const logementAvecEcs = (generateursEcs) => ({
    sortie: { deperdition: { deperdition_enveloppe: 200 } },
    installation_ecs_collection: {
      installation_ecs: [{ generateur_ecs_collection: { generateur_ecs: generateursEcs } }]
    }
  });
  const generateur = (de) => ({ donnee_entree: de });

  beforeEach(() => {
    tvStore = new TvStore();
    service = new GenerateurChService(new ChTvStore(), tvStore, new EmetteurChService());
    vi.spyOn(tvStore, 'getTempBase').mockReturnValue(-9);
  });

  test('chaudière de chauffage seul installée après 2015 : Pch = 7,84 kW → Pn = 10 kW', () => {
    const logement = logementAvecEcs([]);
    const gen = generateur({ enum_type_generateur_ch_id: '97', enum_usage_generateur_id: 1 });
    expect(service.pn(ctx, logement, installation, gen)).toBe(10000);
  });

  test('chaudière 1991-2000 (pose inconnue, avant 2006) : plancher 18 kW', () => {
    const logement = logementAvecEcs([]);
    const gen = generateur({ enum_type_generateur_ch_id: '88', enum_usage_generateur_id: 1 });
    expect(service.pn(ctx, logement, installation, gen)).toBe(18000);
  });

  test('chaudière mixte instantanée : Pdim = max(Pch ; 21 kW) → Pn = 24 kW', () => {
    const logement = logementAvecEcs([
      { donnee_entree: { enum_usage_generateur_id: 2, volume_stockage: 300 } },
      { donnee_entree: { enum_usage_generateur_id: 3, volume_stockage: 0 } }
    ]);
    const gen = generateur({ enum_type_generateur_ch_id: '97', enum_usage_generateur_id: 3 });
    expect(service.pn(ctx, logement, installation, gen)).toBe(24000);
  });

  test('radiateur gaz : Pn = Pdim (pas de table)', () => {
    const logement = logementAvecEcs([]);
    const gen = generateur({ enum_type_generateur_ch_id: '54', enum_usage_generateur_id: 1 });
    expect(service.pn(ctx, logement, installation, gen)).toBeCloseTo(7837.877241580406, 9);
  });

  test('installation collective : Pch conservée', () => {
    const logement = logementAvecEcs([]);
    const collective = { donnee_entree: { enum_type_installation_id: 2 } };
    const gen = generateur({ enum_type_generateur_ch_id: '97', enum_usage_generateur_id: 1 });
    expect(service.pn(ctx, logement, collective, gen)).toBeCloseTo(7837.877241580406, 9);
  });

  test('volume de stockage du générateur ECS mixte jumeau (reference_generateur_mixte)', () => {
    const ecs = (reference, volume) => ({
      donnee_entree: {
        enum_usage_generateur_id: '3',
        reference_generateur_mixte: reference,
        volume_stockage: volume
      }
    });
    const logement = logementAvecEcs([ecs('A', 0), ecs('B', 200)]);
    expect(service.volumeStockageEcsMixte(logement, { reference_generateur_mixte: 'B' })).toBe(200);
    expect(service.volumeStockageEcsMixte(logement, {})).toBeUndefined();
    expect(service.volumeStockageEcsMixte({}, {})).toBeUndefined();
    expect(
      service.volumeStockageEcsMixte(
        { installation_ecs_collection: { installation_ecs: [{}] } },
        { reference_generateur_mixte: 'B' }
      )
    ).toBeUndefined();
  });

  test('execute : le générateur est transmis à l’estimation de pn', () => {
    vi.spyOn(service, 'pn').mockReturnValue(24000);
    vi.spyOn(service, 'caracteristiques').mockReturnValue({});
    const gen = {
      donnee_entree: { enum_type_generateur_ch_id: '97', enum_lien_generateur_emetteur_id: 1 },
      donnee_intermediaire: {}
    };
    const inst = {
      donnee_entree: { enum_type_installation_id: 1 },
      generateur_chauffage_collection: { generateur_chauffage: [gen] }
    };
    const logement = logementAvecEcs([]);
    service.execute(ctx, logement, inst);
    expect(service.pn).toHaveBeenCalledWith(ctx, logement, inst, gen);
    expect(gen.donnee_intermediaire.pn).toBe(24000);
  });

  describe('pn des données intermédiaires du DPE', () => {
    const generateurAvecPn = (methode) => ({
      donnee_entree: {
        enum_type_generateur_ch_id: '97',
        enum_lien_generateur_emetteur_id: 1,
        enum_methode_saisie_carac_sys_id: methode
      },
      donnee_intermediaire: { pn: 210000 }
    });
    const installationAvec = (gen) => ({
      donnee_entree: { enum_type_installation_id: 2 },
      generateur_chauffage_collection: { generateur_chauffage: [gen] }
    });

    beforeEach(() => {
      vi.spyOn(service, 'pn').mockReturnValue(64206);
      vi.spyOn(service, 'caracteristiques').mockReturnValue({});
      return () => set_dpe_original(true);
    });

    test('DPE d’origine : pn forfaitaire du DPE reprise', () => {
      const gen = generateurAvecPn('1');
      service.execute(ctx, logementAvecEcs([]), installationAvec(gen));
      expect(service.pn).not.toHaveBeenCalled();
      expect(gen.donnee_intermediaire.pn).toBe(210000);
    });

    test('DPE modifié (isOriginal = false) : pn forfaitaire du DPE non reprise, réestimée', () => {
      set_dpe_original(false);
      const gen = generateurAvecPn('1');
      service.execute(ctx, logementAvecEcs([]), installationAvec(gen));
      expect(service.pn).toHaveBeenCalled();
      expect(gen.donnee_intermediaire.pn).toBe(64206);
    });

    test('DPE modifié (isOriginal = false) : pn saisie (méthode 2) conservée', () => {
      set_dpe_original(false);
      const gen = generateurAvecPn('2');
      service.execute(ctx, logementAvecEcs([]), installationAvec(gen));
      expect(service.pn).not.toHaveBeenCalled();
      expect(gen.donnee_intermediaire.pn).toBe(210000);
    });
  });
});
