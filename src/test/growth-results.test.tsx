import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GrowthResults } from "@/components/plant-growth/GrowthResults";

describe("Growth results presentation", () => {
  it("shows model predictions without the removed model notes", () => {
    render(<GrowthResults data={{ prediction: { growth_rate_cm_per_day: 0.401, growth_status: "Moderate Growth" }, warnings: ["Results are experimental estimates, not guaranteed outcomes."] }} image="data:image/jpeg;base64," analyzedAt={0} />);
    expect(screen.getByText("0.401 cm/day")).toBeInTheDocument();
    expect(screen.queryByText("Notes from the model")).not.toBeInTheDocument();
    expect(screen.queryByText("Results are experimental estimates, not guaranteed outcomes.")).not.toBeInTheDocument();
  });
});