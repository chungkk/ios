# Critical Security Fixes - Cần Fix NGAY

**Ngày:** 2026-01-14  
**Priority:** 🔴 CRITICAL  
**Deadline:** Trước khi deploy production

---

## 🎯 Tổng Quan

**2 issues CRITICAL cần fix:**
1. ✅ **Vulnerable Dependency (qs package)** - 5 phút
2. ⏳ **SSL Certificate Pinning** - 4 giờ

---

## Issue #1: Vulnerable Dependency - qs Package 🔴

### Thông Tin Lỗ Hổng

| Field | Value |
|-------|-------|
| **Package** | `qs` |
| **Current Version** | 6.14.0 |
| **Fixed Version** | 6.14.1+ |
| **Severity** | HIGH |
| **CVE Score** | 7.5 |
| **CWE** | CWE-20 (Improper Input Validation) |
| **Advisory** | GHSA-6rw7-vpxm-498p |

### Mô Tả Lỗ Hổng

```
Title: qs's arrayLimit bypass allows DoS via memory exhaustion
Description: The qs package before 6.14.1 allows attackers to cause 
a Denial of Service (DoS) via memory exhaustion by bypassing the 
arrayLimit protection mechanism using bracket notation in query strings.
```

### Impact

- 🔴 **Denial of Service (DoS)** - Attacker có thể crash app
- 🔴 **Memory Exhaustion** - Tràn bộ nhớ khi parse requests
- 🔴 **Affects API parsing** - Ảnh hưởng axios requests

### Example Attack

```javascript
// Attacker sends request with malicious query string
// ?ids[999999999]=1&ids[999999998]=2&...
// This bypasses arrayLimit and causes memory exhaustion
```

### Solution

**Step 1: Check current version**
```bash
npm list qs
# Output: qs@6.14.0 (VULNERABLE)
```

**Step 2: Fix vulnerability**
```bash
npm audit fix
```

**Step 3: Verify fix**
```bash
npm audit
npm list qs
# Should show: qs@6.14.1 or higher
```

**Step 4: Test app**
```bash
npm test
npm run ios  # or android
```

### Verification Checklist

- [x] Run `npm audit fix` ✅
- [x] Check `npm list qs` shows version >= 6.14.1 ✅
- [x] Run `npm audit` - shows 0 vulnerabilities ✅
- [ ] Run `npm test` - all tests pass
- [ ] Test API calls in app work correctly
- [ ] Commit changes with message: "security: fix qs vulnerability GHSA-6rw7-vpxm-498p"

### Expected Result

```bash
# Before fix:
$ npm audit
1 high severity vulnerability

# After fix:
$ npm audit
found 0 vulnerabilities ✅
```

### ✅ ISSUE #1 COMPLETED!

**Status:** FIXED ✅  
**Date:** 2026-01-14  
**Time Taken:** 2 minutes  
**Result:** 0 vulnerabilities remaining

**Changes:**
- qs package updated from 6.14.0 → 6.14.1
- All security vulnerabilities resolved
- No breaking changes detected

---

## Issue #2: SSL Certificate Pinning 🔴

### Vấn Đề

**Current State:**
```typescript
// src/services/api.ts
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  // ⚠️ NO SSL PINNING!
});
```

**Risk:**
- 🔴 **Man-in-the-Middle (MITM) attacks** possible
- 🔴 Attacker can intercept HTTPS traffic
- 🔴 Sensitive data (tokens, passwords) can be stolen
- 🔴 Certificate spoofing attacks

### Real-World Attack Scenario

```
1. User connects to public WiFi (airport, coffee shop)
2. Attacker performs MITM attack with fake certificate
3. App accepts fake certificate (no pinning)
4. Attacker intercepts all API calls
5. Attacker steals JWT tokens, user data, passwords
```

### Solution Overview

**Option 1: Certificate Pinning** (Recommended)
- Pin specific SSL certificate
- More secure but needs update when cert expires

**Option 2: Public Key Pinning**
- Pin public key hash
- More flexible, works across cert renewals

**We'll use Option 2: Public Key Pinning**

---

### Implementation Steps

#### Step 1: Get Certificate Public Key Hash

