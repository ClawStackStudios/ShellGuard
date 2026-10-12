---
name: changelog-automation
description: Patterns and tools for automating changelog generation, release notes, and version management following industry standards (Keep a Changelog, Conventional Commits, Semantic Versioning, git-cliff, standard-version, semantic-release).
---

# Changelog Automation

Patterns and tools for automating changelog generation, release notes, and version management following industry standards.

## When to Use This Skill
- Setting up automated changelog generation
- Implementing Conventional Commits across workflows and rules
- Creating release note workflows and release templates
- Standardizing commit message formats and attribution
- Generating GitHub/GitLab release notes
- Managing semantic versioning and release lifecycle gates

---

## Core Concepts

### 1. Keep a Changelog Format (v1.1.0)
Changelogs must be human-readable, chronological, and group changes into standardized semantic categories:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- New feature X

## [1.2.0] - 2024-01-15
### Added
- User profile avatars
- Dark mode support

### Changed
- Improved loading performance by 40%

### Deprecated
- Old authentication API (use v2)

### Removed
- Legacy payment gateway

### Fixed
- Login timeout issue (#123)

### Security
- Updated dependencies for CVE-2024-1234

[Unreleased]: https://github.com/user/repo/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/user/repo/compare/v1.1.0...v1.2.0
```

### 2. Conventional Commits (v1.0.0)

Structure:
```plaintext
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

| Type | Description | Changelog Section |
| :--- | :--- | :--- |
| `feat` | New feature | `Added` |
| `fix` | Bug fix | `Fixed` |
| `fix(security)` / `fix(crypto)` | Security patch, cryptographic hardening | `Security` |
| `docs` | Documentation | Documentation (or excluded) |
| `style` | Formatting, missing semi-colons, etc. | (usually excluded) |
| `refactor` | Code restructuring without feature or bug changes | `Changed` |
| `perf` | Performance improvement | `Changed` |
| `test` | Adding or updating tests | (usually excluded) |
| `chore` | Maintenance, dependencies, tooling | (usually excluded) |
| `ci` | CI/CD pipeline changes | (usually excluded) |
| `build` | Build system or external dependencies | (usually excluded) |
| `revert` | Reverting a previous commit | `Removed` |

#### Breaking Changes
- Append `!` after type/scope: `feat(api)!: drop v1 endpoints`
- Or add `BREAKING CHANGE:` in footer with migration notes:
  ```
  BREAKING CHANGE: The user endpoint now returns `userId` instead of `id`.
  ```

#### Security Advisories & Coordinated Vulnerability Disclosure in Changelogs
Security entries in `CHANGELOG.md` (`### Security`) and release notes adhere strictly to the repository's `SECURITY.md` policy:
- **Scope & Naming**: Use type `fix(security)` or `fix(crypto)` for security patches and cryptographic repairs.
- **Advisory References**: Reference CVEs or GitHub Security Advisory IDs (e.g. `GHSA-xxxx-yyyy-zzzz`) and link to the advisory when public.
- **Responsible Disclosure Attribution**: Credit external security researchers who reported via the private channels defined in `SECURITY.md`, respecting anonymity requests:
  ```markdown
  ### Security
  - Mitigated timing side-channel in key hash verification ([GHSA-xxxx-yyyy](https://github.com/owner/repo/security/advisories/GHSA-xxxx-yyyy)). Reported by @researcher via responsible disclosure.
  ```
- **Severity Disclosure**: Clearly indicate upgrade urgency (`[Critical]`, `[High]`, `[Moderate]`, `[Low]`) so vault operators can prioritize maintenance.

### 3. Semantic Versioning (SemVer 2.0.0)
Format: `MAJOR.MINOR.PATCH` (or 4-tier build receipt `vX.Y.Z.W (Build N)`):
- **MAJOR**: Breaking changes (`feat!` or `BREAKING CHANGE`).
- **MINOR**: Backward-compatible new features (`feat`).
- **PATCH**: Backward-compatible bug fixes and performance improvements (`fix`, `perf`).

---

## Tooling & Automation Methods

### Method 1: Conventional Changelog & Commitlint (Node.js)
```bash
npm install -D @commitlint/cli @commitlint/config-conventional husky standard-version
```

Configuration `commitlint.config.js`:
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'build', 'revert'],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 72],
  },
};
```

Husky commit hook setup:
```bash
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### Method 2: standard-version Configuration
Configuration `.versionrc.js`:
```javascript
module.exports = {
  types: [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
    { type: "perf", section: "Performance Improvements" },
    { type: "revert", section: "Reverts" },
    { type: "docs", section: "Documentation", hidden: true },
    { type: "style", section: "Styles", hidden: true },
    { type: "chore", section: "Miscellaneous", hidden: true },
    { type: "refactor", section: "Code Refactoring", hidden: true },
    { type: "test", section: "Tests", hidden: true },
    { type: "build", section: "Build System", hidden: true },
    { type: "ci", section: "CI/CD", hidden: true },
  ],
  commitUrlFormat: "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
  compareUrlFormat: "{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}",
  issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
  userUrlFormat: "{{host}}/{{user}}",
  releaseCommitMessageFormat: "chore(release): {{currentTag}}",
  scripts: {
    prebump: 'echo "Running prebump"',
    postbump: 'echo "Running postbump"',
    prechangelog: 'echo "Running prechangelog"',
    postchangelog: 'echo "Running postchangelog"',
  },
};
```

Scripts in `package.json`:
```json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:patch": "standard-version --release-as patch",
    "release:dry": "standard-version --dry-run"
  }
}
```

