import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GenerateurChService } from './generateur-ch.service.js';

import { DpeNormalizerService } from '../../../normalizer/domain/dpe-normalizer.service.js';
import corpus from '../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../test/test-helpers.js';
import { TypeGenerateur } from '../../../dpe/domain/models/installation-chauffage.model.js';
import { ChTvStore } from '../../../dpe/infrastructure/ch/chTv.store.js';

/** @type {GenerateurChService} **/
let service;

/** @type {ChTvStore} **/
let tvStore;

/** @type {DpeNormalizerService} **/
let normalizerService;

describe('Calcul des caractéristiques des générateurs de chauffage', () => {
  beforeEach(() => {
    tvStore = new ChTvStore();
    service = new GenerateurChService(tvStore);
    normalizerService = new DpeNormalizerService();
  });

  test('Determination du type de générateur', () => {
    vi.spyOn(tvStore, 'getCombustionGenerateurs').mockReturnValue([1]);
    vi.spyOn(tvStore, 'getPacGenerateurs').mockReturnValue([2]);

    expect(service.typeGenerateur({ enum_type_generateur_ch_id: 1 })).toBe(
      TypeGenerateur.COMBUSTION
    );
    expect(tvStore.getCombustionGenerateurs).toHaveBeenCalled();

    expect(service.typeGenerateur({ enum_type_generateur_ch_id: 2 })).toBe(TypeGenerateur.PAC);
    expect(tvStore.getCombustionGenerateurs).toHaveBeenCalled();
    expect(tvStore.getPacGenerateurs).toHaveBeenCalled();

    expect(service.typeGenerateur({ enum_type_generateur_ch_id: 3 })).toBe(TypeGenerateur.OTHER);
    expect(tvStore.getCombustionGenerateurs).toHaveBeenCalled();
    expect(tvStore.getPacGenerateurs).toHaveBeenCalled();
  });

  test.each([
    {
      label: 'Générateur chauffage avec méthode de saisie 4',
      enumMethodeSaisieCaracSysId: 4,
      ratioVirtualisation: 1,
      pn: 25000,
      qp0Perc: '0.05%',
      qp0Initial: 125,
      expected: 125
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 5',
      enumMethodeSaisieCaracSysId: 5,
      ratioVirtualisation: 1,
      pn: 25000,
      qp0Perc: '0.05%',
      qp0Initial: 125,
      expected: 125
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 3 et aucun qp0Perc',
      enumMethodeSaisieCaracSysId: 3,
      ratioVirtualisation: 1,
      pn: 25000,
      qp0Perc: undefined,
      qp0Initial: 125,
      expected: 0
    },
    {
      label:
        'Générateur chauffage avec méthode de saisie 3 et qp0Perc contenant Pn, ratio de virtualisation 1',
      enumMethodeSaisieCaracSysId: 3,
      ratioVirtualisation: 1,
      pn: 25000,
      qp0Perc: '0,085*Pn*(Pn)^-0,4',
      qp0Initial: 125,
      expected: 586.39
    },
    {
      label:
        'Générateur chauffage avec méthode de saisie 3 et qp0Perc contenant Pn, ratio de virtualisation 0.5',
      enumMethodeSaisieCaracSysId: 3,
      ratioVirtualisation: 0.5,
      pn: 25000,
      qp0Perc: '0,085*Pn*(Pn)^-0,4',
      qp0Initial: 125,
      expected: 444.4
    },
    {
      label:
        'Générateur chauffage avec méthode de saisie 3 et qp0Perc en %, ratio de virtualisation 1',
      enumMethodeSaisieCaracSysId: 3,
      ratioVirtualisation: 1,
      pn: 25000,
      qp0Perc: '0.6%',
      qp0Initial: 125,
      expected: 150
    },
    {
      label:
        'Générateur chauffage avec méthode de saisie 3 et qp0Perc constante, ratio de virtualisation 1',
      enumMethodeSaisieCaracSysId: 3,
      ratioVirtualisation: 1,
      pn: 25000,
      qp0Perc: '12',
      qp0Initial: 125,
      expected: 12000
    },
    {
      label:
        'Générateur chauffage avec méthode de saisie 3 et qp0Perc contenant Pn, E et F, ratio de virtualisation 0.5, sans ventouse',
      enumMethodeSaisieCaracSysId: 3,
      presenceVentouse: 0,
      ratioVirtualisation: 0.5,
      pn: 25000,
      qp0Perc: 'Pn * (E + F * logPn) / 100',
      qp0Initial: 125,
      expected: 285.21
    },
    {
      label:
        'Générateur chauffage avec méthode de saisie 3 et qp0Perc contenant Pn, E et F, ratio de virtualisation 0.5, avec ventouse',
      enumMethodeSaisieCaracSysId: 3,
      presenceVentouse: 1,
      ratioVirtualisation: 0.5,
      pn: 25000,
      qp0Perc: 'Pn * (E + F * logPn) / 100',
      qp0Initial: 125,
      expected: 203.89
    }
  ])(
    "Détermination des pertes à l'arrêt qp0 pour $label",
    ({
      enumMethodeSaisieCaracSysId,
      ratioVirtualisation,
      pn,
      qp0Perc,
      qp0Initial,
      presenceVentouse = undefined,
      expected
    }) => {
      /** @type {GenerateurChauffage} */
      const generateurChauffage = {
        donnee_entree: {
          enum_methode_saisie_carac_sys_id: enumMethodeSaisieCaracSysId,
          presence_ventouse: presenceVentouse
        },
        donnee_utilisateur: {
          ratio_virtualisation: ratioVirtualisation,
          generateur: { qp0_perc: qp0Perc }
        },
        donnee_intermediaire: { qp0: qp0Initial, pn }
      };

      expect(service.qp0(generateurChauffage)).toBeCloseTo(expected, 2);
    }
  );

  test.each([
    {
      label: 'Générateur chauffage avec méthode de saisie 3',
      enumMethodeSaisieCaracSysId: 3,
      ratioVirtualisation: 1,
      pn: 25000,
      rpn: '84 + 2 logPn',
      rpint: '80 + 3 logPn',
      rpnInitial: 0.95,
      rpintInitial: 0.69,
      expected: { rpn: 0.95, rpint: 0.69 }
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 4',
      enumMethodeSaisieCaracSysId: 4,
      ratioVirtualisation: 1,
      pn: 25000,
      rpn: '84 + 2 logPn',
      rpint: '80 + 3 logPn',
      rpnInitial: 0.95,
      rpintInitial: 0.69,
      expected: { rpn: 0.95, rpint: 0.69 }
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 5',
      enumMethodeSaisieCaracSysId: 5,
      ratioVirtualisation: 1,
      pn: 25000,
      rpn: '84 + 2 logPn',
      rpint: '80 + 3 logPn',
      rpnInitial: 0.95,
      rpintInitial: 0.69,
      expected: { rpn: 0.95, rpint: 0.69 }
    },
    {
      label: 'Générateur chauffage avec méthodes de saisie 2 et aucun rpn ni rpint',
      enumMethodeSaisieCaracSysId: 2,
      ratioVirtualisation: 1,
      pn: 25000,
      rpn: undefined,
      rpint: undefined,
      rpnInitial: 0.95,
      rpintInitial: 0.69,
      expected: { rpn: 0, rpint: 0 }
    },
    {
      label: 'Générateur chauffage avec méthodes de saisie 2 et ratio de virtualisation 1',
      enumMethodeSaisieCaracSysId: 2,
      ratioVirtualisation: 1,
      pn: 25000,
      rpn: '84 + 2 logPn',
      rpint: '80 + 3 logPn',
      rpnInitial: 0.95,
      rpintInitial: 0.69,
      expected: { rpn: 0.8679588001734407, rpint: 0.8419382002601611 }
    },
    {
      label: 'Générateur chauffage avec méthodes de saisie 2 et ratio de virtualisation 0.5',
      enumMethodeSaisieCaracSysId: 2,
      ratioVirtualisation: 0.5,
      pn: 25000,
      rpn: '84 + 2 logPn',
      rpint: '80 + 3 logPn',
      rpnInitial: 0.95,
      rpintInitial: 0.69,
      expected: { rpn: 0.8739794000867204, rpint: 0.8509691001300805 }
    }
  ])(
    'Détermination des rendements rpn et rpint pour $label',
    ({
      enumMethodeSaisieCaracSysId,
      ratioVirtualisation,
      pn,
      rpn,
      rpint,
      rpnInitial,
      rpintInitial,
      expected
    }) => {
      /** @type {GenerateurChauffage} */
      const generateurChauffage = {
        donnee_entree: { enum_methode_saisie_carac_sys_id: enumMethodeSaisieCaracSysId },
        donnee_utilisateur: {
          ratio_virtualisation: ratioVirtualisation,
          generateur: { rpn, rpint }
        },
        donnee_intermediaire: { rpn: rpnInitial, rpint: rpintInitial, pn }
      };

      expect(service.rpnrpint(generateurChauffage)).toStrictEqual(expected);
    }
  );

  test.each([
    {
      label: 'Générateur chauffage avec méthode de saisie 2 et pveilleuse',
      enumMethodeSaisieCaracSysId: 2,
      pveilleuseInitial: 150,
      pveil: 250,
      expected: 150
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 2 et !pveilleuse',
      enumMethodeSaisieCaracSysId: 2,
      pveil: 250,
      expected: 250
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 1 et pveilleuse',
      enumMethodeSaisieCaracSysId: 1,
      pveilleuseInitial: 150,
      pveil: 250,
      expected: 250
    }
  ])(
    'Détermination de la puissance de la veilleuse pour $label',
    ({ enumMethodeSaisieCaracSysId, pveilleuseInitial, pveil, expected }) => {
      /** @type {GenerateurChauffage} */
      const generateurChauffage = {
        donnee_entree: { enum_methode_saisie_carac_sys_id: enumMethodeSaisieCaracSysId },
        donnee_utilisateur: { generateur: { pveil } },
        donnee_intermediaire: { pveilleuse: pveilleuseInitial }
      };

      expect(service.pveil(generateurChauffage)).toStrictEqual(expected);
    }
  );

  test.each([
    {
      label: 'Générateur chauffage avec présence ventouse',
      presenceVentouse: 1,
      expected: {
        qp0: 165.47247112790626,
        rpint: 0.8352827377716704,
        rpn: 0.8635218251811136,
        pveil: 250
      }
    },
    {
      label: 'Générateur chauffage sans ventouse',
      presenceVentouse: 0,
      expected: {
        qp0: 233.86904891331818,
        rpint: 0.8352827377716704,
        rpn: 0.8635218251811136,
        pveil: 250
      }
    }
  ])('Détermination des caractéristiques pour $label', ({ presenceVentouse, expected }) => {
    /** @type {GenerateurChauffage} */
    const generateurChauffage = {
      donnee_entree: { enum_methode_saisie_carac_sys_id: 2, presence_ventouse: presenceVentouse },
      donnee_utilisateur: {
        ratio_virtualisation: 1,
        generateur: {
          qp0_perc: 'Pn * (E + F * logPn) / 100',
          rpn: '84 + 2 logPn',
          rpint: '80 + 3 logPn',
          pveil: 250
        }
      },
      donnee_intermediaire: { rpn: 0.95, rpint: 0.68, qp0: 125, pn: 15000 }
    };

    expect(service.caracteristiques(generateurChauffage)).toStrictEqual(expected);
  });

  test('Gestion des générateurs à combustion', () => {
    vi.spyOn(tvStore, 'getCombustionGenerateurs').mockReturnValue([1]);
    vi.spyOn(tvStore, 'getPacGenerateurs').mockReturnValue([2]);
    vi.spyOn(tvStore, 'getGenerateurCombustion').mockReturnValue({});

    /** @type {GenerateurChauffage} */
    const generateurChauffage = {
      donnee_entree: {
        enum_methode_saisie_carac_sys_id: 4,
        enum_type_generateur_ch_id: 3,
        presence_ventouse: 1
      },
      donnee_intermediaire: { rpn: 0.95, rpint: 0.68, qp0: 125, pn: 15000 }
    };

    const installationChauffage = {
      donnee_entree: { ratio_virtualisation: 0.8 },
      generateur_chauffage_collection: {
        generateur_chauffage: [generateurChauffage]
      }
    };

    service.execute(installationChauffage);
    expect(tvStore.getGenerateurCombustion).not.toHaveBeenCalled();

    installationChauffage.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree.enum_type_generateur_ch_id = 1;
    service.execute(installationChauffage);
    expect(tvStore.getGenerateurCombustion).toHaveBeenCalledWith(1, 18.75);
    expect(
      installationChauffage.generateur_chauffage_collection.generateur_chauffage[0]
        .donnee_utilisateur
    ).toStrictEqual({
      generateur: {},
      ratio_virtualisation: 0.8,
      typeGenerateur: TypeGenerateur.COMBUSTION
    });
  });

  describe("Test d'intégration des installations de chauffage", () => {
    test.each(corpus)('vérification des DI qp0 des installations CH pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      const installationsCh = structuredClone(
        dpeRequest.logement.installation_chauffage_collection?.installation_chauffage || []
      );

      installationsCh.forEach((installationCh, i) => {
        service.execute(installationCh);

        installationCh.generateur_chauffage_collection?.generateur_chauffage.forEach(
          (generateurChauffage, j) => {
            const expectedQp0 =
              dpeRequest.logement.installation_chauffage_collection.installation_chauffage[i]
                .generateur_chauffage_collection.generateur_chauffage[j].donnee_intermediaire.qp0;

            if (expectedQp0) {
              expect(generateurChauffage.donnee_intermediaire.qp0).toBeCloseTo(expectedQp0, 2);
            } else {
              expect(generateurChauffage.donnee_intermediaire.qp0).toBeUndefined();
            }
          }
        );
      });
    });

    test.each(corpus)('vérification des DI rpn des installations CH pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      const installationsCh = structuredClone(
        dpeRequest.logement.installation_chauffage_collection?.installation_chauffage || []
      );

      installationsCh.forEach((installationCh, i) => {
        service.execute(installationCh);

        installationCh.generateur_chauffage_collection?.generateur_chauffage.forEach(
          (generateurChauffage, j) => {
            const expectedRpn =
              dpeRequest.logement.installation_chauffage_collection.installation_chauffage[i]
                .generateur_chauffage_collection.generateur_chauffage[j].donnee_intermediaire.rpn;

            if (expectedRpn) {
              expect(generateurChauffage.donnee_intermediaire.rpn).toBeCloseTo(expectedRpn, 2);
            } else {
              expect(generateurChauffage.donnee_intermediaire.rpn).toBeUndefined();
            }
          }
        );
      });
    });

    test.each(corpus)('vérification des DI rpint des installations CH pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      const installationsCh = structuredClone(
        dpeRequest.logement.installation_chauffage_collection?.installation_chauffage || []
      );

      installationsCh.forEach((installationCh, i) => {
        service.execute(installationCh);

        installationCh.generateur_chauffage_collection?.generateur_chauffage.forEach(
          (generateurChauffage, j) => {
            const expectedRpint =
              dpeRequest.logement.installation_chauffage_collection.installation_chauffage[i]
                .generateur_chauffage_collection.generateur_chauffage[j].donnee_intermediaire.rpint;

            if (expectedRpint) {
              expect(generateurChauffage.donnee_intermediaire.rpint).toBeCloseTo(expectedRpint, 2);
            } else {
              expect(generateurChauffage.donnee_intermediaire.rpint).toBeUndefined();
            }
          }
        );
      });
    });
  });
});
