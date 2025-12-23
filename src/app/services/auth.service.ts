import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { tap, delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = process.env['NG_APP_API_URL'];
  public isLoggedIn$ = new BehaviorSubject<boolean>(!!this.getAccessToken());

  // Mock User Profile
  public userProfile = {
    name: 'Admin User',
    role: 'Super Admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  };

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: any): Observable<any> {
    // Mock Login (ของจริงยิง this.http.post)
    return of({ accessToken: 'fake-jwt-token', refreshToken: 'fake-refresh-token' }).pipe(
      delay(800),
      tap(tokens => {
        this.storeTokens(tokens);
        this.isLoggedIn$.next(true);
      })
    );
  }

  refreshToken(): Observable<any> {
    console.log('🔄 Refreshing Token...');
    // Mock Refresh Token
    return of({ accessToken: 'new-fake-jwt-token', refreshToken: 'new-fake-refresh-token' }).pipe(
      delay(500),
      tap(tokens => this.storeTokens(tokens))
    );
  }

  logout() {
    localStorage.clear();
    this.isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  private storeTokens(tokens: any) {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }

  getAccessToken() { return localStorage.getItem('access_token'); }
}
