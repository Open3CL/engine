import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_gen_ecs` et ses fonctions de rendement :
 * - `enums` : libellés des types de générateur / installation / zone ;
 * - `utils` : `tv`, `tvColumnIDs`, `requestInput(ID)`, `Tbase` contrôlés, `bug_for_bug_compat` désactivé ;
 * - `tv_generateur_combustion` : injecte les caractéristiques (rpn, qp0, pveil) du générateur ;
 * - `scopOrCop` : injecte le SCOP pour les pompes à chaleur ;
 * - `conso_aux_gen`, `updateGenerateurCombustion`, `getFicheTechnique` : neutralisés.
 * Aucune vraie table de valeurs n'est utilisée : les tests restent stables si les données changent.
 */
const state = vi.hoisted(() => ({ bug: false }));

vi.mock('./enums.js', () => ({
  default: {
    type_generateur_ecs: {
      60: 'ballon électrique à accumulation vertical',
      61: 'ballon électrique à accumulation vertical catégorie c ou 3 étoiles',
      gaz: 'chauffe-eau gaz',
      chaud: 'chaudière gaz condensation',
      accu: 'accumulateur gaz',
      pac: 'pac double service',
      autre: 'générateur non implémenté',
      combautre: 'foyer fermé bois à combustion',
      84: 'chaudière fioul (système collectif par défaut)'
    },
    type_generateur_ch: { chaud_ch: 'chaudière gaz condensation' },
    classe_altitude: { 1: 'ca1' },
    zone_climatique: { 1: 'h1a' },
    type_installation_solaire: { 1: 'installation solaire' }
  }
}));

vi.mock('./utils.js', () => ({
  get bug_for_bug_compat() {
    return state.bug;
  },
  getVolumeStockageFromDescription: vi.fn(),
  requestInput: vi.fn((de, du, field) => de[field]),
  requestInputID: vi.fn((de, du, field) => de[`enum_${field}_id`]),
  Tbase: { ca1: { h1: -5 } },
  tv: vi.fn(),
  tvColumnIDs: vi.fn(() => [])
}));

vi.mock('./13.2_generateur_combustion.js', () => ({
  tv_generateur_combustion: vi.fn(),
  updateGenerateurCombustion: vi.fn()
}));

vi.mock('./15_conso_aux.js', () => ({
  conso_aux_gen: vi.fn()
}));

vi.mock('./12.4_pac.js', () => ({
  scopOrCop: vi.fn()
}));

vi.mock('./ficheTechnique.js', () => ({
  default: vi.fn()
}));

const {
  default: calc_gen_ecs,
  rg_chauffe_eau_gaz,
  rgrs_chaudiere,
  rg_accumulateur_gaz,
  rgrsReseauUrbain
} = await import('./14_generateur_ecs.js');
const { tvColumnIDs, requestInput, requestInputID, tv, getVolumeStockageFromDescription } =
  await import('./utils.js');
const { tv_generateur_combustion } = await import('./13.2_generateur_combustion.js');
const { scopOrCop } = await import('./12.4_pac.js');
const { default: getFicheTechnique } = await import('./ficheTechnique.js');

/**
 * 14. Générateur d'ECS : rendements et consommations
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §14
 */
describe('rendements de génération (fonctions pures)', () => {
  const di = { rpn: 0.9, qp0: 0.1, pveil: 0.02, Qgw: 1000 };

  test('rg_chauffe_eau_gaz : valeur de référence', () => {
    // valeur de référence de régression
    expect(rg_chauffe_eau_gaz(di, 100)).toBeCloseTo(0.8974283293793307, 9);
  });

  test('rgrs_chaudiere : valeur de référence (prend en compte Qgw et 0.5·pveil)', () => {
    // valeur de référence de régression
    expect(rgrs_chaudiere(di, 100)).toBeCloseTo(0.8899979361936746, 9);
  });

  test('rg_accumulateur_gaz : valeur de référence', () => {
    // valeur de référence de régression
    expect(rg_accumulateur_gaz(di, 100)).toBeCloseTo(0.8840973866670649, 9);
  });

  test('un besoin ECS plus grand rapproche le rendement du rendement à pleine charge', () => {
    expect(rg_chauffe_eau_gaz(di, 100000)).toBeGreaterThan(rg_chauffe_eau_gaz(di, 100));
  });
});

/**
 * Réseau de chaleur : rendement forfaitaire selon le caractère isolé.
 */
describe('rgrsReseauUrbain - rendement d’un réseau de chaleur', () => {
  test('type 73 (réseau isolé) : 0.9', () => {
    expect(rgrsReseauUrbain({ enum_type_generateur_ecs_id: '73' }, {})).toBe(0.9);
  });

  test('réseau marqué isolé au niveau de l’installation : 0.9', () => {
    expect(
      rgrsReseauUrbain({ enum_type_generateur_ecs_id: '72' }, { reseau_distribution_isole: 1 })
    ).toBe(0.9);
  });

  test('réseau non isolé par défaut : 0.75', () => {
    expect(
      rgrsReseauUrbain({ enum_type_generateur_ecs_id: '72' }, { reseau_distribution_isole: 0 })
    ).toBe(0.75);
  });
});

/**
 * calc_gen_ecs : sélection de la branche de rendement selon le type d'énergie / générateur.
 */
describe('calc_gen_ecs - consommation par générateur', () => {
  let ecs_di;
  let ecs_de;

  beforeEach(() => {
    vi.mocked(tvColumnIDs).mockReset().mockReturnValue([]);
    vi.mocked(requestInput)
      .mockReset()
      .mockImplementation((de, du, field) => de[field]);
    vi.mocked(requestInputID)
      .mockReset()
      .mockImplementation((de, du, field) => de[`enum_${field}_id`]);
    vi.mocked(tv_generateur_combustion).mockReset();
    vi.mocked(scopOrCop).mockReset();
    vi.mocked(tv).mockReset();
    vi.mocked(getVolumeStockageFromDescription).mockReset();
    vi.mocked(getFicheTechnique).mockReset();
    state.bug = false;

    ecs_di = { besoin_ecs: 100, besoin_ecs_depensier: 150, rendement_distribution: 0.9 };
    ecs_de = { enum_type_installation_id: '1' };
  });

  /** Données d'entrée d'un générateur, avec absence de stockage par défaut (Qgw = 0). */
  function gen(deExtra) {
    return {
      donnee_entree: {
        usage_generateur: 'ecs',
        type_stockage_ecs: "abscence de stockage d'ecs (production instantanée)",
        volume_stockage: 0,
        ...deExtra
      }
    };
  }

  test('générateur électrique sans stockage (Qgw = 0) : conso = besoin / rd', () => {
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: '60' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(g.donnee_intermediaire.rendement_stockage).toBeCloseTo(1, 9);
    // valeur de référence de régression : 100 / 0.9
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(111.11111111111111, 9);
    expect(g.donnee_intermediaire.conso_ecs_depensier).toBeCloseTo(166.66666666666666, 9);
  });

  test('ballon électrique 3 étoiles : bonus de 8 % sur le rendement de stockage', () => {
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: '61' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(g.donnee_intermediaire.rendement_stockage).toBeCloseTo(1.08, 9);
    // valeur de référence de régression : 100 / (1.08 * 0.9)
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(102.88065843621398, 9);
  });

  test('réseau de chaleur isolé (type 73) : rendement 0.9', () => {
    const g = gen({
      type_energie: 'réseau de chauffage urbain',
      enum_type_generateur_ecs_id: '73'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'immeuble');

    expect(g.donnee_intermediaire.rendement_generation_stockage).toBe(0.9);
    // valeur de référence de régression : 100 / (0.9 * 0.9)
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(123.45679012345678, 9);
  });

  test('pompe à chaleur : consommation pilotée par le SCOP', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) => (table === 'scop' ? ['pac'] : []));
    vi.mocked(scopOrCop).mockImplementation((di) => {
      di.scop = 3;
    });
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: 'pac' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(scopOrCop).toHaveBeenCalled();
    // valeur de référence de régression : 100 / 3 / 0.9
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(37.03703703703703, 9);
  });

  test('chauffe-eau gaz (combustion) : rendement calculé par rg_chauffe_eau_gaz', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'generateur_combustion' ? ['gaz'] : []
    );
    vi.mocked(tv_generateur_combustion).mockImplementation((dpe, di) => {
      di.rpn = 0.9;
      di.qp0 = 0.1;
      di.pveil = 0.02;
      di.pveilleuse = 1;
      di.pn = 5000;
    });
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'gaz',
      enum_methode_saisie_carac_sys_id: '1'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(g.donnee_intermediaire.rendement_generation).toBeCloseTo(0.8974283293793307, 9);
    // valeur de référence de régression : 100 / (0.8974283293793307 * 0.9)
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(123.81056790123455, 9);
  });

  test('installation solaire : la couverture solaire réduit la consommation', () => {
    ecs_de.enum_type_installation_solaire_id = '1';
    ecs_de.fecs_saisi = 0.5;
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: '60' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(ecs_di.fecs).toBe(0.5);
    // valeur de référence de régression : 100 * (1 - 0.5) / 0.9
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(55.55555555555556, 9);
  });

  test('type d’énergie non pris en charge : rendement neutre (Iecs = 1)', () => {
    const g = gen({ type_energie: 'bois', enum_type_generateur_ecs_id: 'autre' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // aucune branche spécifique : conso = besoin / rd
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(111.11111111111111, 9);
  });

  /**
   * 14.1 - Pertes de stockage forfaitaires (générateur électrique à accumulation).
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §14.1
   */
  test('électrique avec stockage : pertes de stockage forfaitaires et matcher de volume', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'pertes_stockage' ? ['60'] : []
    );
    vi.mocked(tv).mockReturnValue({ cr: '0.5', tv_pertes_stockage_id: '7' });
    const g = gen({
      type_energie: 'électricité',
      enum_type_generateur_ecs_id: '60',
      type_stockage_ecs: 'ballon vertical',
      volume_stockage: 150
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // Volume 150 -> plage '100 <   ≤ 200'
    expect(tv).toHaveBeenCalledWith('pertes_stockage', {
      enum_type_generateur_ecs_id: '60',
      volume_ballon: '100 <   ≤ 200'
    });
    // Qgw = (8592 * 45 / 24) * Vs * cr * ratio -- valeur de référence de régression
    expect(g.donnee_intermediaire.Qgw).toBe(1208250);
    expect(g.donnee_entree.tv_pertes_stockage_id).toBe(7);
    // cr est supprimé après usage
    expect(g.donnee_intermediaire.cr).toBeUndefined();
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(1319.361111111111, 9);
    expect(g.donnee_intermediaire.conso_ecs_depensier).toBeCloseTo(1374.9166666666667, 9);
  });

  test.each([
    [50, '≤ 100'],
    [150, '100 <   ≤ 200'],
    [250, '200 <   ≤ 300'],
    [400, '> 300']
  ])('plage de volume de ballon : %s L -> %s', (volume, plageAttendue) => {
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'pertes_stockage' ? ['60'] : []
    );
    vi.mocked(tv).mockReturnValue({ cr: '0.4', tv_pertes_stockage_id: '7' });
    const g = gen({
      type_energie: 'électricité',
      enum_type_generateur_ecs_id: '60',
      type_stockage_ecs: 'ballon',
      volume_stockage: volume
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(tv).toHaveBeenCalledWith('pertes_stockage', {
      enum_type_generateur_ecs_id: '60',
      volume_ballon: plageAttendue
    });
  });

  test('pertes de stockage introuvables : erreur signalée, cr non renseigné', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'pertes_stockage' ? ['60'] : []
    );
    vi.mocked(tv).mockReturnValue(undefined);
    const g = gen({
      type_energie: 'électricité',
      enum_type_generateur_ecs_id: '60',
      type_stockage_ecs: 'ballon',
      volume_stockage: 150
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(errSpy).toHaveBeenCalledWith('!! pas de valeur forfaitaire trouvée pour cr !!');
    errSpy.mockRestore();
  });

  /**
   * 17.2.1 - Traitement des usages collectifs (ratio de virtualisation, volume issu de la fiche).
   */
  test('installation collective : volume de stockage lu dans la fiche technique', () => {
    vi.mocked(getFicheTechnique).mockReturnValue({ valeur: '150 L' });
    ecs_de.enum_type_installation_id = '2';
    ecs_de.ratio_virtualisation = 1;
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'autre',
      type_stockage_ecs: 'ballon',
      volume_stockage: 999
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'immeuble');

    // Vs issu de la fiche (150) -> Qgw = 67662 * 150^0.55 (générateur non électrique)
    expect(g.donnee_intermediaire.Qgw).toBeCloseTo(1064620.987190969, 9);
  });

  test('installation collective sans volume : repli sur parseFloat(Vs) / ratio', () => {
    // Fiche dont la valeur ne contient pas de volume exploitable -> VsFiche = 0
    vi.mocked(getFicheTechnique).mockReturnValue({ valeur: 'inconnu' });
    ecs_de.enum_type_installation_id = '2';
    ecs_de.ratio_virtualisation = 2;
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'autre',
      type_stockage_ecs: 'ballon',
      volume_stockage: 0
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'immeuble');

    // Vs = 0 -> Qgw = 67662 * 0^0.55 = 0
    expect(g.donnee_intermediaire.Qgw).toBe(0);
  });

  test('bug_for_bug_compat : volume proratisé recalé sur la description', () => {
    state.bug = true;
    vi.mocked(getVolumeStockageFromDescription).mockReturnValue(100);
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'autre',
      type_stockage_ecs: 'ballon',
      volume_stockage: 100
    });
    // ratio = 1 (non collectif) -> round(100 / 1) = 100 == description -> Vs = 100
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // Générateur non électrique -> Qgw = 67662 * 100^0.55
    expect(g.donnee_intermediaire.Qgw).toBeCloseTo(67662 * 100 ** 0.55, 9);
  });

  test('bug_for_bug_compat : type 84 électrique déduit de l’énergie, pertes via tv_pertes_stockage_id', () => {
    state.bug = true;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(tv).mockReturnValue({ cr: '0.5', tv_pertes_stockage_id: '9' });
    const g = gen({
      type_energie: 'électricité',
      enum_type_generateur_ecs_id: '84',
      enum_type_energie_id: '1',
      type_stockage_ecs: 'ballon',
      volume_stockage: 150,
      tv_pertes_stockage_id: '9'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // Type 84 : le matcher des pertes se fonde sur tv_pertes_stockage_id
    expect(tv).toHaveBeenCalledWith('pertes_stockage', { tv_pertes_stockage_id: '9' });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  /**
   * 18.4 - Facteur de couverture solaire forfaitaire.
   */
  test('couverture solaire forfaitaire (maison) : facteur issu de la table', () => {
    vi.mocked(tv).mockReturnValue({
      facteur_couverture_solaire: '0.4',
      tv_facteur_couverture_solaire_id: '3'
    });
    ecs_de.enum_type_installation_solaire_id = '1';
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: '60' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(tv).toHaveBeenCalledWith('facteur_couverture_solaire', {
      enum_zone_climatique_id: '1',
      type_installation_solaire: 'installation solaire',
      type_batiment: 'maison'
    });
    expect(ecs_di.fecs).toBe(0.4);
    expect(ecs_de.tv_facteur_couverture_solaire_id).toBe(3);
  });

  test('couverture solaire forfaitaire (immeuble) : type de bâtiment immeuble', () => {
    vi.mocked(tv).mockReturnValue({
      facteur_couverture_solaire: '0.3',
      tv_facteur_couverture_solaire_id: '4'
    });
    ecs_de.enum_type_installation_solaire_id = '1';
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: '60' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'immeuble');

    expect(tv).toHaveBeenCalledWith(
      'facteur_couverture_solaire',
      expect.objectContaining({ type_batiment: 'immeuble' })
    );
  });

  test('couverture solaire introuvable : erreur signalée', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(tv).mockReturnValue(undefined);
    ecs_de.enum_type_installation_solaire_id = '1';
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: '60' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(errSpy).toHaveBeenCalledWith(
      '!! pas de valeur forfaitaire trouvée pour facteur_couverture_solaire !!'
    );
    errSpy.mockRestore();
  });

  /**
   * 14.1.2 / 14.1.3 - Générateurs à combustion (chaudière, accumulateur).
   */
  test('chaudière combustion sans stockage (Qgw = 0) : rendement de génération direct', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'generateur_combustion' ? ['chaud'] : []
    );
    vi.mocked(tv_generateur_combustion).mockImplementation((dpe, di) => {
      di.rpn = 0.9;
      di.qp0 = 100;
      di.pn = 20000;
      di.pveilleuse = 0; // absence de veilleuse -> pveil forcé à 0
    });
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'chaud',
      enum_methode_saisie_carac_sys_id: '1'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // pveil ramené à 0 en l'absence de veilleuse
    expect(g.donnee_intermediaire.pveil).toBe(0);
    // valeurs de référence de régression
    expect(g.donnee_intermediaire.rendement_generation).toBeCloseTo(0.3446955189582535, 9);
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(322.3456790123457, 9);
  });

  test('chaudière combustion avec stockage (Qgw > 0) : rendement génération + stockage', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'generateur_combustion' ? ['chaud'] : []
    );
    vi.mocked(tv_generateur_combustion).mockImplementation((dpe, di) => {
      di.rpn = 0.9;
      di.qp0 = 100;
      di.pn = 20000;
      di.pveilleuse = 1;
      di.pveil = 0;
    });
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'chaud',
      enum_methode_saisie_carac_sys_id: '1',
      type_stockage_ecs: 'ballon',
      volume_stockage: 200
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(g.donnee_intermediaire.Qgw).toBeCloseTo(1247128.8571714761, 9);
    // valeur de référence de régression
    expect(g.donnee_intermediaire.rendement_generation_stockage).toBeCloseTo(
      0.06505165235309393,
      9
    );
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(1708.0444092028745, 9);
  });

  test('accumulateur gaz : qp0 recalculé (1.5 % de Pn) et rendement dédié', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'generateur_combustion' ? ['accu'] : []
    );
    vi.mocked(tv_generateur_combustion).mockImplementation((dpe, di) => {
      di.rpn = 0.9;
      di.qp0 = 999; // sera écrasé par 1.5 * pn / 100
      di.pn = 20000;
      di.pveilleuse = 1;
      di.pveil = 0;
    });
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'accu',
      enum_methode_saisie_carac_sys_id: '1'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // qp0 = 1.5 * 20000 / 100 = 300
    expect(g.donnee_intermediaire.qp0).toBe(300);
    // valeur de référence de régression
    expect(g.donnee_intermediaire.rendement_generation).toBeCloseTo(0.03719254165564666, 9);
  });

  test('générateur à combustion non implémenté : avertissement, aucun rendement', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'generateur_combustion' ? ['combautre'] : []
    );
    vi.mocked(tv_generateur_combustion).mockImplementation((dpe, di) => {
      di.rpn = 0.9;
      di.qp0 = 100;
      di.pn = 20000;
      di.pveilleuse = 1;
      di.pveil = 0;
    });
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'combautre',
      enum_methode_saisie_carac_sys_id: '1'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('bug_for_bug_compat : correction de qp0 (< 1) pour un générateur à combustion', () => {
    state.bug = true;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'generateur_combustion' ? ['chaud'] : []
    );
    vi.mocked(tv_generateur_combustion).mockImplementation((dpe, di) => {
      di.rpn = 0.9;
      di.qp0 = 0.1; // < 1 -> corrigé à 100
      di.pn = 20000;
      di.pveilleuse = 1;
      di.pveil = 0;
    });
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'chaud',
      enum_methode_saisie_carac_sys_id: '1'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(g.donnee_intermediaire.qp0).toBe(100);
    expect(g.donnee_intermediaire.rendement_generation).toBeCloseTo(0.3446955189582535, 9);
    warnSpy.mockRestore();
  });

  /**
   * Type 84 (système collectif par défaut) : détection combustion / PAC selon les données présentes.
   */
  test('type 84 combustion : le type de générateur ECS est déduit de la ligne combustion', () => {
    vi.mocked(tv).mockReturnValue({ enum_type_generateur_ecs_id: 'chaud|autre' });
    vi.mocked(tv_generateur_combustion).mockImplementation((dpe, di) => {
      di.rpn = 0.9;
      di.qp0 = 100;
      di.pn = 20000;
      di.pveilleuse = 1;
      di.pveil = 0;
    });
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: '84',
      tv_generateur_combustion_id: '42',
      enum_methode_saisie_carac_sys_id: '1'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // Premier type de la liste retenu pour le calcul du rendement
    expect(g.donnee_entree.enum_type_generateur_ecs_id).toBe('chaud');
    // La chaudière est bien calculée
    expect(g.donnee_intermediaire.rendement_generation).toBeCloseTo(0.3446955189582535, 9);
  });

  test('type 84 combustion : ligne combustion absente, aucun redressement du type', () => {
    vi.mocked(tv).mockReturnValue(undefined);
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: '84',
      tv_generateur_combustion_id: '42',
      enum_methode_saisie_carac_sys_id: '1'
    });
    // Générateur '84' n'est pas dans les combustion_ids : bascule sur la branche neutre (Iecs = 1)
    vi.mocked(tv_generateur_combustion).mockImplementation((dpe, di) => {
      di.rpn = 0.9;
      di.qp0 = 100;
      di.pn = 20000;
      di.pveilleuse = 1;
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // Type inchangé (pas de enum_type_generateur_ecs_id dans la ligne)
    expect(g.donnee_entree.enum_type_generateur_ecs_id).toBe('84');
  });

  test('type 84 pompe à chaleur : déduit via tv_scop_id', () => {
    vi.mocked(scopOrCop).mockImplementation((di) => {
      di.scop = 3;
    });
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: '84',
      tv_scop_id: '5',
      enum_methode_saisie_carac_sys_id: '1'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // Reconnu comme PAC -> consommation pilotée par le SCOP
    expect(scopOrCop).toHaveBeenCalled();
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(37.03703703703703, 9);
  });

  /**
   * Réseau de chaleur : redressement de reseau_distribution_isole (bug_for_bug_compat).
   */
  test('bug_for_bug_compat : rendement 0.9 saisi force reseau_distribution_isole à 1', () => {
    state.bug = true;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    ecs_de.enum_type_installation_id = '3';
    ecs_de.reseau_distribution_isole = 0;
    const g = {
      donnee_entree: {
        usage_generateur: 'ecs',
        type_stockage_ecs: "abscence de stockage d'ecs (production instantanée)",
        volume_stockage: 0,
        type_energie: 'réseau de chauffage urbain',
        enum_type_generateur_ecs_id: '72'
      },
      donnee_intermediaire: { rendement_generation_stockage: 0.9 }
    };
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'immeuble');

    expect(ecs_de.reseau_distribution_isole).toBe(1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('usage chauffage + ecs : type de générateur limité aux générateurs mixtes', () => {
    const g = gen({
      type_energie: 'électricité',
      enum_type_generateur_ecs_id: '60',
      usage_generateur: 'chauffage + ecs'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // Le générateur électrique conserve son calcul de rendement de stockage
    expect(g.donnee_intermediaire.rendement_stockage).toBeCloseTo(1, 9);
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(111.11111111111111, 9);
  });

  test('usage de générateur inconnu : avertissement, type de générateur non défini', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const g = gen({
      type_energie: 'électricité',
      enum_type_generateur_ecs_id: '60',
      usage_generateur: 'refroidissement'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(warnSpy).toHaveBeenCalledWith(
      "!! usage_generateur n'est pas 'ecs' ou 'chauffage + ecs' !!"
    );
    warnSpy.mockRestore();
  });

  test('collectif électrique : pertes de stockage calculées avec le volume collectif', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'pertes_stockage' ? ['60'] : []
    );
    vi.mocked(tv).mockReturnValue({ cr: '0.5', tv_pertes_stockage_id: '7' });
    ecs_de.enum_type_installation_id = '2';
    ecs_de.ratio_virtualisation = 1;
    const g = gen({
      type_energie: 'électricité',
      enum_type_generateur_ecs_id: '60',
      type_stockage_ecs: 'ballon',
      volume_stockage: 150
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'immeuble');

    // Volume collectif (150) transmis à tv_pertes_stockage
    expect(tv).toHaveBeenCalledWith('pertes_stockage', {
      enum_type_generateur_ecs_id: '60',
      volume_ballon: '100 <   ≤ 200'
    });
    expect(g.donnee_intermediaire.Qgw).toBe(1208250);
  });

  test('pompe à chaleur sans SCOP : la consommation est pilotée par le COP', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) => (table === 'scop' ? ['pac'] : []));
    vi.mocked(scopOrCop).mockImplementation((di) => {
      di.cop = 2.5;
    });
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: 'pac' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // valeur de référence de régression : 100 / 2.5 / 0.9
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(44.44444444444444, 9);
  });

  test('bug_for_bug_compat : rendement 0.75 saisi avec réseau marqué isolé -> avertissement', () => {
    state.bug = true;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    ecs_de.enum_type_installation_id = '3';
    ecs_de.reseau_distribution_isole = 1;
    const g = {
      donnee_entree: {
        usage_generateur: 'ecs',
        type_stockage_ecs: "abscence de stockage d'ecs (production instantanée)",
        volume_stockage: 0,
        type_energie: 'réseau de chauffage urbain',
        enum_type_generateur_ecs_id: '72',
        description: 'RCU'
      },
      donnee_intermediaire: { rendement_generation_stockage: 0.75 }
    };
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'immeuble');

    // Le réseau reste isolé (0.9) car reseau_distribution_isole = 1
    expect(g.donnee_intermediaire.rendement_generation_stockage).toBe(0.9);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
