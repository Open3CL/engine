import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `9_emetteur_ch.js` :
 * - `tv` : accès générique aux tables (rendements d'émission / de régulation /
 *   intermittence). On pilote la ligne retournée selon la table interrogée ;
 * - `bug_for_bug_compat` : désactivé pour rester sur le comportement nominal ;
 * - `TvsStore` : store des rendements de distribution, remplacé par une classe
 *   factice dont on contrôle les méthodes via `vi.hoisted`.
 */
const { getRendementDistributionCh, getRendementDistributionChById } = vi.hoisted(() => ({
  getRendementDistributionCh: vi.fn(),
  getRendementDistributionChById: vi.fn()
}));

vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  bug_for_bug_compat: false
}));

vi.mock('./core/tv/infrastructure/tvs.store.js', () => ({
  TvsStore: vi.fn(() => ({
    getRendementDistributionCh,
    getRendementDistributionChById
  }))
}));

const { rendement_emission, calc_emetteur_ch } = await import('./9_emetteur_ch.js');
const { tv } = await import('./utils.js');

beforeEach(() => {
  vi.mocked(tv).mockReset();
  getRendementDistributionCh.mockReset();
  getRendementDistributionChById.mockReset();
});

/**
 * 9. Rendements des émetteurs de chauffage
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9
 */
describe('rendement_emission - produit des rendements', () => {
  const emetteur = {
    donnee_intermediaire: {
      rendement_emission: 0.95,
      rendement_distribution: 0.9,
      rendement_regulation: 0.9
    }
  };

  test('rendement global = rg * re * rd * rr (rg = 1 par défaut)', () => {
    expect(rendement_emission(emetteur)).toBeCloseTo(0.7695, 12);
  });

  test('le rendement de génération (rg) est appliqué en facteur', () => {
    expect(rendement_emission(emetteur, 0.8)).toBeCloseTo(0.6156, 12);
  });
});

describe('calc_emetteur_ch - renseignement des données intermédiaires', () => {
  /** Pilote la fonction `tv` selon la table interrogée. */
  function stubTv() {
    vi.mocked(tv).mockImplementation((table) => {
      if (table === 'rendement_emission') {
        return { re: '0.95', tv_rendement_emission_id: '11' };
      }
      if (table === 'rendement_regulation') {
        return { rr: '0.99', tv_rendement_regulation_id: '22' };
      }
      if (table === 'intermittence') {
        return { i0: '0.85', tv_intermittence_id: '33' };
      }
      return null;
    });
  }

  test("agrège les rendements (distribution, émission, régulation) et l'intermittence", () => {
    stubTv();
    getRendementDistributionCh.mockReturnValue({
      rd: '0.92',
      tv_rendement_distribution_ch_id: '44'
    });

    const em_ch = {
      donnee_entree: {
        enum_type_emission_distribution_id: '10',
        reseau_distribution_isole: 1
      }
    };
    calc_emetteur_ch(em_ch, { enum_type_installation_id: '1' }, '2', '3');

    expect(em_ch.donnee_intermediaire).toEqual({
      rendement_distribution: 0.92,
      rendement_emission: 0.95,
      rendement_regulation: 0.99,
      i0: 0.85
    });
    // les identifiants de table sont réécrits en nombres sur la donnée d'entrée
    expect(em_ch.donnee_entree.tv_rendement_distribution_ch_id).toBe(44);
    expect(em_ch.donnee_entree.tv_rendement_emission_id).toBe(11);
    expect(em_ch.donnee_entree.tv_rendement_regulation_id).toBe(22);
    expect(em_ch.donnee_entree.tv_intermittence_id).toBe(33);
    expect(em_ch.donnee_utilisateur).toEqual({});
  });

  test('rendement de distribution : repli sur la recherche par identifiant si aucune ligne directe', () => {
    stubTv();
    getRendementDistributionCh.mockReturnValue(undefined);
    getRendementDistributionChById.mockReturnValue({
      rd: '0.88',
      tv_rendement_distribution_ch_id: '55'
    });

    const em_ch = {
      donnee_entree: {
        enum_type_emission_distribution_id: '10',
        tv_rendement_distribution_ch_id: 55
      }
    };
    calc_emetteur_ch(em_ch, { enum_type_installation_id: '1' }, '2', '3');

    expect(getRendementDistributionChById).toHaveBeenCalledWith(55);
    expect(em_ch.donnee_intermediaire.rendement_distribution).toBe(0.88);
  });

  test("intermittence : la fiche technique de comptage force la présence d'un comptage individuel", () => {
    stubTv();
    getRendementDistributionCh.mockReturnValue({
      rd: '0.92',
      tv_rendement_distribution_ch_id: '44'
    });

    const em_ch = {
      donnee_entree: {
        enum_type_emission_distribution_id: '10',
        enum_type_chauffage_id: '1',
        enum_equipement_intermittence_id: '1',
        enum_type_regulation_id: '1'
      }
    };
    // map_id === '1' => la classe d'inertie entre dans le matcher
    calc_emetteur_ch(
      em_ch,
      {
        enum_type_installation_id: '1',
        ficheTechniqueComptage: { valeur: '1' }
      },
      '1',
      '7'
    );

    const matcher = vi.mocked(tv).mock.calls.find((c) => c[0] === 'intermittence')[1];
    expect(matcher.comptage_individuel).toBe('Présence');
    expect(matcher.enum_methode_application_dpe_log_id).toBe('1');
    expect(matcher.enum_classe_inertie_id).toBe('7');
  });

  test('intermittence : absence de comptage individuel hors fiche technique', () => {
    stubTv();
    getRendementDistributionCh.mockReturnValue({
      rd: '0.92',
      tv_rendement_distribution_ch_id: '44'
    });

    const em_ch = {
      donnee_entree: { enum_type_emission_distribution_id: '10' }
    };
    // map_id !== '1' => pas de classe d'inertie dans le matcher
    calc_emetteur_ch(em_ch, { enum_type_installation_id: '1' }, '2', '3');

    const matcher = vi.mocked(tv).mock.calls.find((c) => c[0] === 'intermittence')[1];
    expect(matcher.comptage_individuel).toBe('Absence');
    expect(matcher.enum_classe_inertie_id).toBeUndefined();
  });
});