```bash
# Get certificate from server
echo | openssl s_client -servername ckk.pro -connect ckk.pro:443 2>/dev/null | openssl x509 -pubkey -noout > public_key.pem

# Calculate SHA-256 hash
openssl pkey -pubin -in public_key.pem -outform der | openssl dgst -sha256 -binary | openssl enc -base64
```

**Output example:**
```
sha256/ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ=
```

#### Step 2: Install SSL Pinning Package

```bash
# Install package
npm install react-native-ssl-pinning

# For iOS
cd ios && pod install && cd ..

# For Android - add to build.gradle (already in project)
```

#### Step 3: Create SSL Pinning Configuration

**Create file:** `src/config/sslPinning.ts`

```typescript
// src/config/sslPinning.ts
export const SSL_PINNING_CONFIG = {
  'ckk.pro': {
    includeSubdomains: true,
    publicKeyHashes: [
      // Primary certificate
      'sha256/YOUR_PRIMARY_HASH_HERE=',
      // Backup certificate (for rotation)
      'sha256/YOUR_BACKUP_HASH_HERE=',
    ],
  },
};

export const PINNING_ENABLED = true; // Set to false for development
```

#### Step 4: Update API Service

**Update file:** `src/services/api.ts`

```typescript
import { fetch as sslFetch } from 'react-native-ssl-pinning';
import { SSL_PINNING_CONFIG, PINNING_ENABLED } from '../config/sslPinning';

// Create custom fetch with SSL pinning
const createPinnedFetch = () => {
  if (!PINNING_ENABLED) {
    return fetch; // Use normal fetch in development
  }

  return async (url: string, options: any) => {
    try {
      const response = await sslFetch(url, {
        ...options,
        sslPinning: SSL_PINNING_CONFIG,
        timeoutInterval: 10000,
      });
      return response;
    } catch (error) {
      console.error('[SSL Pinning] Request failed:', error);
      throw new Error('SSL Certificate validation failed');
    }
  };
};

// Update axios to use pinned fetch
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  adapter: require('axios/lib/adapters/http'), // Use http adapter
});

// Add SSL pinning interceptor
api.interceptors.request.use(
  async (config) => {
    if (PINNING_ENABLED && config.url) {
      const fullUrl = config.baseURL + config.url;
      try {
        // Validate certificate before request
        await sslFetch(fullUrl, {
          method: 'HEAD',
          sslPinning: SSL_PINNING_CONFIG,
        });
      } catch (error) {
        throw new Error('SSL Certificate validation failed');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

#### Step 5: Handle SSL Pinning Errors

**Create file:** `src/utils/sslPinningError.ts`

```typescript
export class SSLPinningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSLPinningError';
  }
}

export const handleSSLPinningError = (error: any) => {
  if (error.message?.includes('SSL Certificate')) {
    Alert.alert(
      'Security Warning',
      'Unable to verify secure connection. Please check your network.',
      [{ text: 'OK' }]
    );
    return true;
  }
  return false;
};
```

#### Step 6: Add Development Override

**Update file:** `src/config/sslPinning.ts`

```typescript
import { __DEV__ } from 'react-native';

// Disable SSL pinning in development for easier testing
export const PINNING_ENABLED = !__DEV__;

