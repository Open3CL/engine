import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DeperditionPlancherBasService } from './deperdition-plancher-bas.service.js';

/**
 * Tests unitaires isolés de `DeperditionPlancherBasService` (nouvelle architecture).
 *
 * Le `TvStore` est remplacé par un double de test (spies `vi.fn`) et le coefficient b (classe de
 * base) est espionné : seule la logique propre au service (Upb0, Upb, Ue, type d'isolation) est
 * vérifiée, sans dépendre des tables de valeurs réelles.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.2.2
 */

/** @type {{ getUpb0: import('vitest').Mock, getUpb: import('vitest').Mock, getUeByUpd: import('vitest').Mock }} */
let tvStore;

/** @type {DeperditionPlancherBasService} */
let service;

const ctx = {
  zoneClimatique: { id: '1', value: 'h1a' },
  effetJoule: false,
  enumPeriodeConstructionId: '1'
};

beforeEach(() => {
  tvStore = {
    getUpb0: vi.fn(() => 1.45),
    getUpb: vi.fn(() => 0.4),
    getUeByUpd: vi.fn(() => 0.385384615)
  };
  service = new DeperditionPlancherBasService(tvStore);
  vi.spyOn(service, 'b').mockReturnValue(1);
});

/** Plancher non isolé, U0 forfaitaire, adjacence extérieur par défaut. */
const plancherDE = (donnees = {}) => ({
  enum_methode_saisie_u0_id: '2',
  enum_methode_saisie_u_id: '1',
  enum_type_plancher_bas_id: '2',
  enum_type_adjacence_id: '1',
  ...donnees
});

describe('DeperditionPlancherBasService - execute()', () => {
  test('transmet les données du plancher au calcul de b', () => {
    const pbDE = plancherDE({
      surface_aiu: 10,
      surface_aue: 20,
      enum_cfg_isolation_lnc_id: '3'
    });

    const di = service.execute(ctx, pbDE);

    expect(service.b).toHaveBeenCalledWith({
      enumTypeAdjacenceId: '1',
      surfaceAiu: 10,
      surfaceAue: 20,
      enumCfgIsolationLncId: '3',
      zoneClimatique: 'h1a'
    });
    expect(di).toEqual({ upb0: 1.45, upb: 1.45, upb_final: 1.45, b: 1 });
  });
});

describe('DeperditionPlancherBasService - calcul de Upb0', () => {
  test.each(['1', '2'])('méthode u0 %s : valeur forfaitaire de la table upb0', (methode) => {
    const di = service.execute(ctx, plancherDE({ enum_methode_saisie_u0_id: methode }));

    expect(tvStore.getUpb0).toHaveBeenCalledWith('2');
    expect(di.upb0).toBe(1.45);
  });

  test('méthode u0 5 (u saisi) : upb0 non déterminé', () => {
    const di = service.execute(
      ctx,
      plancherDE({ enum_methode_saisie_u0_id: '5', enum_methode_saisie_u_id: '9', upb_saisi: 0.3 })
    );

    expect(di.upb0).toBeUndefined();
    expect(di.upb).toBe(0.3);
  });

  test('u0 saisi : valeur saisie retenue', () => {
    const di = service.execute(
      ctx,
      plancherDE({ enum_methode_saisie_u0_id: '3', upb0_saisi: 1.2 })
    );

    expect(tvStore.getUpb0).not.toHaveBeenCalled();
    expect(di.upb0).toBe(1.2);
  });
});

describe('DeperditionPlancherBasService - calcul de Upb', () => {
  test('non isolé : upb = min(upb0, 2)', () => {
    tvStore.getUpb0.mockReturnValue(3);

    expect(service.execute(ctx, plancherDE()).upb).toBe(2);
  });

  test.each(['2', '7', '8'])(
    'méthode u %s (table forfaitaire) : min(upb nu, upb de la table)',
    (methode) => {
      const di = service.execute(ctx, plancherDE({ enum_methode_saisie_u_id: methode }));

      // Construction avant 1975 sans période d'isolation => période d'isolation 3 (1975-1977)
      expect(tvStore.getUpb).toHaveBeenCalledWith('3', '1', false);
      expect(di.upb).toBe(0.4);
    }
  );

  test.each(['3', '4'])('méthode u %s : épaisseur d’isolation', (methode) => {
    const di = service.execute(
      ctx,
      plancherDE({ enum_methode_saisie_u_id: methode, epaisseur_isolation: 10 })
    );

    // 1 / (1 / 1,45 + 0,1 / 0,042) arrondi à 1e-5 (valeur de référence de régression)
    expect(di.upb).toBe(0.32567);
  });

  test.each(['5', '6'])('méthode u %s : résistance d’isolation', (methode) => {
    const di = service.execute(
      ctx,
      plancherDE({ enum_methode_saisie_u_id: methode, resistance_isolation: 2 })
    );

    // 1 / (1 / 1,45 + 2) arrondi à 1e-5 (valeur de référence de régression)
    expect(di.upb).toBe(0.37179);
  });

  test('saisie directe : upb saisi', () => {
    const di = service.execute(ctx, plancherDE({ enum_methode_saisie_u_id: '9', upb_saisi: 0.25 }));

    expect(di.upb).toBe(0.25);
  });
});

