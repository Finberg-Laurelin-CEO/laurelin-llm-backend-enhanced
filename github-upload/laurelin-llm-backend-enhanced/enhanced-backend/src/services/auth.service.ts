import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from './config.service';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  domain?: string;
  verified_email: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: GoogleUser;
  error?: string;
}

export class AuthService {
  private client: OAuth2Client;
  private config: ConfigService;
  private allowedDomains: string[];

  constructor() {
    this.config = ConfigService.getInstance();
    this.client = new OAuth2Client();
    this.allowedDomains = [
      'laurelin-inc.com',
      'gmail.com' // Allow Gmail for testing, remove in production
    ];
  }

  /**
   * Verify Google ID token and extract user information
   */
  public async verifyGoogleToken(idToken: string): Promise<AuthResult> {
    try {
      // Verify the token
      const clientId = this.config.getConfig().googleClientId;
      if (!clientId) {
        return {
          success: false,
          error: 'Google Client ID not configured'
        };
      }

      const ticket = await this.client.verifyIdToken({
        idToken: idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return {
          success: false,
          error: 'Invalid token payload'
        };
      }

      const user: GoogleUser = {
        id: payload.sub || '',
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture,
        domain: this.extractDomain(payload.email || ''),
        verified_email: payload.email_verified || false
      };

      // Check if user's domain is allowed
      if (!user.domain || !this.isDomainAllowed(user.domain)) {
        return {
          success: false,
          error: `Domain ${user.domain || 'unknown'} is not allowed. Only Laurelin Inc employees can access this service.`
        };
      }

      // Check if email is verified
      if (!user.verified_email) {
        return {
          success: false,
          error: 'Email address must be verified'
        };
      }

      return {
        success: true,
        user: user
      };

    } catch (error) {
      console.error('Token verification failed:', error);
      return {
        success: false,
        error: 'Token verification failed'
      };
    }
  }

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  }

  /**
   * Check if domain is in the allowed list
   */
  private isDomainAllowed(domain: string): boolean {
    return this.allowedDomains.includes(domain.toLowerCase());
  }

  /**
   * Generate a session token for authenticated users
   */
  public generateSessionToken(user: GoogleUser): string {
    // In a real implementation, you'd use JWT or similar
    // For now, we'll create a simple session identifier
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      domain: user.domain,
      timestamp: Date.now()
    };

    return Buffer.from(JSON.stringify(sessionData)).toString('base64');
  }

  /**
   * Validate session token
   */
  public validateSessionToken(token: string): AuthResult {
    try {
      const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is not expired (24 hours)
      const tokenAge = Date.now() - sessionData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > maxAge) {
        return {
          success: false,
          error: 'Session expired'
        };
      }

      const user: GoogleUser = {
        id: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
        domain: sessionData.domain,
        verified_email: true
      };

      return {
        success: true,
        user: user
      };

    } catch (error) {
      return {
        success: false,
        error: 'Invalid session token'
      };
    }
  }

  /**
   * Add a new allowed domain (for admin use)
   */
  public addAllowedDomain(domain: string): void {
    if (!this.allowedDomains.includes(domain.toLowerCase())) {
      this.allowedDomains.push(domain.toLowerCase());
    }
  }

  /**
   * Remove an allowed domain (for admin use)
   */
  public removeAllowedDomain(domain: string): void {
    this.allowedDomains = this.allowedDomains.filter(
      d => d.toLowerCase() !== domain.toLowerCase()
    );
  }

  /**
   * Get list of allowed domains
   */
  public getAllowedDomains(): string[] {
    return [...this.allowedDomains];
  }
}
