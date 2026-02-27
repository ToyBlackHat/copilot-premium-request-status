import * as vscode from "vscode";

export type PremiumRequestUsageItem = {
  product: string;
  sku: string;
  model?: string;
  unitType: string;
  pricePerUnit?: number;
  grossQuantity: number;
  grossAmount?: number;
  discountQuantity: number;
  discountAmount?: number;
  netQuantity: number;
  netAmount?: number;
};

export type PremiumRequestUsageResponse = {
  usageItems: PremiumRequestUsageItem[];
};

export type UsageTotals = {
  includedConsumed: number;
  billed: number;
  total: number;
  includedAmount: number;
  billedAmount: number;
  totalAmount: number;
  hasAmountData: boolean;
};

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function ghFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    method: "GET",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": "vscode-copilot-premium-requests-status"
    }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

export async function getGitHubTokenOrThrow(
  ctx: vscode.ExtensionContext
): Promise<{ token: string; source: string }> {
  const secret = await ctx.secrets.get("copilotPremiumRequests.pat");
  if (secret && secret.trim().length > 0) {
    return { token: secret.trim(), source: "secretToken" };
  }

  const session = await vscode.authentication.getSession("github", ["user"], {
    createIfNone: true
  });

  return { token: session.accessToken, source: "vscodeSession" };
}

export async function getViewerLogin(token: string): Promise<string> {
  const me = await ghFetch<{ login: string }>(token, "/user");
  return me.login;
}

export async function getPremiumRequestUsageForUser(
  token: string,
  username: string,
  year: number,
  month: number
): Promise<PremiumRequestUsageResponse> {
  const path = `/users/${username}/settings/billing/premium_request/usage?year=${year}&month=${month}`;
  return ghFetch<PremiumRequestUsageResponse>(token, path);
}

export function sumUsage(
  resp: PremiumRequestUsageResponse,
  productFilter?: string
): UsageTotals {
  const filter = (productFilter ?? "").trim().toLowerCase();

  const items = resp.usageItems ?? [];
  const filtered = filter.length === 0
    ? items
    : items.filter(i => (i.product ?? "").toLowerCase() === filter);

  const includedConsumed = filtered.reduce((a, i) => a + (i.discountQuantity ?? 0), 0);
  const billed = filtered.reduce((a, i) => a + (i.netQuantity ?? 0), 0);
  const total = filtered.reduce((a, i) => a + (i.grossQuantity ?? 0), 0);
  const includedAmount = filtered.reduce((a, i) => a + (i.discountAmount ?? 0), 0);
  const billedAmount = filtered.reduce((a, i) => a + (i.netAmount ?? 0), 0);
  const totalAmount = filtered.reduce((a, i) => a + (i.grossAmount ?? 0), 0);
  const hasAmountData = filtered.some(i =>
    i.grossAmount !== undefined || i.netAmount !== undefined || i.discountAmount !== undefined
  );

  return {
    includedConsumed: roundToTwo(includedConsumed),
    billed: roundToTwo(billed),
    total: roundToTwo(total),
    includedAmount: roundToTwo(includedAmount),
    billedAmount: roundToTwo(billedAmount),
    totalAmount: roundToTwo(totalAmount),
    hasAmountData
  };
}