### Method 3: semantic-release (Full CI/CD Automation)
Configuration `release.config.js`:
```javascript
module.exports = {
  branches: [
    "main",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      { changelogFile: "CHANGELOG.md" },
    ],
    [
      "@semantic-release/npm",
      { npmPublish: true },
    ],
    [
      "@semantic-release/github",
      { assets: ["dist/**/*.js", "dist/**/*.css"] },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};
```

### Method 4: GitHub Actions Release Workflow
File `.github/workflows/release.yml`:
```yaml
name: Release
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      release_type:
        description: "Release type"
        required: true
        default: "patch"
        type: choice
        options:
          - patch
          - minor
          - major

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
      - name: Run semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

### Method 5: git-cliff (Fast Rust-Based Changelog Generator)
Configuration `cliff.toml`:
```toml
[changelog]
header = """
# Changelog
All notable changes to this project will be documented in this file.
"""
body = """
{% if version %}\
    ## [{{ version | trim_start_matches(pat="v") }}] - {{ timestamp | date(format="%Y-%m-%d") }}
{% else %}\
    ## [Unreleased]
{% endif %}\
{% for group, commits in commits | group_by(attribute="group") %}
    ### {{ group | upper_first }}
    {% for commit in commits %}
        - {% if commit.scope %}**{{ commit.scope }}:** {% endif %}\
            {{ commit.message | upper_first }}\
            {% if commit.github.pr_number %} ([#{{ commit.github.pr_number }}](https://github.com/owner/repo/pull/{{ commit.github.pr_number }})){% endif %}\
    {% endfor %}
{% endfor %}
"""
footer = """
{% for release in releases -%}
    {% if release.version -%}
        {% if release.previous.version -%}
            [{{ release.version | trim_start_matches(pat="v") }}]: \
                https://github.com/owner/repo/compare/{{ release.previous.version }}...{{ release.version }}
        {% endif -%}
    {% else -%}
        [unreleased]: https://github.com/owner/repo/compare/{{ release.previous.version }}...HEAD
    {% endif -%}
{% endfor %}
"""
trim = true

[git]
conventional_commits = true
filter_unconventional = true
split_commits = false
commit_parsers = [
    { message = "^feat", group = "Features" },
    { message = "^fix", group = "Bug Fixes" },
    { message = "^doc", group = "Documentation" },
    { message = "^perf", group = "Performance" },
    { message = "^refactor", group = "Refactoring" },
    { message = "^style", group = "Styling" },
    { message = "^test", group = "Testing" },
    { message = "^chore\\(release\\)", skip = true },
    { message = "^chore", group = "Miscellaneous" },
]
filter_commits = false
tag_pattern = "v[0-9]*"
```

CLI commands:
```bash
# Generate changelog
git cliff -o CHANGELOG.md

# Generate for specific range
git cliff v1.0.0..v2.0.0 -o RELEASE_NOTES.md

# Preview without writing
git cliff --unreleased --dry-run
```

---

## Release Notes Templates

### 1. GitHub / GitLab Release Template
```markdown
## What's Changed

### 🚀 Features
{{ range .Features }}
- {{ .Title }} by @{{ .Author }} in #{{ .PR }}
{{ end }}

### 🐛 Bug Fixes
{{ range .Fixes }}
- {{ .Title }} by @{{ .Author }} in #{{ .PR }}
{{ end }}

### 📚 Documentation
{{ range .Docs }}
- {{ .Title }} by @{{ .Author }} in #{{ .PR }}
{{ end }}

### 🔧 Maintenance
{{ range .Chores }}
- {{ .Title }} by @{{ .Author }} in #{{ .PR }}
{{ end }}

## New Contributors
{{ range .NewContributors }}
- @{{ .Username }} made their first contribution in #{{ .PR }}
{{ end }}

**Full Changelog**: https://github.com/owner/repo/compare/v{{ .Previous }}...v{{ .Current }}
```

### 2. Internal / Artifact Release Notes Template
```markdown
# Release v2.1.0 — January 15, 2024

## Summary
This release introduces dark mode support and improves checkout performance by 40%. It also includes important security updates.

## Highlights
### 🌙 Dark Mode
Users can now switch to dark mode from settings. The preference is automatically saved and synced across devices.

### ⚡ Performance
- Checkout flow is 40% faster
- Reduced bundle size by 15%

## Breaking Changes
None in this release.

## Upgrade Guide
No special steps required. Standard deployment process applies.

## Known Issues
- Dark mode may flicker on initial load (fix scheduled for v2.1.1)

## Dependencies Updated
| Package | From | To | Reason |
| :--- | :--- | :--- | :--- |
| `react` | 18.2.0 | 18.3.0 | Performance improvements |
| `lodash` | 4.17.20 | 4.17.21 | Security patch |
```

---

## Best Practices

### Do's
- **Follow Conventional Commits**: Enables automated tooling, machine parsing, and clear history.
- **Write Clear, Imperative Messages**: Under 72 characters on subject lines; explain the *why* in the body.
- **Reference Issues & PRs**: Link commits to tickets (`Closes #123`).
- **Use Consistent Scopes**: Define team-wide scopes (`auth`, `vault`, `api`, `ui`).
- **Automate Releases**: Reduce human error in tagging and changelog synchronization.

### Don'ts
- **Don't Mix Changes**: One logical change per commit. Avoid mega-commits.
- **Don't Skip Validation**: Use linting and commit hooks (`commitlint`, `husky`).
- **Don't Manually Diverge Changelogs**: Follow standard Keep a Changelog categories (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`).
- **Don't Forget Breaking Change Markers**: Always flag breaking changes with `!` or `BREAKING CHANGE:`.
- **Don't Ignore CI / Pre-Flight Gates**: Never commit or tag if tests, linters, or builds fail.
