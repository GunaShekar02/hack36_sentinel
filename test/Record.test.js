const Record = artifacts.require("Record");
require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("Record", accounts => {
  let record;

  before(async () => {
    record = await Record.deployed();
  });

  describe("deployement", async () => {
    it("deploys successfully", async () => {
      const address = record.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });
  });

  describe("storage", async () => {
    it("updates recordHash", async () => {
      let caseName = "Case ABC";
      let recordHash = "abc123";
      let area = "morena";
      let expectedResult = [["Case ABC", "abc123"]];
      await record.set(caseName, recordHash, area);
      const result = await record.get(area);
      assert.deepEqual(result, expectedResult);
    });
  });
});
