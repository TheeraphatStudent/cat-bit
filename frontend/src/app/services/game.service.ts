import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game, GameFilter } from '../models/game.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = `${environment.apiEndpoint}/games`;

  constructor(private http: HttpClient) {}

  getGames(filter?: GameFilter): Observable<Game[]> {
    let params = new HttpParams();
    if (filter?.name) params = params.set('name', filter.name);
    if (filter?.type) params = params.set('type', filter.type);
    if (filter?.minPrice) params = params.set('minPrice', filter.minPrice.toString());
    if (filter?.maxPrice) params = params.set('maxPrice', filter.maxPrice.toString());

    return this.http.get<Game[]>(`${this.apiUrl}`, { params });
  }

  getGame(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/${id}`);
  }

  createGame(game: Partial<Game>): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}`, game);
  }

  updateGame(id: number, game: Partial<Game>): Observable<Game> {
    return this.http.put<Game>(`${this.apiUrl}/${id}`, game);
  }

  deleteGame(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getUserLibrary(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/library`);
  }

  uploadGameImage(gameId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/${gameId}/upload-image`, formData);
  }
}