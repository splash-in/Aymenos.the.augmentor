# AYMENOS Compliance Documentation
## COPPA & GDPR Full Account Requirements

### Data Fields Required

#### Core Identity Fields
```typescript
{
  // Required for all users
  email: string;              // Primary identifier, must be verified
  username: string;           // Public display name (pseudonymous allowed)
  password_hash: string;      // Bcrypt/Argon2 hashed, never plain text
  
  // Age verification (COPPA requirement)
  birthdate: Date;            // Used to calculate age, not displayed publicly
  
  // Account status
  emailVerified: boolean;     // Must be true before full access
  emailVerifiedAt: Date;      // Timestamp of verification
  accountType: enum;          // "adult" | "minor_with_consent" | "minor_pending"
  
  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}
```

#### Minor-Specific Fields (Ages 13-17)
```typescript
{
  // Parental consent (COPPA requirement)
  parentEmail: string;              // Guardian's email for consent
  parentalConsentGiven: boolean;    // Must be true for account activation
  parentalConsentDate: Date;        // When consent was granted
  
  // Verification tracking
  consentRequestId: number;         // Link to consent request record
}
```

#### Privacy & Consent Fields (GDPR requirement)
```typescript
{
  // Explicit consents (must be opt-in, not pre-checked)
  dataProcessingConsent: boolean;   // Required - cannot use service without this
  marketingConsent: boolean;        // Optional - for promotional emails
  analyticsConsent: boolean;        // Optional - for usage tracking
  thirdPartySharing: boolean;       // Optional - for partner integrations
  
  // Consent versioning (GDPR requirement)
  consentVersion: string;           // "1.0", "1.1" etc. - track policy changes
  consentDate: Date;                // When user agreed to current version
  
  // Right to access
  lastDataExport: Date;             // Track GDPR data export requests
  
  // Right to be forgotten
  deletionRequested: boolean;       // User requested account deletion
  deletionRequestDate: Date;        // When deletion was requested
  scheduledDeletionDate: Date;      // 30-day grace period
}
```

---

### Security Measures Required

#### 1. Data Encryption

**At Rest:**
```typescript
// Database encryption
- Use encrypted database connections (TLS/SSL)
- Encrypt sensitive fields: email, parentEmail, birthdate
- Use AES-256 encryption for PII (Personally Identifiable Information)
- Store encryption keys in secure vault (not in code)
```

**In Transit:**
```typescript
// HTTPS everywhere
- Force HTTPS for all connections
- Use TLS 1.3 minimum
- HSTS headers enabled
- Secure cookie flags: HttpOnly, Secure, SameSite=Strict
```

**Password Security:**
```typescript
// Never store plain text passwords
import bcrypt from 'bcrypt';

// Hash with salt rounds >= 12
const passwordHash = await bcrypt.hash(password, 12);

// Enforce password requirements:
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- Check against common password lists
- Implement rate limiting on login attempts
```

#### 2. Access Controls

**Authentication:**
```typescript
// Session management
- JWT tokens with short expiration (15 minutes)
- Refresh tokens stored securely (HttpOnly cookies)
- Implement session invalidation on logout
- Track active sessions per user

// Multi-factor authentication (optional but recommended)
- TOTP (Time-based One-Time Password)
- Email verification codes
- SMS codes (if phone number provided)
```

**Authorization:**
```typescript
// Role-based access control
enum Role {
  USER = "user",           // Standard user
  MINOR = "minor",         // User under 18
  PARENT = "parent",       // Guardian with access to minor's account
  ADMIN = "admin"          // Platform administrator
}

// Permission checks
- Users can only access their own data
- Parents can view minor's data (with consent)
- Admins require audit logging for all actions
```

#### 3. Audit Logging (GDPR Article 30 requirement)

```typescript
// Log all data access
interface DataAccessLog {
  userId: number;
  accessType: "view" | "export" | "delete" | "update";
  dataCategory: string;           // "profile", "messages", "achievements"
  accessedBy: number;             // Who accessed (for admin actions)
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: object;                // Additional context
}

// Retention: Keep logs for 2 years minimum (GDPR requirement)
```

#### 4. Data Minimization (GDPR Article 5)

**Only collect what's necessary:**
```typescript
// ❌ DO NOT collect:
- Social security numbers
- Government ID numbers
- Biometric data (fingerprints, face scans)
- Precise geolocation
- Financial information (unless payment required)
- Health information
- Political opinions
- Religious beliefs

// ✅ DO collect (with justification):
- Email: Required for account recovery
- Birthdate: Required for age verification (COPPA)
- Parent email: Required for minor consent (COPPA)
- IP address: Security & fraud prevention
- Usage data: Service improvement (with consent)
```

