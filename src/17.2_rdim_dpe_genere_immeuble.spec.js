import { describe, expect, test } from 'vitest';
import {
  rdimImplicite,
  reconstituerRdimDpeGenereImmeuble,
  SEUIL_RDIM_IMPLICITE
} from './17.2_rdim_dpe_genere_immeuble.js';

/**
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - § 17.2.2.2.2 et § 17.2.2.3.1
 * @see https://github.com/Open3CL/engine/issues/287
 */
describe('Reconstitution du rdim des DPE appartement générés depuis un DPE immeuble', () => {
  describe('rdimImplicite', () => {
    test('installation individuelle décrite sur la surface de l’immeuble : rdim = na × Sh_i / SH', () => {
      // Cas 2694E0022738J : na = 62, Sh_i = SH = 4 094 m² → rdim = 62
      expect(rdimImplicite({ enum_type_installation_id: '1', rdim: 1 }, 4094, 62, 4094)).toBe(62);
      expect(rdimImplicite({ enum_type_installation_id: '1' }, 2047, '62', '4094')).toBe(31);
    });

    test('installation collective : non concernée', () => {
      expect(rdimImplicite({ enum_type_installation_id: '2', rdim: 1 }, 4094, 62, 4094)).toBeNull();
    });

    test('rdim exporté différent de 1 : on conserve la saisie', () => {
      expect(rdimImplicite({ enum_type_installation_id: '1', rdim: 4 }, 4094, 62, 4094)).toBeNull();
    });

    test('ratio na × Sh_i / SH inférieur ou égal au seuil : installation d’un seul logement', () => {
      expect(SEUIL_RDIM_IMPLICITE).toBe(1.5);
      // 10 × 60 / 600 = 1 → logement seul
      expect(rdimImplicite({ enum_type_installation_id: '1' }, 60, 10, 600)).toBeNull();
      // 10 × 90 / 600 = 1,5 → seuil non dépassé
      expect(rdimImplicite({ enum_type_installation_id: '1' }, 90, 10, 600)).toBeNull();
      // 10 × 91 / 600 > 1,5
      expect(rdimImplicite({ enum_type_installation_id: '1' }, 91, 10, 600)).toBeCloseTo(
        1.516666667,
        9
      );
    });

    test('données manquantes ou un seul logement : non concerné', () => {
      const de = { enum_type_installation_id: '1' };
      expect(rdimImplicite(undefined, 100, 10, 100)).toBeNull();
      expect(rdimImplicite(de, 100, 1, 100)).toBeNull();
      expect(rdimImplicite(de, 100, undefined, 100)).toBeNull();
      expect(rdimImplicite(de, 100, 10, 0)).toBeNull();
      expect(rdimImplicite(de, undefined, 10, 100)).toBeNull();
    });
  });

  describe('reconstituerRdimDpeGenereImmeuble', () => {
    const cg = { nombre_appartement: 62, surface_habitable_immeuble: 4094 };
    const ch = (surface, type = '1') => ({
      donnee_entree: { enum_type_installation_id: type, rdim: 1, surface_chauffee: surface }
    });
    const ecs = (surface, type = '1') => ({
      donnee_entree: { enum_type_installation_id: type, rdim: 1, surface_habitable: surface }
    });

    test('chauffage et ECS décrits à l’échelle de l’immeuble : rdim reconstitué sur les deux', () => {
      const instCh = [ch(4094)];
      const instEcs = [ecs(4094)];
      expect(reconstituerRdimDpeGenereImmeuble(cg, instCh, instEcs)).toEqual({
        ch: true,
        ecs: true
      });
      expect(instCh[0].donnee_entree).toMatchObject({ rdim: 62, rdim_reconstitue: true });
      expect(instEcs[0].donnee_entree).toMatchObject({ rdim: 62, rdim_reconstitue: true });
    });

    test('ECS seule à l’échelle de l’immeuble : rdim reconstitué sur l’ECS uniquement', () => {
      const instCh = [ch(63.8)];
      const instEcs = [ecs(4094)];
      expect(reconstituerRdimDpeGenereImmeuble(cg, instCh, instEcs)).toEqual({
        ch: false,
        ecs: true
      });
      expect(instCh[0].donnee_entree.rdim_reconstitue).toBeUndefined();
      expect(instEcs[0].donnee_entree).toMatchObject({ rdim: 62, rdim_reconstitue: true });
    });

    test('seules les installations concernées sont modifiées', () => {
      const instCh = [ch(4094), ch(4094, '2'), ch(63.8)];
      expect(reconstituerRdimDpeGenereImmeuble(cg, instCh, undefined)).toEqual({
        ch: true,
        ecs: false
      });
      expect(instCh[0].donnee_entree.rdim_reconstitue).toBe(true);
      expect(instCh[1].donnee_entree.rdim_reconstitue).toBeUndefined();
      expect(instCh[2].donnee_entree.rdim_reconstitue).toBeUndefined();
    });

    test('collections absentes', () => {
      expect(reconstituerRdimDpeGenereImmeuble(undefined, undefined, undefined)).toEqual({
        ch: false,
        ecs: false
      });
    });
  });
});
