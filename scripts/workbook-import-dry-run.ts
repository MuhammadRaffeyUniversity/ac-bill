import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type WorkbookRow = Record<string, unknown>;

export type WorkbookSnapshot = {
  sheets: Record<string, WorkbookRow[]>;
};

export type DryRunIssue = {
  severity: "error" | "warning";
  sheet: string;
  row?: number;
  message: string;
};

export type WorkbookDryRunReport = {
  accepted: boolean;
  rowCounts: Record<string, number>;
  teamNamesNeedingReview: string[];
  totals: {
    salarySales: number;
    salaryExpenses: number;
    commissionSales: number;
    companyExpenses: number;
    personalExpenses: number;
    pettyCashIn: number;
    pettyCashOut: number;
  };
  issues: DryRunIssue[];
};

const operationalSheets = new Set([
  "Dash Board",
  "Invoice Record",
  "Salary Teams",
  "Commission Teams",
  "Personal Expenses",
  "Company Expenses",
  "Employee Records",
  "Petty Cash",
]);

const ignoredSheets = new Set(["Sheet11", "Sheet12"]);

function valueAt(row: WorkbookRow, names: string[]) {
  for (const name of names) {
    if (name in row) return row[name];
  }

  return undefined;
}

function requiredNumber(
  row: WorkbookRow,
  names: string[],
  sheet: string,
  rowNumber: number,
  issues: DryRunIssue[],
) {
  const value = valueAt(row, names);
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    issues.push({
      severity: "error",
      sheet,
      row: rowNumber,
      message: `Expected a finite number in ${names.join(" or ")}.`,
    });
    return 0;
  }

  return parsed;
}

function optionalNumber(row: WorkbookRow, names: string[]) {
  const value = valueAt(row, names);
  if (value === undefined || value === null || value === "") return 0;

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function collectTeamName(
  row: WorkbookRow,
  sheet: string,
  rowNumber: number,
  teamNames: Set<string>,
  issues: DryRunIssue[],
) {
  const value = valueAt(row, ["team", "Team"]);
  if (typeof value !== "string" || !value.trim()) {
    issues.push({
      severity: "error",
      sheet,
      row: rowNumber,
      message: "A team name is required for this row.",
    });
    return;
  }

  teamNames.add(value.trim());
}

/**
 * Validates a redacted workbook snapshot before a human maps it into database
 * records. It never opens Excel files or writes to the database.
 */
export function validateWorkbookSnapshot(snapshot: WorkbookSnapshot): WorkbookDryRunReport {
  const issues: DryRunIssue[] = [];
  const teamNames = new Set<string>();
  const rowCounts: Record<string, number> = {};
  const totals = {
    salarySales: 0,
    salaryExpenses: 0,
    commissionSales: 0,
    companyExpenses: 0,
    personalExpenses: 0,
    pettyCashIn: 0,
    pettyCashOut: 0,
  };

  for (const [sheet, rows] of Object.entries(snapshot.sheets)) {
    rowCounts[sheet] = rows.length;

    if (ignoredSheets.has(sheet)) {
      issues.push({
        severity: "warning",
        sheet,
        message: "This sheet is intentionally excluded from operational import.",
      });
      continue;
    }

    if (!operationalSheets.has(sheet)) {
      issues.push({
        severity: "warning",
        sheet,
        message: "Unknown sheet; it requires a documented mapping before import.",
      });
      continue;
    }

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      switch (sheet) {
        case "Salary Teams":
          collectTeamName(row, sheet, rowNumber, teamNames, issues);
          totals.salarySales += requiredNumber(row, ["sales", "Sales"], sheet, rowNumber, issues);
          totals.salaryExpenses += optionalNumber(row, ["expense", "Expense"]);
          break;
        case "Commission Teams":
          collectTeamName(row, sheet, rowNumber, teamNames, issues);
          totals.commissionSales += requiredNumber(row, ["sales", "Sales"], sheet, rowNumber, issues);
          break;
        case "Company Expenses":
          totals.companyExpenses += requiredNumber(row, ["amount", "Amount"], sheet, rowNumber, issues);
          break;
        case "Personal Expenses":
          totals.personalExpenses += requiredNumber(row, ["amount", "Amount"], sheet, rowNumber, issues);
          break;
        case "Petty Cash":
          totals.pettyCashIn += optionalNumber(row, ["cashIn", "Cash In", "cash in"]);
          totals.pettyCashOut += optionalNumber(row, ["cashOut", "Cash Out", "cash out"]);
          break;
        default:
          break;
      }
    });
  }

  if (teamNames.size > 6) {
    issues.push({
      severity: "warning",
      sheet: "Team mapping",
      message: `Found ${teamNames.size} team names. Confirm the final six active teams and merge historical variants before import.`,
    });
  }

  return {
    accepted: !issues.some((issue) => issue.severity === "error"),
    rowCounts,
    teamNamesNeedingReview: [...teamNames].sort(),
    totals,
    issues,
  };
}

async function main() {
  const source = process.argv[2];
  if (!source) {
    console.error("Usage: tsx scripts/workbook-import-dry-run.ts <redacted-workbook-snapshot.json>");
    process.exitCode = 1;
    return;
  }

  const raw = await readFile(resolve(source), "utf8");
  const snapshot = JSON.parse(raw) as WorkbookSnapshot;
  const report = validateWorkbookSnapshot(snapshot);
  console.log(JSON.stringify(report, null, 2));
  if (!report.accepted) process.exitCode = 1;
}

if (process.argv[1]?.endsWith("workbook-import-dry-run.ts")) {
  void main();
}
