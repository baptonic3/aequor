// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury {
    address public owner;
    IERC20 public usdc;
    uint256 public arcChainId;

    uint256 public recipientCount;

    struct Recipient {
        address wallet;
        uint256 destinationChainId; // chain abstracted
        uint256 amount;
        bool active;
    }

    mapping(uint256 => Recipient) public recipients;

    event RecipientAdded(
        uint256 indexed id,
        address wallet,
        uint256 destinationChainId,
        uint256 amount
    );

    event SameChainPayout(
        uint256 indexed recipientId, 
        address recipient, 
        uint256 amount
    );

    event CrossChainSettlementRequested(
        uint256 indexed recipientId,
        address recipient,
        uint256 destinationChainId,
        uint256 amount
    );

    event Deposited(
        address indexed depositor,
        uint256 amount
    );

    event EmergencyWithdrawal(
        address indexed owner,
        uint256 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdc, uint256 _arcChainId) {
        require(_usdc != address(0), "Invalid USDC address");
        owner = msg.sender;
        usdc = IERC20(_usdc);
        arcChainId = _arcChainId;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        emit Deposited(msg.sender, amount);
    }

    function addRecipient(
        address wallet,
        uint256 destinationChainId,
        uint256 amount
    ) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        require(amount > 0, "Amount must be greater than 0");

        recipients[recipientCount] = Recipient(
            wallet,
            destinationChainId,
            amount,
            true
        );

        emit RecipientAdded(
            recipientCount,
            wallet,
            destinationChainId,
            amount
        );

        recipientCount++;
    }

    function updateRecipient(
        uint256 recipientId,
        address wallet,
        uint256 destinationChainId,
        uint256 amount,
        bool active
    ) external onlyOwner {
        require(recipientId < recipientCount, "Invalid recipient ID");
        require(wallet != address(0), "Invalid wallet address");
        require(amount > 0, "Amount must be greater than 0");

        recipients[recipientId] = Recipient(
            wallet,
            destinationChainId,
            amount,
            active
        );
    }

    function deactivateRecipient(uint256 recipientId) external onlyOwner {
        require(recipientId < recipientCount, "Invalid recipient ID");
        recipients[recipientId].active = false;
    }

    function executePayout(uint256 recipientId) external onlyOwner {
        Recipient memory r = recipients[recipientId];
        require(r.active, "Inactive recipient");
        require(usdc.balanceOf(address(this)) >= r.amount, "Insufficient balance");

        if (r.destinationChainId == arcChainId) {
            // Same-chain payout
            require(usdc.transfer(r.wallet, r.amount), "Transfer failed");
            emit SameChainPayout(recipientId, r.wallet, r.amount);
        } else {
            // Cross-chain settlement intent
            emit CrossChainSettlementRequested(
                recipientId,
                r.wallet,
                r.destinationChainId,
                r.amount
            );
        }
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(usdc.transfer(owner, amount), "Withdrawal failed");
        
        emit EmergencyWithdrawal(owner, amount);
    }

    function getTreasuryBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}