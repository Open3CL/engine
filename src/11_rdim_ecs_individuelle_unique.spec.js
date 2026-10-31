import { describe, expect, test } from 'vitest';
import {
  rdimImpliciteEcsIndividuelleUnique,
  rdimsImplicitesEcsIndividuellesMultiples,
  reconstituerRdimEcsIndividuelleUnique,
  reconstituerRdimEcsIndividuellesMultiples,
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

/**
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - § 11.4 et § 17.1.3.2
 * @see Tribu : Calcul_batiment.cs l. 581-588 et l. 1660-1662 ; Calcul_installation_ECS.cs l. 75
 */
describe("Rdim des installations ECS individuelles multiples d'un immeuble", () => {
  /** Installation ECS individuelle décrite pour un logement type */
  const inst = (surface_habitable, nombre_logement, de = {}) => ({
    donnee_entree: { enum_type_installation_id: '1', surface_habitable, nombre_logement, ...de }
  });
  /** Cas type 2244E3039157K : 48,82 × 2 + 78,09 × 6 = 566,18 ≈ SH = 566,16 */
  const ecs = () => [inst(48.82, 2), inst(78.09, 6)];

  describe('rdimsImplicitesEcsIndividuellesMultiples', () => {
    test('installations individuelles, Σ Sh × N = SH, sans rdim : rdim_i = nombre_logement_i', () => {
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', ecs(), 566.16)).toEqual([2, 6]);
      expect(
        rdimsImplicitesEcsIndividuellesMultiples(
          'immeuble',
          [
            inst('48.82', '2', { enum_type_installation_id: 1 }),
            inst('78.09', '6', { enum_type_installation_id: 1 })
          ],
          '566.16'
        )
      ).toEqual([2, 6]);
    });

    test('nombre_logement absent sur une installation : rdim = 1 pour celle-ci', () => {
      // 100 × 4 + 50 × 1 = 450
      expect(
        rdimsImplicitesEcsIndividuellesMultiples(
          'immeuble',
          [inst(100, 4), inst(50, undefined)],
          450
        )
      ).toEqual([4, 1]);
    });

    test('tolérance de 5 % sur Σ Sh × N ≈ SH', () => {
      // Σ = 100 × 4 + 50 × 2 = 500 ; |500 − SH| ≤ 0,05 × SH ⇔ 476,19 ≤ SH ≤ 526,31
      const deux = () => [inst(100, 4), inst(50, 2)];
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', deux(), 526)).toEqual([4, 2]);
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', deux(), 477)).toEqual([4, 2]);
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', deux(), 527)).toBeNull();
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', deux(), 476)).toBeNull();
    });

    test('surfaces exportées comme surface totale desservie (Σ Sh = SH) : non concerné', () => {
      // Cas type 2224E1374434V : 74,4 × 3 + 31 × 1 = 254,2 ≠ SH = 105,4 = Σ Sh
      expect(
        rdimsImplicitesEcsIndividuellesMultiples('immeuble', [inst(74.4, 3), inst(31, 1)], 105.4)
      ).toBeNull();
    });

    test('tous les nombre_logement à 1 (LICIEL) : non concerné', () => {
      expect(
        rdimsImplicitesEcsIndividuellesMultiples('immeuble', [inst(60, 1), inst(40, 1)], 100)
      ).toBeNull();
    });

    test('un rdim exporté sur une installation : on conserve la saisie', () => {
      expect(
        rdimsImplicitesEcsIndividuellesMultiples(
          'immeuble',
          [inst(48.82, 2, { rdim: 2 }), inst(78.09, 6)],
          566.16
        )
      ).toBeNull();
    });

    test('une installation collective : non concerné', () => {
      expect(
        rdimsImplicitesEcsIndividuellesMultiples(
          'immeuble',
          [inst(48.82, 2), inst(78.09, 6, { enum_type_installation_id: '2' })],
          566.16
        )
      ).toBeNull();
    });

    test('maison ou appartement : non concerné', () => {
      expect(rdimsImplicitesEcsIndividuellesMultiples('maison', ecs(), 566.16)).toBeNull();
      expect(rdimsImplicitesEcsIndividuellesMultiples('appartement', ecs(), 566.16)).toBeNull();
    });

    test('installation unique : non concerné (cf. rdimImpliciteEcsIndividuelleUnique)', () => {
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', [inst(64, 10)], 640)).toBeNull();
    });

    test('données manquantes ou invalides : non concerné', () => {
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', undefined, 566.16)).toBeNull();
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', [], 566.16)).toBeNull();
      expect(
        rdimsImplicitesEcsIndividuellesMultiples('immeuble', [inst(48.82, 2), {}], 566.16)
      ).toBeNull();
      expect(
        rdimsImplicitesEcsIndividuellesMultiples('immeuble', [inst(48.82, 2), null], 566.16)
      ).toBeNull();
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', ecs(), undefined)).toBeNull();
      expect(rdimsImplicitesEcsIndividuellesMultiples('immeuble', ecs(), 0)).toBeNull();
      expect(
        rdimsImplicitesEcsIndividuellesMultiples(
          'immeuble',
          [inst(48.82, 2), inst(undefined, 6)],
          566.16
        )
      ).toBeNull();
      expect(
        rdimsImplicitesEcsIndividuellesMultiples('immeuble', [inst(100, 4), inst(50, -2)], 300)
      ).toBeNull();
    });
  });

  describe('reconstituerRdimEcsIndividuellesMultiples', () => {
    test('installations concernées : rdim et flag positionnés sur chacune', () => {
      const installations = ecs();
      expect(reconstituerRdimEcsIndividuellesMultiples('immeuble', installations, 566.16)).toBe(
        true
      );
      expect(installations[0].donnee_entree).toMatchObject({ rdim: 2, rdim_reconstitue: true });
      expect(installations[1].donnee_entree).toMatchObject({ rdim: 6, rdim_reconstitue: true });
    });

    test('installations non concernées : inchangées', () => {
      const installations = [inst(60, 1), inst(40, 1)];
      expect(reconstituerRdimEcsIndividuellesMultiples('immeuble', installations, 100)).toBe(false);
      installations.forEach((i) => {
        expect(i.donnee_entree.rdim).toBeUndefined();
        expect(i.donnee_entree.rdim_reconstitue).toBeUndefined();
      });
    });
  });
});
