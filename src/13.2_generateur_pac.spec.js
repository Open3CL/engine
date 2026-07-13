import { describe, expect, test } from 'vitest';

/**
 * Ce module ne dépend d'aucune table de valeurs ni d'aucun enum : la logique est
 * entièrement déterminée par les données d'entrée. Aucun mock n'est donc nécessaire.
 */
const { updateGenerateurPacs } = await import('./13.2_generateur_pac.js');

/**
 * 13.2 - Substitution des générateurs "autre système thermodynamique" par un CET
 * sur air ambiant équivalent selon la période d'installation.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2
 */
describe('updateGenerateurPacs - substitution des générateurs thermodynamiques', () => {
  test("aucune période d'installation renseignée : aucune modification", () => {
    const de = { enum_type_generateur_ecs_id: '82' };
    updateGenerateurPacs({}, de, 'ecs');
    expect(de.enum_type_generateur_ecs_id).toBe('82');
  });

  test.each([
    ['1', '10'],
    ['2', '11'],
    ['3', '12']
  ])(
    'ECS type 82 (autre système thermodynamique électrique), période %s : générateur remplacé par %s',
    (periode, attendu) => {
      const de = {
        enum_type_generateur_ecs_id: '82',
        enum_periode_installation_ecs_thermo_id: periode
      };
      updateGenerateurPacs({}, de, 'ecs');
      expect(de.enum_type_generateur_ecs_id).toBe(attendu);
    }
  );

  test('ECS type 82 avec période inconnue : type conservé tel quel', () => {
    const de = {
      enum_type_generateur_ecs_id: '82',
      enum_periode_installation_ecs_thermo_id: '9'
    };
    updateGenerateurPacs({}, de, 'ecs');
    expect(de.enum_type_generateur_ecs_id).toBe('82');
  });

  test('ECS type différent de 82 : aucune substitution même avec une période', () => {
    const de = {
      enum_type_generateur_ecs_id: '50',
      enum_periode_installation_ecs_thermo_id: '1'
    };
    updateGenerateurPacs({}, de, 'ecs');
    expect(de.enum_type_generateur_ecs_id).toBe('50');
  });

  test('type ch avec une période : la substitution ECS ne s’applique pas', () => {
    const de = {
      enum_type_generateur_ch_id: '82',
      enum_periode_installation_ecs_thermo_id: '1'
    };
    updateGenerateurPacs({}, de, 'ch');
    // La branche de substitution est réservée au type 'ecs' : valeur inchangée
    expect(de.enum_type_generateur_ch_id).toBe('82');
  });
});
