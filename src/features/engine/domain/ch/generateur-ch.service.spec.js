import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GenerateurChService } from './generateur-ch.service.js';
import { EmetteurChService } from './emetteur-ch.service.js';
import { ChTvStore } from '../../../dpe/infrastructure/ch/chTv.store.js';
import { TvStore } from '../../../dpe/infrastructure/tv.store.js';

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
