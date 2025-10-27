const { sum } = require("../utils");

test("sum adds numbers correctly", () => {
  expect(sum(5, 4)).toBe(9);
});
