---
description: Semantic versioning logic for determining and applying project version increments from CHANGELOG.md analysis.
---

# Workflow: Intelligent Project Versioning & Documentation

This rule defines an automated, multi-step process for releasing a new version of the project. I MUST follow this logic precisely to ensure a correct and consistent release version incrementation methodology.

### Step 1: Determine New Version (Automated Logic)

My primary task is to calculate the new version number. I MUST follow this decision tree in order:

1.  **Check for Explicit User Input:**
    - First, check if the user has provided an explicit version type (e.g., `major`, `minor`, `patch`, `fix`).
    - If yes, this is the highest priority. Proceed to calculate the new version based on this input.

2.  **Infer from `CHANGELOG.md`:**
    - If no explicit type is given, I MUST infer it by analyzing the content under the `[Unreleased]` section of `CHANGELOG.md`.
    - Apply the following Semantic Versioning logic:
        - If I find `BREAKING CHANGE:` text or a `### Removed` section, it MUST be a **MAJOR** increment.
        - If I find a `### Added` section, it MUST be a **MINOR** increment.
        - If I only find `### Fixed`, `### Security`, or other minor sections, it MUST be a **PATCH** increment.

3.  **Ask User on Ambiguity (Fallback):**
    - ⚠️ **If my inference is ambiguous** (e.g., only a `### Changed` section exists), I **MUST NOT GUESS**.
    - Instead, I MUST ask the user for clarification. Present my analysis and provide clear choices.
    - **✅ Use this template for asking:**
      > "I have analyzed the changes in `[Unreleased]` and the version increment is ambiguous. Based on the changes, I suggest the following options:
      > - **MINOR (`X.Y.Z`):** Choose this for new, backward-compatible features.
      > - **PATCH (`A.B.C`):** Choose this for backward-co mpatible bug fixes.
      >
      > Please specify which version is correct."

### Step 2: Pre-flight Check & Confirmation

Before modifying any files, perform an internal verification and present a plan to the user.

1.  **Internal Verification:** Use a thinking block to confirm I have all necessary information.
    ```xml
    <thinking>
    1.  Current version source file identified (e.g., `package.json`).
    2.  Current version read: [e.g., 1.9.3]
    3.  Increment type determined: [e.g., minor (inferred)]
    4.  Calculated new version: [e.g., 1.10.0]
    5.  Required files are present and accessible.
    Plan is ready for execution.
    </thinking>
    ```
2.  **State Your Plan:** Present the confirmed new version number to the user and ask for final approval before writing any changes. For example: "I will increment the version to `1.10.0`. Is this correct?"

### Step 3: Execute Core File Modifications

Once the user confirms, I will proceed with the following precise file modifications.

1.  **Update Central Version Source:**
    - Locate and update the version number in the identified source file (`package.json`, `app-config.yaml`, etc.).

2.  **Update `CHANGELOG.md`:**
    - Create a new version heading below `[Unreleased]` using the format `## [X.Y.Z] - YYYY-MM-DD`.
    - Move the summarized changes from the `[Unreleased]` section to this new version section.
    - Update the version comparison link at the bottom of the file.

3.  **Update `README.md` Version Badge:**
    - Find the version badge in `README.md` and update the version number.
    - **✅ Template:** `[![Version](https://img.shields.io/badge/version-NEW.VERSION.HERE-blue.svg)](CHANGELOG.md)`

### Step 4: 🧠 Intelligently Update Project Documentation

My goal is to ensure all technical and maintenance documentation reflects the new changes, not just list them.

1.  **Analyze Changes:** Review the finalized changelog entries for this version.
2.  **Identify Affected Docs:** Scan the project for relevant documentation (e.g., files in `docs/`, `guides/`, or files like `ARCHITECTURE.md`, `MAINTENANCE.md`).
3.  **Synthesize and Propose Updates:** Based on the *type* of change, determine the required documentation update.
    - **`Added`**: If a new feature was added (e.g., caching), find the relevant document (e.g., `architecture.md`) and propose adding a new section explaining it. If new configuration is required, propose updates to the setup guide.
    - **`Changed`**: If a process was changed, locate its existing description and propose updates to reflect the new behavior (e.g., updating an API endpoint's documentation).
    - **`Removed`**: If a feature was removed, find its documentation and propose either removing the section or clearly marking it as deprecated with migration steps.
    - **`Fixed`**: Bug fixes typically do not require documentation updates unless they clarify a previously misunderstood behavior.
4.  **AWAIT USER APPROVAL:** 🚨 **CRITICAL:** I MUST NOT apply these changes directly. I MUST present a clear summary of the proposed documentation updates (e.g., as a `diff` or a before/after summary) to the user for review and approval before proceeding.

### Step 5: Prepare Git Commit Message

Once all file changes are approved and applied, I will prepare and output the following commit message text. **DO NOT execute the commit.**

**✅ Template:**
```
<version number> <short, descriptive title>

- A bulleted list summarizing the key feature/fix changes.
- Update project documentation to reflect new changes.
```

**Example Output:**
```
1.10.0 Introduce User Profile Caching

- Implemented Redis caching for user profile data to reduce database load.
- Added new environment variables for Redis connection.
- Updated ARCHITECTURE.md with details on the new caching layer.