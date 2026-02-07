// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Treasury
 * @author Aequor Team
 * @notice Chain-abstracted USDC treasury for multi-chain settlement using Arc and Circle CCTP
 * @dev This contract serves as the onchain authority for USDC settlements. For same-chain payouts,
 * USDC is transferred directly. For cross-chain settlements, the contract emits intent events that
 * are picked up by an offchain executor which handles Circle CCTP settlement.
 */
contract Treasury {
    /// @notice The owner address 
    address public owner;
    
    /// @notice USDC token contract interface
    IERC20 public usdc;
    
    /// @notice Chain ID of the Arc network where this contract is deployed
    uint256 public arcChainId;

    /// @notice Total number of recipients registered
    uint256 public recipientCount;

    /**
     * @notice Recipient configuration for payout destinations
     * @dev Stores destination wallet, chain, amount, and active status
     */
    struct Recipient {
        address wallet;              // Destination wallet address
        uint256 destinationChainId;  // Target chain for settlement (chain abstracted)
        uint256 amount;              // USDC amount in smallest units (6 decimals)
        bool active;                 // Whether this recipient is active
    }

    /**
     * @notice Record of cross-chain settlement initiation
     * @dev Prevents double-settlement by tracking initiated settlements
     */
    struct SettlementRecord {
        bool initiated;              // Whether settlement has been initiated
        uint256 timestamp;           // Block timestamp of settlement initiation
        uint256 amount;              // Amount settled
        uint256 destinationChainId;  // Destination chain for this settlement
    }

    /// @notice Mapping of recipient ID to recipient configuration
    mapping(uint256 => Recipient) public recipients;
    
    /// @notice Mapping of recipient ID to settlement record (prevents double-settlement)
    mapping(uint256 => SettlementRecord) public settlements;

    /**
     * @notice Emitted when a new recipient is added
     * @param id Unique recipient identifier
     * @param wallet Destination wallet address
     * @param destinationChainId Target chain ID
     * @param amount USDC amount in smallest units
     */
    event RecipientAdded(
        uint256 indexed id,
        address wallet,
        uint256 destinationChainId,
        uint256 amount
    );

    /**
     * @notice Emitted when a same-chain payout is executed
     * @param recipientId Recipient identifier
     * @param recipient Destination wallet address
     * @param amount USDC amount transferred
     */
    event SameChainPayout(
        uint256 indexed recipientId, 
        address recipient, 
        uint256 amount
    );

    /**
     * @notice Emitted when a cross-chain settlement intent is created
     * @dev Offchain executor listens for this event 
     * @param recipientId Recipient identifier
     * @param recipient Destination wallet address on target chain
     * @param destinationChainId Target chain ID for USDC delivery
     * @param amount USDC amount to settle
     */
    event CrossChainSettlementRequested(
        uint256 indexed recipientId,
        address recipient,
        uint256 destinationChainId,
        uint256 amount
    );

    /**
     * @notice Emitted when a settlement is recorded onchain
     * @dev Tracks settlement to prevent double-spending
     * @param recipientId Recipient identifier
     * @param recipient Destination wallet address
     * @param destinationChainId Target chain ID
     * @param amount USDC amount
     * @param timestamp Block timestamp of settlement
     */
    event SettlementInitiated(
        uint256 indexed recipientId,
        address recipient,
        uint256 destinationChainId,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @notice Emitted when USDC is deposited into the treasury
     * @param depositor Address that deposited USDC
     * @param amount USDC amount deposited
     */
    event Deposited(
        address indexed depositor,
        uint256 amount
    );

    /**
     * @notice Emitted when owner performs emergency withdrawal
     * @param owner Owner address that withdrew funds
     * @param amount USDC amount withdrawn
     */
    event EmergencyWithdrawal(
        address indexed owner,
        uint256 amount
    );

    /**
     * @notice Restricts function access to contract owner only
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /**
     * @notice Initializes the treasury with USDC token and chain ID
     * @param _usdc USDC token contract address
     * @param _arcChainId Chain ID of Arc network
     */
    constructor(address _usdc, uint256 _arcChainId) {
        require(_usdc != address(0), "Invalid USDC address");
        owner = msg.sender;
        usdc = IERC20(_usdc);
        arcChainId = _arcChainId;
    }

    /**
     * @notice Deposits USDC into the treasury
     * @dev Requires prior approval of USDC transfer
     * @param amount USDC amount to deposit (in smallest units, 6 decimals)
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Adds a new payout recipient
     * @dev Only owner can add recipients. Auto-increments recipientCount
     * @param wallet Destination wallet address
     * @param destinationChainId Target chain ID (chain abstracted)
     * @param amount USDC amount for this recipient
     */
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

    /**
     * @notice Updates an existing recipient's configuration
     * @dev Only owner can update recipients
     * @param recipientId ID of recipient to update
     * @param wallet New destination wallet address
     * @param destinationChainId New target chain ID
     * @param amount New USDC amount
     * @param active Whether recipient should be active
     */
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

    /**
     * @notice Deactivates a recipient without deleting their data
     * @dev Only owner can deactivate recipients
     * @param recipientId ID of recipient to deactivate
     */
    function deactivateRecipient(uint256 recipientId) external onlyOwner {
        require(recipientId < recipientCount, "Invalid recipient ID");
        recipients[recipientId].active = false;
    }

    /**
     * @notice Executes a payout to a registered recipient
     * @dev For same-chain: transfers USDC directly
     *      For cross-chain: emits settlement intent for offchain executor
     *      Prevents double-settlement via settlements mapping
     * @param recipientId ID of recipient to pay out
     * 
     * later Implementation Note:
     * For cross-chain settlements, this function would call:
     * ITokenMessenger(CCTP_TOKEN_MESSENGER).depositForBurn(
     *     amount,
     *     destinationDomain,
     *     bytes32(uint256(uint160(recipient))),
     *     address(usdc)
     * );
     */
    function executePayout(uint256 recipientId) external onlyOwner {
        Recipient memory r = recipients[recipientId];
        require(r.active, "Inactive recipient");
        require(usdc.balanceOf(address(this)) >= r.amount, "Insufficient balance");
        require(!settlements[recipientId].initiated, "Settlement already initiated");

        if (r.destinationChainId == arcChainId) {
            // Same-chain payout: Direct USDC transfer
            require(usdc.transfer(r.wallet, r.amount), "Transfer failed");
            emit SameChainPayout(recipientId, r.wallet, r.amount);
        } else {
            // Cross-chain settlement intent
            // SIMULATION: Emit events and track settlement for testnet demo
            // PRODUCTION: Would call Circle's CCTP TokenMessenger.depositForBurn()
            
            // Record settlement to prevent double-spending
            settlements[recipientId] = SettlementRecord({
                initiated: true,
                timestamp: block.timestamp,
                amount: r.amount,
                destinationChainId: r.destinationChainId
            });
            
            emit CrossChainSettlementRequested(
                recipientId,
                r.wallet,
                r.destinationChainId,
                r.amount
            );
            
            emit SettlementInitiated(
                recipientId,
                r.wallet,
                r.destinationChainId,
                r.amount,
                block.timestamp
            );
        }
    }

    /**
     * @notice Emergency withdrawal function for owner to recover funds
     * @dev Only owner can withdraw. Use with caution
     * @param amount USDC amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(usdc.transfer(owner, amount), "Withdrawal failed");
        
        emit EmergencyWithdrawal(owner, amount);
    }

    /**
     * @notice Returns the current USDC balance of the treasury
     * @return Current USDC balance in smallest units (6 decimals)
     */
    function getTreasuryBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Transfers ownership to a new address
     * @dev Only current owner can transfer ownership
     * @param newOwner Address of new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}