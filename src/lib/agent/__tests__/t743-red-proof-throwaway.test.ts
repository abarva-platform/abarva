/**
 * TEMPORARY — pushed only to prove, by watching CI rather than by reading the
 * workflow, that a suite this repository has never named is reached by the
 * directory sweep added in T-743. It fails on purpose. The commit after this
 * one deletes it.
 */
it("fails on purpose, so the required job has to have run a file nobody named", () => {
  expect("t743-red-proof").toBe("this assertion must fail in CI");
});
