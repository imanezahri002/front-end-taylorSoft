import { User, UserResponse, UserRequest } from './user.model';

// Main Coutourier model (extends User)
export interface Coutourier extends User {
  experience?: number;
}

// Coutourier Response model (from API)
export interface CoutourierResponse extends UserResponse {
  experience?: number;
}

// Coutourier Request model (to API)
export interface CoutourierRequest extends UserRequest {
  experience?: number;
}
