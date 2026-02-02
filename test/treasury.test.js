import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("AequorTreasury", function () {
  it("Non-Arc destination emits CrossChainSettlementRequested", async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    
    // Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    const mockUsdcAddress = await mockUsdc.getAddress();

    const arcChainId = 999;
    
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(mockUsdcAddress, arcChainId);
    await treasury.waitForDeployment();

    // Fund the treasury so it has balance
    await mockUsdc.mint(await treasury.getAddress(), 10000);

    // Add recipient
    const recipientAddr = otherAccount.address;
    const destChainId = 123; // Random chain
    const amount = 1000;
    
    await treasury.addRecipient(recipientAddr, destChainId, amount);
    
    // Execute Payout
    // We expect the event
    await expect(treasury.executePayout(0))
      .to.emit(treasury, "CrossChainSettlementRequested")
      .withArgs(0, recipientAddr, destChainId, amount);
  });
});
