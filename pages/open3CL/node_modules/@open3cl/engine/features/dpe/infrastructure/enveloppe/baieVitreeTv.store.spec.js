import { beforeEach, describe, expect, test } from 'vitest';
import { BaieVitreeTvStore } from './baieVitreeTv.store.js';

/** @type {BaieVitreeTvStore} **/
let tvStore;

describe('Lecture des tables de valeurs', () => {
  beforeEach(() => {
    tvStore = new BaieVitreeTvStore();
  });

  describe('lecture des valeurs de ug', () => {
    test.each([
      {
        label: 'Simple vitrage',
        enumTypeVitrageId: '1',
        expected: 5.8
      },
      {
        label: "Survitrage non traité avec lame d'air 6mm",
        enumTypeVitrageId: '4',
        epaisseurLame: 6,
        expected: 3.4
      },
      {
        label: "Survitrage non traité avec lame d'air 20mm",
        enumTypeVitrageId: '4',
        epaisseurLame: 20,
        expected: 2.8
      },
      {
        label: "Double vitrage vertical traité avec lame d'air argon 14mm",
        enumTypeVitrageId: '2',
        epaisseurLame: 14,
        enumTypeGazLameId: '2',
        enumInclinaisonVitrageId: '1',
        vitrageVir: '1',
        expected: 1.2
      },
      {
        label: "Double vitrage vertical non traité avec lame d'air argon 14mm",
        enumTypeVitrageId: '2',
        epaisseurLame: 14,
        enumTypeGazLameId: '2',
        enumInclinaisonVitrageId: '1',
        vitrageVir: '0',
        expected: 2.8
      },
      {
        label: "Double vitrage horizontal non traité avec lame d'air inconnu 15mm",
        enumTypeVitrageId: '2',
        epaisseurLame: 15,
        enumTypeGazLameId: '3',
        enumInclinaisonVitrageId: '4',
        vitrageVir: '0',
        expected: 2.9
      },
      {
        label: "Double vitrage horizontal non traité avec lame d'air inconnu 12mm",
        enumTypeVitrageId: '2',
        epaisseurLame: 12,
        enumTypeGazLameId: '3',
        enumInclinaisonVitrageId: '4',
        vitrageVir: '0',
        expected: 3.1
      }
    ])(
      `ug pour baie vitrée $label`,
      ({
        enumTypeVitrageId,
        enumTypeGazLameId = undefined,
        enumInclinaisonVitrageId = undefined,
        vitrageVir = undefined,
        epaisseurLame = undefined,
        expected
      }) => {
        expect(
          tvStore.getUg(
            enumTypeVitrageId,
            enumTypeGazLameId,
            enumInclinaisonVitrageId,
            vitrageVir,
            epaisseurLame
          )
        ).toBe(expected);
      }
    );

    test('Récupération des valeurs des épaisseurs disponibles pour les valeurs de ug', () => {
      expect(tvStore.getEpaisseurAvailableForUg()).toStrictEqual([
        0, 6, 8, 10, 12, 14, 15, 16, 18, 20
      ]);
    });

    test('pas de valeur de ug', () => {
      const ug = tvStore.getUg('0', '0', '0', false, 0);
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs de sw', () => {
    test.each([
      {
        label: 'Paroi en brique de verre pleine',
        enumTypeBaieId: '1',
        enumTypeMateriauxMenuiserieId: '1',
        expected: 0.4
      },
      {
        label: 'Paroi en polycarbonnate',
        enumTypeBaieId: '3',
        enumTypeMateriauxMenuiserieId: '2',
        expected: 0.4
      },
      {
        label: 'Fenêtres battantes',
        enumTypeBaieId: '4',
        enumTypeMateriauxMenuiserieId: '3',
        enumTypeVitrageId: '1',
        expected: 0.58
      },
      {
        label: 'Fenêtres coulissantes',
        enumTypeBaieId: '5',
        enumTypeMateriauxMenuiserieId: '3',
        enumTypeVitrageId: '3',
        enumTypePoseId: '2',
        expected: 0.41
      },
      {
        label: 'Fenêtres coulissantes',
        enumTypeBaieId: '5',
        enumTypeMateriauxMenuiserieId: '3',
        enumTypeVitrageId: '3',
        enumTypePoseId: '2',
        vitrageVir: 1,
        expected: 0.37
      },
      {
        label: 'Fenêtres coulissantes',
        enumTypeBaieId: '5',
        enumTypeMateriauxMenuiserieId: '3',
        enumTypeVitrageId: '3',
        enumTypePoseId: '2',
        vitrageVir: '1',
        expected: 0.37
      }
    ])(
      `sw pour baie vitrée $label`,
      ({
        enumTypeVitrageId = undefined,
        enumTypeBaieId,
        enumTypeMateriauxMenuiserieId,
        vitrageVir = undefined,
        enumTypePoseId = undefined,
        expected
      }) => {
        expect(
          tvStore.getSw(
            enumTypeVitrageId,
            enumTypeBaieId,
            enumTypeMateriauxMenuiserieId,
            vitrageVir,
            enumTypePoseId
          )
        ).toBe(expected);
      }
    );

    test('pas de valeur de sw', () => {
      const ug = tvStore.getSw('0', '0', '0', '0', '0');
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs de uw', () => {
    test.each([
      {
        label: 'Paroi en brique de verre pleine',
        enumTypeBaieId: '1',
        enumTypeMateriauxMenuiserieId: '1',
        expected: 3.5
      },
      {
        label: 'Paroi en polycarbonnate',
        enumTypeBaieId: '3',
        enumTypeMateriauxMenuiserieId: '2',
        expected: 3
      },
      {
        label: 'uw non extrapolé pour Fenêtres battantes',
        enumTypeBaieId: '4',
        enumTypeMateriauxMenuiserieId: '6',
        ug: 0.5,
        expected: 1.3
      },
      {
        label: 'uw extrapolé pour Fenêtres coulissantes',
        enumTypeBaieId: '5',
        enumTypeMateriauxMenuiserieId: '6',
        ug: '2.45',
        expected: 3.05
      },
      {
        label: 'uw extrapolé pour Fenêtres coulissantes',
        enumTypeBaieId: '5',
        enumTypeMateriauxMenuiserieId: '6',
        ug: '8',
        expected: 8
      }
    ])(
      `uw pour baie vitrée $label`,
      ({ enumTypeBaieId, enumTypeMateriauxMenuiserieId, ug = undefined, expected }) => {
        expect(tvStore.getUw(enumTypeBaieId, enumTypeMateriauxMenuiserieId, ug)).toBeCloseTo(
          expected,
          2
        );
      }
    );

    test('pas de valeur de uw', () => {
      const ug = tvStore.getSw('0', '0', 0);
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs de ujn', () => {
    test.each([
      {
        label: 'ujn non extrapolé',
        enumTypeFermetureId: '2',
        uw: 0.8,
        expected: '0.8'
      },
      {
        label: 'ujn extrapolé',
        enumTypeFermetureId: '2',
        uw: 0.85,
        expected: '0.85'
      },
      {
        label: 'ujn extrapolé > à la borne maximale des valeurs connues',
        enumTypeFermetureId: '2',
        uw: 7,
        expected: '5.9'
      }
    ])(`ujn pour baie vitrée $label`, ({ enumTypeFermetureId, uw, expected }) => {
      expect(tvStore.getUjn(enumTypeFermetureId, uw)).toBeCloseTo(expected, 2);
    });

    test('pas de valeur de ujn', () => {
      const ug = tvStore.getUjn('0', 0);
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs de deltar', () => {
    test.each([
      {
        label: 'Jalousie accordéon',
        enumTypeFermetureId: '2',
        expected: 0.08
      },
      {
        label: 'Fermeture isolée sans ajours',
        enumTypeFermetureId: '8',
        expected: 0.25
      }
    ])(`deltar pour baie vitrée $label`, ({ enumTypeFermetureId, expected }) => {
      expect(tvStore.getDeltar(enumTypeFermetureId)).toBe(expected);
    });

    test('pas de valeur de deltar', () => {
      const ug = tvStore.getDeltar('0');
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs des masques lointains non homogènes', () => {
    test.each([
      {
        label: '2 secteurs lateraux',
        tvCoeffMasqueLointainNonHomogeneId: '1',
        expected: 0
      },
      {
        label: '2 secteurs lateraux',
        tvCoeffMasqueLointainNonHomogeneId: '4',
        expected: 15
      }
    ])(`ombre pour baie vitrée $label`, ({ tvCoeffMasqueLointainNonHomogeneId, expected }) => {
      expect(tvStore.getOmbre(tvCoeffMasqueLointainNonHomogeneId)).toBe(expected);
    });

    test('pas de valeur de masque lointain non homogène', () => {
      const ug = tvStore.getOmbre('0');
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs des masques proches', () => {
    test.each([
      {
        label: 'Baie en fond de balcon ou fond et flanc de loggias',
        tvCoefMasqueProcheId: '1',
        expected: 0.4
      },
      {
        label: 'Baie sous un balcon ou auvent',
        tvCoefMasqueProcheId: '13',
        expected: 0.8
      }
    ])(`incidence masque proche pour baie vitrée $label`, ({ tvCoefMasqueProcheId, expected }) => {
      expect(tvStore.getMasqueProche(tvCoefMasqueProcheId)).toBe(expected);
    });

    test('pas de valeur de masque proche', () => {
      const ug = tvStore.getMasqueProche('0');
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs des masques lointains homogènes', () => {
    test.each([
      {
        label: 'Orientation nord, hauteur 15 ≤….< 30',
        tvCoefMasqueLointainHomogeneId: '2',
        expected: 0.82
      },
      {
        label: 'Orientation sud, hauteur 60 ≤….< 90',
        tvCoefMasqueLointainHomogeneId: '8',
        expected: 0.1
      }
    ])(
      `incidence masque proche pour baie vitrée $label`,
      ({ tvCoefMasqueLointainHomogeneId, expected }) => {
        expect(tvStore.getMasqueLointainHomogene(tvCoefMasqueLointainHomogeneId)).toBe(expected);
      }
    );

    test('pas de valeur de masque lointain homogène', () => {
      const ug = tvStore.getMasqueLointainHomogene('0');
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs coefficients de réduction de température des espaces tampons', () => {
    test.each([
      {
        label: 'lc non isolé + espace tampon solarisé orienté nord',
        zoneClimatique: 'H1a',
        enumCfgIsolationLncId: '9',
        expected: 0.85
      },
      {
        label: 'lc isolé + espace tampon solarisé orienté sud',
        zoneClimatique: 'H2C',
        enumCfgIsolationLncId: '7',
        expected: 0.57
      }
    ])(
      `incidence masque proche pour baie vitrée $label`,
      ({ zoneClimatique, enumCfgIsolationLncId, expected }) => {
        expect(tvStore.getBver(zoneClimatique, enumCfgIsolationLncId)).toBe(expected);
      }
    );

    test('pas de valeur de coefficients de réduction de température', () => {
      const ug = tvStore.getBver('h3C', 1);
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs de coefficients de transparence des espaces tampons', () => {
    test.each([
      {
        label: 'Parois en polycarbonate',
        tvCoefTransparenceEtsId: '9',
        expected: 0.39
      },
      {
        label: 'Parois triple vitrage en Bois / Bois-métal',
        tvCoefTransparenceEtsId: '5',
        expected: 0.49
      }
    ])(
      `incidence masque proche pour baie vitrée $label`,
      ({ tvCoefTransparenceEtsId, expected }) => {
        expect(tvStore.getCoefTransparenceEts(tvCoefTransparenceEtsId)).toBe(expected);
      }
    );

    test('pas de valeur de coefficients de transparence', () => {
      const ug = tvStore.getCoefTransparenceEts(0);
      expect(ug).toBeUndefined();
    });
  });

  describe("lecture des coefficients d'orientation et inclinaison des parois vitrées", () => {
    test.each([
      {
        label: 'Baie vitrée orientée nord, inclinaison inf25°',
        enumOrientationId: '2',
        enumInclinaisonVitrageId: '1',
        zoneClimatiqueId: '1',
        mois: 'Janvier',
        expected: 0.52
      },
      {
        label: 'Baie vitrée orientée nord, inclinaison inf25°',
        enumOrientationId: '2',
        enumInclinaisonVitrageId: '1',
        zoneClimatiqueId: '1',
        mois: 'Juillet',
        expected: 1.98
      },
      {
        label: 'Baie vitrée orientée sud, inclinaison sup75°',
        enumOrientationId: '1',
        enumInclinaisonVitrageId: '3',
        zoneClimatiqueId: '2',
        mois: 'Janvier',
        expected: 1
      },
      {
        label: 'Baie vitrée orientée sud, inclinaison horizontale',
        enumOrientationId: '1',
        enumInclinaisonVitrageId: '4',
        zoneClimatiqueId: '2',
        mois: 'Janvier',
        expected: 0.58
      }
    ])(
      `coefficient pour $label`,
      ({ enumOrientationId, enumInclinaisonVitrageId, zoneClimatiqueId, mois, expected }) => {
        expect(
          tvStore.getCoefficientBaieVitree(
            enumOrientationId,
            enumInclinaisonVitrageId,
            zoneClimatiqueId,
            mois
          )
        ).toMatchObject(expected);
      }
    );
  });

  test('lecture des épaisseurs disponibles pour les coefficients de transmission thermique ug', () => {
    const ug = tvStore.getEpaisseurAvailableForUg();
    expect(ug).toStrictEqual([0, 6, 8, 10, 12, 14, 15, 16, 18, 20]);
  });

  test('lecture des épaisseurs disponibles pour les coefficients de transmission thermique ug', () => {
    const ug = tvStore.getEpaisseurAvailableForUg();
    expect(ug).toStrictEqual([0, 6, 8, 10, 12, 14, 15, 16, 18, 20]);
  });
});
