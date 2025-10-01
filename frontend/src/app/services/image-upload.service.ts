import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ImageUploadResponse {
  data: string;
}

export interface DecodedImageResponse {
  data: {
    url: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private uploadUrl = 'https://locatto-67775182631.europe-west1.run.app/upload';

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<DecodedImageResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImageUploadResponse>(this.uploadUrl, formData).pipe(
      map(response => {
        const decodedData = this.decodeImageData(response.data);
        return decodedData;
      })
    );
  }

  private decodeImageData(encodedData: string): DecodedImageResponse {
    try {
      if (encodedData.startsWith('{')) {
        return JSON.parse(encodedData);
      }

      const decodedString = atob(encodedData);
      return JSON.parse(decodedString);
    } catch (error) {
      console.error('Error decoding image data:', error);
      throw new Error('Failed to decode image response');
    }
  }
}
