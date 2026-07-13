import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendance mockée : `getFicheTechnique` (import par défaut), qui fournit l'année
 * d'installation utilisée pour choisir le générateur équivalent. On contrôle sa valeur
 * de retour ; son fonctionnement interne n'est pas testé ici.
 */
vi.mock('./ficheTechnique.js', () => ({
  default: vi.fn()
}));

const { updateGenerateurChaudieres } = await import('./13.2_generateur_combustion_chaudiere.js');
const { default: getFicheTechnique } = await import('./ficheTechnique.js');

beforeEach(() => {
  vi.mocked(getFicheTechnique).mockReset();
});

/**
 * 13.2 - Les "autres systèmes à combustion" sont assimilés à des chaudières standard
 * de la période correspondante.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2
 */
describe('updateGenerateurChaudieres - substitution par une chaudière équivalente', () => {
  test('type non concerné : aucune substitution, pas de champ previous', () => {
    getFicheTechnique.mockReturnValue(undefined);
    const de = { enum_type_generateur_ch_id: '90' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('90');
    expect(de.previous_enum_type_generateur_ch_id).toBeUndefined();
  });

  test('sans fiche technique : identifiant conservé mais previous renseigné (ch, gaz 113)', () => {
    getFicheTechnique.mockReturnValue(undefined);
    const de = { enum_type_generateur_ch_id: '113' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('113');
    expect(de.previous_enum_type_generateur_ch_id).toBe('113');
  });

  test('fiche "avant 1948" : chaudière la plus ancienne de la table (ch, gaz 113 -> 85)', () => {
    getFicheTechnique.mockReturnValue({ valeur: 'avant 1948' });
    const de = { enum_type_generateur_ch_id: '113' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('85');
    expect(de.previous_enum_type_generateur_ch_id).toBe('113');
  });

  test('année 1985 : seuil 1981 retenu (ch, gaz 113 -> 86)', () => {
    getFicheTechnique.mockReturnValue({ valeur: '1985' });
    const de = { enum_type_generateur_ch_id: '113' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('86');
  });

  test('année postérieure au dernier seuil : chaudière la plus récente (ch, gaz 113 -> 90)', () => {
    getFicheTechnique.mockReturnValue({ valeur: '2030' });
    const de = { enum_type_generateur_ch_id: '113' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('90');
  });

  test('type ECS (fioul 79) : utilise la table ECS et le seuil correspondant', () => {
    getFicheTechnique.mockReturnValue({ valeur: '1972' });
    const de = { enum_type_generateur_ecs_id: '79' };
    updateGenerateurChaudieres({}, de, 'ecs');
    // seuils fioul ECS : 1948->35, 1970->36 ... 1972 >= 1970 => 36
    expect(de.enum_type_generateur_ecs_id).toBe('36');
    expect(de.previous_enum_type_generateur_ecs_id).toBe('79');
  });

  test("la fiche technique est interrogée avec le bon domaine ('7' pour ch, '8' pour ecs)", () => {
    getFicheTechnique.mockReturnValue({ valeur: '2000' });
    updateGenerateurChaudieres({}, { enum_type_generateur_ch_id: '113' }, 'ch');
    expect(getFicheTechnique).toHaveBeenCalledWith({}, '7', 'année', [
      'Autre système à combustion'
    ]);

    getFicheTechnique.mockClear();
    updateGenerateurChaudieres({}, { enum_type_generateur_ecs_id: '79' }, 'ecs');
    expect(getFicheTechnique).toHaveBeenCalledWith({}, '8', 'année', [
      'Autre système à combustion'
    ]);
  });
});
