import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { decodeJWT } from '../utils/json-helper';

export interface ImageUploadResponse {
  data: string;
}

export interface DecodedImageResponse {
  message: string;
  data: {
    filename: string;
    url: string;
    provider: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private uploadUrl = 'https://locatto-67775182631.europe-west1.run.app/upload';

  constructor(private http: HttpClient) { }

  uploadImage(file: File): Observable<DecodedImageResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImageUploadResponse>(this.uploadUrl, formData).pipe(
      map(response => {
        const decodedData = decodeJWT(response.data);

        // console.log("Update response: ", decodedData)

        return decodedData;
      })
    );
  }
}
