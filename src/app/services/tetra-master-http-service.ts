import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardStats, UserJson } from '../util/card-types';

@Injectable({
  providedIn: 'root'
})
export class TetraMasterHttpService {

  constructor(private readonly http: HttpClient) {

  }

  createUser(username: string, password: string): Observable<{token: string, user: UserJson}> {
    const body = { user_id: 0, username: username, enc_password: password};
    
    return this.http.post<{token: string, user: UserJson}>('/tetra-master/user/create', body);
  }

  login(username: string, password: string, jwtToken?: string): Observable<{token: string, user: UserJson}> {
    const body = { user_id: 0, username: username, enc_password: password};
    const headers: HttpHeaders = jwtToken ? new HttpHeaders({'Authorization': 'Bearer ' + jwtToken}) : new HttpHeaders({});

    return this.http.post<{token: string, user: UserJson}>('/tetra-master/user/login', body, { headers });
  }

  addCard(jwtToken: string, card: {cardStats: CardStats, cardType: number}): Observable<boolean> {
    const body = {
      card_type: card.cardType,
      arrows: card.cardStats.activeArrows,
      attack_power: card.cardStats.attackPower,
      attack_style: card.cardStats.attackStyle,
      physical_defense: card.cardStats.physicalDefense,
      magical_defense: card.cardStats.magicalDefense
    }
    const headers: HttpHeaders = new HttpHeaders({'Authorization': 'Bearer ' + jwtToken});
    return this.http.post<boolean>('/tetra-master/add-card', body, { headers });
  }

  removeCard(jwtToken: string, card: {cardStats: CardStats, cardType: number}): Observable<boolean> {
    const body = {
      card_type: card.cardType,
      arrows: card.cardStats.activeArrows,
      attack_power: card.cardStats.attackPower,
      attack_style: card.cardStats.attackStyle,
      physical_defense: card.cardStats.physicalDefense,
      magical_defense: card.cardStats.magicalDefense
    }
    const headers: HttpHeaders = new HttpHeaders({'Authorization': 'Bearer ' + jwtToken});
    return this.http.post<boolean>('/tetra-master/remove-card', body, { headers });
  }
}
