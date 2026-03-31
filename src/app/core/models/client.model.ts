import { User, UserResponse, UserRequest } from './user.model';
import { Mesure } from './mesure.model';

// Main Client model (extends User)
export interface Client extends User {
  dateNaissance?: Date | string;
  notes?: string;
  preferences?: string;
  mesure?: Mesure;
}

// Client Response model (from API)
export interface ClientResponse extends UserResponse {
  dateNaissance?: Date | string;
  notes?: string;
  preferences?: string;
  mesure?: Mesure;
}

// Client Request model (to API)
export interface ClientRequest extends UserRequest {
  dateNaissance?: Date | string;
  notes?: string;
  preferences?: string;
  mesureId?: number;
}
