/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AgentMarkdown } from "../markdownRenderer";

jest.mock("remark-gfm", () => () => undefined);
jest.mock("rehype-sanitize", () => () => undefined);
jest.mock(
  "react-markdown",
  () =>
    function MockMarkdown({
      components,
    }: {
      components: { ul: React.ElementType; ol: React.ElementType };
    }) {
      const Ul = components.ul;
      const Ol = components.ol;
      return (
        <>
          <Ul>
            <li>Supporting fact</li>
          </Ul>
          <Ol>
            <li>First priority</li>
          </Ol>
        </>
      );
    },
);

it("explicitly restores Home list markers against the CSS reset", () => {
  render(<AgentMarkdown text="Supporting fact" showListMarkers />);
  const lists = screen.getAllByRole("list");
  expect(lists[0]).toHaveStyle({ listStyleType: "disc" });
  expect(lists[1]).toHaveStyle({ listStyleType: "decimal" });
});

it("keeps existing surfaces unchanged by default", () => {
  render(<AgentMarkdown text="Supporting fact" />);
  expect(screen.getAllByRole("list")[0].style.listStyleType).toBe("");
});
