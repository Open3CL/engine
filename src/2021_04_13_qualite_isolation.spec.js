import { describe, expect, test } from 'vitest';

/**
 * Module purement calculatoire (aucune dépendance externe) : on teste
 * directement les seuils de qualité et l'agrégation des déperditions.
 */
const { default: calc_qualite_isolation, qualite_isol } = await import(
  './2021_04_13_qualite_isolation.js'
);

/**
 * Qualité de l'isolation
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - annexe qualité d'isolation
 */
describe('qualite_isol - classement selon les seuils U', () => {
  const seuils = [0.3, 0.45, 0.65];

  test('déperdition ou surface nulle : U = 0 => très bonne (1)', () => {
    expect(qualite_isol(0, 100, ...seuils)).toBe(1);
    expect(qualite_isol(50, 0, ...seuils)).toBe(1);
  });

  test('U strictement inférieur au seuil 1 : très bonne (1)', () => {
    // U = 20 / 100 = 0.2 < 0.3
    expect(qualite_isol(20, 100, ...seuils)).toBe(1);
  });

  test('U dans [seuil1, seuil2[ : bonne (2)', () => {
    // U = 0.4
    expect(qualite_isol(40, 100, ...seuils)).toBe(2);
  });

  test('U dans [seuil2, seuil3[ : moyenne (3)', () => {
    // U = 0.5
    expect(qualite_isol(50, 100, ...seuils)).toBe(3);
  });

  test('U supérieur ou égal au seuil 3 : insuffisante (4)', () => {
    // U = 0.9 >= 0.65
    expect(qualite_isol(90, 100, ...seuils)).toBe(4);
  });

  test('les bornes sont exclusives par le bas (U === seuil => classe suivante)', () => {
    // U === seuil1 (0.3) => n'est pas < seuil1 => classe 2
    expect(qualite_isol(30, 100, ...seuils)).toBe(2);
  });
});

/** Paroi générique surface/U. */
function mur({ adjacence = '1', surface, umur, b = 1 }) {
  return {
    donnee_entree: { enum_type_adjacence_id: adjacence, surface_paroi_opaque: surface },
    donnee_intermediaire: { b, umur }
  };
}
function plancherBas({ adjacence = '1', surface, upb }) {
  return {
    donnee_entree: { enum_type_adjacence_id: adjacence, surface_paroi_opaque: surface },
    donnee_intermediaire: { upb }
  };
}
function plancherHaut({ adjacence = '1', typePh = '12', description, surface, uph }) {
  return {
    donnee_entree: {
      enum_type_adjacence_id: adjacence,
      enum_type_plancher_haut_id: typePh,
      description,
      surface_paroi_opaque: surface
    },
    donnee_intermediaire: { uph }
  };
}
function baie({ surface, u, b = 1 }) {
  return {
    donnee_entree: { surface_totale_baie: surface, u_menuiserie: u },
    donnee_intermediaire: { b, u_menuiserie: u }
  };
}
function porte({ surface, u, b = 1 }) {
  return {
    donnee_entree: { surface_porte: surface, uporte: u },
    donnee_intermediaire: { b, uporte: u }
  };
}
function enveloppe({ murs = [], pb = [], ph = [], bv = [], portes = [] }) {
  return {
    mur_collection: { mur: murs },
    plancher_haut_collection: { plancher_haut: ph },
    plancher_bas_collection: { plancher_bas: pb },
    baie_vitree_collection: { baie_vitree: bv },
    porte_collection: { porte: portes }
  };
}

