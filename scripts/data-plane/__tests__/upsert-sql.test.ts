import { buildUpdateAssignments } from "../upsert-sql";

describe("buildUpdateAssignments", () => {
  it("merges clients on the natural key `name` without rewriting the primary key", () => {
    // The clients_name_key gate failure: conflict on `name`, PK `id` protected.
    const sql = buildUpdateAssignments(
      ["id", "name", "key", "industry_code"],
      ["name"],
      ["id"],
    );
    expect(sql).toContain('"key" = excluded."key"');
    expect(sql).toContain('"industry_code" = excluded."industry_code"');
    // Never rewrite the conflict key or the primary key.
    expect(sql).not.toContain('"name" = excluded');
    expect(sql).not.toContain('"id" = excluded');
  });

  it("excludes the PK from the update set on a normal PK upsert", () => {
    const sql = buildUpdateAssignments(["id", "name"], ["id"], ["id"]);
    expect(sql).toBe('do update set "name" = excluded."name"');
  });

  it("returns `do nothing` when every column is a conflict or protected key", () => {
    expect(buildUpdateAssignments(["id"], ["id"], ["id"])).toBe("do nothing");
    expect(buildUpdateAssignments(["a", "b"], ["a", "b"])).toBe("do nothing");
  });
});
