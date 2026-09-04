import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_bv` (calcul des déperditions des baies vitrées) :
 * - `b` (3.1_b.js) : renseigne simplement `di.b` (coefficient de réduction) ;
 * - `utils` : `tv` (table de valeurs, dispatchée par nom de table), `requestInput` /
 *   `requestInputID` (passe-plats vers les données d'entrée), `getRange` (encadrement contrôlé),
 *   `bug_for_bug_compat` (accesseur adossé à un état hoisté, activable par test) ;
 * - `tv.js` : table `uw` réduite aux lignes utiles à l'interpolation.
 */
const state = vi.hoisted(() => ({ bug: false }));

vi.mock('./3.1_b.js', () => ({
  default: vi.fn((di) => {
    di.b = 1;
  })
}));

vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInput: (de, du, field) => de[field],
  requestInputID: (de, du, field) => de[`enum_${field}_id`],
  getRange: vi.fn(),
  get bug_for_bug_compat() {
    return state.bug;
  }
}));

vi.mock('./tv.js', () => ({
  default: {
    uw: [
      { enum_type_baie_id: '4', enum_type_materiaux_menuiserie_id: '3', ug: '2.8' },
      { enum_type_baie_id: '4', enum_type_materiaux_menuiserie_id: '3', ug: '4' }
    ]
  }
}));

const { default: calc_bv } = await import('./3.3_baie_vitree.js');
const { tv, getRange } = await import('./utils.js');

/**
 * Lignes retournées par défaut pour chaque table de valeurs. La table `uw` est dispatchée
 * selon la borne d'encadrement (`^2.8$` ou `^4$`) afin de piloter l'interpolation.
 */
function defaultRows() {
  return {
    ug: { ug: '2.8', tv_ug_id: '5' },
    sw: { sw: '0.5', tv_sw_id: '1' },
    uw: (matcher) => (matcher.ug === '^4$' ? { uw: '1.5' } : { uw: '3', tv_uw_id: '10' }),
    deltar: { deltar: '0.1', tv_deltar_id: '6' },
    ujn: { ujn: '2.4', tv_ujn_id: '201' },
    coef_masque_proche: { fe1: '0.8', tv_coef_masque_proche_id: '19' },
    coef_masque_lointain_homogene: { fe2: '0.9', tv_coef_masque_lointain_homogene_id: '3' },
    coef_masque_lointain_non_homoge: { omb: '20' }
  };
}

let rows;
let errorSpy;
let logSpy;

beforeEach(() => {
  vi.mocked(tv).mockReset();
  vi.mocked(getRange).mockReset();
  state.bug = false;
  rows = defaultRows();

  vi.mocked(tv).mockImplementation((table, matcher) => {
    const entry = rows[table];
    return typeof entry === 'function' ? entry(matcher) : entry;
  });
  // Encadrement par défaut : bornes identiques => interpolation dégénérée (delta_ug = 0)
  vi.mocked(getRange).mockReturnValue([2.8, 2.8]);

  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  logSpy.mockRestore();
});

/** Baie vitrée double vitrage, avec fermeture, sans masque ni double-fenêtre. */
function baseBv(overrides = {}) {
  return {
    donnee_entree: {
      description: 'Fenêtre test',
      enum_type_vitrage_id: '2',
      enum_type_gaz_lame_id: '1',
      enum_inclinaison_vitrage_id: '3',
      vitrage_vir: 0,
      epaisseur_lame: 12,
      enum_type_baie_id: '4',
      enum_type_materiaux_menuiserie_id: '3',
      enum_type_pose_id: '3',
      enum_type_fermeture_id: '7',
      type_fermeture: 'volets battants bois',
      surface_totale_baie: 2.6,
      ...overrides
    }
  };
}

/**
 * 3.3 Coefficients de transmission thermique et facteur solaire des baies vitrées.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.3
 */
describe('calc_bv - parcours nominal (double vitrage avec fermeture)', () => {
  test('renseigne b, sw, ug, uw, ujn et u_menuiserie', () => {
    const bv = baseBv();
    calc_bv(bv, 1);

    const di = bv.donnee_intermediaire;
    expect(di.b).toBe(1);
    expect(di.sw).toBe(0.5);
    expect(di.ug).toBe(2.8);
    expect(di.uw).toBe(3); // getRange [2.8, 2.8] => delta_ug = 0 => uw = uw(^2.8$)
    expect(di.ujn).toBe(2.4);
    expect(di.u_menuiserie).toBe(2.4); // fermeture présente => u_menuiserie = ujn
    expect(di.fe1).toBe(1); // pas de masque proche
    expect(di.fe2).toBe(1); // pas de masque lointain
    expect(di.deltar).toBeUndefined(); // supprimé en fin de calcul
    expect(bv.donnee_entree.tv_ug_id).toBe(5);
  });

  test('matcher ug enrichi pour un double vitrage (gaz, inclinaison, vir, épaisseur)', () => {
    const bv = baseBv();
    calc_bv(bv, 1);

    expect(tv).toHaveBeenCalledWith('ug', {
      enum_type_vitrage_id: '2',
      enum_type_gaz_lame_id: '1',
      enum_inclinaison_vitrage_id: '3',
      vitrage_vir: 0,
      epaisseur_lame: 12
    });
  });
});

describe('tv_ug - coefficient de transmission du vitrage', () => {
  test('simple vitrage (type 1) : matcher réduit au seul type de vitrage', () => {
    rows.ug = { ug: '5.8', tv_ug_id: '1' };
    const bv = baseBv({ enum_type_vitrage_id: '1' });
    calc_bv(bv, 1);

    expect(tv).toHaveBeenCalledWith('ug', { enum_type_vitrage_id: '1' });
    expect(bv.donnee_intermediaire.ug).toBe(5.8);
  });

  test('type de vitrage absent : matcher réduit (aucun enrichissement)', () => {
    rows.ug = { ug: '5.8', tv_ug_id: '1' };
    const bv = baseBv({ enum_type_vitrage_id: undefined });
    calc_bv(bv, 1);

    expect(tv).toHaveBeenCalledWith('ug', { enum_type_vitrage_id: undefined });
  });

  test('aucune ligne ug trouvée : erreur émise', () => {
    rows.ug = null;
    const bv = baseBv();
    calc_bv(bv, 1);

    expect(errorSpy).toHaveBeenCalledWith('!! pas de valeur forfaitaire trouvée pour ug !!');
    expect(bv.donnee_intermediaire.ug).toBeUndefined();
  });
});

describe('tv_sw - facteur solaire', () => {
  test('sw saisi : valeur reprise directement sans accès table', () => {
    const bv = baseBv({ sw_saisi: 0.42 });
    calc_bv(bv, 1);

    expect(bv.donnee_intermediaire.sw).toBe(0.42);
    expect(tv).not.toHaveBeenCalledWith('sw', expect.anything());
  });

  test('menuiserie brique de verre (matériau 1) : ni vir ni pose dans le matcher', () => {
    const bv = baseBv({ enum_type_materiaux_menuiserie_id: '1' });
    calc_bv(bv, 1);

    expect(tv).toHaveBeenCalledWith('sw', {
      enum_type_vitrage_id: '2',
      enum_type_baie_id: '4',
      enum_type_materiaux_menuiserie_id: '1'
    });
  });

  test('menuiserie classique : matcher enrichi (vir + pose)', () => {
    const bv = baseBv();
    calc_bv(bv, 1);

    expect(tv).toHaveBeenCalledWith('sw', {
      enum_type_vitrage_id: '2',
      enum_type_baie_id: '4',
      enum_type_materiaux_menuiserie_id: '3',
      vitrage_vir: 0,
      enum_type_pose_id: '3'
    });
  });

  test('aucune ligne sw trouvée : erreur émise', () => {
    rows.sw = null;
    const bv = baseBv();
    calc_bv(bv, 1);

    expect(errorSpy).toHaveBeenCalledWith('!! pas de valeur forfaitaire trouvée pour sw !!');
  });
});

describe('tv_uw - coefficient de transmission de la fenêtre', () => {
  test('uw saisi : valeur reprise directement', () => {
    const bv = baseBv({ uw_saisi: 2.1 });
    calc_bv(bv, 1);
    expect(bv.donnee_intermediaire.uw).toBe(2.1);
  });

  test('paroi en brique de verre (type baie 1) : uw lu directement dans la table', () => {
    rows.uw = { uw: '2', tv_uw_id: '10' };
    const bv = baseBv({ enum_type_baie_id: '1' });
    calc_bv(bv, 1);

    expect(tv).toHaveBeenCalledWith('uw', { enum_type_baie_id: '1' });
    expect(bv.donnee_intermediaire.uw).toBe(2);
  });

  test('brique de verre sans ligne uw : uw indéfini et erreur émise', () => {
    rows.uw = null;
    const bv = baseBv({ enum_type_baie_id: '1' });
    calc_bv(bv, 1);

    expect(bv.donnee_intermediaire.uw).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Pas de valeur forfaitaire uw'));
  });

  test('interpolation entre deux Ug tabulés (delta_ug ≠ 0)', () => {
    rows.ug = { ug: '3', tv_ug_id: '5' };
    getRange.mockReturnValue([2.8, 4]);
    const bv = baseBv();
    calc_bv(bv, 1);

    // uw = 3 + (1,5 - 3) * (3 - 2,8) / (4 - 2,8) = 2,75 (référence de régression)
    expect(bv.donnee_intermediaire.uw).toBeCloseTo(2.75, 9);
  });

  test('interpolation sans ligne uw exploitable : uw indéfini et erreur émise', () => {
    getRange.mockReturnValue([2.8, 4]);
    rows.uw = null;
    const bv = baseBv();
    calc_bv(bv, 1);

    expect(bv.donnee_intermediaire.uw).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Pas de valeur forfaitaire uw'));
  });
});

describe('calc_bv - traitement de la fermeture', () => {
  test('ujn saisi : valeur reprise, u_menuiserie = ujn', () => {
    const bv = baseBv({ ujn_saisi: 1.9 });
    calc_bv(bv, 1);

    expect(bv.donnee_intermediaire.ujn).toBe(1.9);
    expect(bv.donnee_intermediaire.u_menuiserie).toBe(1.9);
  });

  test('absence de fermeture : u_menuiserie = uw (pas de calcul de ujn)', () => {
    const bv = baseBv({ type_fermeture: 'abscence de fermeture pour la baie vitrée' });
    calc_bv(bv, 1);

    expect(bv.donnee_intermediaire.u_menuiserie).toBe(3); // = uw
    expect(bv.donnee_intermediaire.ujn).toBeUndefined();
  });

  test('aucune ligne deltar trouvée : erreur émise', () => {
    rows.deltar = null;
    const bv = baseBv();
    calc_bv(bv, 1);

    expect(errorSpy).toHaveBeenCalledWith('!! pas de valeur forfaitaire trouvée pour deltar !!');
  });

  test('aucune ligne ujn trouvée : erreur émise', () => {
    rows.ujn = null;
    const bv = baseBv();
    calc_bv(bv, 1);

    expect(errorSpy).toHaveBeenCalledWith('!! pas de valeur forfaitaire trouvée pour ujn !!');
  });
});

/**
 * 3.3.2 / 6.2.1 Traitement des doubles fenêtres : sw et uw équivalents.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.3.2
 */
describe('calc_bv - double fenêtre', () => {
  /** Baie secondaire (deuxième fenêtre) mesurable pour sw / uw équivalents. */
  function secondFenetre(overrides = {}) {
    return {
      donnee_entree: {
        description: 'Seconde fenêtre',
        enum_type_vitrage_id: '2',
        enum_type_gaz_lame_id: '1',
        enum_inclinaison_vitrage_id: '3',
        vitrage_vir: 0,
        epaisseur_lame: 12,
        enum_type_baie_id: '4',
        enum_type_materiaux_menuiserie_id: '3',
        enum_type_pose_id: '3',
        ...overrides
      },
      donnee_intermediaire: {}
    };
  }

  test('sw et uw équivalents calculés à partir des deux fenêtres', () => {
    const bv = baseBv({ double_fenetre: 1 });
    bv.baie_vitree_double_fenetre = secondFenetre();
    calc_bv(bv, 1);

    // sw équivalent = sw1 * sw2 = 0,5 * 0,5 = 0,25
    expect(bv.donnee_intermediaire.sw).toBeCloseTo(0.25, 9);
    // uw équivalent = 1 / (1/3 + 1/3 + 0,07) (référence de régression)
    expect(bv.donnee_intermediaire.uw).toBeCloseTo(1.3574660633484164, 9);
  });

  test('sw et uw saisis sur la seconde fenêtre : valeurs reprises directement', () => {
    const bv = baseBv({ double_fenetre: 1 });
    bv.baie_vitree_double_fenetre = secondFenetre({ sw_saisi: 0.8, uw_saisi: 2 });
    calc_bv(bv, 1);

    // sw équivalent = 0,5 * 0,8 = 0,4
    expect(bv.donnee_intermediaire.sw).toBeCloseTo(0.4, 9);
    // uw équivalent = 1 / (1/3 + 1/2 + 0,07)
    expect(bv.donnee_intermediaire.uw).toBeCloseTo(1 / (1 / 3 + 1 / 2 + 0.07), 9);
  });

  test('sw nul sur la seconde fenêtre : facteur multiplicatif ramené à 1', () => {
    // La seconde fenêtre (matériau brique de verre) renvoie un sw nul => on retombe sur 1
    rows.sw = (matcher) =>
      matcher.enum_type_materiaux_menuiserie_id === '1'
        ? { sw: '0' }
        : { sw: '0.5', tv_sw_id: '1' };
    const bv = baseBv({ double_fenetre: 1 });
    bv.baie_vitree_double_fenetre = secondFenetre({ enum_type_materiaux_menuiserie_id: '1' });
    calc_bv(bv, 1);

    // sw équivalent = sw1 * 1 = 0,5
    expect(bv.donnee_intermediaire.sw).toBeCloseTo(0.5, 9);
  });

  test('double_fenetre = 1 mais aucune baie secondaire : traitement ignoré', () => {
    const bv = baseBv({ double_fenetre: 1 });
    calc_bv(bv, 1);

    // sw et uw restent ceux de la fenêtre principale
    expect(bv.donnee_intermediaire.sw).toBe(0.5);
    expect(bv.donnee_intermediaire.uw).toBe(3);
  });

  /**
   * Compat bug : sw et uw sont saisis sur la fenêtre principale mais égaux aux valeurs
   * équivalentes calculées ; ce sont ces dernières qui sont conservées (avec erreur).
   */
  test('compat bug : sw/uw saisis mais égaux aux équivalents => équivalents conservés', () => {
    state.bug = true;
    // sw saisi = 0,5 (fenêtre principale), sw seconde fenêtre = 0,5 => produit = 0,25
    const swEquiv = 0.5 * 0.5;
    // uw saisi = 3 (fenêtre principale), uw seconde fenêtre = 3 => équivalent
    const uwEquiv = 1 / (1 / 3 + 1 / 3 + 0.07);

    const bv = baseBv({ double_fenetre: 1, sw_saisi: 0.5, uw_saisi: 3 });
    // valeurs intermédiaires préexistantes égales aux équivalents des deux fenêtres
    bv.donnee_intermediaire = { sw: swEquiv, uw: uwEquiv };
    bv.baie_vitree_double_fenetre = secondFenetre();

    calc_bv(bv, 1);

    expect(bv.donnee_intermediaire.sw).toBeCloseTo(swEquiv, 9);
    expect(bv.donnee_intermediaire.uw).toBeCloseTo(uwEquiv, 9);
    expect(errorSpy).toHaveBeenCalled();
  });
});

/**
 * 6.3 Masques proches et lointains.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §6.3
 */
describe('calc_bv - masques lointains non homogènes (fe2)', () => {
  test('collection de masques : fe2 = 1 - somme des occultations', () => {
    const bv = baseBv({
      masque_lointain_non_homogene_collection: {
        masque_lointain_non_homogene: [
          { tv_coef_masque_lointain_non_homogene_id: 1 },
          { tv_coef_masque_lointain_non_homogene_id: 2 }
        ]
      }
    });
    // omb = 20 par masque => fe2 = 1 - 0,2 - 0,2 = 0,6
    calc_bv(bv, 1);
    expect(bv.donnee_intermediaire.fe2).toBeCloseTo(0.6, 9);
  });

  test('masque unique (objet, non tableau) : normalisé en tableau', () => {
    const bv = baseBv({
      masque_lointain_non_homogene_collection: {
        masque_lointain_non_homogene: { tv_coef_masque_lointain_non_homogene_id: 1 }
      }
    });
    calc_bv(bv, 1);
    expect(bv.donnee_intermediaire.fe2).toBeCloseTo(0.8, 9); // 1 - 0,2
  });

  test('collection sans masque : fe2 reste à 1', () => {
    const bv = baseBv({ masque_lointain_non_homogene_collection: {} });
    calc_bv(bv, 1);
    expect(bv.donnee_intermediaire.fe2).toBe(1);
  });

  test('occultation supérieure à 100% : fe2 borné à 0', () => {
    rows.coef_masque_lointain_non_homoge = { omb: '150' };
    const bv = baseBv({
      masque_lointain_non_homogene_collection: {
        masque_lointain_non_homogene: [{ tv_coef_masque_lointain_non_homogene_id: 1 }]
      }
    });
    calc_bv(bv, 1);
    expect(bv.donnee_intermediaire.fe2).toBe(0);
  });

  test('aucune ligne omb trouvée : information consignée (console.log)', () => {
    rows.coef_masque_lointain_non_homoge = null;
    const bv = baseBv({
      masque_lointain_non_homogene_collection: {
        masque_lointain_non_homogene: [{ tv_coef_masque_lointain_non_homogene_id: 1 }]
      }
    });
    calc_bv(bv, 1);
    expect(logSpy).toHaveBeenCalledWith(
      '!! pas de valeur forfaitaire trouvée pour coef_masque_lointain_non_homog !!'
    );
  });
});

describe('calc_bv - masque proche (fe1)', () => {
  test('sans identifiant de masque proche : fe1 = 1', () => {
    const bv = baseBv();
    calc_bv(bv, 1);
    expect(bv.donnee_intermediaire.fe1).toBe(1);
  });

  test('avec identifiant : fe1 lu dans la table', () => {
    const bv = baseBv({ tv_coef_masque_proche_id: 19 });
    calc_bv(bv, 1);
    expect(bv.donnee_intermediaire.fe1).toBe(0.8);
  });

  test('identifiant présent mais aucune ligne : erreur émise', () => {
    rows.coef_masque_proche = null;
    const bv = baseBv({ tv_coef_masque_proche_id: 19 });
    calc_bv(bv, 1);
    expect(errorSpy).toHaveBeenCalledWith(
      '!! pas de valeur forfaitaire trouvée pour coef_masque_proche !!'
    );
  });
});

describe('calc_bv - masque lointain homogène (fe2)', () => {
  test('sans identifiant : fe2 inchangé', () => {
    const bv = baseBv();
    calc_bv(bv, 1);
    expect(bv.donnee_intermediaire.fe2).toBe(1);
  });

  test('avec identifiant : fe2 lu dans la table (écrase la valeur par défaut)', () => {
    const bv = baseBv({ tv_coef_masque_lointain_homogene_id: 3 });
    calc_bv(bv, 1);
    expect(bv.donnee_intermediaire.fe2).toBe(0.9);
  });

  test('identifiant présent mais aucune ligne : information consignée (console.log)', () => {
    rows.coef_masque_lointain_homogene = null;
    const bv = baseBv({ tv_coef_masque_lointain_homogene_id: 3 });
    calc_bv(bv, 1);
    expect(logSpy).toHaveBeenCalledWith(
      '!! pas de valeur forfaitaire trouvée pour coef_masque_lointain_homogene !!'
    );
  });
});
