import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SharedFilters } from "./shared-filters";
import { createDefaultFilters } from "@/shared/types/filters";

describe("SharedFilters", () => {
  it("resets to default filters when Reset is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const filters = {
      ...createDefaultFilters(),
      season: "Dry" as const, // force reset button visible
    };

    render(<SharedFilters filters={filters} onFilterChange={onFilterChange} compact />);

    const resetButton = screen.getByRole("button", { name: /reset/i });
    await user.click(resetButton);

    expect(onFilterChange).toHaveBeenCalledTimes(1);
    const nextFilters = onFilterChange.mock.calls[0][0];
    expect(nextFilters.season).toBe("All");
    expect(nextFilters.fieldStage).toBe("All");
    expect(nextFilters.pestType).toBe("All");
  });
});

