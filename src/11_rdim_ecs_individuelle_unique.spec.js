import { describe, expect, test } from 'vitest';
import {
  rdimImpliciteEcsIndividuelleUnique,
  reconstituerRdimEcsIndividuelleUnique,
  TOLERANCE_SURFACE_LOGEMENT_TYPE
} from './11_rdim_ecs_individuelle_unique.js';

/**
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - § 11.6, § 11.6.2 et § 17.2.2.3
 * @see Tribu : Calcul_batiment.cs l. 583-588, l. 602-604, l. 1654-1664
 * @see https://github.com/Open3CL/engine/issues/288
 */
describe("Rdim de l'installation ECS individuelle unique d'un immeuble", () => {
  /** Installation ECS décrite pour un logement type : Sh = SH / N, nombre_logement = N */
  const ecs = (de) => [
    {
      donnee_entree: {
        enum_type_installation_id: '1',
        surface_habitable: 64,
        nombre_logement: 10,
        ...de
      }
    }
  ];

  describe('rdimImpliciteEcsIndividuelleUnique', () => {
    test('installation individuelle unique, Sh × N = SH, sans rdim : rdim = nombre_logement', () => {
      // Cas type 2244E3131012H : N = 10
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', ecs(), 640)).toBe(10);
      expect(
        rdimImpliciteEcsIndividuelleUnique(
          'immeuble',
          ecs({ enum_type_installation_id: 1, surface_habitable: '64', nombre_logement: '10' }),
          '640'
        )
      ).toBe(10);
    });

    test('tolérance de 5 % sur Sh × N ≈ SH', () => {
      expect(TOLERANCE_SURFACE_LOGEMENT_TYPE).toBe(0.05);
      // |640 − SH| ≤ 0,05 × SH ⇔ 609,52 ≤ SH ≤ 673,68
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', ecs(), 673)).toBe(10);
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', ecs(), 610)).toBe(10);
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', ecs(), 674)).toBeNull();
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', ecs(), 609)).toBeNull();
    });

    test('installation décrite sur la surface de l’immeuble (Sh = SH) : non concernée', () => {
      expect(
        rdimImpliciteEcsIndividuelleUnique('immeuble', ecs({ surface_habitable: 640 }), 640)
      ).toBeNull();
    });

    test('LICIEL : nombre_logement = 1 → non concerné', () => {
      expect(
        rdimImpliciteEcsIndividuelleUnique(
          'immeuble',
          ecs({ nombre_logement: 1, surface_habitable: 640 }),
          640
        )
      ).toBeNull();
    });

    test('rdim exporté : on conserve la saisie', () => {
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', ecs({ rdim: 4 }), 640)).toBeNull();
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', ecs({ rdim: 1 }), 640)).toBeNull();
    });

    test('installation collective : non concernée', () => {
      expect(
        rdimImpliciteEcsIndividuelleUnique('immeuble', ecs({ enum_type_installation_id: '2' }), 640)
      ).toBeNull();
    });

    test('maison ou appartement : non concerné', () => {
      expect(rdimImpliciteEcsIndividuelleUnique('maison', ecs(), 640)).toBeNull();
      expect(rdimImpliciteEcsIndividuelleUnique('appartement', ecs(), 640)).toBeNull();
    });

    test('plusieurs installations ECS : non concerné (#232)', () => {
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', [...ecs(), ...ecs()], 640)).toBeNull();
    });

    test('données manquantes : non concerné', () => {
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', undefined, 640)).toBeNull();
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', [], 640)).toBeNull();
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', [{}], 640)).toBeNull();
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', ecs(), undefined)).toBeNull();
      expect(rdimImpliciteEcsIndividuelleUnique('immeuble', ecs(), 0)).toBeNull();
      expect(
        rdimImpliciteEcsIndividuelleUnique('immeuble', ecs({ surface_habitable: undefined }), 640)
      ).toBeNull();
      expect(
        rdimImpliciteEcsIndividuelleUnique('immeuble', ecs({ nombre_logement: undefined }), 640)
      ).toBeNull();
    });
  });

  describe('reconstituerRdimEcsIndividuelleUnique', () => {
    test('installation concernée : rdim et flag positionnés', () => {
      const inst = ecs();
      expect(reconstituerRdimEcsIndividuelleUnique('immeuble', inst, 640)).toBe(true);
      expect(inst[0].donnee_entree).toMatchObject({ rdim: 10, rdim_reconstitue: true });
    });

    test('installation non concernée : inchangée', () => {
      const inst = ecs({ nombre_logement: 1 });
      expect(reconstituerRdimEcsIndividuelleUnique('immeuble', inst, 640)).toBe(false);
      expect(inst[0].donnee_entree.rdim).toBeUndefined();
      expect(inst[0].donnee_entree.rdim_reconstitue).toBeUndefined();
    });
  });
});
