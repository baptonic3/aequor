import hre from "hardhat";

async function main() {
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
  const USDC_ADDRESS = process.env.ARC_USDC_ADDRESS;
  
  // Amount to deposit (1 USDC = 1000000 with 6 decimals)
  const DEPOSIT_AMOUNT = "1000000"; // 1 USDC
  // const DEPOSIT_AMOUNT = "10000000"; // 10 USDC

  console.log("💰 Depositing USDC to Treasury...");
  console.log("   Treasury:", TREASURY_ADDRESS);
  console.log("   USDC:", USDC_ADDRESS);
  console.log("   Amount:", DEPOSIT_AMOUNT, "(1 USDC)");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("   Depositor:", signer.address);

  // Get USDC contract
  const usdc = await hre.ethers.getContractAt(
    ["function approve(address spender, uint256 amount) external returns (bool)",
     "function balanceOf(address account) external view returns (uint256)"],
    USDC_ADDRESS
  );

  // Check balance
  const balance = await usdc.balanceOf(signer.address);
  console.log("\n Your USDC balance:", balance.toString());

  if (balance < BigInt(DEPOSIT_AMOUNT)) {
    console.error("\n❌ Insufficient USDC balance!");
    console.error("   You need:", DEPOSIT_AMOUNT);
    console.error("   You have:", balance.toString());
    console.error("\n💡 Get test USDC from Arc faucet first");
    process.exitCode = 1;
    return;
  }

  // Step 1: Approve Treasury to spend USDC
  console.log("\n Approving Treasury to spend USDC...");
  const approveTx = await usdc.approve(TREASURY_ADDRESS, DEPOSIT_AMOUNT);
  await approveTx.wait();
  console.log("   ✅ Approved");

  // Step 2: Deposit to Treasury
  console.log("\n Depositing to Treasury...");
  const treasury = await hre.ethers.getContractAt("Treasury", TREASURY_ADDRESS);
  const depositTx = await treasury.deposit(DEPOSIT_AMOUNT);
  await depositTx.wait();
  console.log("   ✅ Deposited");

  // Step 3: Verify Treasury balance
  const treasuryBalance = await treasury.getTreasuryBalance();
  // display balance in real USDC format
  console.log("\n Treasury USDC balance:", (treasuryBalance / BigInt(1_000_000)).toString(), "USDC");
  console.log("\n🎉 Treasury funded successfully!");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});
