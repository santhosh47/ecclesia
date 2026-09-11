# Contributing to Ecclesia

Thank you for your interest in contributing to the **Ecclesia Church Management System (ChMS)**! Ecclesia is dedicated to empowering churches, parishes, and ministries with reliable, modern, and privacy-respecting technology.

---

## 1. Code of Conduct

We are committed to providing a welcoming, respectful, and collaborative environment for all contributors. Please treat fellow contributors and maintainers with kindness, patience, and professional courtesy.

---

## 2. Getting Started

Before making changes:
1. Review the system architecture in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
2. Set up your local development environment by following [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
3. Check active issues or open a discussion before undertaking major feature overhauls.

---

## 3. Git Branching & Commit Conventions

### Branch Naming Conventions
- `feature/<short-description>`: For new capabilities or user-facing enhancements.
- `bugfix/<issue-id>-<description>`: For resolving defects or unexpected behavior.
- `docs/<topic>`: For documentation updates, guides, and diagrams.
- `refactor/<component>`: For structural code improvements without behavioral changes.

### Commit Messages (Conventional Commits)
Please follow the standard conventional commit format:
```
<type>(<scope>): <subject>

[optional body]
```

**Allowed Types**:
- `feat`: A new feature (e.g., `feat(activities): add recurrence schedule rules`)
- `fix`: A bug fix (e.g., `fix(attendance): resolve division by zero in average report`)
- `docs`: Documentation updates (e.g., `docs(api): document avatar upload endpoints`)
- `test`: Adding or correcting tests (e.g., `test(playwright): add mobile SE audit`)
- `refactor`: Code reorganization with no feature changes
- `chore`: Dependency updates, build configs, toolchains

---

## 4. Pre-Pull Request Checklist

Before submitting your pull request, verify the following checks pass locally:

### 1. Backend Test Suite
```powershell
cd backend
pytest tests
```
*All tests in `tests/` must pass with zero failures.*

### 2. Frontend TypeScript & Production Build
```powershell
cd admin-portal
npm run build
```
*Must build with zero compilation or lint errors.*

### 3. Playwright End-to-End & Mobile Test Suites
Ensure both backend and frontend local servers are running:
```powershell
cd admin-portal
npm run test:e2e
```
*All 13 E2E and mobile tests must pass cleanly.*

### 4. Update Changelog & Documentation
- Document user-facing changes under the `[Unreleased]` or current version section in [CHANGELOG.md](CHANGELOG.md).
- If adding new API endpoints, document them in [docs/API_REFERENCE.md](docs/API_REFERENCE.md).
- If modifying database schemas, include an Alembic migration (`alembic revision --autogenerate`).

---

## 5. Review & Merging Process

1. **Submit PR**: Open a pull request against the `main` branch with a clear description of the problem solved, changes made, and test validation evidence.
2. **Review**: Maintainers will review code clarity, schema stability, security guards, and test coverage.
3. **Merge**: Once approved and all CI checks pass, your changes will be merged into `main`.
