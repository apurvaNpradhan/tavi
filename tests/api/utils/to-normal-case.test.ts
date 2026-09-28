import { describe, expect, it } from "vitest";
import { toNormalCase } from "../../../apps/api/src/utils/to-normal-case";

describe("toNormalCase", () => {
  it("title-cases a kebab-case value", () => {
    expect(toNormalCase("in-progress")).toBe("In Progress");
  });

  it("title-cases a snake_case value", () => {
    expect(toNormalCase("hello_world")).toBe("Hello World");
  });

  it("collapses repeated separators", () => {
    expect(toNormalCase("a--b__c")).toBe("A B C");
  });

  it("leaves a single word capitalized", () => {
    expect(toNormalCase("done")).toBe("Done");
  });
});
