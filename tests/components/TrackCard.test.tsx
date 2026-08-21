import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TrackCard } from "@/components/TrackCard";

describe("TrackCard", () => {
  it("links to the track page when live", () => {
    render(<TrackCard slug="investment-banking" name="Investment Banking" status="live" />);
    const link = screen.getByRole("link", { name: /investment banking/i });
    expect(link).toHaveAttribute("href", "/tracks/investment-banking");
  });

  it("shows a Coming Soon badge and no link when not live", () => {
    render(<TrackCard slug="product-management" name="Product Management" status="coming_soon" />);
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
