import { decode, verify } from 'jsonwebtoken';

export interface JsonWebKey {
  readonly kid: string;
  readonly publicKey?: string;
  readonly rsaPublicKey?: string;
}

export interface JwksClient {
  getSigningKey(kid: string): Promise<JsonWebKey>;
}

export interface VerifiedTokenPayload {
  readonly sub: string;
  readonly unique_name: string;
  readonly 'extn.employeeId': string[];
}

export default class AdJwtVerifier {
  readonly applicationId: string;
  readonly issuer: string;
  readonly jwksClient: JwksClient;

  constructor(applicationId: string, issuer: string, jwksClient: JwksClient) {
    this.applicationId = applicationId;
    this.issuer = issuer;
    this.jwksClient = jwksClient;
  }

  /**
   * Verifies the specified Azure AD JWT id/access token.  Throws an error if the token is invalid.
   * token - The encoded JWT token to verify.
   * returns - The decoded and verified token.
   */
  async verifyJwt(token: string): Promise<VerifiedTokenPayload> {
    const kid = decode(token, { complete: true }).header.kid;
    const signingKey = await this.jwksClient.getSigningKey(kid);

    const rsaPublicKey = signingKey.publicKey || signingKey.rsaPublicKey || '';
    if (rsaPublicKey === '') {
      throw new Error(`No public RSA key for kid: ${kid}`);
    }

    return verify(token, rsaPublicKey, {
      audience: this.applicationId,
      issuer: this.issuer,
      clockTolerance: 30, /* seconds */
    });
  }
}
