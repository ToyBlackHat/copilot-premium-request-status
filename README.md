# Copilot Premium Requests Status

[![CI](https://github.com/ToyBlackHat/copilot-premium-request-status/actions/workflows/ci.yml/badge.svg)](https://github.com/ToyBlackHat/copilot-premium-request-status/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/ToyBlackHat/copilot-premium-request-status)](https://github.com/ToyBlackHat/copilot-premium-request-status/blob/main/LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/ToyBlackHat/copilot-premium-request-status)](https://github.com/ToyBlackHat/copilot-premium-request-status/commits/main)
[![Issues](https://img.shields.io/github/issues/ToyBlackHat/copilot-premium-request-status)](https://github.com/ToyBlackHat/copilot-premium-request-status/issues)
[![Stars](https://img.shields.io/github/stars/ToyBlackHat/copilot-premium-request-status?style=social)](https://github.com/ToyBlackHat/copilot-premium-request-status/stargazers)
[![Forks](https://img.shields.io/github/forks/ToyBlackHat/copilot-premium-request-status?style=social)](https://github.com/ToyBlackHat/copilot-premium-request-status/network/members)
[![Top Language](https://img.shields.io/github/languages/top/ToyBlackHat/copilot-premium-request-status)](https://github.com/ToyBlackHat/copilot-premium-request-status)

VS Code extension that shows GitHub Copilot **premium requests usage** in the status bar (included vs billed), with manual and automatic refresh.

## Features

- Status bar summary: `Included | Billed`
- Tooltip with details: included, billed, total, user, auth source, last sync
- Secure token storage in VS Code Secrets
- Fallback auth through VS Code GitHub session
- Configurable product filter, refresh interval, icon, and status bar alignment
- Commands for refresh and token management

## Requirements

- VS Code `^1.90.0`
- GitHub account with access to billing usage endpoint
- Recommended: fine-grained PAT with permission **Plan: read-only**

## Installation (local development)

```bash
npm install
npm run build
```

Then run the extension in VS Code using **Run Extension** (F5).

## Run locally in VS Code

1. Open this project folder in VS Code.
2. Run:

  ```bash
  npm install
  npm run build
  ```

3. Press `F5` (or use **Run and Debug** → **Run Extension**).
4. In the new Extension Development Host window:
  - Open Command Palette (`Cmd+Shift+P`)
  - Run **Copilot Premium Requests: Set / Update Token (Secure)**
  - Paste PAT with **Plan: read-only**
  - Check status bar for usage values

## Add extension to your VS Code (VSIX)

1. Build package:

  ```bash
  npm install
  npm run package
  ```

2. Install generated `.vsix` file:
  - In VS Code open Extensions view
  - `...` menu → **Install from VSIX...**
  - Select the generated `.vsix`

Alternative (CLI):

```bash
code --install-extension ./copilot-premium-requests-status-0.1.0.vsix
```

## Commands

- `Copilot Premium Requests: Refresh Now`
- `Copilot Premium Requests: Set / Update Token (Secure)`
- `Copilot Premium Requests: Clear Stored Token`

## Configuration

Extension settings namespace: `copilotPremiumRequests`

- `refreshIntervalMinutes` (number, default: `15`, min: `5`)
- `productFilter` (string, default: `Copilot`, empty = all products)
- `statusBarAlignment` (`left` | `right`, default: `right`)
- `icon` (string, Codicon syntax, default: `$(github)`)

## How authentication works

1. Extension checks secret storage key: `copilotPremiumRequests.pat`
2. If missing, it requests VS Code GitHub auth session (`user`)
3. Token is used to call GitHub API for current month usage

## API used

- `GET /user`
- `GET /users/{username}/settings/billing/premium_request/usage?year={year}&month={month}`

Base URL: `https://api.github.com`  
API version header: `X-GitHub-Api-Version: 2022-11-28`

## Development

### Scripts

- `npm run build` — compile TypeScript to `dist/`
- `npm run watch` — compile in watch mode
- `npm run package` — package extension with `npx -y @vscode/vsce@latest package`

### Project structure

```text
src/
  extension.ts      # VS Code activation, status bar, commands, timers
  githubBilling.ts  # GitHub auth + API client + usage aggregation
dist/
  extension.js
  githubBilling.js
```

## Troubleshooting

- **Status shows auth error**
  - Set PAT again using command: **Set / Update Token (Secure)**
  - Ensure PAT has required permission: **Plan: read-only**
- **No data in selected product**
  - Clear `productFilter` or verify exact product name returned by API
- **Data seems stale**
  - Run **Refresh Now** or lower `refreshIntervalMinutes`

## Security notes

- PAT is stored in VS Code Secret Storage (not in workspace files)
- Do not commit tokens to source control
- Packaging uses `npx -y @vscode/vsce@latest` to avoid keeping vulnerable transitive dependencies in local devDependencies

## Current project status

- TypeScript build: ✅
- Output artifacts in `dist/`: ✅
- Type diagnostics in source files: ✅ (no errors)

## License

MIT — see `LICENSE`.
