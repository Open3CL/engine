import { TvStore } from './tv.store.js';
import { tv } from '../../../utils.js';
import { beforeEach, describe, expect, test } from 'vitest';
import { TypeHabitation } from '../domain/models/type-habitation.model.js';

/** @type {TvStore} **/
let tvStore;

describe('Lecture des tables de valeurs', () => {
  beforeEach(() => {
    tvStore = new TvStore();
  });

  describe('lecture des valeurs de b', () => {
    test.each([
      { enumTypeAdjacenceId: '1', label: 'extérieur', bExpected: 1 },
      { enumTypeAdjacenceId: '2', label: 'paroi enterrée', bExpected: 1 },
      { enumTypeAdjacenceId: '3', label: 'vide sanitaire', bExpected: 1 },
      {
        enumTypeAdjacenceId: '4',
        label: "bâtiment ou local à usage autre que d'habitation",
        bExpected: 0.2
      },
      { enumTypeAdjacenceId: '5', label: 'terre-plein', bExpected: 1 },
      { enumTypeAdjacenceId: '6', label: 'sous-sol non chauffé', bExpected: 1 },
      {
        enumTypeAdjacenceId: '7',
        enumCfgIsolationLncId: '1',
        uVue: 3,
        label: 'locaux non chauffés non accessible',
        bExpected: 0.95
      },
      {
        enumTypeAdjacenceId: '22',
        label: "local non déperditif (local à usage d'habitation chauffé)",
        bExpected: 0
      },
      {
        enumTypeAdjacenceId: '8',
        uVue: 3,
        enumCfgIsolationLncId: '2',
        rAiuAue: 0.1,
        label: 'garage',
        bExpected: 0.9
      }
    ])(
      'b pour $label (id:$enumTypeAdjacenceId)',
      ({
        enumTypeAdjacenceId,
        uVue = undefined,
        enumCfgIsolationLncId = undefined,
        rAiuAue = undefined,
        bExpected
      }) => {
        const b = tvStore.getB(enumTypeAdjacenceId, uVue, enumCfgIsolationLncId, rAiuAue);
        expect(b).toBe(bExpected);
      }
    );
  });

  describe('lecture des valeurs de uVue', () => {
    test.each([
      { enumTypeAdjacenceId: '1', label: 'extérieur', expected: undefined },
      { enumTypeAdjacenceId: '2', label: 'paroi enterrée', expected: undefined },
      { enumTypeAdjacenceId: '3', label: 'vide sanitaire', expected: undefined },
      {
        enumTypeAdjacenceId: '4',
        label: "bâtiment ou local à usage autre que d'habitation",
        expected: undefined
      },
      { enumTypeAdjacenceId: '5', label: 'terre-plein', expected: undefined },
      { enumTypeAdjacenceId: '6', label: 'sous-sol non chauffé', expected: undefined },
      {
        enumTypeAdjacenceId: '7',
        label: 'locaux non chauffés non accessible',
        expected: undefined
      },
      { enumTypeAdjacenceId: '8', label: 'garage', expected: 3 },
      { enumTypeAdjacenceId: '9', label: 'cellier', expected: 3 },
      {
        enumTypeAdjacenceId: '10',
        label: 'espace tampon solarisé (véranda,loggia fermée)',
        expected: undefined
      },
      { enumTypeAdjacenceId: '11', label: 'comble fortement ventilé', expected: 9 },
      { enumTypeAdjacenceId: '12', label: 'comble faiblement ventilé', expected: 3 },
      { enumTypeAdjacenceId: '13', label: 'comble très faiblement ventilé', expected: 0.3 },
      {
        enumTypeAdjacenceId: '14',
        label: "circulation sans ouverture directe sur l'extérieur",
        expected: 0
      },
      {
        enumTypeAdjacenceId: '15',
        label: "circulation avec ouverture directe sur l'extérieur",
        expected: 0.3
      },
      {
        enumTypeAdjacenceId: '16',
        label: 'circulation avec bouche ou gaine de désenfumage ouverte en permanence',
        expected: 3
      },
      {
        enumTypeAdjacenceId: '17',
        label: "hall d'entrée avec dispositif de fermeture automatique",
        expected: 0.3
      },
      {
        enumTypeAdjacenceId: '18',
        label: "hall d'entrée sans dispositif de fermeture automatique",
        expected: 3
      },
      { enumTypeAdjacenceId: '19', label: 'garage privé collectif', expected: 3 },
      {
        enumTypeAdjacenceId: '20',
        label: "local tertiaire à l'intérieur de l'immeuble en contact avec l'appartement",
        expected: undefined
      },
      { enumTypeAdjacenceId: '21', label: 'autres dépendances', expected: 3 },
      {
        enumTypeAdjacenceId: '22',
        label: "local non déperditif (local à usage d'habitation chauffé)",
        expected: undefined
      }
    ])('uVue pour $label (id:$enumTypeAdjacenceId)', ({ enumTypeAdjacenceId, expected }) => {
      const uVue = tvStore.getUVue(enumTypeAdjacenceId);
      expect(uVue).toBe(expected);
    });
  });

  describe('lecture des valeurs de umur0', () => {
    test.each([
      { label: 'mur inconnu', enumMateriauxStructureMurId: '1', expected: 2.5 },
      {
        label: "Murs en pierre de taille et moellons constitué d'un seul matériaux 18cm",
        enumMateriauxStructureMurId: '2',
        epaisseurStructure: 18,
        expected: 3.2
      },
      {
        label: "Murs en pierre de taille et moellons constitué d'un seul matériaux 37cm",
        enumMateriauxStructureMurId: '2',
        epaisseurStructure: 37,
        expected: 2.45
      },
      {
        label: "Murs en pierre de taille et moellons constitué d'un seul matériaux 30cm",
        enumMateriauxStructureMurId: '2',
        epaisseurStructure: 30,
        expected: 2.65
      },
      {
        label: "Murs en pierre de taille et moellons constitué d'un seul matériaux 39cm",
        enumMateriauxStructureMurId: '2',
        epaisseurStructure: 39,
        expected: 2.45
      },
      {
        label: "Murs en pierre de taille et moellons constitué d'un seul matériaux 98cm",
        enumMateriauxStructureMurId: '2',
        epaisseurStructure: 98,
        expected: 1.5
      },
      {
        label: 'Murs en pan de bois sans remplissage tout venant',
        enumMateriauxStructureMurId: '5',
        epaisseurStructure: 12,
        expected: 2.7
      }
    ])(
      'umur pour $label (id:$enumMateriauxStructureMurId)',
      ({ enumMateriauxStructureMurId, epaisseurStructure, expected }) => {
        const umur0 = tvStore.getUmur0(enumMateriauxStructureMurId, epaisseurStructure);
        expect(umur0).toBe(expected);
      }
    );

    test('pas de valeur de umur0', () => {
      const umur0 = tvStore.getUmur0('0');
      expect(umur0).toBeUndefined();
    });
  });

  describe('lecture des valeurs de umur', () => {
    test.each([
      {
        label: 'mur année de construction avant 1948 zone climatique h1a',
        enumPeriodeConstructionId: '1',
        enumZoneClimatiqueId: '1',
        expected: 2.5
      },
      {
        label: 'mur année de construction 1983-1988 zone climatique h1a',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '1',
        expected: 0.8
      },
      {
        label: 'mur année de construction 1983-1988 zone climatique h2a',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '4',
        expected: 0.84
      },
      {
        label: 'mur année de construction 1983-1988 zone climatique h3',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '8',
        effetJoule: false,
        expected: 0.89
      },
      {
        label: 'mur année de construction 1983-1988 zone climatique h1a',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '1',
        effetJoule: true,
        expected: 0.7
      },
      {
        label: 'mur année de construction 1983-1988 zone climatique h2a',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '4',
        effetJoule: true,
        expected: 0.74
      },
      {
        label: 'mur année de construction 1983-1988 zone climatique h3',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '8',
        effetJoule: true,
        expected: 0.78
      }
    ])(
      'umur pour $label',
      ({ enumPeriodeConstructionId, enumZoneClimatiqueId, effetJoule, expected }) => {
        const umur = tvStore.getUmur(enumPeriodeConstructionId, enumZoneClimatiqueId, effetJoule);
        expect(umur).toBe(expected);
      }
    );

    test('pas de valeur de umur', () => {
      const umur = tvStore.getUmur('0', '1', true);
      expect(umur).toBeUndefined();
    });
  });

  describe('lecture des valeurs de upb0', () => {
    test.each([
      { enumTypePlancherBasId: '1', expected: 2 },
      { enumTypePlancherBasId: '2', expected: 1.45 },
      { enumTypePlancherBasId: '3', expected: 1.45 },
      { enumTypePlancherBasId: '4', expected: 1.1 },
      { enumTypePlancherBasId: '5', expected: 1.6 },
      { enumTypePlancherBasId: '6', expected: 1.1 },
      { enumTypePlancherBasId: '7', expected: 1.75 },
      { enumTypePlancherBasId: '8', expected: 0.8 },
      { enumTypePlancherBasId: '9', expected: 2 },
      { enumTypePlancherBasId: '10', expected: 1.6 },
      { enumTypePlancherBasId: '11', expected: 2 },
      { enumTypePlancherBasId: '12', expected: 0.45 }
    ])(
      'upb0 pour type plancher bas $enumTypePlancherBasId',
      ({ enumTypePlancherBasId, expected }) => {
        const upb0 = tvStore.getUpb0(enumTypePlancherBasId);
        expect(upb0).toBe(expected);
      }
    );

    test('pas de valeur de upb0', () => {
      const upb0 = tvStore.getUpb0('0');
      expect(upb0).toBeUndefined();
    });
  });

  describe('lecture des valeurs de upb', () => {
    test.each([
      {
        label: 'pb année de construction avant 1948 zone climatique h1a',
        enumPeriodeConstructionId: '1',
        enumZoneClimatiqueId: '1',
        expected: 2
      },
      {
        label: 'pb année de construction 1983-1988 zone climatique h1a',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '1',
        expected: 0.8
      },
      {
        label: 'pb année de construction 1983-1988 zone climatique h2a',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '4',
        expected: 0.74
      },
      {
        label: 'pb année de construction 1983-1988 zone climatique h3',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '8',
        effetJoule: false,
        expected: 0.89
      },
      {
        label: 'pb année de construction 1983-1988 zone climatique h1a',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '1',
        effetJoule: true,
        expected: 0.55
      },
      {
        label: 'pb année de construction 1983-1988 zone climatique h2a',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '4',
        effetJoule: true,
        expected: 0.58
      },
      {
        label: 'pb année de construction 1983-1988 zone climatique h3',
        enumPeriodeConstructionId: '5',
        enumZoneClimatiqueId: '8',
        effetJoule: true,
        expected: 0.78
      }
    ])(
      'upb pour $label',
      ({ enumPeriodeConstructionId, enumZoneClimatiqueId, effetJoule, expected }) => {
        const upb = tvStore.getUpb(enumPeriodeConstructionId, enumZoneClimatiqueId, effetJoule);
        expect(upb).toBe(expected);
      }
    );

    test('pas de valeur de upb', () => {
      const upb = tvStore.getUpb('0', '1', true);
      expect(upb).toBeUndefined();
    });
  });

  describe('lecture des valeurs de ue par upb', () => {
    test.each([
      {
        label: 'ue non extrapolé (upb = min des ue disponibles)',
        enumTypeAdjacenceId: '3',
        enumPeriodeConstructionId: '1',
        dsp: 4,
        upb: 0.31,
        expected: 0.25
      },
      {
        label: 'ue non extrapolé (upb = max des ue disponibles)',
        enumTypeAdjacenceId: '3',
        enumPeriodeConstructionId: '1',
        dsp: 4,
        upb: 3.33,
        expected: 0.43
      },
      {
        label: 'ue extrapolé',
        enumTypeAdjacenceId: '3',
        enumPeriodeConstructionId: '1',
        dsp: 4,
        upb: 3,
        expected: 0.42
      },
      {
        label: 'ue extrapolé',
        enumTypeAdjacenceId: '3',
        enumPeriodeConstructionId: '1',
        dsp: 4,
        upb: 3,
        expected: 0.42
      }
    ])(
      'ue pour $label',
      ({ enumTypeAdjacenceId, enumPeriodeConstructionId, dsp, upb, expected }) => {
        const ue = tvStore.getUeByUpd(enumTypeAdjacenceId, enumPeriodeConstructionId, dsp, upb);
        expect(ue).toBeCloseTo(expected);
      }
    );

    test('pas de valeur de ue', () => {
      const ue = tvStore.getUeByUpd('0', '1', 0, 0);
      expect(ue).toBeUndefined();
    });
  });

  describe('lecture des valeurs de uph0', () => {
    test.each([
      { enumTypePlancherHautId: '1', expected: 2.5 },
      { enumTypePlancherHautId: '2', expected: 1.45 },
      { enumTypePlancherHautId: '3', expected: 1.45 },
      { enumTypePlancherHautId: '4', expected: 1.2 },
      { enumTypePlancherHautId: '5', expected: 2.5 },
      { enumTypePlancherHautId: '6', expected: 2.5 },
      { enumTypePlancherHautId: '7', expected: 1.2 },
      { enumTypePlancherHautId: '8', expected: 2.5 },
      { enumTypePlancherHautId: '9', expected: 2 },
      { enumTypePlancherHautId: '10', expected: 2.3 },
      { enumTypePlancherHautId: '11', expected: 2.5 },
      { enumTypePlancherHautId: '12', expected: 2.5 },
      { enumTypePlancherHautId: '13', expected: 0.24 },
      { enumTypePlancherHautId: '14', expected: 2.5 },
      { enumTypePlancherHautId: '15', expected: undefined },
      { enumTypePlancherHautId: '16', expected: 2.5 }
    ])(
      'uph0 pour type plancher Haut $enumTypePlancherHautId',
      ({ enumTypePlancherHautId, expected }) => {
        const uph0 = tvStore.getUph0(enumTypePlancherHautId);
        expect(uph0).toBe(expected);
      }
    );

    test('pas de valeur de uph0', () => {
      const uph0 = tvStore.getUph0('0');
      expect(uph0).toBeUndefined();
    });
  });

  describe('lecture des valeurs de uph', () => {
    test.each([
      {
        enumPeriodeConstructionId: '1',
        typeToiture: 'terrasse',
        enumZoneClimatiqueId: '1',
        effetJoule: false,
        expected: 2.5
      },
      {
        enumPeriodeConstructionId: '4',
        typeToiture: 'combles',
        enumZoneClimatiqueId: '4',
        effetJoule: true,
        expected: 0.42
      },
      {
        enumPeriodeConstructionId: '8',
        typeToiture: 'combles',
        enumZoneClimatiqueId: '6',
        effetJoule: true,
        expected: 0.2
      }
    ])(
      'uph pour type plancher Haut',
      ({ enumPeriodeConstructionId, typeToiture, enumZoneClimatiqueId, effetJoule, expected }) => {
        expect(
          tvStore.getUph(enumPeriodeConstructionId, typeToiture, enumZoneClimatiqueId, effetJoule)
        ).toBe(expected);
      }
    );

    test('pas de valeur de uph', () => {
      const uph = tvStore.getUph('0', 'terrasse', '1', false);
      expect(uph).toBeUndefined();
    });
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
        vitrageVir: true,
        expected: 1.2
      },
      {
        label: "Double vitrage vertical non traité avec lame d'air argon 14mm",
        enumTypeVitrageId: '2',
        epaisseurLame: 14,
        enumTypeGazLameId: '2',
        enumInclinaisonVitrageId: '1',
        vitrageVir: false,
        expected: 2.8
      },
      {
        label: "Double vitrage horizontal non traité avec lame d'air inconnu 15mm",
        enumTypeVitrageId: '2',
        epaisseurLame: 15,
        enumTypeGazLameId: '3',
        enumInclinaisonVitrageId: '4',
        vitrageVir: false,
        expected: 2.9
      },
      {
        label: "Double vitrage horizontal non traité avec lame d'air inconnu 12mm",
        enumTypeVitrageId: '2',
        epaisseurLame: 12,
        enumTypeGazLameId: '3',
        enumInclinaisonVitrageId: '4',
        vitrageVir: false,
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

    test('pas de valeur de ug', () => {
      const ug = tvStore.getUg('0', '0', '0', false, 0);
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs de debits_ventilation', () => {
    test.each([
      {
        label: 'Ventilation par ouverture des fenêtres',
        enumTypeVentilation: '1',
        expected: {
          qvarep_conv: '1.2',
          qvasouf_conv: '1.2',
          smea_conv: '0'
        }
      },
      {
        label: 'VMC SF Auto réglable de 2001 à 2012',
        enumTypeVentilation: '5',
        expected: {
          qvarep_conv: '1.5',
          qvasouf_conv: '0',
          smea_conv: '2'
        }
      }
    ])(`debitsVentilation pour ventilation $label`, ({ enumTypeVentilation, expected }) => {
      expect(tvStore.getDebitsVentilation(enumTypeVentilation)).toMatchObject(expected);
    });

    test('pas de valeur de debits_ventilation', () => {
      const ug = tvStore.getDebitsVentilation('0');
      expect(ug).toBeUndefined();
    });
  });

  describe('lecture des valeurs de q4paConv', () => {
    test.each([
      {
        label: 'Ventilation avant 1948, appartement',
        periodConstruction: '1',
        typeHabitation: TypeHabitation.APPARTEMENT,
        isolationSurface: '0',
        expected: {
          q4pa_conv: '4.6'
        }
      },
      {
        label: 'Ventilation avant 1948, appartement',
        periodConstruction: '1',
        typeHabitation: TypeHabitation.APPARTEMENT,
        isolationSurface: undefined,
        expected: {
          q4pa_conv: '4.6'
        }
      },
      {
        label: 'Ventilation 1948-1974, maison',
        periodConstruction: '2',
        typeHabitation: TypeHabitation.MAISON,
        isolationSurface: undefined,
        expected: {
          q4pa_conv: '2.2'
        }
      },
      {
        label: 'Ventilation 1948-1974, maison surfaces isolées',
        periodConstruction: '2',
        typeHabitation: TypeHabitation.MAISON,
        isolationSurface: '1',
        expected: {
          q4pa_conv: '1.9'
        }
      },
      {
        label: 'Ventilation avant 1948, maison avec joints',
        periodConstruction: '1',
        typeHabitation: TypeHabitation.MAISON,
        isolationSurface: undefined,
        presenceJointsMenuiserie: '1',
        expected: {
          q4pa_conv: '2.5'
        }
      },
      {
        label: 'Ventilation avant 1948, maison avec joints',
        periodConstruction: '1',
        typeHabitation: TypeHabitation.MAISON,
        isolationSurface: '0',
        presenceJointsMenuiserie: '1',
        expected: {
          q4pa_conv: '2.5'
        }
      }
    ])(
      `q4paConv pour ventilation $label`,
      ({
        periodConstruction,
        typeHabitation,
        isolationSurface,
        presenceJointsMenuiserie,
        expected
      }) => {
        expect(
          tvStore.getQ4paConv(
            periodConstruction,
            typeHabitation,
            isolationSurface,
            presenceJointsMenuiserie
          )
        ).toMatchObject(expected);
      }
    );

    test('pas de valeur de debits_ventilation', () => {
      const ug = tvStore.getQ4paConv('2', TypeHabitation.MAISON, '0', '1');
      expect(ug).toBeUndefined();
    });
  });

  describe.skip('Benchmark b', () => {
    test('reworked', () => {
      for (let i = 0; i < 1000; i++) {
        const b = tvStore.getB('8');
        expect(b).toBe(1);
      }
    });

    test('legacy', () => {
      const matcher = {
        enum_type_adjacence_id: '8'
      };

      for (let i = 0; i < 1000; i++) {
        const result = tv('coef_reduction_deperdition', matcher);
        expect(result.b).toBe('1');
      }
    });
  });

  describe.skip('Benchmark uVue', () => {
    test('reworked', () => {
      for (let i = 0; i < 1000; i++) {
        const uVue = tvStore.getUVue('8');
        expect(uVue).toBe(3);
      }
    });

    test('legacy', () => {
      const matcher = {
        enum_type_adjacence_id: '8'
      };

      for (let i = 0; i < 1000; i++) {
        const result = tv('uvue', matcher);
        expect(result.uvue).toBe('3');
      }
    });
  });
});