describe('calc_qualite_isolation - agrégation et classement', () => {
  test('cas de référence : ubat et classes de qualité', () => {
    const env = enveloppe({
      murs: [mur({ surface: 100, umur: 0.5 })],
      pb: [plancherBas({ surface: 50, upb: 0.4 })],
      ph: [plancherHaut({ surface: 30, uph: 0.2 })],
      bv: [baie({ surface: 20, u: 2 })],
      portes: [porte({ surface: 5, u: 2 })]
    });
    const dp = {
      deperdition_mur: 50,
      deperdition_plancher_bas: 20,
      deperdition_plancher_haut: 6,
      deperdition_baie_vitree: 40,
      deperdition_porte: 10,
      deperdition_pont_thermique: 10
    };

    const ret = calc_qualite_isolation(env, dp);

    // valeur de référence de régression : 136 / 205
    expect(ret.ubat).toBeCloseTo(0.6634146341463415, 9);
    expect(ret.qualite_isol_enveloppe).toBe(3);
    expect(ret.qualite_isol_mur).toBe(3); // U = 0.5
    expect(ret.qualite_isol_plancher_bas).toBe(2); // U = 0.4
    expect(ret.qualite_isol_menuiserie).toBe(2); // U = 50/25 = 2
    expect(ret.qualite_isol_plancher_haut_comble_amenage).toBe(2); // U = 0.2
  });

  test('les locaux non déperditifs (adjacence 22) sont exclus des murs et planchers bas', () => {
    const env = enveloppe({
      murs: [mur({ surface: 100, umur: 0.5 }), mur({ adjacence: '22', surface: 999, umur: 9 })],
      pb: [
        plancherBas({ surface: 50, upb: 0.4 }),
        plancherBas({ adjacence: '22', surface: 999, upb: 9 })
      ]
    });
    const dp = {
      deperdition_mur: 50,
      deperdition_plancher_bas: 20,
      deperdition_plancher_haut: 0,
      deperdition_baie_vitree: 0,
      deperdition_porte: 0,
      deperdition_pont_thermique: 0
    };

    const ret = calc_qualite_isolation(env, dp);

    // surface déperditive = 100 + 50 = 150 ; ubat = 70 / 150
    expect(ret.ubat).toBeCloseTo(70 / 150, 9);
    expect(ret.qualite_isol_mur).toBe(3); // 0.5 seule paroi retenue
  });

  test('un mur avec coefficient b nul est exclu du calcul', () => {
    const env = enveloppe({
      murs: [mur({ surface: 100, umur: 0.5 }), mur({ surface: 200, umur: 9, b: 0 })]
    });
    const dp = {
      deperdition_mur: 50,
      deperdition_plancher_bas: 0,
      deperdition_plancher_haut: 0,
      deperdition_baie_vitree: 0,
      deperdition_porte: 0,
      deperdition_pont_thermique: 0
    };

    const ret = calc_qualite_isolation(env, dp);

    // seul le mur b>0 (surface 100) est compté
    expect(ret.ubat).toBeCloseTo(0.5, 9);
    expect(ret.qualite_isol_mur).toBe(3);
  });

  test("plancher haut non adjacent à l'extérieur (adjacence !== 1) : classé comble perdu", () => {
    const env = enveloppe({
      ph: [plancherHaut({ adjacence: '5', surface: 40, uph: 0.1 })]
    });
    const dp = {
      deperdition_mur: 0,
      deperdition_plancher_bas: 0,
      deperdition_plancher_haut: 4,
      deperdition_baie_vitree: 0,
      deperdition_porte: 0,
      deperdition_pont_thermique: 0
    };

    const ret = calc_qualite_isolation(env, dp);

    // U = 4 / 40 = 0.1 < 0.15 => très bonne (1)
    expect(ret.qualite_isol_plancher_haut_comble_perdu).toBe(1);
    expect(ret.qualite_isol_plancher_haut_comble_amenage).toBeUndefined();
    expect(ret.qualite_isol_plancher_haut_toit_terrasse).toBeUndefined();
  });

  test('plancher haut extérieur sans marqueur combles aménagés : classé toit terrasse', () => {
    const env = enveloppe({
      ph: [
        plancherHaut({
          adjacence: '1',
          typePh: '5',
          description: 'dalle béton',
          surface: 40,
          uph: 0.28
        })
      ]
    });
    const dp = {
      deperdition_mur: 0,
      deperdition_plancher_bas: 0,
      deperdition_plancher_haut: 11.2,
      deperdition_baie_vitree: 0,
      deperdition_porte: 0,
      deperdition_pont_thermique: 0
    };

    const ret = calc_qualite_isolation(env, dp);

    // U = 0.28 : seuils toit terrasse 0.25 / 0.3 / 0.35 => classe 2 (dans [0.25, 0.3[)
    expect(ret.qualite_isol_plancher_haut_toit_terrasse).toBe(2);
  });

  test('description contenant « combles aménagés » : classé combles aménagés', () => {
    const env = enveloppe({
      ph: [
        plancherHaut({
          adjacence: '1',
          typePh: '5',
          description: 'Combles aménagés sous rampant',
          surface: 30,
          uph: 0.2
        })
      ]
    });
    const dp = {
      deperdition_mur: 0,
      deperdition_plancher_bas: 0,
      deperdition_plancher_haut: 6,
      deperdition_baie_vitree: 0,
      deperdition_porte: 0,
      deperdition_pont_thermique: 0
    };

    const ret = calc_qualite_isolation(env, dp);

    expect(ret.qualite_isol_plancher_haut_comble_amenage).toBe(2);
  });

  test('collections vides : ubat non fini, seules les quatre qualités de base présentes', () => {
    const env = enveloppe({});
    const dp = {
      deperdition_mur: 0,
      deperdition_plancher_bas: 0,
      deperdition_plancher_haut: 0,
      deperdition_baie_vitree: 0,
      deperdition_porte: 0,
      deperdition_pont_thermique: 0
    };

    const ret = calc_qualite_isolation(env, dp);

    // 0 / 0 => NaN
    expect(Number.isFinite(ret.ubat)).toBe(false);
    expect(ret.qualite_isol_plancher_haut_comble_amenage).toBeUndefined();
    expect(ret.qualite_isol_plancher_haut_toit_terrasse).toBeUndefined();
    expect(ret.qualite_isol_plancher_haut_comble_perdu).toBeUndefined();
  });
});
