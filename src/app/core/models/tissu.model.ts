export interface Tissu {
  id?: number;
  reference: string;
  nom: string;
  largeur?: number;
  active?: boolean;
  typeTissuId: number;
  typeTissuNom?: string;
  prixMetre?: number;
}
