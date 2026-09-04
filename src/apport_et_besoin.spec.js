import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `apport_et_besoin.js` (pur assembleur) :
 * - `enums` : mapping zone/altitude/inertie ;
 * - besoins ECS / froid, apports internes / solaires, surface sud équivalente :
 *   simples délégations dont on contrôle le retour ;
 * - `Nadeq` : service de calcul du nombre d'adultes équivalents, remplacé par
 *   une classe factice via `vi.hoisted`.
 */
const { calculateNadeq } = vi.hoisted(() => ({ calculateNadeq: vi.fn() }));

vi.mock('./enums.js', () => ({
  default: {
    zone_climatique: { 0: 'h1a' },
    classe_altitude: { 0: 'ca1' },
    classe_inertie: { 0: 'moyenne' }
  }
}));

vi.mock('./6.2_surface_sud_equivalente.js', () => ({ calc_sse: vi.fn() }));
vi.mock('./10_besoin_fr.js', () => ({ default: vi.fn() }));
vi.mock('./11_besoin_ecs.js', () => ({ default: vi.fn() }));
vi.mock('./6.1_apport_gratuit.js', () => ({ calc_ai: vi.fn(), calc_as: vi.fn() }));
vi.mock('./11_nadeq.js', () => ({ Nadeq: vi.fn(() => ({ calculateNadeq })) }));

const { default: calc_apport_et_besoin } = await import('./apport_et_besoin.js');
const { calc_sse } = await import('./6.2_surface_sud_equivalente.js');
const { default: calc_besoin_fr } = await import('./10_besoin_fr.js');
const { default: calc_besoin_ecs } = await import('./11_besoin_ecs.js');
const { calc_ai, calc_as } = await import('./6.1_apport_gratuit.js');

/** Logement minimal contenant les collections lues par l'assembleur. */
function logementFixture() {
  return {
    enveloppe: {
      inertie: { enum_classe_inertie_id: 0 },
      baie_vitree_collection: { baie_vitree: ['bv'] },
      ets_collection: { ets: ['ets'] }
    }
  };
}

beforeEach(() => {
  calculateNadeq.mockReset().mockReturnValue(2.5);
  vi.mocked(calc_sse).mockReset().mockReturnValue(7);
  vi.mocked(calc_besoin_ecs).mockReset().mockReturnValue({ besoin_ecs: 1 });
  vi.mocked(calc_besoin_fr)
    .mockReset()
    .mockImplementation(() => ({ besoin_fr: 5, besoin_fr_depensier: 6 }));
  vi.mocked(calc_ai)
    .mockReset()
    .mockImplementation(() => ({ apport_interne_ch: 10, apport_interne_fr: 20 }));
  vi.mocked(calc_as)
    .mockReset()
    .mockImplementation(() => ({ apport_solaire_ch: 30, apport_solaire_fr: 40 }));
});

/**
 * Calcul des apports et besoins (assembleur chauffage / froid / ECS)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf
 */
describe('calc_apport_et_besoin', () => {
  test('agrège les besoins, apports et volumes ECS (climatisation présente)', () => {
    const ret = calc_apport_et_besoin(
      logementFixture(),
      'maison',
      [],
      ['clim'],
      100,
      1,
      250,
      0,
      0,
      0
    );

    expect(ret.nadeq).toBe(2.5);
    // volumes d'ECS journaliers : 56 L et 79 L (dépensier) par adulte équivalent
    expect(ret.v40_ecs_journalier).toBe(140);
    expect(ret.v40_ecs_journalier_depensier).toBe(197.5);
    expect(ret.surface_sud_equivalente).toBe(7);
    // fusion des retours délégués
    expect(ret.besoin_ecs).toBe(1);
    expect(ret.besoin_fr).toBe(5);
    expect(ret.besoin_fr_depensier).toBe(6);
    expect(ret.apport_interne_fr).toBe(20);
    expect(ret.apport_solaire_fr).toBe(40);
    expect(ret.apport_interne_ch).toBe(10);
    expect(ret.apport_solaire_ch).toBe(30);
  });

  test('délègue avec les bons libellés (altitude/zone/inertie) et collections', () => {
    const logement = logementFixture();
    calc_apport_et_besoin(logement, 'maison', [], ['clim'], 100, 1, 250, 4, 0, 0);

    expect(calculateNadeq).toHaveBeenCalledWith(logement);
    expect(calc_besoin_ecs).toHaveBeenCalledWith('ca1', 'h1a', 2.5);
    expect(calc_besoin_fr).toHaveBeenCalledWith(
      'ca1',
      'h1a',
      100,
      2.5,
      250,
      'moyenne',
      ['bv'],
      ['ets']
    );
    // les apports internes/solaires reçoivent l'indicateur ilpa
    expect(calc_ai).toHaveBeenCalledWith(4, 'ca1', 'h1a', 100, 2.5);
    expect(calc_as).toHaveBeenCalledWith(4, 'ca1', 'h1a', ['bv'], ['ets']);
    expect(calc_sse).toHaveBeenCalledWith('ca1', 'h1a', ['bv'], ['ets']);
  });

  test('sans climatisation : besoins de froid et apports de froid remis à zéro', () => {
    const ret = calc_apport_et_besoin(logementFixture(), 'maison', [], [], 100, 1, 250, 0, 0, 0);

    expect(ret.besoin_fr).toBe(0);
    expect(ret.besoin_fr_depensier).toBe(0);
    expect(ret.apport_interne_fr).toBe(0);
    expect(ret.apport_solaire_fr).toBe(0);
    // les apports de chauffage restent inchangés
    expect(ret.apport_interne_ch).toBe(10);
    expect(ret.apport_solaire_ch).toBe(30);
  });
});
