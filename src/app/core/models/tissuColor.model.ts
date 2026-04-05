import { Tissu } from './tissu.model';
import { Color } from './color.model';

// Main TissuColor model
export interface TissuColor {
  id?: number;
  photo: string;
  active?: boolean;
  couleurId?: number;
  couleurNom?: string;
  couleurCodeHex?: string;
  tissuId?: number;
  tissuReference?: string;
  tissuNom?: string;
  prixMetre?: number;
  couleur?: Color;
  tissu?: Tissu;
}

