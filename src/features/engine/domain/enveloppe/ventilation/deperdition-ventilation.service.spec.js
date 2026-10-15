import { beforeEach, describe, expect, test, vi } from 'vitest';

/** `bug_for_bug_compat` (utils.js) piloté par le test. */
const state = vi.hoisted(() => ({ bug: false }));
vi.mock('../../../../../utils.js', async (importOriginal) => ({
  ...(await importOriginal()),
  get bug_for_bug_compat() {
    return state.bug;
  }
}));

const { DeperditionVentilationService } = await import('./deperdition-ventilation.service.js');

/**
 * Tests unitaires isolés du calcul de Q4Paconv (`DeperditionVentilationService.q4paConv`).
 * Le store des tables de valeurs est remplacé par un double de test.
 *
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §4
 */

/** @type {DeperditionVentilationService} */
let service;
let tvStore;

const ctx = { enumPeriodeConstructionId: '1', typeHabitation: 'APPARTEMENT' };

describe('DeperditionVentilationService.q4paConv', () => {
  beforeEach(() => {
    tvStore = {
      getQ4paConv: vi.fn().mockReturnValue({ q4pa_conv: '4.6' }),
      getQ4paConvById: vi.fn()
    };
    service = new DeperditionVentilationService(tvStore);
    state.bug = false;
  });

  test('Q4Pa mesuré saisi : utilisé directement', () => {
    expect(service.q4paConv({ q4pa_conv_saisi: 1.7 }, ctx, 0, 100, 0, 10, true)).toBe(1.7);
    expect(tvStore.getQ4paConv).not.toHaveBeenCalled();
  });

  test('avant 1948, menuiseries majoritairement avec joints : ligne « avec joints »', () => {
    service.q4paConv({}, ctx, 0, 100, 8, 2, false);
    expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '0', '1');
  });

  test('avant 1948, menuiseries sans joint : ligne sans critère de joints', () => {
    service.q4paConv({ tv_q4pa_conv_id: 12 }, ctx, 0, 100, 0, 10, false);
    expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '0', undefined);
  });

  describe('presence_joint non exporté (issue #294)', () => {
    test('hors bug_for_bug_compat : la ligne du DPE est ignorée', () => {
      state.bug = false;
      tvStore.getQ4paConvById.mockReturnValue({ presence_joints_menuiserie: '1' });

      service.q4paConv({ tv_q4pa_conv_id: 12 }, ctx, 0, 100, 0, 10, true);

      expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '0', undefined);
    });

    test('bug_for_bug_compat et ligne DPE « avec joints » : joints repris', () => {
      state.bug = true;
      tvStore.getQ4paConvById.mockReturnValue({ presence_joints_menuiserie: '1' });

      service.q4paConv({ tv_q4pa_conv_id: 12 }, ctx, 0, 100, 0, 10, true);

      expect(tvStore.getQ4paConvById).toHaveBeenCalledWith(12);
      expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '0', '1');
    });

    test('bug_for_bug_compat mais presence_joint renseigné : pas de reprise', () => {
      state.bug = true;
      tvStore.getQ4paConvById.mockReturnValue({ presence_joints_menuiserie: '1' });

      service.q4paConv({ tv_q4pa_conv_id: 12 }, ctx, 0, 100, 0, 10, false);

      expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '0', undefined);
    });

    test('bug_for_bug_compat et ligne DPE sans joints : pas de reprise', () => {
      state.bug = true;
      tvStore.getQ4paConvById.mockReturnValue({ presence_joints_menuiserie: '' });

      service.q4paConv({ tv_q4pa_conv_id: 1 }, ctx, 0, 100, 0, 10, true);

      expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '0', undefined);
    });

    test('surfaces majoritairement isolées : le critère des joints ne s’applique pas', () => {
      state.bug = true;
      tvStore.getQ4paConvById.mockReturnValue({ presence_joints_menuiserie: '1' });

      service.q4paConv({ tv_q4pa_conv_id: 12 }, ctx, 100, 0, 0, 10, true);

      expect(tvStore.getQ4paConvById).not.toHaveBeenCalled();
      expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '1', undefined);
    });
  });
});
