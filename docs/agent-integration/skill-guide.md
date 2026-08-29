# AI Agent Skill Guide (`/skill.md`)

<CopyPage />

ShellGuard serves an auto-generated, machine-readable skill document directly at `GET /skill.md`.

---

## 📜 How AI Agents Use `/skill.md`

When an autonomous agent (such as an Antigravity Agent, Claude Code, Cline, or Cursor agent) is connected to your development environment, you can point the agent directly to:

```text
http://localhost:6464/skill.md
```

The agent reads this single document to instantly understand:
1. How to compute the SHA-256 hash of its `lb-` key.
2. How to obtain an `api-` token via `POST /api/auth/token`.
3. How to query credentials, passwords, and SSH keys.
4. How to format and parse `{ success, data }` envelopes and error responses.

---

## 🤖 Direct Agent Integration Example

To tell an agent to interact with ShellGuard in its prompt:

> *"You have access to ShellGuard at `http://localhost:6464`. Read the instructions at `http://localhost:6464/skill.md` to authenticate using the `lb-...` key in the environment and fetch the staging database credentials."*
