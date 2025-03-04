import { TypeDpe } from '../../../dpe/domain/models/type-habitation.model.js';

/**
 * Calcul du nombre d’adultes équivalent Nadeq
 * Chapitre 11.1 Calcul du besoin d’ECS
 *
 * Methode_de_calcul_3CL_DPE_2021 - Page 70
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class NadeqService {
  /**
   * @param typeDpe {TypeDpe}
   * @param surfaceHabitable {number}
   * @param nombreAppartement {number}
   * @return {number}
   */
  execute(typeDpe, surfaceHabitable, nombreAppartement) {
    if (typeDpe === TypeDpe.MAISON) {
      return this.#calculateIndividualNadeq(surfaceHabitable);
    }

    return this.#calculateCollectiveNadeq(
      surfaceHabitable,
      typeDpe === TypeDpe.APPARTEMENT ? 1 : nombreAppartement
    );
  }

  /**
   * Calcul de nadeq pour une maison ou un logement individuel
   * @param surfaceHabitableLogement {number}
   * @returns {number}
   */
  #calculateIndividualNadeq(surfaceHabitableLogement) {
    let Nmax;

    if (surfaceHabitableLogement < 30) Nmax = 1;
    else if (surfaceHabitableLogement < 70) Nmax = 1.75 - 0.01875 * (70 - surfaceHabitableLogement);
    else Nmax = 0.025 * surfaceHabitableLogement;

    if (Nmax < 1.75) return Nmax;
    else return 1.75 + 0.3 * (Nmax - 1.75);
  }

  /**
   * Calcul de nadeq pour un logement collectif
   *
   * @param surfaceHabitableImmeuble {number}
   * @param nombreAppartement {number}
   * @returns {number}
   */
  #calculateCollectiveNadeq(surfaceHabitableImmeuble, nombreAppartement) {
    const Shmoy = surfaceHabitableImmeuble / nombreAppartement;

    let Nmax;
    if (Shmoy < 10) Nmax = 1;
    else if (Shmoy < 50) Nmax = 1.75 - 0.01875 * (50 - Shmoy);
    else Nmax = 0.035 * Shmoy;

    if (Nmax < 1.75) return nombreAppartement * Nmax;
    else return nombreAppartement * (1.75 + 0.3 * (Nmax - 1.75));
  }
}
