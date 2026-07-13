import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler le module de ventilation :
 * - `tv` : accès aux tables `debits_ventilation` / `q4pa_conv`, on contrôle les lignes ;
 * - `requestInput` / `requestInputID` : passe-plats vers les données d'entrée ;
 * - `bug_for_bug_compat` : désactivé pour isoler le comportement nominal ;
 * - `calc_pvent` (5_conso_ventilation.js) : espion, la conso de ventilation est testée ailleurs.
 */
vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  requestInput: (de, du, field) => de[field],
  requestInputID: (de, du, field) => de[`enum_${field}_id`],
  bug_for_bug_compat: false
}));

vi.mock('./5_conso_ventilation.js', () => ({
  default: vi.fn()
}));

const { default: calc_ventilation, calc_hperm } = await import('./4_ventilation.js');
const { tv } = await import('./utils.js');
const { default: calc_pvent } = await import('./5_conso_ventilation.js');

/** Ligne figée de la table `debits_ventilation`. */
const ROW_DEBITS = {
  qvarep_conv: '1.2',
  qvasouf_conv: '0.5',
  smea_conv: '20',
  tv_debits_ventilation_id: '3'
};

beforeEach(() => {
  tv.mockReset();
  vi.mocked(calc_pvent).mockReset();
  tv.mockImplementation((table) => {
    if (table === 'debits_ventilation') return { ...ROW_DEBITS };
    if (table === 'q4pa_conv') return { q4pa_conv: '1.3', tv_q4pa_conv_id: '9' };
    return null;
  });
});

/**
 * Déperdition par renouvellement d'air dû aux infiltrations (Hperm)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §4
 */
describe('calc_hperm - déperdition par perméabilité', () => {
  test('plusieurs façades exposées (pfe=1) : e=0,07 et f=15', () => {
    const di = { q4pa_conv: 1.3, smea_conv: 20, qvasouf_conv: 0.5, qvarep_conv: 1.2 };
    calc_hperm(di, 100, 2.5, 80, 1);
    // valeur de référence de régression
    expect(di.hperm).toBeCloseTo(124.24055432137072, 9);
  });

  test('une seule façade exposée (pfe=0) : e=0,02 et f=20', () => {
    const di = { q4pa_conv: 1.3, smea_conv: 20, qvasouf_conv: 0.5, qvarep_conv: 1.2 };
    calc_hperm(di, 100, 2.5, 80, 0);
    // valeur de référence de régression
    expect(di.hperm).toBeCloseTo(31.494527138357977, 9);
  });

  test('le nombre de façades exposées modifie le résultat', () => {
    const diMulti = { q4pa_conv: 1.3, smea_conv: 20, qvasouf_conv: 0.5, qvarep_conv: 1.2 };
    const diSingle = { q4pa_conv: 1.3, smea_conv: 20, qvasouf_conv: 0.5, qvarep_conv: 1.2 };
    calc_hperm(diMulti, 100, 2.5, 80, 1);
    calc_hperm(diSingle, 100, 2.5, 80, 0);
    expect(diMulti.hperm).not.toBeCloseTo(diSingle.hperm, 5);
  });
});

/** Fabrique un objet ventilation avec les données d'entrée utiles. */
function ventilation(de = {}) {
  return { donnee_entree: { enum_type_ventilation_id: '1', ...de } };
}

const CG = {
  hsp: 2.5,
  enum_periode_construction_id: '1',
  enum_methode_application_dpe_log_id: '1'
};

describe('calc_ventilation - orchestration', () => {
  test('surface ventilée absente : la surface habitable Sh est utilisée', () => {
    const vt = ventilation({ q4pa_conv_saisi: 1.3 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    // Hvent = 0,34 * qvarep_conv * surface_ventile = 0,34 * 1,2 * 100
    expect(vt.donnee_intermediaire.hvent).toBeCloseTo(40.8, 9);
  });

  test('surface ventilée collective : divisée par la clé de répartition', () => {
    const vt = ventilation({
      surface_ventile: 200,
      cle_repartition_ventilation: 2,
      q4pa_conv_saisi: 1.3
    });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    // surface_ventile = 200 / 2 = 100 => Hvent = 0,34 * 1,2 * 100
    expect(vt.donnee_intermediaire.hvent).toBeCloseTo(40.8, 9);
  });

  test('Q4Pa mesuré saisi : utilisé directement, sans lecture de la table q4pa_conv', () => {
    const vt = ventilation({ q4pa_conv_saisi: 0.6 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(vt.donnee_intermediaire.q4pa_conv).toBe(0.6);
    expect(tv).not.toHaveBeenCalledWith('q4pa_conv', expect.anything());
  });

  test('Q4Pa non saisi : lu dans la table q4pa_conv', () => {
    const vt = ventilation();
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(tv).toHaveBeenCalledWith('q4pa_conv', expect.any(Object));
    expect(vt.donnee_intermediaire.q4pa_conv).toBe(1.3);
  });

  test('les débits conventionnels intermédiaires sont supprimés du résultat', () => {
    const vt = ventilation({ q4pa_conv_saisi: 1.3 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(vt.donnee_intermediaire.qvarep_conv).toBeUndefined();
    expect(vt.donnee_intermediaire.qvasouf_conv).toBeUndefined();
    expect(vt.donnee_intermediaire.smea_conv).toBeUndefined();
  });

  test('la consommation de ventilation est déléguée à calc_pvent', () => {
    const vt = ventilation({ q4pa_conv_saisi: 1.3 });
    calc_ventilation(vt, CG, 'th', 80, 100, [], [], [], []);

    expect(calc_pvent).toHaveBeenCalledWith(
      vt.donnee_intermediaire,
      vt.donnee_entree,
      vt.donnee_utilisateur,
      'th'
    );
  });
});