#### 5. Data Retention & Deletion

**Retention Policies:**
```typescript
// Active accounts
- Keep data while account is active
- Inactive accounts: Delete after 2 years of no login

// Deleted accounts
- 30-day grace period (allow recovery)
- After 30 days: Permanent deletion
- Exception: Audit logs (keep 2 years for legal compliance)

// Parental consent records
- Keep for duration of minor's account
- Delete 30 days after minor turns 18 or account closes
```

**Right to be Forgotten (GDPR Article 17):**
```typescript
async function deleteUserData(userId: number) {
  // 1. Anonymize user-generated content
  await anonymizeUserPosts(userId);
  
  // 2. Delete personal data
  await db.delete(users).where(eq(users.id, userId));
  
  // 3. Delete related records
  await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
  await db.delete(parentalConsentRequests).where(eq(parentalConsentRequests.userId, userId));
  await db.delete(privacySettings).where(eq(privacySettings.userId, userId));
  
  // 4. Keep audit logs (legal requirement)
  // Do NOT delete dataAccessLogs
  
  // 5. Notify third parties (if data was shared)
  await notifyThirdPartiesOfDeletion(userId);
}
```

---

### Age Verification Process

#### Step 1: Collect Birthdate
```typescript
// During registration
const birthdate = new Date(userInput.birthdate);
const age = calculateAge(birthdate);

if (age < 13) {
  throw new Error("Users must be at least 13 years old (COPPA requirement)");
}

if (age >= 13 && age < 18) {
  // Trigger parental consent flow
  accountType = "minor_pending";
} else {
  // Adult account
  accountType = "adult";
}
```

#### Step 2: Parental Consent (for ages 13-17)
```typescript
// Send consent request email
const token = generateSecureToken();
await sendParentalConsentEmail({
  parentEmail: userInput.parentEmail,
  minorName: userInput.username,
  minorAge: age,
  consentLink: `https://aymenos.com/consent/verify?token=${token}`,
  expiresIn: "7 days"
});

// Email must include:
// - Clear explanation of data collection
// - Link to privacy policy
// - Link to terms of service
// - Explanation of minor's rights
// - How to revoke consent
// - Contact information for questions
```

#### Step 3: Consent Verification
```typescript
// Parent clicks link in email
async function verifyParentalConsent(token: string) {
  const request = await getConsentRequest(token);
  
  // Verify token is valid and not expired
  if (!request || request.expiresAt < new Date()) {
    throw new Error("Consent link expired");
  }
  
  // Update user account
  await db.update(users).set({
    parentalConsentGiven: true,
    parentalConsentDate: new Date(),
    accountType: "minor_with_consent"
  }).where(eq(users.id, request.userId));
  
  // Send confirmation emails to both parent and minor
  await sendConsentConfirmation(request.parentEmail, request.userId);
}
```

---

### Email Verification Process

```typescript
// Step 1: Send verification email
const token = generateSecureToken();
await sendVerificationEmail({
  email: userInput.email,
  verificationLink: `https://aymenos.com/verify?token=${token}`,
  expiresIn: "24 hours"
});

// Step 2: User clicks link
async function verifyEmail(token: string) {
  const verification = await getEmailVerification(token);
  
  if (!verification || verification.expiresAt < new Date()) {
    throw new Error("Verification link expired");
  }
  
  await db.update(users).set({
    emailVerified: true,
    emailVerifiedAt: new Date()
  }).where(eq(users.id, verification.userId));
}

