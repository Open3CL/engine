import { ProductionENR } from './16.2_production_enr.js';
import { describe, expect, test, it } from 'vitest';

describe('production ENR unit tests', () => {
  /**
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf Page 103
   */
  const productionENR = new ProductionENR();

  test('should get conso elect au', () => {
    // surface * 29 pour une maison
    expect(productionENR.getCelecAu('maison', 10)).toBe(290);

    // surface * (27 + 1.1) pour un appartement
    expect(productionENR.getCelecAu('appartement', 10)).toBe(281);
  });

  test('should get ppv 0 without ENR', () => {
    let productionElecEnr = {};
    expect(productionENR.getPpv(productionElecEnr, 1)).toBe(0);

    productionElecEnr.panneaux_pv_collection = {};
    expect(productionENR.getPpv(productionElecEnr, 1)).toBe(0);

    productionElecEnr.panneaux_pv_collection = {
      panneaux_pv: []
    };
    expect(productionENR.getPpv(productionElecEnr, 1)).toBe(0);
  });

  test('should get ppv 0 with unknown coef_orientation_pv', () => {
    let productionElecEnr = {
      panneaux_pv_collection: {
        panneaux_pv: [
          {
            enum_orientation_pv_id: 12,
            enum_inclinaison_pv_id: 12
          },
          {
            enum_orientation_pv_id: 15,
            enum_inclinaison_pv_id: 12
          }
        ]
      }
    };
    expect(productionENR.getPpv(productionElecEnr, 1)).toBe(0);
  });

  it.each([
    [2826.8015616000007, 8, 9.6],
    [2120.1011712, undefined, 9.6]
  ])(
    'should get ppv %s with nombre module %s and surface totale capteur %s',
    (ppv, nombre_module, surface_totale_capteurs) => {
      let productionElecEnr = {
        panneaux_pv_collection: {
          panneaux_pv: [
            {
              surface_totale_capteurs: surface_totale_capteurs,
              nombre_module: nombre_module,
              enum_orientation_pv_id: 1,
              enum_inclinaison_pv_id: 2
            }
          ]
        }
      };
      expect(productionENR.getPpv(productionElecEnr, 1)).toBe(ppv);
    }
  );

  test('should update ef conso', () => {
    const productionElectricite = {
      conso_elec_ac_fr: 100,
      conso_elec_ac_ch: 150,
      conso_elec_ac_ecs: 200,
      conso_elec_ac_eclairage: 250,
      conso_elec_ac_auxiliaire: 300
    };

    const conso = {
      ef_conso: {
        conso_ecs: 1000,
        conso_ch: 500,
        conso_fr: 800,
        conso_eclairage: 900,
        conso_totale_auxiliaire: 1250,
        conso_5_usages: 1500,
        conso_5_usages_m2: 100
      }
    };

    productionENR.updateEfConso(productionElectricite, conso, 10);

    expect(conso).toStrictEqual({
      ef_conso: {
        conso_ecs: 800,
        conso_ch: 350,
        conso_fr: 700,
        conso_eclairage: 650,
        conso_totale_auxiliaire: 950,
        conso_5_usages: 500,
        conso_5_usages_m2: 50
      }
    });
  });

  test('should get tapl', () => {
    let productionElectricite = productionENR.getTapl({}, {}, 158, 2500);

    expect(productionElectricite).toStrictEqual({
      conso_elec_ac_ch: 0,
      conso_elec_ac_eclairage: 0,
      conso_elec_ac_ecs: 0,
      conso_elec_ac_fr: 0,
      conso_elec_ac_auxiliaire_distribution_ch: 0,
      conso_elec_ac_auxiliaire_distribution_ecs: 0,
      conso_elec_ac_auxiliaire_generation_ch: 0,
      conso_elec_ac_auxiliaire_generation_ecs: 0,
      conso_elec_ac_ventilation: 0,
      conso_elec_ac_autre_usage: 0.028440000000000003
    });

    const consoElec = {
      conso_ch: 1000,
      conso_ecs: 1500
    };

    const efConso = {
      conso_ecs: 1000,
      conso_ch: 500,
      conso_fr: 800,
      conso_eclairage: 900,
      conso_auxiliaire_distribution_ch: 250,
      conso_auxiliaire_distribution_ecs: 110,
      conso_auxiliaire_generation_ch: 100,
      conso_auxiliaire_generation_ecs: 120,
      conso_auxiliaire_ventilation: 150,
      conso_totale_auxiliaire: 1250,
      conso_5_usages: 1500,
      conso_5_usages_m2: 100
    };

    productionElectricite = productionENR.getTapl(efConso, consoElec, 158, 2500);

    expect(productionElectricite).toStrictEqual({
      conso_elec_ac_ch: 0.008,
      conso_elec_ac_eclairage: 0.018,
      conso_elec_ac_ecs: 0.03,
      conso_elec_ac_fr: 0.08,
      conso_elec_ac_auxiliaire_distribution_ch: 0.005,
      conso_elec_ac_auxiliaire_distribution_ecs: 0.0022,
      conso_elec_ac_auxiliaire_generation_ch: 0.0008,
      conso_elec_ac_auxiliaire_generation_ecs: 0.0024,
      conso_elec_ac_ventilation: 0.03,
      conso_elec_ac_autre_usage: 0.028440000000000003
    });
  });

  test('should calculate conso elec', () => {
    let productionElecEnr = {
      panneaux_pv_collection: {
        panneaux_pv: [
          {
            nombre_module: 8,
            enum_orientation_pv_id: 1,
            enum_inclinaison_pv_id: 2
          }
        ]
      }
    };

    let productionElectricite = {
      conso_elec_ac: 0,
      production_pv: 0,
      conso_elec_ac_ch: 0,
      conso_elec_ac_auxiliaire_generation_ch: 0,
      conso_elec_ac_ecs: 0,
      conso_elec_ac_auxiliaire_generation_ecs: 0,
      conso_elec_ac_fr: 0,
      conso_elec_ac_ventilation: 0,
      conso_elec_ac_eclairage: 0,
      conso_elec_ac_auxiliaire_distribution_ecs: 0,
      conso_elec_ac_auxiliaire_distribution_ch: 0,
      conso_elec_ac_auxiliaire: 0,
      conso_elec_ac_autre_usage: 0
    };

    const conso = {
      ef_conso: {
        conso_ecs: 1000,
        conso_ch: 500,
        conso_fr: 800,
        conso_eclairage: 900,
        conso_totale_auxiliaire: 1250,
        conso_5_usages: 1500,
        conso_5_usages_m2: 100
      },
      sortie_par_energie_collection: {
        sortie_par_energie: [
          {
            enum_type_energie_id: '1',
            conso_5_usages: 1500,
            conso_ch: 1000,
            conso_ecs: 1500
          }
        ]
      }
    };

    productionENR.calculateConsoElecAc(
      productionElectricite,
      productionElecEnr,
      conso,
      1,
      'maison',
      100
    );

    expect(productionElectricite).toStrictEqual({
      conso_elec_ac: 1039.8691678904038,
      production_pv: 2826.8015616000007,
      conso_elec_ac_ch: 12.64278623574959,
      conso_elec_ac_auxiliaire_generation_ch: 0,
      conso_elec_ac_ecs: 47.41044838406096,
      conso_elec_ac_auxiliaire_generation_ecs: 0,
      conso_elec_ac_fr: 126.42786235749591,
      conso_elec_ac_ventilation: 0,
      conso_elec_ac_eclairage: 28.44626903043658,
      conso_elec_ac_auxiliaire_distribution_ecs: 0,
      conso_elec_ac_auxiliaire_distribution_ch: 0,
      conso_elec_ac_auxiliaire: 0,
      conso_elec_ac_autre_usage: 860.1136363636363
    });

    expect(productionElecEnr).toStrictEqual({
      donnee_intermediaire: {
        conso_elec_ac: 1039.8691678904038,
        production_pv: 2826.8015616000007,
        taux_autoproduction: 0.2363339017932736
      },
      panneaux_pv_collection: {
        panneaux_pv: [
          {
            enum_inclinaison_pv_id: 2,
            enum_orientation_pv_id: 1,
            nombre_module: 8
          }
        ]
      }
    });
  });

  test('should reuse an existing donnee_intermediaire when computing conso elec ac', () => {
    // Le noeud donnee_intermediaire préexiste : il doit être conservé (et non recréé)
    const productionElecEnr = {
      donnee_intermediaire: { valeur_existante: 42 },
      panneaux_pv_collection: {
        panneaux_pv: [{ nombre_module: 8, enum_orientation_pv_id: 1, enum_inclinaison_pv_id: 2 }]
      }
    };

    const productionElectricite = {};
    const conso = {
      ef_conso: {},
      sortie_par_energie_collection: {
        sortie_par_energie: [
          { enum_type_energie_id: '1', conso_5_usages: 1500, conso_ch: 1000, conso_ecs: 1500 }
        ]
      }
    };

    productionENR.calculateConsoElecAc(
      productionElectricite,
      productionElecEnr,
      conso,
      1,
      'maison',
      10
    );

    // la clé préexistante est préservée, les champs calculés sont ajoutés
    expect(productionElecEnr.donnee_intermediaire.valeur_existante).toBe(42);
    expect(productionElecEnr.donnee_intermediaire.production_pv).toBe(2826.8015616000007);
    expect(productionElecEnr.donnee_intermediaire.conso_elec_ac).toBeGreaterThan(0);
  });

  test('should get ppv when panneaux_pv is a single object (not an array)', () => {
    const productionElecEnr = {
      panneaux_pv_collection: {
        panneaux_pv: {
          nombre_module: 8,
          enum_orientation_pv_id: 1,
          enum_inclinaison_pv_id: 2
        }
      }
    };
    // même résultat qu'avec un tableau à un élément
    expect(productionENR.getPpv(productionElecEnr, 1)).toBe(2826.8015616000007);
  });

  test('should update ep conso with a coeff ep override', () => {
    const productionElectricite = {
      conso_elec_ac_ecs: 200,
      conso_elec_ac_ch: 150,
      conso_elec_ac_fr: 100,
      conso_elec_ac_eclairage: 250,
      conso_elec_ac_auxiliaire: 300
    };
    const conso = {
      ep_conso: {
        ep_conso_ecs: 1000,
        ep_conso_ch: 500,
        ep_conso_fr: 800,
        ep_conso_eclairage: 900,
        ep_conso_totale_auxiliaire: 1250,
        ep_conso_5_usages: 5000,
        ep_conso_5_usages_m2: 100
      }
    };

    // coeff_ep_override = 2 : chaque poste est minoré de 2 * autoconso
    productionENR.updateEPConso(productionElectricite, conso, 10, 2);

    expect(conso.ep_conso).toStrictEqual({
      ep_conso_ecs: 600, // 1000 - 2*200
      ep_conso_ch: 200, // 500 - 2*150
      ep_conso_fr: 600, // 800 - 2*100
      ep_conso_eclairage: 400, // 900 - 2*250
      ep_conso_totale_auxiliaire: 650, // 1250 - 2*300
      ep_conso_5_usages: 3000, // 5000 - 2*1000
      ep_conso_5_usages_m2: 300 // floor(3000 / 10)
    });
  });

  test('should update ep conso with the default coeff ep (1.9) when no override', () => {
    const productionElectricite = {
      conso_elec_ac_ecs: 200,
      conso_elec_ac_ch: 150,
      conso_elec_ac_fr: 100,
      conso_elec_ac_eclairage: 250,
      conso_elec_ac_auxiliaire: 300
    };
    const conso = {
      ep_conso: {
        ep_conso_ecs: 1000,
        ep_conso_ch: 500,
        ep_conso_fr: 800,
        ep_conso_eclairage: 900,
        ep_conso_totale_auxiliaire: 1250,
        ep_conso_5_usages: 5000,
        ep_conso_5_usages_m2: 100
      }
    };

    // pas d'override => coefficient par défaut 1.9
    productionENR.updateEPConso(productionElectricite, conso, 10);

    expect(conso.ep_conso).toStrictEqual({
      ep_conso_ecs: 620, // 1000 - 1.9*200
      ep_conso_ch: 215, // 500 - 1.9*150
      ep_conso_fr: 610, // 800 - 1.9*100
      ep_conso_eclairage: 425, // 900 - 1.9*250
      ep_conso_totale_auxiliaire: 680, // 1250 - 1.9*300
      ep_conso_5_usages: 3100, // 5000 - 1.9*1000
      ep_conso_5_usages_m2: 310 // floor(3100 / 10)
    });
  });

  test.each([
    ['une installation absente', null],
    ["l'absence de production photovoltaïque", { donnee_entree: { presence_production_pv: 0 } }]
  ])('calculateEnr retourne des autoconsommations nulles pour %s', (_label, productionElecEnr) => {
    const conso = { ef_conso: {}, ep_conso: {} };

    const ret = productionENR.calculateEnr(productionElecEnr, conso, 10, 'maison', 1, 100);

    expect(ret).toStrictEqual({
      production_pv: 0,
      conso_elec_ac: 0,
      conso_elec_ac_ch: 0,
      conso_elec_ac_ecs: 0,
      conso_elec_ac_fr: 0,
      conso_elec_ac_eclairage: 0,
      conso_elec_ac_auxiliaire: 0,
      conso_elec_ac_autre_usage: 0
    });
  });

  test('calculateEnr calcule et applique les autoconsommations en présence de PV', () => {
    const productionElecEnr = {
      donnee_entree: { presence_production_pv: 1 },
      panneaux_pv_collection: {
        panneaux_pv: [{ nombre_module: 8, enum_orientation_pv_id: 1, enum_inclinaison_pv_id: 2 }]
      }
    };
    const conso = {
      ef_conso: {
        conso_ecs: 1000,
        conso_ch: 500,
        conso_fr: 800,
        conso_eclairage: 900,
        conso_totale_auxiliaire: 1250,
        conso_5_usages: 1500,
        conso_5_usages_m2: 100
      },
      ep_conso: {
        ep_conso_ecs: 3000,
        ep_conso_ch: 1500,
        ep_conso_fr: 2000,
        ep_conso_eclairage: 1800,
        ep_conso_totale_auxiliaire: 2500,
        ep_conso_5_usages: 10000,
        ep_conso_5_usages_m2: 100
      },
      sortie_par_energie_collection: {
        sortie_par_energie: [
          { enum_type_energie_id: '1', conso_5_usages: 1500, conso_ch: 1000, conso_ecs: 1500 }
        ]
      }
    };

    const ret = productionENR.calculateEnr(productionElecEnr, conso, 10, 'maison', 1, 100);

    // valeurs de référence de régression
    expect(ret).toStrictEqual({
      production_pv: 2826.8015616000007,
      conso_elec_ac: 403.3632077277818,
      conso_elec_ac_ch: 17.146151231786686,
      conso_elec_ac_ecs: 64.29806711920007,
      conso_elec_ac_fr: 171.46151231786683,
      conso_elec_ac_eclairage: 38.57884027152004,
      conso_elec_ac_auxiliaire: 0,
      conso_elec_ac_autre_usage: 21.14245810055866
    });

    // les consommations d'énergie finale sont bien minorées par l'autoconsommation
    expect(conso.ef_conso.conso_ecs).toBeLessThan(1000);
    expect(conso.ef_conso.conso_5_usages).toBeLessThan(1500);
  });
});
