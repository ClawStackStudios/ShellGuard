---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

At a high level, the process of creating a skill goes like this:

- Decide what you want the skill to do and roughly how it should do it
- Write a draft of the skill
- Create a few test prompts and run claude-with-access-to-the-skill on them
- Help the user evaluate the results both qualitatively and quantitatively
- Rewrite the skill based on feedback from the user's evaluation of the results
- Repeat until you're satisfied
- Expand the test set and try again at larger scale

Your job when using this skill is to figure out where the user is in this process and then jump in and help them progress through these stages.

## Communicating with the user

Pay attention to context cues to understand how to phrase your communication. In the default case, just to give you some idea:

- "evaluation" and "benchmark" are borderline, but OK
- for "JSON" and "assertion" you want to see serious cues from the user that they know what those things are before using them without explaining them

It's OK to briefly explain terms if you're in doubt, and feel free to clarify terms with a short definition if you're unsure if the user will understand.

---

## Creating a skill

### Capture Intent

Start by understanding the user's intent. The current conversation might already contain a workflow the user wants to capture (e.g., they say "turn this into a skill"). If so, extract answers from the conversation history first — the tools used, the sequence of steps, corrections the user made, input/output formats observed. The user may need to fill the gaps, and should confirm before proceeding to the next step.

1. What should this skill enable Claude to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases to verify the skill works?

### Interview and Research

Proactively ask questions about edge cases, input/output formats, example files, success criteria, and dependencies. Wait to write test prompts until you've got this part ironed out.

### Write the SKILL.md

Based on the user interview, fill in these components:

- **name**: Skill identifier
- **description**: When to trigger, what it does. This is the primary triggering mechanism - include both what the skill does AND specific contexts for when to use it. Make the skill descriptions a little bit "pushy" — Claude has a tendency to undertrigger skills.
- **compatibility**: Required tools, dependencies (optional, rarely needed)
- **the rest of the skill**

### Skill Writing Guide

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Progressive Disclosure

Skills use a three-level loading system:
1. **Metadata** (name + description) - Always in context (~100 words)
2. **SKILL.md body** - In context whenever skill triggers (<500 lines ideal)
3. **Bundled resources** - As needed (unlimited, scripts can execute without loading)

**Key patterns:**
- Keep SKILL.md under 500 lines; if approaching this limit, add additional hierarchy with clear pointers about where to go next.
- Reference files clearly from SKILL.md with guidance on when to read them
- For large reference files (>300 lines), include a table of contents

#### Writing Patterns

Prefer using the imperative form in instructions.

**Defining output formats** - You can do it like this:
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**Examples pattern** - It's useful to include examples:
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### Writing Style

Try to explain to the model why things are important in lieu of heavy-handed MUSTs. Use theory of mind and try to make the skill general and not super-narrow to specific examples. Start by writing a draft and then look at it with fresh eyes and improve it.

### Test Cases

After writing the skill draft, come up with 2-3 realistic test prompts — the kind of thing a real user would actually say. Share them with the user for review.

Save test cases to `evals/evals.json`. Don't write assertions yet — just the prompts.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

---

## Running and evaluating test cases

Put results in `<skill-name>-workspace/` as a sibling to the skill directory. Within the workspace, organize results by iteration (`iteration-1/`, `iteration-2/`, etc.) and within that, each test case gets a directory.

### Step 1: Spawn all runs (with-skill AND baseline) in the same turn

For each test case, spawn two subagents in the same turn — one with the skill, one without. Launch everything at once so it all finishes around the same time.

### Step 2: While runs are in progress, draft assertions

Draft quantitative assertions for each test case and explain them to the user. Good assertions are objectively verifiable and have descriptive names.

### Step 3: As runs complete, capture timing data

When each subagent task completes, save timing data to `timing.json` in the run directory.

### Step 4: Grade, aggregate, and launch the viewer

