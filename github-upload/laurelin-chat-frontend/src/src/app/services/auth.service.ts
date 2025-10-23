import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  domain?: string;
  verified_email: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  sessionToken: string | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    sessionToken: null,
    loading: false,
    error: null
  });

  public authState$ = this.authState.asObservable();

  constructor() {
    this.initializeGoogleSignIn();
    this.checkExistingAuth();
  }

  private initializeGoogleSignIn(): void {
    // Load Google Sign-In script if not already loaded
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }

  private checkExistingAuth(): void {
    const savedToken = localStorage.getItem('laurelin_session_token');
    const savedUser = localStorage.getItem('laurelin_user');

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.authState.next({
          isAuthenticated: true,
          user,
          sessionToken: savedToken,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        this.clearAuthData();
      }
    }
  }

  public async signInWithGoogle(): Promise<boolean> {
    this.setLoading(true);
    this.clearError();

    try {
      if (!window.google) {
        throw new Error('Google Sign-In library not loaded');
      }

      return new Promise((resolve) => {
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: async (response: any) => {
            try {
              const success = await this.handleCredentialResponse(response.credential);
              resolve(success);
            } catch (error) {
              console.error('Authentication error:', error);
              this.setError('Authentication failed. Please try again.');
              resolve(false);
            }
          }
        });

        window.google.accounts.id.prompt();
      });
    } catch (error) {
      console.error('Sign-in error:', error);
      this.setError('Failed to initialize Google Sign-In');
      this.setLoading(false);
      return false;
    }
  }

  private async handleCredentialResponse(idToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/llm-login-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();

      if (data.success) {
        const user = data.user;
        const sessionToken = data.sessionToken;

        // Save to localStorage
        localStorage.setItem('laurelin_session_token', sessionToken);
        localStorage.setItem('laurelin_user', JSON.stringify(user));

        // Update auth state
        this.authState.next({
          isAuthenticated: true,
          user,
          sessionToken,
          loading: false,
          error: null
        });

        return true;
      } else {
        this.setError(data.error || 'Authentication failed');
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      this.setError('Failed to authenticate. Please try again.');
      return false;
    }
  }

  public signOut(): void {
    this.clearAuthData();
    
    // Sign out from Google
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('laurelin_session_token');
    localStorage.removeItem('laurelin_user');
    
    this.authState.next({
      isAuthenticated: false,
      user: null,
      sessionToken: null,
      loading: false,
      error: null
    });
  }

  public getCurrentUser(): GoogleUser | null {
    return this.authState.value.user;
  }

  public getSessionToken(): string | null {
    return this.authState.value.sessionToken;
  }

  public isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  public getAuthHeaders(): { [key: string]: string } {
    const token = this.getSessionToken();
    return token ? { 'X-Session-Token': token } : {};
  }

  private setLoading(loading: boolean): void {
    this.authState.next({
      ...this.authState.value,
      loading
    });
  }

  private setError(error: string): void {
    this.authState.next({
      ...this.authState.value,
      error,
      loading: false
    });
  }

  private clearError(): void {
    this.authState.next({
      ...this.authState.value,
      error: null
    });
  }

  public getError(): string | null {
    return this.authState.value.error;
  }

  public isLoading(): boolean {
    return this.authState.value.loading;
  }
}

// Extend Window interface for Google Sign-In
declare global {
  interface Window {
    google: any;
  }
}
