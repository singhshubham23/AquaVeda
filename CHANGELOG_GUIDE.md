# Changelog & Logs Management

## Overview

The AquaVeda project now has a **dual-layer changelog system**:

1. **`.logs`** — Machine-readable JSON changelog (automated, structured)
2. **`docs/logs.md`** — Human-readable markdown log (synced via script)

Both are kept in sync for flexibility in reading and querying.

---

## Adding Changelog Entries

### Method 1: Interactive CLI (Recommended)

```bash
cd AquaVeda
node scripts/add-changelog.js
```

This will:
- Prompt you to select a category
- Ask for title, description, affected files
- Add entry to `.logs` 
- Sync to `docs/logs.md`

### Method 2: Manual JSON Edit

Edit `.logs` directly:

```json
{
  "entries": [
    {
      "date": "2026-05-11",
      "category": "Frontend",
      "title": "Added dark mode toggle",
      "description": "Implemented theme switcher in navbar",
      "files": ["client/src/components/Nav.jsx", "client/src/styles/themes.css"],
      "priority": "medium",
      "status": "completed"
    }
  ]
}
```

### Method 3: Git Hooks (Fully Automated - Optional)

To auto-log every commit:

```bash
# Install the post-commit hook
cp .githooks/post-commit .git/hooks/
chmod +x .git/hooks/post-commit

# Configure git to use .githooks directory
git config core.hooksPath .githooks
```

Then each commit automatically updates `.logs` based on changed files.

---

## Categories

| Category | Use Case |
|----------|----------|
| **Frontend** | UI, components, styling |
| **Backend** | APIs, business logic, database |
| **Docs** | Documentation, README, guides |
| **Config** | Build, env, dependencies |
| **CI/CD** | Testing, deployment automation |
| **Ops** | Monitoring, infrastructure |
| **Planning** | Roadmap, strategy decisions |
| **Refactor** | Code cleanup, architecture |
| **Bugfix** | Bug fixes and hotpatches |
| **Feature** | New features |
| **Performance** | Optimization work |

---

## `.logs` File Structure

```json
{
  "format": "Automated Changelog Log",
  "description": "Machine-readable changelog",
  "categories": [...],
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "category": "Category Name",
      "title": "Brief title",
      "description": "Detailed description",
      "files": ["path/to/file1.js", "path/to/file2.css"],
      "priority": "low|medium|high",
      "status": "completed|in-progress|blocked"
    }
  ],
  "lastUpdated": "ISO 8601 timestamp"
}
```

---

## Querying Changelogs

### Find all Frontend changes
```bash
grep "\"category\": \"Frontend\"" .logs
```

### Find all high-priority items in last 7 days
```bash
jq '.entries[] | select(.priority=="high" and .date>"2026-05-04")' .logs
```

### Generate a release notes summary
```bash
jq -r '.entries[] | "[" + .date + "] " + .category + " - " + .title' .logs
```

---

## Integration with Other Projects

To set up the same system for **HaloTaskPro**, **StockSphere**, or **CyberShield**:

```bash
cp AquaVeda/.logs ProjectName/.logs
cp AquaVeda/scripts/add-changelog.js ProjectName/scripts/add-changelog.js
```

Then customize `.logs` with that project's relevant entries.

---

## Best Practices

✅ **DO:**
- Add entries immediately after completing a feature
- Be descriptive but concise (one-liner title + detail)
- Mark priority based on user-facing impact
- Include affected files for traceability

❌ **DON'T:**
- Leave `status: "in-progress"` entries for too long
- Add entries weeks after completion
- Use vague titles like "fixed stuff"
- Skip the category selection

---

## Future Enhancements

- [ ] Auto-generate release notes from `.logs`
- [ ] Slack integration to announce major changes
- [ ] Weekly digest of changelogs
- [ ] Semantic versioning based on entry types
- [ ] Changelog search UI in project dashboard