Once all runs are done:
1. **Grade each run** — evaluate each assertion against the outputs
2. **Aggregate into benchmark** — produce benchmark.json and benchmark.md
3. **Do an analyst pass** — surface patterns the aggregate stats might hide
4. **Launch the viewer** with both qualitative outputs and quantitative data

### Step 5: Read the feedback

When the user tells you they're done, read `feedback.json` and focus improvements on test cases with specific complaints.

---

## Improving the skill

### How to think about improvements

1. **Generalize from the feedback.** We're trying to create skills that work across many different prompts, not just the test examples.
2. **Keep the prompt lean.** Remove things that aren't pulling their weight.
3. **Explain the why.** Try hard to explain the **why** behind everything you're asking the model to do. If you find yourself writing ALWAYS or NEVER in all caps, that's a yellow flag — reframe and explain the reasoning.
4. **Look for repeated work across test cases.** If all test cases result in the subagent writing similar helper scripts, that's strong signal the skill should bundle that script.

### The iteration loop

After improving the skill:
1. Apply improvements to the skill
2. Rerun all test cases into a new `iteration-<N+1>/` directory
3. Launch the reviewer with `--previous-workspace` pointing at the previous iteration
4. Wait for the user to review and tell you they're done
5. Read the new feedback, improve again, repeat

Keep going until the user says they're happy, the feedback is all empty, or you're not making meaningful progress.

---

## Description Optimization

The description field in SKILL.md frontmatter is the primary mechanism that determines whether Claude invokes a skill. After creating or improving a skill, offer to optimize the description for better triggering accuracy.

### Step 1: Generate trigger eval queries

Create 20 eval queries — a mix of should-trigger and should-not-trigger. Save as JSON.

The queries must be realistic and something a user would actually type. Not abstract requests, but requests that are concrete and specific with detail. Use a mix of different lengths, and focus on edge cases rather than making them clear-cut.

For **should-trigger** queries (8-10), think about coverage. Different phrasings of the same intent — some formal, some casual. Include cases where the user doesn't explicitly name the skill but clearly needs it.

For **should-not-trigger** queries (8-10), the most valuable ones are the near-misses — queries that share keywords or concepts with the skill but actually need something different.

### Step 2: Review with user

Present the eval set to the user for review.

### Step 3: Run the optimization loop

Run the optimization loop in the background. It splits the eval set into 60% train and 40% held-out test, evaluates the current description, then proposes improvements based on what failed. Re-evaluates each new description on both train and test, iterating up to 5 times.

### Step 4: Apply the result

Take `best_description` from the output and update the skill's SKILL.md frontmatter. Show the user before/after and report the scores.

---

## Claude.ai-specific instructions

In Claude.ai, the core workflow is the same but some mechanics change:

- **Running test cases**: No subagents. Read the skill's SKILL.md, then follow its instructions to accomplish the test prompt yourself. Do them one at a time.
- **Reviewing results**: If no browser available, present results directly in the conversation. Ask for feedback inline.
- **Benchmarking**: Skip quantitative benchmarking. Focus on qualitative feedback.
- **Description optimization**: Requires `claude` CLI tool. Skip if on Claude.ai.

---

## Cowork-Specific Instructions

- You have subagents, so the main workflow works.
- No browser/display — use `--static <output_path>` for standalone HTML.
- GENERATE THE EVAL VIEWER *BEFORE* evaluating inputs yourself.
- Feedback: `feedback.json` downloads as a file. Read it from there.
- Packaging works — `package_skill.py` just needs Python and a filesystem.

---

## Reference files

The agents/ directory contains instructions for specialized subagents:
- `agents/grader.md` — How to evaluate assertions against outputs
- `agents/comparator.md` — How to do blind A/B comparison
- `agents/analyzer.md` — How to analyze why one version beat another

The references/ directory has additional documentation:
- `references/schemas.md` — JSON structures for evals.json, grading.json, etc.

---

## Core Loop (Summary)

- Figure out what the skill is about
- Draft or edit the skill
- Run claude-with-access-to-the-skill on test prompts
- With the user, evaluate the outputs
- Repeat until satisfied
- Package the final skill and return it to the user.
