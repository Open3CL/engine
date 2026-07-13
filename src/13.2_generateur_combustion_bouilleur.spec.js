import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendance mockée : `getFicheTechnique` (import par défaut), qui fournit l'année
 * d'installation du poêle bouilleur. On contrôle sa valeur de retour uniquement.
 */
vi.mock('./ficheTechnique.js', () => ({
  default: vi.fn()
}));

const { updateGenerateurBouilleurs } = await import('./13.2_generateur_combustion_bouilleur.js');
const { default: getFicheTechnique } = await import('./ficheTechnique.js');

beforeEach(() => {
  vi.mocked(getFicheTechnique).mockReset();
});

/**
 * 13.1 - Les poêles à bois bouilleur sont assimilés à des chaudières bois de la
 * période correspondante.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.1
 */
describe('updateGenerateurBouilleurs - substitution par une chaudière bois équivalente', () => {
  test('type non concerné : aucune substitution', () => {
    getFicheTechnique.mockReturnValue(undefined);
    const de = { enum_type_generateur_ch_id: '90' };
    updateGenerateurBouilleurs({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('90');
  });

  test('sans fiche technique : période par défaut 2004-2012 (ch, bûche 48 -> 58)', () => {
    getFicheTechnique.mockReturnValue(undefined);
    const de = { enum_type_generateur_ch_id: '48' };
    updateGenerateurBouilleurs({}, de, 'ch');
    // Valeur par défaut : chaudière bois 2004-2012 (values[2004])
    expect(de.enum_type_generateur_ch_id).toBe('58');
  });

  test('fiche "avant 1948" : chaudière bois la plus ancienne (ch, bûche 48 -> 55)', () => {
    getFicheTechnique.mockReturnValue({ valeur: 'avant 1948' });
    const de = { enum_type_generateur_ch_id: '48' };
    updateGenerateurBouilleurs({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('55');
  });

  test.each([
    ['2020', '61'], // >= 2019
    ['2018', '60'], // >= 2018
    ['2015', '59'], // >= 2013
    ['2005', '58'], // >= 2004
    ['1996', '57'], // >= 1995
    ['1980', '56'], // >= 1978
    ['1950', '55'] // >= 1948
  ])('année %s : seuil de période appliqué (ch, bûche 48 -> %s)', (annee, attendu) => {
    getFicheTechnique.mockReturnValue({ valeur: annee });
    const de = { enum_type_generateur_ch_id: '48' };
    updateGenerateurBouilleurs({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe(attendu);
  });

  test('type ECS (granulés 115) : utilise la table ECS des chaudières bois', () => {
    getFicheTechnique.mockReturnValue({ valeur: '2016' });
    const de = { enum_type_generateur_ecs_id: '115' };
    updateGenerateurBouilleurs({}, de, 'ecs');
    // granulés ECS : 2013->33 ; 2016 >= 2013 => 33
    expect(de.enum_type_generateur_ecs_id).toBe('33');
  });

  test("la fiche technique est interrogée pour un 'bouilleur' dans le domaine '7'", () => {
    getFicheTechnique.mockReturnValue({ valeur: '2000' });
    updateGenerateurBouilleurs({}, { enum_type_generateur_ch_id: '48' }, 'ch');
    expect(getFicheTechnique).toHaveBeenCalledWith({}, '7', 'année', ['bouilleur']);
  });
});
