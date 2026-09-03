import hre from "hardhat";

async function main() {
  console.log("Deploying ForensicEvidence smart contract...");
  const ForensicEvidence = await hre.ethers.getContractFactory("ForensicEvidence");
  const contract = await ForensicEvidence.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ForensicEvidence contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
