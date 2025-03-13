import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GenerateurChService } from './generateur-ch.service.js';

import { DpeNormalizerService } from '../../../normalizer/domain/dpe-normalizer.service.js';
import corpus from '../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../test/test-helpers.js';
import { TypeGenerateur } from '../../../dpe/domain/models/installation-chauffage.model.js';
import { ChTvStore } from '../../../dpe/infrastructure/ch/chTv.store.js';
import { ContexteBuilder } from '../contexte.builder.js';
import { TvStore } from '../../../dpe/infrastructure/tv.store.js';
import { EmetteurChService } from './emetteur-ch.service.js';

/** @type {GenerateurChService} **/
let service;

/** @type {EmetteurChService} **/
let emetteurChService;

/** @type {ChTvStore} **/
let chTvStore;

/** @type {TvStore} **/
let tvStore;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul des caractéristiques des générateurs de chauffage', () => {
  beforeEach(() => {
    chTvStore = new ChTvStore();
    tvStore = new TvStore();
    emetteurChService = new EmetteurChService(chTvStore);
    service = new GenerateurChService(chTvStore, tvStore, emetteurChService);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
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
      label:
        'Générateur chauffage avec méthode de saisie 5 mais pas de temp_fonc_30 ni temp_fonc_100',
      enumMethodeSaisieCaracSysId: 5,
      emetteurServiceCalled: true,
      expected: { temp_fonc_30: 18, temp_fonc_100: 25 }
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 5 mais pas de temp_fonc_30',
      enumMethodeSaisieCaracSysId: 5,
      tempFonc100Initial: 38,
      emetteurServiceCalled: true,
      expected: { temp_fonc_30: 18, temp_fonc_100: 25 }
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 5 mais pas de temp_fonc_100',
      enumMethodeSaisieCaracSysId: 5,
      tempFonc30Initial: 25,
      emetteurServiceCalled: true,
      expected: { temp_fonc_30: 18, temp_fonc_100: 25 }
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 4 avec temp_fonc_30 et temp_fonc_100',
      enumMethodeSaisieCaracSysId: 4,
      tempFonc30Initial: 25,
      tempFonc100Initial: 38,
      emetteurServiceCalled: true,
      expected: { temp_fonc_30: 18, temp_fonc_100: 25 }
    },
    {
      label: 'Générateur chauffage avec méthode de saisie 5 avec temp_fonc_30 et temp_fonc_100',
      enumMethodeSaisieCaracSysId: 5,
      tempFonc30Initial: 25,
      tempFonc100Initial: 38,
      emetteurServiceCalled: false,
      expected: { temp_fonc_30: 25, temp_fonc_100: 38 }
    }
  ])(
    'Détermination des températures de fonctionnement à 30% et 100% de charge pour $label',
    ({
      enumMethodeSaisieCaracSysId,
      tempFonc30Initial = undefined,
      tempFonc100Initial = undefined,
      emetteurServiceCalled,
      expected
    }) => {
      vi.spyOn(emetteurChService, 'temperatureFonctionnement').mockReturnValue({
        temp_fonc_30: 18,
        temp_fonc_100: 25
      });

      /** @type {GenerateurChauffage} */
      const generateurChauffage = {
        donnee_entree: { enum_methode_saisie_carac_sys_id: enumMethodeSaisieCaracSysId },
        donnee_intermediaire: { temp_fonc_100: tempFonc100Initial, temp_fonc_30: tempFonc30Initial }
      };

      /** @type {EmetteurChauffage[]} */
      const emetteursChauffage = [
        {
          donnee_entree: { surface_chauffee: 80 },
          donnee_intermediaire: { rendement_emission: 0.86 }
        }
      ];

      /** @type {Contexte} */
      const contexte = { altitude: { id: 1 }, zoneClimatique: { id: 1 } };

      expect(
        service.temperatureFonctionnement(contexte, generateurChauffage, emetteursChauffage)
      ).toStrictEqual(expected);

      if (emetteurServiceCalled) {
        expect(emetteurChService.temperatureFonctionnement).toHaveBeenCalledWith(
          contexte,
          generateurChauffage.donnee_entree,
          emetteursChauffage
        );
      } else {
        expect(emetteurChService.temperatureFonctionnement).not.toHaveBeenCalled();
      }
    }
  );

  test('Détermination de la puissance nominale pour un générateur de chauffage', () => {
    vi.spyOn(tvStore, 'getTempBase').mockReturnValue(-9.5);

    /** @type {Contexte} */
    const contexte = { altitude: { id: 1 }, zoneClimatique: { id: 1 } };

    /** @type {Logement} **/
    const logement = { sortie: { deperdition: { deperdition_enveloppe: 1134 } } };

    expect(service.pn(contexte, logement)).toBeCloseTo(45234.35, 2);
    expect(tvStore.getTempBase).toHaveBeenCalledWith(1, 1);
  });

  test('Détermination du type de générateur de chauffage', () => {
    expect(service.typeGenerateur({ enum_type_generateur_ch_id: 1 })).toBe(TypeGenerateur.OTHER);
    [
      75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97,
      127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 148, 149, 150, 151, 160, 161
    ].forEach((value) =>
      expect(service.typeGenerateur({ enum_type_generateur_ch_id: value })).toBe(
        TypeGenerateur.CHAUDIERE
      )
    );
  });

  test('Détermination des caractéristiques pour le générateur de chauffage', () => {
    vi.spyOn(emetteurChService, 'temperatureFonctionnement').mockReturnValue({
      temp_fonc_30: 18,
      temp_fonc_100: 25
    });

    /** @type {GenerateurChauffage} */
    const generateurChauffage = {
      donnee_entree: { enum_methode_saisie_carac_sys_id: 5, presence_ventouse: 1 },
      donnee_utilisateur: {
        ratio_virtualisation: 1,
        typeGenerateur: TypeGenerateur.CHAUDIERE,
        generateur: {
          qp0_perc: 'Pn * (E + F * logPn) / 100',
          rpn: '84 + 2 logPn',
          rpint: '80 + 3 logPn',
          pveil: 250
        }
      },
      donnee_intermediaire: {
        rpn: 0.95,
        rpint: 0.68,
        qp0: 125,
        pn: 15000,
        temp_fonc_30: 18,
        temp_fonc_100: 25
      }
    };

    /** @type {EmetteurChauffage[]} */
    const emetteursChauffage = [
      {
        donnee_entree: { surface_chauffee: 80 },
        donnee_intermediaire: { rendement_emission: 0.86 }
      }
    ];

    /** @type {Contexte} */
    const contexte = { altitude: { id: 1 }, zoneClimatique: { id: 1 } };

    expect(
      service.caracteristiques(contexte, generateurChauffage, emetteursChauffage)
    ).toStrictEqual({
      pveil: 250,
      qp0: 125,
      rpint: 0.68,
      rpn: 0.95,
      temp_fonc_100: 25,
      temp_fonc_30: 18
    });
  });

  describe('Détermination des caractéristiques du générateur', () => {
    let generateurChauffage;
    let installationChauffage;
    let logement;
    let ctx;

    beforeEach(() => {
      vi.spyOn(chTvStore, 'getCombustionGenerateurs').mockReturnValue([1, 76]);
      vi.spyOn(chTvStore, 'getPacGenerateurs').mockReturnValue([2]);
      vi.spyOn(chTvStore, 'getGenerateurCombustion').mockReturnValue({});

      /** @type {GenerateurChauffage} */
      generateurChauffage = {
        donnee_entree: {
          enum_methode_saisie_carac_sys_id: 4,
          enum_type_generateur_ch_id: 3,
          presence_ventouse: 1
        },
        donnee_intermediaire: {
          rpn: 0.95,
          rpint: 0.68,
          qp0: 125,
          pn: 15000,
          temp_fonc_30: 25,
          temp_fonc_100: 36
        }
      };

      installationChauffage = {
        donnee_entree: { ratio_virtualisation: 0.8 },
        generateur_chauffage_collection: {
          generateur_chauffage: [generateurChauffage]
        }
      };

      /** @type {Logement} */
      logement = {
        installation_chauffage_collection: { installation_chauffage: [installationChauffage] }
      };

      /** @type {Contexte} */
      ctx = {
        zoneClimatique: { id: 1 }
      };
    });

    test('Générateur autre que combustion ou chaudière', () => {
      service.execute(ctx, logement, installationChauffage);
      expect(chTvStore.getGenerateurCombustion).not.toHaveBeenCalled();
      expect(
        installationChauffage.generateur_chauffage_collection.generateur_chauffage[0]
          .donnee_utilisateur
      ).toStrictEqual({
        combustion: false,
        pac: false,
        ratio_virtualisation: 0.8,
        typeGenerateur: TypeGenerateur.OTHER
      });
    });

    test('Détermination des caractéristiques du générateur à combustion', () => {
      installationChauffage.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree.enum_type_generateur_ch_id = 1;
      service.execute(ctx, logement, installationChauffage);
      expect(chTvStore.getGenerateurCombustion).toHaveBeenCalledWith(1, 18.75);
      expect(
        installationChauffage.generateur_chauffage_collection.generateur_chauffage[0]
          .donnee_utilisateur
      ).toStrictEqual({
        combustion: true,
        pac: false,
        generateur: {},
        ratio_virtualisation: 0.8,
        typeGenerateur: TypeGenerateur.OTHER
      });
      expect(
        installationChauffage.generateur_chauffage_collection.generateur_chauffage[0]
          .donnee_intermediaire
      ).toStrictEqual({
        pn: 15000,
        pveil: 0,
        qp0: 125,
        rpint: 0.68,
        rpn: 0.95,
        temp_fonc_100: 36,
        temp_fonc_30: 25
      });
    });

    test('Détermination des caractéristiques du générateur à combustion de type chaudière', () => {
      installationChauffage.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree.enum_type_generateur_ch_id = 76;
      installationChauffage.generateur_chauffage_collection.generateur_chauffage[0].donnee_entree.enum_methode_saisie_carac_sys_id = 5;
      service.execute(ctx, logement, installationChauffage);
      expect(
        installationChauffage.generateur_chauffage_collection.generateur_chauffage[0]
          .donnee_utilisateur
      ).toStrictEqual({
        combustion: true,
        pac: false,
        generateur: {},
        ratio_virtualisation: 0.8,
        typeGenerateur: TypeGenerateur.CHAUDIERE
      });
      expect(
        installationChauffage.generateur_chauffage_collection.generateur_chauffage[0]
          .donnee_intermediaire
      ).toStrictEqual({
        pn: 15000,
        pveil: 0,
        qp0: 125,
        rpint: 0.68,
        rpn: 0.95,
        temp_fonc_100: 36,
        temp_fonc_30: 25
      });
    });
  });

  describe("Test d'intégration des installations de chauffage", () => {
    test.each(corpus)('vérification des DI qp0 des installations CH pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      const installationsCh = structuredClone(
        dpeRequest.logement.installation_chauffage_collection?.installation_chauffage || []
      );

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      installationsCh.forEach((installationCh, i) => {
        service.execute(ctx, dpeRequest.logement, installationCh);

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

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      installationsCh.forEach((installationCh, i) => {
        service.execute(ctx, dpeRequest.logement, installationCh);

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

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      installationsCh.forEach((installationCh, i) => {
        service.execute(ctx, dpeRequest.logement, installationCh);

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

    test.each(corpus)(
      'vérification des DI temp_fonc_30 des installations CH pour dpe %s',
      (ademeId) => {
        let dpeRequest = getAdemeFileJson(ademeId);
        dpeRequest = normalizerService.normalize(dpeRequest);
        console.log(ademeId);
        const installationsCh = structuredClone(
          dpeRequest.logement.installation_chauffage_collection?.installation_chauffage || []
        );

        /** @type {Contexte} */
        const ctx = contexteBuilder.fromDpe(dpeRequest);

        installationsCh.forEach((installationCh, i) => {
          service.execute(ctx, dpeRequest.logement, installationCh);

          installationCh.generateur_chauffage_collection?.generateur_chauffage.forEach(
            (generateurChauffage, j) => {
              const expectedTempFonct30 =
                dpeRequest.logement.installation_chauffage_collection.installation_chauffage[i]
                  .generateur_chauffage_collection.generateur_chauffage[j].donnee_intermediaire
                  .temp_fonc_30;

              console.log(expectedTempFonct30);
              console.log(generateurChauffage.donnee_intermediaire.temp_fonc_30);

              if (expectedTempFonct30) {
                expect(generateurChauffage.donnee_intermediaire.temp_fonc_30).toBeCloseTo(
                  expectedTempFonct30,
                  2
                );
              } else {
                expect(generateurChauffage.donnee_intermediaire.temp_fonc_30).toBeUndefined();
              }
            }
          );
        });
      }
    );

    test.each(corpus)(
      'vérification des DI temp_fonc_100 des installations CH pour dpe %s',
      (ademeId) => {
        let dpeRequest = getAdemeFileJson(ademeId);
        dpeRequest = normalizerService.normalize(dpeRequest);

        const installationsCh = structuredClone(
          dpeRequest.logement.installation_chauffage_collection?.installation_chauffage || []
        );

        /** @type {Contexte} */
        const ctx = contexteBuilder.fromDpe(dpeRequest);

        installationsCh.forEach((installationCh, i) => {
          service.execute(ctx, dpeRequest.logement, installationCh);

          installationCh.generateur_chauffage_collection?.generateur_chauffage.forEach(
            (generateurChauffage, j) => {
              const expectedTempFonct100 =
                dpeRequest.logement.installation_chauffage_collection.installation_chauffage[i]
                  .generateur_chauffage_collection.generateur_chauffage[j].donnee_intermediaire
                  .temp_fonc_100;

              if (expectedTempFonct100) {
                expect(generateurChauffage.donnee_intermediaire.temp_fonc_100).toBeCloseTo(
                  expectedTempFonct100,
                  2
                );
              } else {
                expect(generateurChauffage.donnee_intermediaire.temp_fonc_100).toBeUndefined();
              }
            }
          );
        });
      }
    );
  });
});
