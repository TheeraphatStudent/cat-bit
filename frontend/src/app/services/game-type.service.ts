import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameType } from '../models/game-type.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameTypeService {
  private apiUrl = `${environment.apiEndpoint}/game-types`;

  constructor(private http: HttpClient) {}

  getGameTypes(): Observable<GameType[]> {
    return this.http.get<GameType[]>(this.apiUrl);
  }

  createGameType(gameType: Partial<GameType>): Observable<GameType> {
    return this.http.post<GameType>(this.apiUrl, gameType);
  }

  updateGameType(id: number, gameType: Partial<GameType>): Observable<GameType> {
    return this.http.put<GameType>(`${this.apiUrl}/${id}`, gameType);
  }

  deleteGameType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
