import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User>({ email: '', isAuthenticated: false });
  public currentUser$ = this.currentUserSubject.asObservable();
  private redirectPath: string = '/home';

  constructor() {
    // Check if user is already logged in (localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  setRedirectPath(path: string): void {
    this.redirectPath = path;
  }

  getRedirectPath(): string {
    return this.redirectPath;
  }

  get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<boolean> {
    return new Observable(observer => {
      // Mock authentication - in real app, this would be an HTTP call
      setTimeout(() => {
        if (email && password.length >= 8) {
          const user: User = { email, isAuthenticated: true };
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 1000);
    });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next({ email: '', isAuthenticated: false });
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value.isAuthenticated;
  }
}