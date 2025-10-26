import { jwtDecode } from "jwt-decode";
import { DecodedImageResponse } from "../services/image-upload.service";

export const decodeJWT = (token: string) => {
  try {
    const decoded = jwtDecode<any>(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    throw new Error('Failed to decode JWT response');
  }
}