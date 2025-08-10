import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { UserJson } from '../util/card-types';

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
    const headers: HttpHeaders = jwtToken ? new HttpHeaders({'Authorization': 'Bearer ' + jwtToken}) : new HttpHeaders({}) ;

    return this.http.post<{token: string, user: UserJson}>('/tetra-master/user/login', body, { headers });
  }
}
