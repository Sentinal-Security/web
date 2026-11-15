import test from "node:test";
import assert from "node:assert/strict";
import { escapeCsvCell } from "../csvExport.ts";

test("escapeCsvCell neutralizes spreadsheet formula injection prefixes", () => {
  assert.equal(escapeCsvCell("=CMD|'/C calc'!A0"), `"'=CMD|'/C calc'!A0"`);
  assert.equal(escapeCsvCell("+1+1"), `"'+1+1"`);
  assert.equal(escapeCsvCell("-1+1"), `"'-1+1"`);
  assert.equal(escapeCsvCell("@SUM(1,1)"), `"'@SUM(1,1)"`);
  assert.equal(escapeCsvCell("\tcmd"), `"'\tcmd"`);
  assert.equal(escapeCsvCell("normal text"), `"normal text"`);
  assert.equal(escapeCsvCell('a"b'), `"a""b"`);
});
