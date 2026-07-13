import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler la logique du module :
 * - `tv` : accès à la table `generateur_combustion` (ligne contrôlée) ;
 * - `tvColumnLines` : liste des critères de puissance (vidée pour neutraliser le critère Pn) ;
 * - `convertExpression` : non utilisée dans le chemin testé (critères vides) ;
 * - `bug_for_bug_compat` : désactivé pour isoler le comportement nominal ;
 * - `enums` : mapping minimal ;
 * - les modules de substitution de générateurs (bouilleur / chaudière / pac) : simples espions ;
 * - `getFicheTechnique` : présence d'un ventilateur.
 * La bibliothèque `mathjs` (evaluate) n'est pas mockée : c'est une fonction pure déterministe.
 */
vi.mock('./utils.js', () => ({
  bug_for_bug_compat: false,
  tv: vi.fn(),
  tvColumnLines: vi.fn(() => []),
  convertExpression: vi.fn((x) => x)
}));

vi.mock('./enums.js', () => ({
  default: {
    type_generateur_ch: { 89: 'chaudière gaz standard 2001-2015' },
    type_generateur_ecs: { 50: 'chaudière gaz standard' }
  }
}));

vi.mock('./13.2_generateur_combustion_bouilleur.js', () => ({
  updateGenerateurBouilleurs: vi.fn()
}));
vi.mock('./13.2_generateur_combustion_chaudiere.js', () => ({
  updateGenerateurChaudieres: vi.fn()
}));
vi.mock('./13.2_generateur_pac.js', () => ({
  updateGenerateurPacs: vi.fn()
}));
vi.mock('./ficheTechnique.js', () => ({
  default: vi.fn()
}));

const { tv_generateur_combustion, updateGenerateurCombustion } = await import(
  './13.2_generateur_combustion.js'
);
const { tv, tvColumnLines } = await import('./utils.js');
const { updateGenerateurBouilleurs } = await import('./13.2_generateur_combustion_bouilleur.js');
const { updateGenerateurChaudieres } = await import('./13.2_generateur_combustion_chaudiere.js');
const { updateGenerateurPacs } = await import('./13.2_generateur_pac.js');
const { default: getFicheTechnique } = await import('./ficheTechnique.js');

beforeEach(() => {
  vi.mocked(tv).mockReset();
  vi.mocked(tvColumnLines).mockReset();
  vi.mocked(tvColumnLines).mockReturnValue([]);
  vi.mocked(updateGenerateurBouilleurs).mockReset();
  vi.mocked(updateGenerateurChaudieres).mockReset();
  vi.mocked(updateGenerateurPacs).mockReset();
  vi.mocked(getFicheTechnique).mockReset();
});

const ROW_DEFAUT = {
  tv_generateur_combustion_id: '42',
  rpn: '90',
  rpint: '85',
  qp0_perc: '5',
  pveil: '10'
};

/**
 * 13.2 - Récupération des caractéristiques forfaitaires d'un générateur à combustion.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2
 */
