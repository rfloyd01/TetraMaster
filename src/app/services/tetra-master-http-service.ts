import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserJson } from '../util/card-types';

@Injectable({
  providedIn: 'root'
})
export class TetraMasterHttpService {
  
  constructor(private readonly http: HttpClient) {

  }

  createUser(username: string, password: string): Observable<UserJson> {
    const body = { user_id: 0, username: username, enc_password: password};
    return this.http.post('/tetra-master/user/create', body) as Observable<UserJson>;
  }

  login(username: string, password: string): Observable<UserJson> {
    const body = { user_id: 0, username: username, enc_password: password};
    return this.http.post('/tetra-master/user/login', body) as Observable<UserJson>;
  }
}
