# Security Policy

## Supported Versions

We actively maintain and support security patches for the following versions of Ecclesia:

| Version | Supported          | Notes                                    |
| ------- | ------------------ | ---------------------------------------- |
| 1.0.x   | :white_check_mark: | Current active release branch            |
| < 1.0   | :x:                | Pre-release versions; upgrade to 1.0.x   |

---

## Reporting a Vulnerability

The Ecclesia engineering team takes security and privacy very seriously, particularly given the confidential nature of member information, pastoral care records, and church financial transactions.

If you believe you have discovered a vulnerability or security issue:

1. **Do not disclose publicly**: Please do NOT open a public GitHub issue.
2. **Contact Email**: Report the details privately to **security@ecclesia.org** (or the repository administrators).
3. **Include Details**:
   - Component affected (Backend FastAPI, Admin Portal React, or Flutter Mobile)
   - Detailed steps to reproduce the vulnerability
   - Proof of concept or request/response dumps
   - Potential impact (e.g. data leak, privilege escalation, unauthorized access)

### Response Timeline
- **Initial Acknowledgment**: Within 24 hours.
- **Triage & Assessment**: Within 72 hours.
- **Patch Release**: High and critical severity issues will be patched and released within 7 days.

---

## Built-In Security Architecture

Ecclesia is built with defense-in-depth security principles:
- **Role-Based Access Control (RBAC)**: Strict separation of privileges across `super_admin`, `admin`, `pastor`, `treasurer`, `elder`, `sub_admin`, and `ministry_leader`.
- **Password Security**: Strong hashing using Bcrypt with salted rounds.
- **Session Tokens**: Cryptographically signed JWT tokens with standard expiration and refresh lifecycle.
- **Rate Limiting**: Sliding window rate-limiting middleware to guard against brute-force attacks and abuse.
- **Audit Logging**: Comprehensive, tamper-evident audit logging for all mutations, exports, pastoral access, and administrative actions.
- **Data Protection**: Strict isolation for confidential pastoral counseling notes and prayer requests.
