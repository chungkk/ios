# SSL Certificate Pinning - Implementation Guide

**Status:** 🔄 Ready to Implement  
**Priority:** 🔴 HIGH  
**Estimated Time:** 4 hours  
**Dependencies:** react-native-ssl-pinning

---

## 🎯 Overview

SSL Certificate Pinning prevents Man-in-the-Middle (MITM) attacks by validating the server's SSL certificate against a known hash. This ensures that even if an attacker has a valid SSL certificate from a compromised Certificate Authority, the app will reject it.

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Access to `ckk.pro` server
- [ ] OpenSSL installed (`openssl version`)
- [ ] Admin access to update npm packages
- [ ] Ability to test on physical devices (not simulator)
- [ ] Understanding of certificate rotation process

---

## 🚀 Implementation Steps

### Phase 1: Get Certificate Hashes (30 minutes)

#### Step 1.1: Get Primary Certificate

```bash
# Connect to server and extract public key
echo | openssl s_client -servername ckk.pro -connect ckk.pro:443 2>/dev/null | openssl x509 -pubkey -noout > ckk_primary.pem

# Calculate SHA-256 hash
openssl pkey -pubin -in ckk_primary.pem -outform der | openssl dgst -sha256 -binary | openssl enc -base64
```

**Save output:**
```
Primary Hash: sha256/[HASH_HERE]=
```

#### Step 1.2: Get Backup Certificate (For Rotation)

```bash
# If you have access to backup certificate:
openssl x509 -in backup_cert.pem -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
```

**Save output:**
```
Backup Hash: sha256/[BACKUP_HASH_HERE]=
```

#### Step 1.3: Check Certificate Expiry

```bash
echo | openssl s_client -servername ckk.pro -connect ckk.pro:443 2>/dev/null | openssl x509 -noout -dates
```

**Example output:**
```
notBefore=Jan  1 00:00:00 2024 GMT
notAfter=Dec 31 23:59:59 2026 GMT
```

**⚠️ Set reminder to rotate 30 days before expiry!**

---

### Phase 2: Install Package (1 hour)

#### Step 2.1: Install react-native-ssl-pinning

```bash
npm install react-native-ssl-pinning
```

#### Step 2.2: iOS Setup

```bash
cd ios
pod install
cd ..
```

#### Step 2.3: Android Setup

**File:** `android/app/build.gradle`

```gradle
dependencies {
    // ... other dependencies
    implementation project(':react-native-ssl-pinning')
}
```

Already configured in project ✅

#### Step 2.4: Verify Installation

```bash
npm list react-native-ssl-pinning
```

Should show installed version.

---

### Phase 3: Configure SSL Pinning (30 minutes)

#### Step 3.1: Update SSL Config

**File:** `src/config/sslPinning.ts` (already created)

Replace TODOs with actual hashes:

```typescript
export const SSL_PINNING_CONFIG = {
  'ckk.pro': {
    includeSubdomains: true,
    publicKeyHashes: [
      // Primary certificate (from Phase 1)
      'sha256/YOUR_PRIMARY_HASH_FROM_PHASE_1=',
      
      // Backup certificate (from Phase 1)
      'sha256/YOUR_BACKUP_HASH_FROM_PHASE_1=',
    ],
  },
};
```

#### Step 3.2: Enable in Production Only

```typescript
// Development: disabled for easier testing
// Production: enabled for security
export const PINNING_ENABLED = process.env.NODE_ENV === 'production';
```

---

### Phase 4: Implement in API Service (2 hours)

#### Option A: Using react-native-ssl-pinning (Recommended)

**File:** `src/services/api.ts`

Add import:
```typescript
import { fetch as sslFetch } from 'react-native-ssl-pinning';
import { SSL_PINNING_CONFIG, PINNING_ENABLED } from '../config/sslPinning';
```

Add interceptor before requests:
```typescript
// SSL Pinning interceptor
if (PINNING_ENABLED) {
  api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const url = `${config.baseURL}${config.url}`;
      
      try {
        // Validate certificate before making request
        await sslFetch(url, {
          method: 'HEAD',
          sslPinning: SSL_PINNING_CONFIG,
          timeoutInterval: 5000,
        });
      } catch (error) {
        console.error('[SSL Pinning] Certificate validation failed:', error);
        throw new Error('SSL Certificate validation failed');
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
}
```