describe('tv_generateur_combustion - caractéristiques du générateur', () => {
  test('puissance nominale calculée à partir de GV et Tbase lorsqu’elle est absente', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = {};
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    // Pn = (1.2 * GV * (19 - Tbase)) / 0.95^3 -- valeur de référence de régression
    expect(di.pn).toBeCloseTo(7837.877241580406, 9);
    expect(de.tv_generateur_combustion_id).toBe(42);
  });

  test('puissance nominale déjà renseignée : non recalculée', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 12345 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.pn).toBe(12345);
  });

  test('méthode forfaitaire (1) en chauffage : rpn, rpint, qp0 et pveil renseignés', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(di.rpn).toBeCloseTo(0.9, 9);
    expect(di.rpint).toBeCloseTo(0.85, 9);
    // qp0_perc constant '5' (ni Pn ni %) => 5 * 1000 * ratio
    expect(di.qp0).toBe(5000);
    expect(di.pveil).toBe(10);
  });

  test('type ECS : le rendement intermédiaire rpint n’est pas calculé', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ecs_id: '50', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ecs', 200, -9, 1);
    expect(di.rpn).toBeCloseTo(0.9, 9);
    expect(di.rpint).toBeUndefined();
  });

  test('qp0_perc exprimé en fonction de Pn : qp0 proportionnel à la puissance nominale', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT, qp0_perc: 'Pn' });
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    // qp0_calc = Pn(kW) = 20 ; inclut 'Pn' => qp0 = 20 * 1000 * ratio = pn
    expect(di.qp0).toBe(20000);
  });

  test('présence d’une ventouse : sélection du couple (E, F) dans la formule de rendement', () => {
    const diSansVentouse = { pn: 20000 };
    tv.mockReturnValue({ ...ROW_DEFAUT, rpn: 'E*40' });
    tv_generateur_combustion(
      {},
      diSansVentouse,
      { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 },
      'ch',
      200,
      -9,
      1
    );
    // E = 2.5 (sans ventouse) => rpn = 2.5*40 / 100 = 1
    expect(diSansVentouse.rpn).toBeCloseTo(1, 9);

    const diVentouse = { pn: 20000 };
    tv.mockReturnValue({ ...ROW_DEFAUT, rpn: 'E*40' });
    tv_generateur_combustion(
      {},
      diVentouse,
      { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 1 },
      'ch',
      200,
      -9,
      1
    );
    // E = 1.75 (avec ventouse) => rpn = 1.75*40 / 100 = 0.7
    expect(diVentouse.rpn).toBeCloseTo(0.7, 9);
  });

  test('méthode 4 : rpn, rpint et qp0 saisis sont conservés (non recalculés)', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000, rpn: 0.5, rpint: 0.4, qp0: 999 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 4);
    expect(di.rpn).toBe(0.5);
    expect(di.rpint).toBe(0.4);
    expect(di.qp0).toBe(999);
  });

  test('puissance de veilleuse saisie prise en compte hors méthode forfaitaire', () => {
    tv.mockReturnValue({ ...ROW_DEFAUT });
    const di = { pn: 20000, pveilleuse: 15 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 2);
    expect(di.pveil).toBe(15);
  });

  test('aucune ligne forfaitaire trouvée : arrêt sans identifiant de générateur', () => {
    tv.mockReturnValue(undefined);
    const di = { pn: 20000 };
    const de = { enum_type_generateur_ch_id: '89', ratio_virtualisation: 1, presence_ventouse: 0 };
    tv_generateur_combustion({}, di, de, 'ch', 200, -9, 1);
    expect(de.tv_generateur_combustion_id).toBeUndefined();
  });
});

/**
 * 13.2 - Orchestration des substitutions de générateurs et enrichissement fiches techniques.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2
 */
describe('updateGenerateurCombustion - orchestration des substitutions', () => {
  test('délègue aux trois routines de substitution avec les mêmes arguments', () => {
    getFicheTechnique.mockReturnValue(undefined);
    const dpe = {};
    const de = { description: 'gen' };
    updateGenerateurCombustion(dpe, de, 'ch');
    expect(updateGenerateurBouilleurs).toHaveBeenCalledWith(dpe, de, 'ch');
    expect(updateGenerateurChaudieres).toHaveBeenCalledWith(dpe, de, 'ch');
    expect(updateGenerateurPacs).toHaveBeenCalledWith(dpe, de, 'ch');
  });

  test('présence d’un ventilateur signalée dans les fiches techniques : presenceVentilateur = 1', () => {
    getFicheTechnique.mockReturnValue({ valeur: 'oui' });
    const de = { description: 'gen' };
    updateGenerateurCombustion({}, de, 'ch');
    expect(de.presenceVentilateur).toBe(1);
  });

  test('absence de ventilateur : presenceVentilateur non renseigné', () => {
    getFicheTechnique.mockReturnValue({ valeur: 'non' });
    const de = { description: 'gen' };
    updateGenerateurCombustion({}, de, 'ch');
    expect(de.presenceVentilateur).toBeUndefined();
  });
});