describe('DeperditionPlancherBasService - calcul de upb_final (Ue)', () => {
  test('calcul_ue = 1 : ue du DPE retenu', () => {
    const di = service.execute(
      ctx,
      plancherDE({ enum_type_adjacence_id: '5', calcul_ue: 1, ue: 0.38538462 })
    );

    expect(di.upb_final).toBe(0.38538462);
    expect(tvStore.getUeByUpd).not.toHaveBeenCalled();
  });

  test('adjacence sans Ue (extérieur) : upb_final = upb', () => {
    const di = service.execute(ctx, plancherDE({ enum_type_adjacence_id: '1' }));

    expect(di.upb_final).toBe(1.45);
    expect(tvStore.getUeByUpd).not.toHaveBeenCalled();
  });

  /**
   * Issue #46 : ue calculé plancher par plancher, 2S/P issu du seul plancher courant.
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.2.2 (tableau ue)
   */
  describe('calcul plancher par plancher (#46)', () => {
    test('2187E0982591I plancher 1 : 2S/P = 2 * 44,8 / 12,8 = 7', () => {
      const di = service.execute(
        ctx,
        plancherDE({ enum_type_adjacence_id: '5', surface_paroi_opaque: 44.8, perimetre_ue: 12.8 })
      );

      expect(tvStore.getUeByUpd).toHaveBeenCalledWith('5', '1', 7, 1.45);
      expect(di.upb_final).toBe(0.38538);
    });

    test('deux planchers de même adjacence : chacun son propre 2S/P', () => {
      const pbA = plancherDE({
        enum_type_adjacence_id: '5',
        surface_paroi_opaque: 50,
        surface_ue: 70,
        perimetre_ue: 20
      });
      const pbB = plancherDE({
        enum_type_adjacence_id: '5',
        surface_paroi_opaque: 50,
        surface_ue: 10,
        perimetre_ue: 10
      });
      tvStore.getUeByUpd.mockImplementation((adj, pc, dsp) => (dsp === 7 ? 0.38 : 0.78));

      const diA = service.execute(ctx, pbA);
      const diB = service.execute(ctx, pbB);

      // pbA : 2 * 70 / 20 = 7 ; pbB : 2 * 10 / 10 = 2 (somme par adjacence : 2 * 80 / 30 => 5)
      expect(tvStore.getUeByUpd).toHaveBeenNthCalledWith(1, '5', '1', 7, 1.45);
      expect(tvStore.getUeByUpd).toHaveBeenNthCalledWith(2, '5', '1', 2, 1.45);
      expect(diA.upb_final).toBe(0.38);
      expect(diB.upb_final).toBe(0.78);
    });

    test('surface_ue absente : surface_paroi_opaque utilisée', () => {
      service.execute(
        ctx,
        plancherDE({ enum_type_adjacence_id: '3', surface_paroi_opaque: 20, perimetre_ue: 10 })
      );

      expect(tvStore.getUeByUpd).toHaveBeenCalledWith('3', '1', 4, 1.45);
    });

    test('2S/P hors tableau : valeur disponible la plus proche (11 => 10)', () => {
      service.execute(
        ctx,
        plancherDE({ enum_type_adjacence_id: '6', surface_ue: 55, perimetre_ue: 10 })
      );

      expect(tvStore.getUeByUpd).toHaveBeenCalledWith('6', '1', 10, 1.45);
    });

    test('perimetre_ue absent : 2S/P = 1 (comportement inchangé)', () => {
      service.execute(ctx, plancherDE({ enum_type_adjacence_id: '5', surface_paroi_opaque: 20 }));

      expect(tvStore.getUeByUpd).toHaveBeenCalledWith('5', '1', 1, 1.45);
    });
  });
});

describe('DeperditionPlancherBasService - typeIsolation()', () => {
  test.each([
    ['terre-plein avant 2001', '5', undefined, '6', 2],
    ['terre-plein à partir de 2001', '5', undefined, '7', 4],
    ['terre-plein, période d’isolation prioritaire', '5', '7', '1', 4],
    ['autre adjacence avant 1975', '3', undefined, '2', 2],
    ['autre adjacence à partir de 1975', '3', undefined, '3', 4]
  ])('isolation inconnue, %s', (_, adjacence, periodeIsolation, periodeConstruction, attendu) => {
    expect(
      service.typeIsolation(
        { enumPeriodeConstructionId: periodeConstruction },
        {
          enum_type_isolation_id: '1',
          enum_type_adjacence_id: adjacence,
          enum_periode_isolation_id: periodeIsolation
        }
      )
    ).toBe(attendu);
  });

  test('isolé mais type d’isolation inconnu (9) : ITE (4)', () => {
    expect(service.typeIsolation(ctx, { enum_type_isolation_id: '9' })).toBe(4);
  });

  test('type d’isolation connu : renvoyé tel quel', () => {
    expect(service.typeIsolation(ctx, { enum_type_isolation_id: '3' })).toBe(3);
  });
});