#### Option B: Using Custom Axios Adapter

Create custom adapter:

**File:** `src/utils/sslPinningAdapter.ts`

```typescript
import { fetch as sslFetch } from 'react-native-ssl-pinning';
import { SSL_PINNING_CONFIG } from '../config/sslPinning';

export const createSSLPinningAdapter = () => {
  return async (config: any) => {
    try {
      const response = await sslFetch(config.url, {
        method: config.method?.toUpperCase(),
        headers: config.headers,
        body: config.data ? JSON.stringify(config.data) : undefined,
        sslPinning: SSL_PINNING_CONFIG,
        timeoutInterval: config.timeout || 10000,
      });

      return {
        data: await response.json(),
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
      };
    } catch (error) {
      throw error;
    }
  };
};
```

Use in api.ts:
```typescript
import { createSSLPinningAdapter } from '../utils/sslPinningAdapter';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  adapter: PINNING_ENABLED ? createSSLPinningAdapter() : undefined,
});
```

---

### Phase 5: Error Handling (30 minutes)

#### Step 5.1: Create SSL Error Handler

**File:** `src/utils/sslPinningError.ts`

```typescript
import { Alert } from 'react-native';

export class SSLPinningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSLPinningError';
  }
}

export const handleSSLPinningError = (error: any): boolean => {
  if (
    error.message?.includes('SSL') ||
    error.message?.includes('Certificate') ||
    error.message?.includes('pinning')
  ) {
    Alert.alert(
      'Security Warning',
      'Unable to verify secure connection. Please check your network and try again.',
      [{ text: 'OK' }]
    );
    return true;
  }
  return false;
};

export const isSSLPinningError = (error: any): boolean => {
  return (
    error.message?.includes('SSL') ||
    error.message?.includes('Certificate') ||
    error.name === 'SSLPinningError'
  );
};
```

#### Step 5.2: Add to API Error Handler

**File:** `src/services/api.ts`

```typescript
import { handleSSLPinningError } from '../utils/sslPinningError';

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle SSL pinning errors
    if (handleSSLPinningError(error)) {
      return Promise.reject(new Error('SSL_PINNING_FAILED'));
    }
    
    // ... existing error handling
    return Promise.reject(error);
  }
);
```

---

### Phase 6: Testing (1 hour)

#### Test 1: Valid Certificate (Should Work)

```bash
# Build and run app
npm run ios  # or android

# Try these actions:
# - Login
# - Fetch lessons
# - Upload file
# - All API calls should work normally
```

**Expected:** ✅ All API calls succeed

---

#### Test 2: Invalid Certificate (Should Fail)

**Temporarily change hash in `sslPinning.ts`:**
```typescript
publicKeyHashes: [
  'sha256/INVALID_HASH_FOR_TESTING_ONLY=',
],
```

**Run app:**
```bash
npm run ios
```

**Expected:** ❌ All API calls fail with SSL error

**Then revert back to correct hash!**

---

#### Test 3: MITM Detection

**Setup Charles Proxy or Burp Suite:**

1. Install Charles Proxy
2. Configure device to use proxy
3. Install Charles SSL certificate on device
4. Try to use app

**Expected:** ❌ App detects MITM and rejects connection

**Success criteria:**
- App shows "Security Warning" alert
- No API calls succeed through proxy
- Logs show SSL pinning rejection

---

#### Test 4: Production vs Development

**Development mode:**
```bash
# Should work without pinning
npm run ios
```

**Production build:**
```bash
# iOS
cd ios
xcodebuild -workspace PapaGeil.xcworkspace -scheme PapaGeil -configuration Release

# Android
cd android
./gradlew assembleRelease
```

**Expected:**
- Dev: Works normally (pinning disabled)
- Prod: Enforces pinning

---

### Phase 7: Monitoring & Maintenance

#### Setup Certificate Expiry Monitoring

**Create monitoring script:**

**File:** `scripts/check-ssl-cert.sh`

