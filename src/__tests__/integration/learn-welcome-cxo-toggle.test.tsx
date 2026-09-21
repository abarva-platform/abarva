/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { WelcomeSection } from "@/components/home/learn/WelcomeSection";

describe("Learn welcome CXO context switcher", () => {
  it("renders the executive review tabs at the top of the page", () => {
    render(<WelcomeSection />);

    const tabs = screen.getByRole("tablist", {
      name: "Choose composite tenant",
    });
    const options = within(tabs).getAllByRole("tab");
    expect(options).toHaveLength(3);
    expect(options[1]).toHaveAttribute("aria-selected", "true");
  });

  it("switches the visible CXO narrative when a tab is selected", () => {
    render(<WelcomeSection />);

    const tabs = screen.getAllByRole("tab");
    const initialDocumentText = document.body.textContent;
    fireEvent.click(tabs[0]);

    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(document.body.textContent).not.toBe(initialDocumentText);

    const firstSelectionText = document.body.textContent;
    fireEvent.click(tabs[2]);

    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(document.body.textContent).not.toBe(firstSelectionText);
  });

  it("renders the brand wordmark image inside the hero eyebrow", () => {
    render(<WelcomeSection />);

    expect(screen.getByRole("img", { name: "AbarVa" })).toHaveAttribute(
      "src",
      "/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-dark-compact.svg",
    );
  });
});
