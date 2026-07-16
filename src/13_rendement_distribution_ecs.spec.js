import { describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler le module :
 * - `enums.type_installation` : libellé du type d'installation dérivé de l'identifiant d'entrée.
 * La fonction actuelle se contente de résoudre le type d'installation sans modifier l'objet ECS ;
 * ces tests figent ce contrat (aucune mutation, retour indéfini) pour détecter toute régression.
 */
vi.mock('./enums.js', () => ({
  default: {
    type_installation: { 1: 'installation individuelle', 2: 'installation collective' }
  }
}));

const { default: rendement_distribution_ecs } = await import('./13_rendement_distribution_ecs.js');

/**
 * 13. Rendement de distribution de l'ECS
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13
 */
describe('rendement_distribution_ecs', () => {
  test('ne retourne aucune valeur (fonction sans effet de sortie)', () => {
    const ecs = { donnee_entree: { enum_type_installation_id: '1' } };
    expect(rendement_distribution_ecs(ecs)).toBeUndefined();
  });

  test('ne mute pas les données d’entrée de l’installation ECS', () => {
    const de = { enum_type_installation_id: '2' };
    const ecs = { donnee_entree: de };
    rendement_distribution_ecs(ecs);
    expect(ecs.donnee_entree).toEqual({ enum_type_installation_id: '2' });
  });

  test('accepte un type d’installation inconnu sans lever d’erreur', () => {
    const ecs = { donnee_entree: { enum_type_installation_id: '999' } };
    expect(() => rendement_distribution_ecs(ecs)).not.toThrow();
  });
});
