# About Copilot Premium Requests Status

## Why this project exists

GitHub Copilot is powerful, but when you have a personal plan with included + billed requests, it's hard to track usage at a glance. This extension brings **real-time visibility** of your Copilot billing directly into VS Code's status bar—no context switching, no dashboard hunting.

## The problem we solve

- **Hidden usage**: You never know if you're burning through included requests or paying overage
- **No quick reference**: GitHub billing UI requires navigation away from your editor
- **Monthly surprises**: Checking only at month-end means no time to adjust habits

## Our solution

Paste your GitHub PAT (Plan: read-only), and the extension shows:
- How many included requests you've consumed this month
- How many are billed (actual cost)
- Total requests in one compact line: `1234 | 567 ($27.34)`

Tap to refresh, configure auto-refresh interval, filter by product—all from the VS Code status bar.

## For whom

- Individual developers on Copilot Personal plan
- Anyone paranoid about surprise billing 😅
- Teams wanting inline usage monitoring (per-user setup)

## Built with

- **TypeScript** + **VS Code Extension API**
- GitHub REST API (`/users/{username}/settings/billing/premium_request/usage`)
- Secure token storage in VS Code Secret Storage
- GitHub Actions CI/CD for automated builds & releases

## Philosophy

**Minimal, focused, secure**
- One job: show Copilot usage
- No bloat, no telemetry
- Your token never leaves your machine

## Contributing

Issues & PRs welcome. Please ensure:
- No hardcoded secrets
- Tests pass (`npm run build`)
- `.gitignore` blocks `node_modules/` and `.vsix`

---

Made with ❤️ by [ToyBlackHat](https://github.com/ToyBlackHat)
