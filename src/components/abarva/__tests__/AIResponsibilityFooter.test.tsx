/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import {
  AI_RESPONSIBILITY_FOOTER_COPY,
  AIResponsibilityFooter,
} from "../AIResponsibilityFooter";

describe("AIResponsibilityFooter", () => {
  it("renders the standard responsibility disclaimer", () => {
    render(<AIResponsibilityFooter />);

    expect(screen.getByText(AI_RESPONSIBILITY_FOOTER_COPY)).toBeInTheDocument();
    expect(screen.getByTestId("ai-responsibility-footer")).toHaveTextContent(
      "You are responsible for decisions taken based on this output.",
    );
  });
});