// Step 3: Restrict features until verified
function requireEmailVerification(user: User) {
  if (!user.emailVerified) {
    throw new Error("Please verify your email before accessing this feature");
  }
}
```

---

### GDPR Rights Implementation

#### Right to Access (Article 15)
```typescript
async function exportUserData(userId: number) {
  const data = {
    personal_data: await getUserProfile(userId),
    activity_data: await getUserActivity(userId),
    consent_records: await getConsentHistory(userId),
    data_access_logs: await getAccessLogs(userId),
  };
  
  // Return as downloadable JSON
  return JSON.stringify(data, null, 2);
}
```

#### Right to Rectification (Article 16)
```typescript
// Allow users to update their data
async function updateUserData(userId: number, updates: Partial<User>) {
  // Log the update
  await logDataAccess(userId, "update", "profile", userId);
  
  // Apply updates
  await db.update(users).set(updates).where(eq(users.id, userId));
}
```

#### Right to Data Portability (Article 20)
```typescript
// Export in machine-readable format (JSON, CSV)
async function exportPortableData(userId: number) {
  const data = await exportUserData(userId);
  
  // Provide in standard format
  return {
    format: "JSON",
    schema_version: "1.0",
    exported_at: new Date().toISOString(),
    data: data
  };
}
```

#### Right to Object (Article 21)
```typescript
// Allow users to opt out of processing
async function updateProcessingConsent(userId: number, consents: object) {
  await db.update(privacySettings).set(consents).where(eq(privacySettings.userId, userId));
  
  // Stop processing immediately
  if (!consents.analyticsConsent) {
    await stopAnalyticsTracking(userId);
  }
  if (!consents.marketingConsent) {
    await unsubscribeFromMarketing(userId);
  }
}
```

---

### Security Best Practices

#### 1. Input Validation
```typescript
// Sanitize all user inputs
import validator from 'validator';

function validateEmail(email: string): boolean {
  return validator.isEmail(email) && email.length <= 320;
}

function validateBirthdate(birthdate: string): boolean {
  const date = new Date(birthdate);
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 120, 0, 1); // Max 120 years old
  
  return date > minDate && date < now;
}

// Prevent SQL injection
// Use parameterized queries (Drizzle ORM handles this)

// Prevent XSS
// Sanitize HTML output, use Content Security Policy headers
```

#### 2. Rate Limiting
```typescript
// Prevent brute force attacks
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many attempts, please try again later"
});

app.post('/api/auth/login', rateLimiter, loginHandler);
app.post('/api/auth/register', rateLimiter, registerHandler);
```

#### 3. CSRF Protection
```typescript
// Use CSRF tokens for state-changing operations
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });
app.post('/api/user/update', csrfProtection, updateHandler);
```

#### 4. Security Headers
```typescript
// Set security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

---

### Compliance Checklist

#### COPPA Compliance ✓
- [x] No data collection from users under 13
- [x] Verifiable parental consent for ages 13-17
- [x] Clear privacy policy in plain language
- [x] Parent can review child's data
- [x] Parent can request deletion of child's data
- [x] Data minimization for minors
- [x] No behavioral advertising to minors without consent

#### GDPR Compliance ✓
- [x] Lawful basis for processing (consent)
- [x] Clear, specific consent (not bundled)
- [x] Easy to withdraw consent
- [x] Right to access (data export)
- [x] Right to rectification (data updates)
- [x] Right to erasure (account deletion)
- [x] Right to data portability (JSON export)
- [x] Right to object (opt-out of processing)
- [x] Data breach notification (within 72 hours)
- [x] Privacy by design and default
- [x] Data Protection Impact Assessment (DPIA)
- [x] Records of processing activities

#### Additional Best Practices ✓
- [x] Privacy policy in multiple languages
- [x] Terms of service clearly displayed
- [x] Cookie consent banner
- [x] Regular security audits
- [x] Penetration testing
- [x] Employee training on data protection
- [x] Incident response plan
- [x] Data Protection Officer (if required)

---

### Required Legal Documents

1. **Privacy Policy** - Must include:
   - What data is collected
   - Why it's collected
   - How it's used
   - Who it's shared with
   - How long it's kept
   - User rights
   - Contact information

2. **Terms of Service** - Must include:
   - Age requirements
   - Acceptable use policy
   - Account termination conditions
   - Limitation of liability
   - Dispute resolution

3. **Cookie Policy** - Must include:
   - Types of cookies used
   - Purpose of each cookie
   - How to disable cookies
   - Third-party cookies

4. **Parental Consent Form** - Must include:
   - Clear explanation for parents
   - What data is collected from minor
   - How to revoke consent
   - Contact information

---

### Implementation Priority

**Phase 1: Core Security (MUST HAVE)**
1. Password hashing (bcrypt/argon2)
2. HTTPS enforcement
3. Secure session management
4. Input validation & sanitization

**Phase 2: Age Verification (COPPA)**
1. Birthdate collection
2. Age calculation
3. Parental consent flow
4. Email verification

**Phase 3: Privacy Controls (GDPR)**
1. Consent management
2. Data export functionality
3. Account deletion
4. Audit logging

**Phase 4: Advanced Security**
1. Rate limiting
2. CSRF protection
3. Security headers
4. Multi-factor authentication

---

This documentation ensures full compliance with both COPPA and GDPR while maintaining user trust and platform security.