```bash
#!/bin/bash

# Check ckk.pro certificate expiry
CERT_EXPIRY=$(echo | openssl s_client -servername ckk.pro -connect ckk.pro:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)

echo "Certificate expires: $CERT_EXPIRY"

# Calculate days until expiry
EXPIRY_DATE=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_DATE=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_DATE - $CURRENT_DATE) / 86400 ))

echo "Days until expiry: $DAYS_LEFT"

if [ $DAYS_LEFT -lt 30 ]; then
  echo "⚠️  WARNING: Certificate expires in less than 30 days!"
  echo "Action required: Prepare new certificate hash and update app"
fi
```

**Add to CI/CD:**
```yaml
# .github/workflows/ssl-monitoring.yml
name: SSL Certificate Monitoring
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  check-ssl:
    runs-on: ubuntu-latest
    steps:
      - name: Check Certificate
        run: |
          bash scripts/check-ssl-cert.sh
```

---

## 🔄 Certificate Rotation Process

### When to Rotate

- 30 days before expiry (recommended)
- Immediately if certificate compromised
- When CA policies change

### Rotation Steps

1. **Get new certificate hash** (30 days before expiry)
   ```bash
   # Get new cert hash from server
   echo | openssl s_client -servername ckk.pro -connect ckk.pro:443 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
   ```

2. **Add as backup hash**
   ```typescript
   publicKeyHashes: [
     'sha256/OLD_CERT=',     // Current
     'sha256/NEW_CERT=',     // New (backup)
   ],
   ```

3. **Release app update**
   - Users install update with both hashes

4. **Update server certificate**
   - After most users updated

5. **Remove old hash** (in next release)
   ```typescript
   publicKeyHashes: [
     'sha256/NEW_CERT=',     // Now primary
     'sha256/FUTURE_CERT=',  // Next backup
   ],
   ```

---

## 📊 Implementation Checklist

### Pre-Implementation
- [ ] Get primary certificate hash
- [ ] Get backup certificate hash
- [ ] Check certificate expiry date
- [ ] Set expiry reminder (30 days before)
- [ ] Review and understand rotation process

### Implementation
- [ ] Install react-native-ssl-pinning
- [ ] Run pod install (iOS)
- [ ] Update sslPinning.ts with actual hashes
- [ ] Implement SSL pinning in api.ts
- [ ] Add error handling
- [ ] Add logging/monitoring

### Testing
- [ ] Test with valid certificate ✅
- [ ] Test with invalid certificate ❌
- [ ] Test MITM detection ❌
- [ ] Test development mode (no pinning)
- [ ] Test production build (with pinning)
- [ ] Test all API endpoints
- [ ] Test error messages

### Documentation
- [ ] Document certificate hashes
- [ ] Document expiry dates
- [ ] Document rotation process
- [ ] Add monitoring script
- [ ] Update deployment docs
- [ ] Train team on rotation

### Production
- [ ] Deploy to staging first
- [ ] Monitor for SSL errors
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor error rates
- [ ] Keep rollback plan ready

---

## ⚠️ Important Notes

### DO
- ✅ Always have 2-3 backup hashes
- ✅ Monitor certificate expiry
- ✅ Test thoroughly before production
- ✅ Disable in development
- ✅ Log SSL failures for monitoring
- ✅ Plan rotation in advance

### DON'T
- ❌ Use single hash (breaks during rotation)
- ❌ Enable in development (causes issues)
- ❌ Deploy without testing MITM detection
- ❌ Forget to monitor expiry
- ❌ Wait until last minute for rotation
- ❌ Hardcode sensitive data

---

## 🐛 Troubleshooting

### Issue: "SSL Certificate validation failed"

**Cause:** Certificate hash mismatch

**Solution:**
1. Verify certificate hash is correct
2. Check if certificate was rotated
3. Get new hash from server
4. Update app configuration

### Issue: Works in dev, fails in production

**Cause:** Pinning enabled only in production

**Solution:**
- This is expected behavior
- Test production build to verify
- Ensure hashes are correct

### Issue: MITM proxy works (security failure!)

**Cause:** SSL pinning not working

**Solution:**
1. Check PINNING_ENABLED = true
2. Verify hashes are correct
3. Check react-native-ssl-pinning installed
4. Review implementation

---

## 📚 Resources

- [OWASP SSL Pinning Guide](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)
- [react-native-ssl-pinning Docs](https://github.com/MaxToyberman/react-native-ssl-pinning)
- [Certificate Transparency](https://certificate.transparency.dev/)

---

**Last Updated:** 2026-01-14  
**Next Review:** After implementation complete
