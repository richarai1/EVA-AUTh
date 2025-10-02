import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User>({ email: '',userName:'', isAuthenticated: false });
  public currentUser$ = this.currentUserSubject.asObservable();
  private redirectPath: string = '/home';
  private userFlowContext: 'consumer' | 'small-business' | 'enterprise' = 'consumer';

  constructor() {
    // Check if user is already logged in (localStorage)
    const consumerUser = localStorage.getItem('consumerUser');
    const businessUser = localStorage.getItem('businessUser');
    const enterpriseUser = localStorage.getItem('enterpriseUser');

    // Determine which user to load based on current context
    if (enterpriseUser && !businessUser && !consumerUser) {
      this.userFlowContext = 'enterprise';
      this.currentUserSubject.next(JSON.parse(enterpriseUser));
    } else if (businessUser && !consumerUser && !enterpriseUser) {
      this.userFlowContext = 'small-business';
      this.currentUserSubject.next(JSON.parse(businessUser));
    } else if (consumerUser && !businessUser && !enterpriseUser) {
      this.userFlowContext = 'consumer';
      this.currentUserSubject.next(JSON.parse(consumerUser));
    } else if (consumerUser) {
      // Default to consumer if multiple exist
      this.userFlowContext = 'consumer';
      this.currentUserSubject.next(JSON.parse(consumerUser));
    }
  }

  setUserFlowContext(context: 'consumer' | 'small-business' | 'enterprise'): void {
    this.userFlowContext = context;
    // Load the appropriate user when context changes
    let storageKey = 'consumerUser';
    if (context === 'small-business') {
      storageKey = 'businessUser';
    } else if (context === 'enterprise') {
      storageKey = 'enterpriseUser';
    }

    const savedUser = localStorage.getItem(storageKey);
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    } else {
      this.currentUserSubject.next({ email: '', userName: '', isAuthenticated: false });
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
          let userName = '';

          // Set different user names based on flow context
          if (this.userFlowContext === 'consumer') {
            userName = 'Richa Rai';
          } else if (this.userFlowContext === 'small-business') {
            userName = 'INSPECTOR DRAIN INC';
          } else if (this.userFlowContext === 'enterprise') {
            userName = 'GLOBAL TECH SOLUTIONS';
          }

          const user: User = { email, userName, isAuthenticated: true };

          // Store in the appropriate localStorage key
          let storageKey = 'consumerUser';
          if (this.userFlowContext === 'small-business') {
            storageKey = 'businessUser';
          } else if (this.userFlowContext === 'enterprise') {
            storageKey = 'enterpriseUser';
          }

          localStorage.setItem(storageKey, JSON.stringify(user));

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
    // Remove all possible user keys
    localStorage.removeItem('consumerUser');
    localStorage.removeItem('businessUser');
    localStorage.removeItem('enterpriseUser');
    // Also remove old key for backward compatibility
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next({ email: '', userName: '',isAuthenticated: false });
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value.isAuthenticated;
  }
}