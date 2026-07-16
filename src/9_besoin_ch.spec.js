import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `9_besoin_ch.js` :
 * - `enums` : mapping altitude / zone climatique / inertie ;
 * - `tvs` : profils mensuels dh19/dh21/nref19/nref21/e (valeurs contrôlées) ;
 * - apports internes/solaires (`calc_ai_j`, `calc_as_j`) et surface sud
 *   équivalente (`calc_sse_j`) : simples fonctions dont on fige le retour ;
 * - besoin ECS journalier (`calc_besoin_ecs_j`) et récupération générateur
 *   (`calc_Qrec_gen_j`) : mockés pour piloter les branches de récupération ;
 * - `mois_liste` réduite à un mois et `bug_for_bug_compat` désactivé.
 */
vi.mock('./enums.js', () => ({
  default: {
    classe_altitude: { 0: 'ca1' },
    zone_climatique: { 0: 'h1a' },
    classe_inertie: { 0: 'moyenne' }
  }
}));

vi.mock('./tv.js', () => ({
  default: {
    dh19: { 0: { ca1: { Janvier: { h1a: 1000 } } } },
    dh21: { 0: { ca1: { Janvier: { h1a: 1200 } } } },
    nref19: { 0: { ca1: { Janvier: { h1a: 100 } } } },
    nref21: { 0: { ca1: { Janvier: { h1a: 120 } } } },
    e: { 0: { ca1: { Janvier: { h1a: 500 } } } }
  }
}));

vi.mock('./6.1_apport_gratuit.js', () => ({
  calc_ai_j: vi.fn(),
  calc_as_j: vi.fn()
}));

vi.mock('./6.2_surface_sud_equivalente.js', () => ({
  calc_sse_j: vi.fn()
}));

vi.mock('./11_besoin_ecs.js', () => ({
  calc_besoin_ecs_j: vi.fn()
}));

vi.mock('./9_generateur_ch.js', () => ({
  calc_Qrec_gen_j: vi.fn()
}));

vi.mock('./utils.js', () => ({
  mois_liste: ['Janvier'],
  bug_for_bug_compat: false
}));

const { default: calc_besoin_ch, calc_Fj, calc_bvj } = await import('./9_besoin_ch.js');
const { calc_ai_j, calc_as_j } = await import('./6.1_apport_gratuit.js');
const { calc_sse_j } = await import('./6.2_surface_sud_equivalente.js');
const { calc_besoin_ecs_j } = await import('./11_besoin_ecs.js');
const { calc_Qrec_gen_j } = await import('./9_generateur_ch.js');

/**
 * 9. Besoins de chauffage (Bch)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9
 */
describe('calc_Fj - fraction des besoins de chauffage couverte par les apports', () => {
  test('retourne 0 lorsque le nombre de degrés-heures est nul', () => {
    expect(calc_Fj(100, 2000, 5000, 0, 'moyenne')).toBe(0);
  });

  test('valeur de référence de régression (inertie moyenne, alpha = 2.9)', () => {
    expect(calc_Fj(100, 2000, 5000, 1000, 'moyenne')).toBeCloseTo(0.06958364704535852, 9);
  });

  test('une inertie lourde (alpha = 3.6) couvre une part différente de la légère (alpha = 2.5)', () => {
    const lourde = calc_Fj(100, 2000, 5000, 1000, 'lourde');
    const legere = calc_Fj(100, 2000, 5000, 1000, 'légère');
    // valeurs de référence de régression
    expect(lourde).toBeCloseTo(0.06993530568739618, 9);
    expect(legere).toBeCloseTo(0.06879276604754976, 9);
    expect(lourde).not.toBeCloseTo(legere, 9);
  });

  test('les inerties "très lourde" et "lourde" partagent le même alpha', () => {
    expect(calc_Fj(100, 2000, 5000, 1000, 'très lourde')).toBeCloseTo(
      calc_Fj(100, 2000, 5000, 1000, 'lourde'),
      12
    );
  });
});

describe('calc_bvj - déperditions corrigées de la fraction récupérée', () => {
  test('bvj = GV * (1 - Fj)', () => {
    expect(calc_bvj(100, 0.3)).toBe(70);
    expect(calc_bvj(100, 0)).toBe(100);
  });
});

