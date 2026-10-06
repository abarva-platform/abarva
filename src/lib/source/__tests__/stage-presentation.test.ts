import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
  sourceStagePresentationFor,
} from "../constants";

describe("Source stage presentation order", () => {
  it("assigns every canonical stage key its one-based lifecycle position", () => {
    SOURCE_STAGE_ORDER.forEach((stageKey, index) => {
      expect(sourceStagePresentationFor(stageKey)).toEqual({
        key: stageKey,
        number: index + 1,
        label: SOURCE_STAGE_LABELS[stageKey],
      });
    });
  });

  it("normalizes legacy keys before assigning presentation positions", () => {
    expect(sourceStagePresentationFor("contract_mobilization")).toMatchObject({
      key: "transition",
      number: 10,
      label: "Transition",
    });
    expect(sourceStagePresentationFor("value_realization")).toMatchObject({
      key: "value",
      number: 11,
      label: "Value",
    });
  });
});
