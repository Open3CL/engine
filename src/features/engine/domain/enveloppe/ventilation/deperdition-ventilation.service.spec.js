import { beforeEach, describe, expect, test, vi } from 'vitest';

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
      getQ4paConv: vi.fn().mockReturnValue({ q4pa_conv: '4.6' })
    };
    service = new DeperditionVentilationService(tvStore);
  });

  test('Q4Pa mesuré saisi : utilisé directement', () => {
    expect(service.q4paConv({ q4pa_conv_saisi: 1.7 }, ctx, 0, 100, 0, 10)).toBe(1.7);
    expect(tvStore.getQ4paConv).not.toHaveBeenCalled();
  });

  test('avant 1948, menuiseries majoritairement avec joints : ligne « avec joints »', () => {
    service.q4paConv({}, ctx, 0, 100, 8, 2);
    expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '0', '1');
  });

  test('avant 1948, menuiseries sans joint : ligne sans critère de joints', () => {
    service.q4paConv({}, ctx, 0, 100, 0, 10);
    expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '0', undefined);
  });

  test('ligne q4pa_conv du DPE « avec joints » contradictoire : valeur recalculée', () => {
    // La ligne 12 « avant 1948 avec joints » choisie par le logiciel n'est pas reprise
    const q4pa = service.q4paConv({ tv_q4pa_conv_id: 12 }, ctx, 0, 100, 0, 10);
    expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '0', undefined);
    expect(q4pa).toBe('4.6');
  });

  test('surfaces majoritairement isolées : le critère des joints ne s’applique pas', () => {
    service.q4paConv({ tv_q4pa_conv_id: 12 }, ctx, 100, 0, 0, 10);
    expect(tvStore.getQ4paConv).toHaveBeenCalledWith('1', 'APPARTEMENT', '1', undefined);
  });
});
