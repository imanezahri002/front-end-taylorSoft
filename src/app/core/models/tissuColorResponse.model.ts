import { Tissu } from './tissu.model';
import { Color } from './color.model';

/**
 * Response model for tissu-color endpoint with complete tissue and color information
 * Used for displaying all tissues with their colors and images
 */
export interface TissuColorResponse {
  id: number;
  photo: string; // Base64 or URL of the image
  active?: boolean;
  couleurId?: number;
  tissuId?: number;
  couleur?: Color;
  tissu?: Tissu;
  // prixMetre is available from tissu.prixMetre
}
