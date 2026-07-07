/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";

import { ContextUploadsTabs } from "@/components/admin/context-layer/ContextUploadsTabs";

describe("ContextUploadsTabs", () => {
  it("keeps upload sections separated behind tabs", () => {
    render(
      <ContextUploadsTabs
        sourceFileCount={7}
        addData={<div>add data body</div>}
        loadedFiles={<div>loaded files body</div>}
        advancedTools={<div>advanced tools body</div>}
      />,
    );

    expect(screen.getByRole("tab", { name: /^Add data$/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Loaded files 7/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /^Advanced$/ })).toBeTruthy();
    expect(screen.getByText("add data body")).toBeTruthy();
    expect(screen.queryByText("advanced tools body")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: /^Advanced$/ }));

    expect(screen.getByText("advanced tools body")).toBeTruthy();
    expect(screen.queryByText("add data body")).toBeNull();
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
      "context-upload-tab-advanced",
    );
  });
});
