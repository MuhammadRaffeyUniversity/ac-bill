import { describe, expect, it } from "vitest";

import { getDispatchSelectionLabel } from "./dispatch-selection";

describe("getDispatchSelectionLabel", () => {
  it("shows the operator-facing label instead of the stored database ID", () => {
    expect(getDispatchSelectionLabel("cmrg98xj7000368cknjmb91q4", [{ id: "cmrg98xj7000368cknjmb91q4", label: "JB Team 1 - Johor (2 open today)" }], "Choose team")).toBe("JB Team 1 - Johor (2 open today)");
  });

  it("falls back to the selection prompt when no option is selected", () => {
    expect(getDispatchSelectionLabel(null, [], "Choose team")).toBe("Choose team");
  });
});
