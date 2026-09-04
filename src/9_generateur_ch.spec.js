import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `9_generateur_ch.js` :
 * - `enums` : libellés des types de générateurs (ch / ecs) ;
 * - `utils` : `requestInput` / `requestInputID` (accès aux données d'entrée),
 *   `tv` (tables de valeurs) et `tvColumnIDs` (listes d'ids par colonne) ;
 * - `15_conso_aux` : consommations d'auxiliaires (génération / distribution) ;
 * - `9_conso_ch` : `conso_ch` (délégation finale) ;
 * - `13.2_generateur_combustion_ch` / `12.4_pac` / `13.2_generateur_combustion` :
 *   calculs spécialisés (combustion / PAC) pilotés par des espions.
 *
 * On vérifie la logique d'aiguillage propre au module (type de générateur,
 * récupération d'énergie, auxiliaires, parois anciennes) sans dépendre des
 * données réelles des tables.
 */
vi.mock('./enums.js', () => ({
  default: {
    type_generateur_ch: {
      1: 'chaudière gaz',
      2: 'générateur à air chaud',
      5: 'chaudière fioul',
      10: 'pac air/eau'
    },
    type_generateur_ecs: {
      1: 'chaudière gaz'
    }
  }
}));

vi.mock('./utils.js', () => ({
  requestInput: vi.fn(),
  requestInputID: vi.fn(),
  tv: vi.fn(),
  tvColumnIDs: vi.fn()
}));

vi.mock('./15_conso_aux.js', () => ({
  conso_aux_distribution_ch: vi.fn(),
  conso_aux_gen: vi.fn()
}));

vi.mock('./9_conso_ch.js', () => ({
  conso_ch: vi.fn()
}));

vi.mock('./13.2_generateur_combustion_ch.js', () => ({
  calc_generateur_combustion_ch: vi.fn()
}));

vi.mock('./12.4_pac.js', () => ({
  scopOrCop: vi.fn()
}));

vi.mock('./13.2_generateur_combustion.js', () => ({
  updateGenerateurCombustion: vi.fn()
}));

const {
  calc_Qrec_gen_j,
  type_generateur_ch,
  checkForGeneratorType,
  calc_generateur_ch,
  hasConsoForAuxDistribution
} = await import('./9_generateur_ch.js');
const { requestInput, requestInputID, tv, tvColumnIDs } = await import('./utils.js');
const { conso_aux_distribution_ch, conso_aux_gen } = await import('./15_conso_aux.js');
const { conso_ch } = await import('./9_conso_ch.js');
const { calc_generateur_combustion_ch } = await import('./13.2_generateur_combustion_ch.js');
const { scopOrCop } = await import('./12.4_pac.js');
const { updateGenerateurCombustion } = await import('./13.2_generateur_combustion.js');

beforeEach(() => {
  vi.mocked(requestInput).mockReset();
  vi.mocked(requestInputID).mockReset();
  vi.mocked(tv).mockReset();
  vi.mocked(tvColumnIDs).mockReset();
  vi.mocked(conso_aux_distribution_ch).mockReset();
  vi.mocked(conso_aux_gen).mockReset();
  vi.mocked(conso_ch).mockReset();
  vi.mocked(calc_generateur_combustion_ch).mockReset();
  vi.mocked(scopOrCop).mockReset();
  vi.mocked(updateGenerateurCombustion).mockReset();
});

/**
 * 9.1.1 Pertes récupérées de génération pour le chauffage (Qrec_gen)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9.1.1
 */
describe('calc_Qrec_gen_j - pertes de génération récupérées', () => {
  /** Générateur minimal en volume chauffé, non "air chaud". */
  function generateur(overridesDe = {}, di = { pn: 10000, qp0: 100 }) {
    return {
      donnee_entree: {
        position_volume_chauffe: 1,
        enum_type_generateur_ch_id: '1',
        presence_ventouse: 0,
        ...overridesDe
      },
      donnee_intermediaire: di
    };
  }

  test('générateur hors volume chauffé : aucune récupération', () => {
    const gen = generateur({ position_volume_chauffe: 0 });
    expect(calc_Qrec_gen_j(gen, 50, 1000)).toBe(0);
  });

  test('générateur à air chaud : aucune récupération', () => {
    const gen = generateur({ enum_type_generateur_ch_id: '2' });
    expect(calc_Qrec_gen_j(gen, 50, 1000)).toBe(0);
  });

  test('usage chauffage (sans ventouse, Cper = 0.5) : Dperj plafonné aux pertes de chauffage', () => {
    vi.mocked(requestInput).mockReturnValue('chauffage');
    const gen = generateur();
    // 0.48 * 0.5 * 100 * min(50, 1.3*1000/(0.3*10000)) = 24 * 0.4333.. = 10.4
    expect(calc_Qrec_gen_j(gen, 50, 1000)).toBeCloseTo(10.4, 9);
  });

  test('présence de ventouse : Cper = 0.75 augmente la récupération', () => {
    vi.mocked(requestInput).mockReturnValue('chauffage');
    const gen = generateur({ presence_ventouse: 1 });
    // 0.48 * 0.75 * 100 * 0.4333.. = 15.6
    expect(calc_Qrec_gen_j(gen, 50, 1000)).toBeCloseTo(15.6, 9);
  });

  test('usage ecs : pertes proportionnelles au nombre d’heures de référence', () => {
    vi.mocked(requestInput).mockReturnValue('ecs');
    const gen = generateur();
    // 0.48 * 0.5 * 100 * (50*1790/8760)
    expect(calc_Qrec_gen_j(gen, 50, 1000)).toBeCloseTo(245.20547945205482, 9);
  });

  test('usage chauffage + ecs : cumul plafonné au nombre d’heures de référence', () => {
    vi.mocked(requestInput).mockReturnValue('chauffage + ecs');
    const gen = generateur();
    // min(50, 0.4333.. + 10.2168..) => 10.6502..
    expect(calc_Qrec_gen_j(gen, 50, 1000)).toBeCloseTo(255.6054794520548, 9);
  });

  test('usage inconnu : Dperj indéfini => récupération nulle (|| 0)', () => {
    vi.mocked(requestInput).mockReturnValue('autre');
    const gen = generateur();
    expect(calc_Qrec_gen_j(gen, 50, 1000)).toBe(0);
  });
});

/**
 * Détermination du type de générateur exploitable pour un usage donné.
 */
describe('type_generateur_ch - sélection du type selon l’usage', () => {
  test('usage chauffage : renvoie directement le type saisi', () => {
    vi.mocked(requestInputID).mockReturnValue('5');
    expect(type_generateur_ch({}, {}, {}, 'chauffage')).toBe('5');
    expect(requestInputID).toHaveBeenCalledWith({}, {}, 'type_generateur_ch');
  });

  test('usage chauffage + ecs : restreint aux types communs chauffage/ECS', () => {
    vi.mocked(requestInputID).mockReturnValue('1');
    const res = type_generateur_ch({}, {}, {}, 'chauffage + ecs');
    expect(res).toBe('1');
    // seul le type '1' (chaudière gaz) est commun aux deux enums
    expect(vi.mocked(requestInputID).mock.calls[0][3]).toEqual(['1']);
  });

  test('usage non géré : avertissement et retour indéfini', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(type_generateur_ch({}, {}, {}, 'refroidissement')).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

/**
 * checkForGeneratorType : classification combustion / PAC, cas particulier 119.
 */
describe('checkForGeneratorType - classification du générateur', () => {
  beforeEach(() => {
    vi.mocked(tvColumnIDs).mockImplementation((file) =>
      file === 'generateur_combustion' ? ['5', '119'] : ['10']
    );
    vi.mocked(requestInput).mockReturnValue('chauffage');
  });

  test('générateur à combustion', () => {
    vi.mocked(requestInputID).mockReturnValue('5');
    const de = {};
    const du = {};
    checkForGeneratorType({}, de, {}, du);
    expect(du.isCombustionGenerator).toBe(true);
    expect(du.isPacGenerator).toBe(false);
    expect(updateGenerateurCombustion).toHaveBeenCalledWith({}, de, 'ch');
  });

  test('pompe à chaleur', () => {
    vi.mocked(requestInputID).mockReturnValue('10');
    const du = {};
    checkForGeneratorType({}, {}, {}, du);
    expect(du.isPacGenerator).toBe(true);
    expect(du.isCombustionGenerator).toBe(false);
  });

  test('générateur ni combustion ni PAC', () => {
    vi.mocked(requestInputID).mockReturnValue('99');
    const du = {};
    checkForGeneratorType({}, {}, {}, du);
    expect(du.isPacGenerator).toBe(false);
    expect(du.isCombustionGenerator).toBe(false);
  });

  test('cas 119 avec tv_generateur_combustion_id : premier type de combustion adopté', () => {
    vi.mocked(requestInputID).mockReturnValue('119');
    vi.mocked(tv).mockReturnValue({ enum_type_generateur_ch_id: '7|8' });
    const de = { tv_generateur_combustion_id: 42 };
    const du = {};
    checkForGeneratorType({}, de, {}, du);
    expect(de.enum_type_generateur_ch_id).toBe('7');
    expect(du.isCombustionGenerator).toBe(true);
    expect(du.isPacGenerator).toBe(false);
  });

  test('cas 119 avec tv_generateur_combustion_id mais ligne sans type : combustion sans réécriture', () => {
    vi.mocked(requestInputID).mockReturnValue('119');
    vi.mocked(tv).mockReturnValue({ enum_type_generateur_ch_id: undefined });
    const de = { tv_generateur_combustion_id: 42 };
    const du = {};
    checkForGeneratorType({}, de, {}, du);
    expect(de.enum_type_generateur_ch_id).toBeUndefined();
    expect(du.isCombustionGenerator).toBe(true);
  });

  test('cas 119 avec tv_generateur_combustion_id mais aucune ligne trouvée', () => {
    vi.mocked(requestInputID).mockReturnValue('119');
    vi.mocked(tv).mockReturnValue(null);
    const de = { tv_generateur_combustion_id: 42 };
    const du = {};
    checkForGeneratorType({}, de, {}, du);
    expect(du.isCombustionGenerator).toBe(true);
  });

  test('cas 119 avec tv_scop_id : classé comme PAC', () => {
    vi.mocked(requestInputID).mockReturnValue('119');
    const de = { tv_scop_id: 7 };
    const du = {};
    checkForGeneratorType({}, de, {}, du);
    expect(du.isPacGenerator).toBe(true);
    expect(du.isCombustionGenerator).toBe(false);
  });

  test('cas 119 par défaut : rendement de génération, premier type adopté', () => {
    vi.mocked(requestInputID).mockReturnValue('119');
    vi.mocked(tv).mockReturnValue({ enum_type_generateur_ch_id: '9|10' });
    const de = { tv_rendement_generation_id: 3 };
    const du = {};
    checkForGeneratorType({}, de, {}, du);
    expect(de.enum_type_generateur_ch_id).toBe('9');
    expect(du.isPacGenerator).toBe(false);
    expect(du.isCombustionGenerator).toBe(false);
  });

  test('cas 119 par défaut sans ligne de rendement : aucune réécriture', () => {
    vi.mocked(requestInputID).mockReturnValue('119');
    vi.mocked(tv).mockReturnValue(null);
    const de = { tv_rendement_generation_id: 3, enum_type_generateur_ch_id: '119' };
    const du = {};
    checkForGeneratorType({}, de, {}, du);
    expect(de.enum_type_generateur_ch_id).toBe('119');
  });
});

/**
 * 15 Consommations d'auxiliaires de distribution : générateurs concernés.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15
 */
describe('hasConsoForAuxDistribution - éligibilité aux auxiliaires de distribution', () => {
  test('générateurs éligibles (chacune des plages)', () => {
    expect(hasConsoForAuxDistribution(110)).toBe(true); // >= 106
    expect(hasConsoForAuxDistribution(60)).toBe(true); // 55..97
    expect(hasConsoForAuxDistribution(50)).toBe(true); // 48..52
    expect(hasConsoForAuxDistribution(10)).toBe(true); // 4..19
  });

  test('générateurs exclus (PAC air/air, poêles, radiateurs, effet joule)', () => {
    expect(hasConsoForAuxDistribution(3)).toBe(false);
    expect(hasConsoForAuxDistribution(20)).toBe(false);
    expect(hasConsoForAuxDistribution(53)).toBe(false);
    expect(hasConsoForAuxDistribution(100)).toBe(false);
  });
});

/**
 * calc_generateur_ch : aiguillage du rendement puis délégations.
 */
describe('calc_generateur_ch - orchestration du calcul générateur', () => {
  /** dpe avec un mur non ancien, inertie légère => parois anciennes = false. */
  function dpeSimple() {
    return {
      logement: {
        enveloppe: {
          inertie: { enum_classe_inertie_id: '3' },
          mur_collection: {
            mur: [
              {
                donnee_intermediaire: { b: 1 },
                donnee_entree: { enum_materiaux_structure_mur_id: '1' }
              }
            ]
          }
        }
      }
    };
  }

  function generateur(de = {}, du = {}, di = {}) {
    return {
      donnee_entree: { enum_type_generateur_ch_id: '1', ...de },
      donnee_utilisateur: du,
      donnee_intermediaire: di
    };
  }

  const emetteur = (lien) => ({
    donnee_entree: {
      enum_lien_generateur_emetteur_id: lien,
      enum_type_emission_distribution_id: 'ed1'
    }
  });

  function appel(gen, em_ch, dpe = dpeSimple()) {
    calc_generateur_ch(
      dpe,
      gen,
      0,
      em_ch,
      'installation de chauffage simple',
      1000,
      2000,
      150,
      100,
      2.5,
      1,
      1,
      0,
      -9.5,
      {},
      100,
      [gen]
    );
  }

  test('PAC avec un unique émetteur : scopOrCop appelé sur cet émetteur', () => {
    const gen = generateur({}, { isPacGenerator: true });
    appel(gen, [emetteur('1')]);
    expect(scopOrCop).toHaveBeenCalledWith(
      gen.donnee_intermediaire,
      gen.donnee_entree,
      gen.donnee_utilisateur,
      1,
      'ed1',
      'ch'
    );
    // délégations finales
    expect(conso_aux_gen).toHaveBeenCalled();
    expect(conso_ch).toHaveBeenCalled();
  });

  test('PAC avec plusieurs émetteurs : sélection par lien générateur/émetteur', () => {
    vi.mocked(requestInputID).mockReturnValue('2');
    const gen = generateur({}, { isPacGenerator: true });
    appel(gen, [emetteur('1'), emetteur('2')]);
    // l'émetteur de lien '2' est retenu (enum_type_emission_distribution_id = 'ed1')
    expect(scopOrCop).toHaveBeenCalled();
    expect(scopOrCop.mock.calls[0][4]).toBe('ed1');
  });

  test('PAC sans émetteur correspondant : repli sur scop/cop saisis', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(requestInputID).mockReturnValue('inconnu');
    const gen = generateur({ description: 'PAC' }, { isPacGenerator: true }, { scop: 3.2 });
    appel(gen, [emetteur('1'), emetteur('2')]);
    expect(scopOrCop).not.toHaveBeenCalled();
    expect(gen.donnee_intermediaire.rg).toBe(3.2);
    expect(gen.donnee_intermediaire.rg_dep).toBe(3.2);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  test('PAC sans émetteur ni scop : repli sur le cop saisi', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(requestInputID).mockReturnValue('inconnu');
    const gen = generateur({ description: 'PAC' }, { isPacGenerator: true }, { cop: 2.7 });
    appel(gen, [emetteur('1'), emetteur('2')]);
    expect(gen.donnee_intermediaire.rg).toBe(2.7);
    expect(gen.donnee_intermediaire.rg_dep).toBe(2.7);
    err.mockRestore();
  });

  test('générateur à combustion : délégué à calc_generateur_combustion_ch', () => {
    const gen = generateur({}, { isCombustionGenerator: true });
    appel(gen, [emetteur('1')]);
    expect(calc_generateur_combustion_ch).toHaveBeenCalled();
  });

  test('générateur standard : rendement de génération lu en table', () => {
    vi.mocked(requestInputID).mockReturnValue('1');
    vi.mocked(tv).mockReturnValue({ rg: '0.85', tv_rendement_generation_id: '77' });
    const gen = generateur();
    appel(gen, [emetteur('1')]);
    expect(gen.donnee_intermediaire.rendement_generation).toBe(0.85);
    expect(gen.donnee_intermediaire.rg).toBe(0.85);
    expect(gen.donnee_entree.tv_rendement_generation_id).toBe(77);
  });

  test('générateur standard sans ligne de rendement : message d’erreur', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(requestInputID).mockReturnValue('1');
    vi.mocked(tv).mockReturnValue(null);
    const gen = generateur();
    appel(gen, [emetteur('1')]);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  test('générateur éligible aux auxiliaires de distribution : conso_aux_distribution_ch appelé', () => {
    vi.mocked(requestInputID).mockReturnValue('1');
    vi.mocked(tv).mockReturnValue({ rg: '0.9', tv_rendement_generation_id: '1' });
    const gen = generateur({ enum_type_generateur_ch_id: '110' });
    appel(gen, [emetteur('1')]);
    expect(conso_aux_distribution_ch).toHaveBeenCalled();
  });

  test('générateur non éligible aux auxiliaires de distribution : conso_aux_distribution_ch ignoré', () => {
    vi.mocked(requestInputID).mockReturnValue('1');
    vi.mocked(tv).mockReturnValue({ rg: '0.9', tv_rendement_generation_id: '1' });
    const gen = generateur({ enum_type_generateur_ch_id: '100' });
    appel(gen, [emetteur('1')]);
    expect(conso_aux_distribution_ch).not.toHaveBeenCalled();
  });

  test('bâtiment à parois anciennes et inertie lourde transmis à conso_ch', () => {
    vi.mocked(requestInputID).mockReturnValue('1');
    vi.mocked(tv).mockReturnValue({ rg: '0.9', tv_rendement_generation_id: '1' });
    const gen = generateur();
    const dpe = {
      logement: {
        enveloppe: {
          inertie: { enum_classe_inertie_id: '1' }, // inertie lourde
          mur_collection: {
            mur: [
              {
                donnee_intermediaire: { b: 1 },
                donnee_entree: { enum_materiaux_structure_mur_id: '2' } // matériau ancien
              },
              {
                // mur avec b = 0 => ignoré dans le décompte
                donnee_intermediaire: { b: 0 },
                donnee_entree: { enum_materiaux_structure_mur_id: '1' }
              }
            ]
          }
        }
      }
    };
    appel(gen, [emetteur('1')], dpe);
    // paroi_ancienne (13e argument) transmis à conso_ch
    expect(vi.mocked(conso_ch).mock.calls[0][12]).toBe(true);
  });

  test('générateur sans données utilisateur/intermédiaire initiales : valeurs par défaut', () => {
    vi.mocked(requestInputID).mockReturnValue('1');
    vi.mocked(tv).mockReturnValue({ rg: '0.9', tv_rendement_generation_id: '1' });
    const gen = {
      donnee_entree: { enum_type_generateur_ch_id: '1' }
    };
    appel(gen, [emetteur('1')]);
    expect(gen.donnee_intermediaire).toBeDefined();
    expect(gen.donnee_utilisateur).toBeDefined();
  });
});
