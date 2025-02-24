import { TypeHabitation } from '../../../dpe/domain/models/dpe.model';

export interface Contexte {
  typeHabitation: TypeHabitation;
  enumPeriodeConstructionId: string;
  surfaceHabitable: string;
  hauteurSousPlafond: string;
  zoneClimatiqueId: string;
  effetJoule: boolean;
}
