import { Tissu } from './tissu.model';
import { Color } from './color.model';

// Main TissuColor model
export interface TissuColor {
  id?: number;
  photo: string;
  active?: boolean;
  couleurId?: number;
  tissuId?: number;
  couleur?: Color;
  tissu?: Tissu;
}