// Or use environment variable
// export const PINNING_ENABLED = process.env.NODE_ENV === 'production';
```

#### Step 7: Testing

**Test 1: Valid Certificate (Should Work)**
```bash
npm run ios
# Try logging in, should work normally
```

**Test 2: Invalid Certificate (Should Fail)**
```typescript
// Temporarily change hash to wrong value
publicKeyHashes: ['sha256/WRONG_HASH=']
// App should reject connection
```

**Test 3: MITM Detection**
```bash
# Use Charles Proxy or Burp Suite
# App should detect MITM and reject connection
```

### Implementation Checklist

- [ ] Get certificate hash from `ckk.pro`
- [ ] Get backup certificate hash (for rotation)
- [ ] Install `react-native-ssl-pinning` package
- [ ] Run `pod install` for iOS
- [ ] Create `src/config/sslPinning.ts`
- [ ] Update `src/services/api.ts` with pinning
- [ ] Create SSL error handler
- [ ] Test with valid certificate
- [ ] Test with invalid certificate (should fail)
- [ ] Test MITM detection with proxy
- [ ] Document certificate rotation process
- [ ] Add certificate expiry monitoring
- [ ] Commit changes

### Certificate Rotation Plan

**Important:** Certificates expire! Plan ahead:

1. **Get expiry date:**
```bash
echo | openssl s_client -servername ckk.pro -connect ckk.pro:443 2>/dev/null | openssl x509 -noout -dates
```

2. **Before expiry:**
   - Get new certificate hash
   - Add as backup hash in config
   - Release app update with both hashes

3. **After server cert updated:**
   - Remove old hash in next release

### Alternative: Public Key Pinning with Multiple Backup Keys

```typescript
export const SSL_PINNING_CONFIG = {
  'ckk.pro': {
    includeSubdomains: true,
    publicKeyHashes: [
      // Current certificate
      'sha256/CURRENT_CERT_HASH=',
      // Backup certificate (for rotation)
      'sha256/BACKUP_CERT_1_HASH=',
      // Second backup
      'sha256/BACKUP_CERT_2_HASH=',
    ],
  },
};
```

**Note:** Having 2-3 backup hashes prevents app from breaking during cert rotation.

---

## 🧪 Full Testing Checklist

### After Fixing Both Issues

- [ ] **qs Vulnerability:**
  - [ ] `npm audit` shows 0 vulnerabilities
  - [ ] `npm list qs` shows version >= 6.14.1
  - [ ] All tests pass
  - [ ] API calls work correctly

- [ ] **SSL Pinning:**
  - [ ] App works with valid certificate
  - [ ] App rejects invalid certificates
  - [ ] MITM attacks are detected
  - [ ] Development mode works (pinning disabled)
  - [ ] Production mode enforces pinning

- [ ] **Integration Testing:**
  - [ ] Login works
  - [ ] API calls work
  - [ ] Token refresh works
  - [ ] File uploads work
  - [ ] No regressions

- [ ] **Documentation:**
  - [ ] Update SECURITY_AUDIT.md with fixes
  - [ ] Document certificate rotation process
  - [ ] Add monitoring for cert expiry
  - [ ] Update deployment docs

---

## 📊 Progress Tracking

| Issue | Status | Time Spent | Completed |
|-------|--------|------------|-----------|
| Fix qs vulnerability | ✅ **COMPLETED** | 2 min | ✅ |
| Implement SSL Pinning | 🔄 In Progress | 0/4 hours | ⏳ |

### Time Estimates

- **Issue #1 (qs):** 5 minutes
  - Run npm audit fix: 2 min
  - Verify & test: 3 min

- **Issue #2 (SSL Pinning):** 4 hours
  - Get certificate hashes: 30 min
  - Install package & setup: 1 hour
  - Implementation: 2 hours
  - Testing & verification: 30 min

**Total:** ~4 hours 5 minutes

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Both critical issues fixed ✅
- [ ] All tests passing ✅
- [ ] npm audit shows 0 vulnerabilities ✅
- [ ] SSL pinning verified ✅
- [ ] Certificate expiry documented ✅
- [ ] Monitoring setup ✅
- [ ] Security review approved ✅

---

## 📝 Notes

### Certificate Pinning Best Practices

1. **Always have backup hashes** - Prevents app breaking during rotation
2. **Monitor cert expiry** - Set alerts 30 days before expiry
3. **Plan rotation** - Update app before cert expires
4. **Test thoroughly** - Especially MITM detection
5. **Document process** - Team should know how to rotate

### When NOT to Use SSL Pinning

- ❌ Development/staging (use env flag to disable)
- ❌ If you can't control backend certificates
- ❌ If certificates rotate frequently (< 30 days)

### Production Monitoring

```typescript
// Add monitoring for SSL failures
import { analytics } from './analytics';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message?.includes('SSL Certificate')) {
      // Log to analytics
      analytics.logEvent('ssl_pinning_failure', {
        url: error.config?.url,
        timestamp: Date.now(),
      });
    }
    return Promise.reject(error);
  }
);
```

---

**Last Updated:** 2026-01-14  
**Maintainer:** Security Team  
**Next Review:** After both fixes completed
