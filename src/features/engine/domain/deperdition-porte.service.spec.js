import { DeperditionPorteService } from './deperdition-porte.service.js';
import corpus from '../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../test/test-helpers.js';
import { TvStore } from '../../dpe/infrastructure/tv.store.js';

/** @type {DeperditionPorteService} **/
let service;

describe('Calcul de déperdition des portes', () => {
  beforeEach(() => {
    service = new DeperditionPorteService(new TvStore());
  });

  describe('Determination de uPorte', () => {
    /** @type {Contexte} */
    const ctx = { zoneClimatiqueId: '1' };

    test.each([
      { type: '1', label: 'porte simple en bois porte opaque pleine', uPorteExpected: 3.5 },
      {
        type: '2',
        label: 'porte simple en bois porte avec moins de 30% de vitrage simple',
        uPorteExpected: 4
      },
      {
        type: '3',
        label: 'porte simple en bois porte avec 30-60% de vitrage simple',
        uPorteExpected: 4.5
      },
      { type: '4', label: 'porte simple en bois porte avec double vitrage', uPorteExpected: 3.3 },
      { type: '5', label: 'porte simple en pvc porte opaque pleine', uPorteExpected: 3.5 },
      {
        type: '6',
        label: 'porte simple en pvc porte avec moins de 30% de vitrage simple',
        uPorteExpected: 4
      },
      {
        type: '7',
        label: 'porte simple en pvc porte avec 30-60% de vitrage simple',
        uPorteExpected: 4.5
      },
      { type: '8', label: 'porte simple en pvc porte avec double vitrage', uPorteExpected: 3.3 },

      { type: '9', label: 'porte simple en métal porte opaque pleine', uPorteExpected: 5.8 },
      { type: '10', label: 'porte simple en métal porte avec vitrage simple', uPorteExpected: 5.8 },
      {
        type: '11',
        label: 'porte simple en métal porte avec moins de 30% de double vitrage',
        uPorteExpected: 5.5
      },
      {
        type: '12',
        label: 'porte simple en métal porte avec 30-60% de double vitrage',
        uPorteExpected: 4.8
      },

      { type: '13', label: 'toute menuiserie porte opaque pleine isolée', uPorteExpected: 1.5 },
      { type: '14', label: 'toute menuiserie porte précédée d’un sas', uPorteExpected: 1.5 },
      {
        type: '15',
        label: 'toute menuiserie porte isolée avec double vitrage',
        uPorteExpected: 1.5
      },

      { type: '16', label: 'autre type de porte', uPorteExpected: undefined }
    ])('$label (id:$type)', ({ type, uPorteExpected }) => {
      /** @type {PorteDE} */
      const de = {
        enum_type_porte_id: type
      };

      const di = service.process(ctx, de);
      expect(di.uporte).toBe(uPorteExpected);
    });

    test('autre porte Uporte saisie manuellement ', () => {
      /** @type {PorteDE} */
      const de = {
        enum_type_porte_id: '16',
        enum_methode_saisie_uporte_id: '2',
        uporte_saisi: 1.6
      };

      const di = service.process(ctx, de);
      expect(di.uporte).toBe(de.uporte_saisi);
    });

    test('autre porte Uporte saisie manuellement et justifié', () => {
      /** @type {PorteDE} */
      const de = {
        enum_type_porte_id: '16',
        enum_methode_saisie_uporte_id: '3',
        uporte_saisi: 1.88
      };

      const di = service.process(ctx, de);
      expect(di.uporte).toBe(de.uporte_saisi);
    });
  });

  describe("Test d'intégration de porte", () => {
    test.each(corpus)('vérification des DI des portes pour dpe %s', (ademeId) => {
      const dpeRequest = getAdemeFileJson(ademeId);
      /** @type {Contexte} */
      const ctx = { zoneClimatiqueId: dpeRequest.logement.meteo.enum_zone_climatique_id };
      const portes = dpeRequest.logement.enveloppe.porte_collection?.porte || [];

      portes.forEach((p) => {
        const di = service.process(ctx, p.donnee_entree);
        expect(di.uporte).toBeCloseTo(p.donnee_intermediaire.uporte, 2);
        expect(di.b).toBeCloseTo(p.donnee_intermediaire.b, 2);
      });
    });
  });
});