describe('calc_besoin_ch - agrégation mensuelle du besoin de chauffage', () => {
  beforeEach(() => {
    vi.mocked(calc_ai_j).mockReset();
    vi.mocked(calc_as_j).mockReset();
    vi.mocked(calc_sse_j).mockReset();
    vi.mocked(calc_besoin_ecs_j).mockReset();
    vi.mocked(calc_Qrec_gen_j).mockReset();
    vi.mocked(calc_ai_j).mockReturnValue(5000);
    vi.mocked(calc_as_j).mockReturnValue(2000);
    vi.mocked(calc_sse_j).mockReturnValue(10);
    vi.mocked(calc_besoin_ecs_j).mockReturnValue(10);
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(0);
  });

  /** Appel nominal sans installation (pas de récupération d'énergie). */
  function appelSansRecup() {
    return calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], [], [], null, 'maison', 1);
  }

  test('valeurs de référence de régression sans récupération (ECS/générateur)', () => {
    const ret = appelSansRecup();
    expect(ret.besoin_ch).toBeCloseTo(93.04163529546415, 9);
    expect(ret.besoin_ch_depensier).toBeCloseTo(113.0298092944794, 9);
  });

  test('la fraction des apports gratuits est ramenée à la moyenne pondérée par les degrés-heures', () => {
    const ret = appelSansRecup();
    // sur un seul mois : fraction = Fj
    expect(ret.fraction_apport_gratuit_ch).toBeCloseTo(0.06958364704535852, 9);
    expect(ret.fraction_apport_gratuit_depensier_ch).toBeCloseTo(0.05808492254600494, 9);
  });

  test('sans récupération, toutes les pertes récupérées retournées sont nulles', () => {
    const ret = appelSansRecup();
    expect(ret.pertes_distribution_ecs_recup).toBe(0);
    expect(ret.pertes_stockage_ecs_recup).toBe(0);
    expect(ret.pertes_generateur_ch_recup).toBe(0);
    expect(ret.pertes_generateur_ch_recup_depensier).toBe(0);
  });

  test('le besoin mensuel est exposé (en Wh) pour chaque mois calculé', () => {
    const ret = appelSansRecup();
    expect(ret.besoin_ch_mois.Janvier).toBeCloseTo(93041.63529546415, 6);
  });

  /**
   * 9.1.1 - Un générateur en volume chauffé avec pertes à l'arrêt (qp0) donne
   * lieu à une récupération d'énergie qui diminue le besoin de chauffage.
   */
  test('la récupération générateur diminue le besoin et appelle calc_Qrec_gen_j', () => {
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(1000);
    const instal_ch = [
      {
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_intermediaire: { qp0: 1 },
              donnee_entree: { position_volume_chauffe: 1 }
            }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], instal_ch, [], null, 'maison', 1);

    expect(calc_Qrec_gen_j).toHaveBeenCalled();
    expect(ret.pertes_generateur_ch_recup).toBeCloseTo(1000, 6);
    // 93041.635 Wh de besoin - 1000 Wh récupérés = 92041.635 Wh
    expect(ret.besoin_ch).toBeCloseTo(92.04163529546415, 6);
  });

  test("un générateur sans pertes à l'arrêt (qp0) n'est pas retenu pour la récupération", () => {
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(1000);
    const instal_ch = [
      {
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_intermediaire: { qp0: 0 },
              donnee_entree: { position_volume_chauffe: 1 }
            }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], instal_ch, [], null, 'maison', 1);
    expect(calc_Qrec_gen_j).not.toHaveBeenCalled();
    expect(ret.pertes_generateur_ch_recup).toBe(0);
  });

  test('le besoin mensuel de chauffage est borné à zéro (Math.max)', () => {
    // récupération générateur démesurée => besoin mensuel négatif ramené à 0
    vi.mocked(calc_Qrec_gen_j).mockReturnValue(1e9);
    const instal_ch = [
      {
        generateur_chauffage_collection: {
          generateur_chauffage: [
            {
              donnee_intermediaire: { qp0: 1 },
              donnee_entree: { position_volume_chauffe: 1 }
            }
          ]
        }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, [], instal_ch, [], null, 'maison', 1);
    expect(ret.besoin_ch).toBe(0);
    expect(ret.besoin_ch_mois.Janvier).toBe(0);
  });

  /**
   * 11.4 - En présence d'une installation ECS, la récupération de distribution
   * ECS (Qrec) diminue le besoin de chauffage et le besoin ECS journalier est
   * sollicité pour chaque mois.
   */
  test('une installation ECS collective alimente la récupération de distribution', () => {
    const instal_ecs = [
      {
        donnee_entree: { enum_type_installation_id: '2', rdim: 1 },
        generateur_ecs_collection: { generateur_ecs: [] }
      }
    ];
    const ret = calc_besoin_ch(0, 0, 0, 0, 100, 100, 3, instal_ecs, [], [], null, 'maison', 1);

    expect(calc_besoin_ecs_j).toHaveBeenCalled();
    expect(ret.pertes_distribution_ecs_recup).toBeGreaterThan(0);
    // la récupération ECS réduit le besoin sous la valeur sans récupération
    expect(ret.besoin_ch).toBeLessThan(93.04163529546415);
  });
});
