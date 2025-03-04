import { conso_ch } from './9_conso_ch.js';
import { describe, expect, test } from 'vitest';

describe('Recherche de bugs dans le calcul de la consommation du chauffage', () => {
  test('calcul de la consommation du chauffage pour 2475E2510509B', () => {
    const di = {
      rendement_generation: 1,
      rg: 1,
      rg_dep: 1,
      conso_auxiliaire_generation_ch: 0,
      conso_auxiliaire_generation_ch_depensier: 0
    };

    const de = {
      description: 'Electrique - Convecteur électrique NFC, NF** et NF***',
      reference: 'Generateur:2024_07_11_09_30_44_722898200737262#1',
      reference_generateur_mixte: '',
      ref_produit_generateur_ch: 'Sans Objet',
      enum_type_generateur_ch_id: '98',
      enum_usage_generateur_id: '1',
      enum_type_energie_id: '1',
      position_volume_chauffe: 1,
      tv_rendement_generation_id: 29,
      identifiant_reseau_chaleur: '',
      enum_methode_saisie_carac_sys_id: '1',
      enum_lien_generateur_emetteur_id: '1'
    };

    const du = {
      enum_usage_generateur_id: ['1', '2', '3'],
      enum_type_generateur_ch_id: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '22',
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
        '30',
        '31',
        '32',
        '33',
        '34',
        '35',
        '36',
        '37',
        '38',
        '39',
        '40',
        '41',
        '42',
        '43',
        '44',
        '45',
        '46',
        '47',
        '48',
        '49',
        '50',
        '51',
        '52',
        '53',
        '54',
        '55',
        '56',
        '57',
        '58',
        '59',
        '60',
        '61',
        '62',
        '63',
        '64',
        '65',
        '66',
        '67',
        '68',
        '69',
        '70',
        '71',
        '72',
        '73',
        '74',
        '75',
        '76',
        '77',
        '78',
        '79',
        '80',
        '81',
        '82',
        '83',
        '84',
        '85',
        '86',
        '87',
        '88',
        '89',
        '90',
        '91',
        '92',
        '93',
        '94',
        '95',
        '96',
        '97',
        '98',
        '99',
        '100',
        '101',
        '102',
        '103',
        '104',
        '105',
        '106',
        '107',
        '108',
        '109',
        '110',
        '111',
        '112',
        '113',
        '114',
        '115',
        '116',
        '117',
        '118',
        '119',
        '120',
        '121',
        '122',
        '123',
        '124',
        '125',
        '126',
        '127',
        '128',
        '129',
        '130',
        '131',
        '132',
        '133',
        '134',
        '135',
        '136',
        '137',
        '138',
        '139',
        '140',
        '141',
        '142',
        '143',
        '144',
        '145',
        '146',
        '147',
        '148',
        '149',
        '150',
        '151',
        '152',
        '153',
        '154',
        '155',
        '156',
        '157',
        '158',
        '159',
        '160',
        '161',
        '162',
        '163',
        '164',
        '165',
        '166',
        '167',
        '168',
        '169',
        '170',
        '171'
      ]
    };
    const _pos = 0;

    const cfg_ch = 'installation de chauffage simple';

    const em_list = [
      {
        donnee_entree: {
          description: '',
          reference: 'Emetteur:2024_07_11_09_30_44_722898200737262#1',
          surface_chauffee: 22.76,
          tv_rendement_emission_id: 1,
          tv_rendement_distribution_ch_id: 1,
          tv_rendement_regulation_id: 1,
          enum_type_emission_distribution_id: '1',
          tv_intermittence_id: 138,
          reseau_distribution_isole: 0,
          enum_equipement_intermittence_id: '4',
          enum_type_regulation_id: '2',
          enum_periode_installation_emetteur_id: '1',
          enum_type_chauffage_id: '1',
          enum_temp_distribution_ch_id: '1',
          enum_lien_generateur_emetteur_id: '1'
        },
        donnee_intermediaire: {
          rendement_distribution: 1,
          rendement_emission: 0.95,
          rendement_regulation: 0.99,
          i0: 0.86
        },
        donnee_utilisateur: {}
      }
    ];

    const GV = 150.18558182166174;
    const Sh = 22.76;
    const hsp = 2.5700000000000003;
    const bch = 8001.0714;
    const bch_dep = 9714.925476692655;

    conso_ch(di, de, du, _pos, cfg_ch, em_list, GV, Sh, hsp, bch, bch_dep);

    expect(di).toStrictEqual({
      conso_auxiliaire_generation_ch: 0,
      conso_auxiliaire_generation_ch_depensier: 0,
      conso_ch: 6324.781622192915,
      conso_ch_depensier: 7679.569278179351,
      rendement_generation: 1,
      rg: 1,
      rg_dep: 1
    });
  });
});
