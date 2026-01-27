/**
 * SSL Certificate Pinning Configuration
 * 
 * IMPORTANT: Before enabling in production:
 * 1. Get actual certificate hashes from papageil.net
 * 2. Add backup certificate hashes for rotation
 * 3. Test thoroughly in staging environment
 * 4. Monitor certificate expiry dates
 * 
 * How to get certificate hash:
 * 
 * Step 1: Get certificate
 * ```bash
 * echo | openssl s_client -servername papageil.net -connect papageil.net:443 2>/dev/null | openssl x509 -pubkey -noout > public_key.pem
 * ```
 * 
 * Step 2: Calculate SHA-256 hash
 * ```bash
 * openssl pkey -pubin -in public_key.pem -outform der | openssl dgst -sha256 -binary | openssl enc -base64
 * ```
 * 
 * Output will be something like:
 * sha256/ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ=
 */

// Disable SSL pinning in development for easier testing
export const PINNING_ENABLED = process.env.NODE_ENV === 'production';

/**
 * SSL Pinning Configuration
 * 
 * TODO: Replace with actual certificate hashes before production!
 * 
 * Best practices:
 * - Always have 2-3 backup hashes for certificate rotation
 * - Monitor certificate expiry (set alerts 30 days before)
 * - Update app before certificate expires
 * - Test with invalid hashes to ensure pinning works
 */
export const SSL_PINNING_CONFIG: {
  [domain: string]: {
    includeSubdomains: boolean;
    publicKeyHashes: string[];
  };
} = {
  // API domain
  'papageil.net': {
    includeSubdomains: true,
    publicKeyHashes: [
      // TODO: Add actual certificate hash here
      // 'sha256/PRIMARY_CERTIFICATE_HASH_HERE=',

      // TODO: Add backup certificate hash (for rotation)
      // 'sha256/BACKUP_CERTIFICATE_1_HASH_HERE=',

      // TODO: Add second backup (optional but recommended)
      // 'sha256/BACKUP_CERTIFICATE_2_HASH_HERE=',
    ],
  },
};

/**
 * Check if SSL pinning is properly configured
 */
export const isSSLPinningConfigured = (): boolean => {
  const hashes = SSL_PINNING_CONFIG['papageil.net']?.publicKeyHashes || [];
  const firstHash = hashes[0];
  return hashes.length > 0 && firstHash !== undefined && !firstHash.includes('TODO');
};

/**
 * Get certificate expiry monitoring reminder
 * Call this periodically to check if certificates need rotation
 */
export const getCertificateStatus = () => {
  // TODO: Implement certificate expiry checking
  // This should fetch cert from server and check expiry date
  return {
    configured: isSSLPinningConfigured(),
    enabled: PINNING_ENABLED,
    needsUpdate: false, // TODO: Check actual expiry
  };
};

export default {
  PINNING_ENABLED,
  SSL_PINNING_CONFIG,
  isSSLPinningConfigured,
  getCertificateStatus,
};
