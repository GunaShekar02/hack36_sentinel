const Record = artifacts.require("Record");

module.exports = function(deployer) {
  deployer.deploy(Record);
};
