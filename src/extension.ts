import * as vscode from "vscode";
import {
  getGitHubTokenOrThrow,
  getPremiumRequestUsageForUser,
  getViewerLogin,
  sumUsage
} from "./githubBilling";

let statusItem: vscode.StatusBarItem | undefined;
let refreshTimer: NodeJS.Timeout | undefined;

function getConfig() {
  const cfg = vscode.workspace.getConfiguration("copilotPremiumRequests");
  return {
    refreshIntervalMinutes: Math.max(5, cfg.get<number>("refreshIntervalMinutes", 15)),
    productFilter: cfg.get<string>("productFilter", "Copilot"),
    alignment: cfg.get<"left" | "right">("statusBarAlignment", "right"),
    icon: cfg.get<string>("icon", "$(github)")
  };
}

function setStatus(text: string, tooltip?: string, isError?: boolean) {
  if (!statusItem) return;
  statusItem.text = text;
  statusItem.tooltip = tooltip;
  statusItem.command = "copilotPremiumRequests.refresh";
  statusItem.backgroundColor = isError
    ? new vscode.ThemeColor("statusBarItem.errorBackground")
    : undefined;
  statusItem.show();
}

async function refreshNow(ctx: vscode.ExtensionContext) {
  const { productFilter, icon } = getConfig();
  setStatus(`${icon} PR …`, "Refreshing premium requests usage…");

  try {
    const { token, source } = await getGitHubTokenOrThrow(ctx);
    const login = await getViewerLogin(token);

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    const usage = await getPremiumRequestUsageForUser(token, login, year, month);
    const totals = sumUsage(usage, productFilter);

    const ts = new Date();
    const hh = String(ts.getHours()).padStart(2, "0");
    const mm = String(ts.getMinutes()).padStart(2, "0");

    const text = `${icon} Inc ${totals.includedConsumed} | Billed ${totals.billed}`;
    const tooltip =
      `Premium Requests (${productFilter || "All products"})\n` +
      `Included: ${totals.includedConsumed}\n` +
      `Billed: ${totals.billed}\n` +
      `Total: ${totals.total}\n` +
      `User: ${login}\n` +
      `Auth: ${source}\n` +
      `Last sync: ${hh}:${mm}`;

    setStatus(text, tooltip);
  } catch (err: any) {
    const { icon } = getConfig();
    const msg = err?.message ?? String(err);

    const hint =
      `Failed to fetch premium requests usage.\n\n` +
      `${msg}\n\n` +
      `Use command: Copilot Premium Requests: Set / Update Token (Secure) with PAT (Plan: read-only).`;

    setStatus(`${icon} PR (auth?)`, hint, true);
  }
}

async function promptSetToken(ctx: vscode.ExtensionContext) {
  const token = await vscode.window.showInputBox({
    prompt: "Paste a GitHub fine-grained PAT with 'Plan: read-only' permission",
    password: true,
    ignoreFocusOut: true
  });

  if (!token || token.trim().length === 0) return;

  await ctx.secrets.store("copilotPremiumRequests.pat", token.trim());
  vscode.window.showInformationMessage("Token saved securely.");
  await refreshNow(ctx);
}

async function clearToken(ctx: vscode.ExtensionContext) {
  await ctx.secrets.delete("copilotPremiumRequests.pat");
  vscode.window.showInformationMessage("Stored token cleared.");
  await refreshNow(ctx);
}

function startTimer(ctx: vscode.ExtensionContext) {
  stopTimer();
  const { refreshIntervalMinutes } = getConfig();
  refreshTimer = setInterval(() => {
    refreshNow(ctx).catch(() => {});
  }, refreshIntervalMinutes * 60_000);
}

function stopTimer() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = undefined;
}

export async function activate(ctx: vscode.ExtensionContext) {
  const { alignment } = getConfig();
  statusItem = vscode.window.createStatusBarItem(
    alignment === "left" ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right,
    100
  );

  ctx.subscriptions.push(statusItem);

  ctx.subscriptions.push(
    vscode.commands.registerCommand("copilotPremiumRequests.refresh", () => refreshNow(ctx)),
    vscode.commands.registerCommand("copilotPremiumRequests.setToken", () => promptSetToken(ctx)),
    vscode.commands.registerCommand("copilotPremiumRequests.clearToken", () => clearToken(ctx))
  );

  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration("copilotPremiumRequests")) {
        startTimer(ctx);
        refreshNow(ctx).catch(() => {});
      }
    })
  );

  startTimer(ctx);
  await refreshNow(ctx);
}

export function deactivate() {
  stopTimer();
  if (statusItem) statusItem.dispose();
}
