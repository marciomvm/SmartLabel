# Draft: Project "Labels" Context

## Findings
- **Directory**: `/mnt/c/Users/Marcio/Labels`
- **Existing Files**:
  - `antigravity-accounts.json`: Contains credentials/tokens (DO NOT COMMIT).
  - `package.json`: Malformed (looks like opencode config).
  - `opencode.json`: Configured with `chrome-devtools` MCP.
- **Stack**: Unclear (Bun lockfile exists, but package.json is odd).

## Potential Goal
- The directory is named "Labels".
- The accounts file contains a Gmail address (`marciomvm@gmail.com`).
- **Hypothesis**: Building a tool to manage email labels or Google Project labels?

## Setup Needs
- [ ] Fix `package.json`.
- [ ] Add `.gitignore` for `antigravity-accounts.json`.
- [ ] Initialize source structure.
