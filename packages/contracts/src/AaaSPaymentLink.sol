// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AaaSPaymentLink
 * @notice Payment link contract for AaaS (Autonomous Agents as Sellers) platform
 * @dev Enables sellers to create payment links that buyers can pay with USDC
 * 
 * Flow:
 * 1. Seller creates payment link with amount and product name
 * 2. Buyer approves USDC spending and calls payLink
 * 3. Contract takes 1% fee, sends rest to seller
 */
contract AaaSPaymentLink is Ownable, ReentrancyGuard {
    IERC20 public usdc;

    struct PaymentLink {
        uint256 id;
        address seller;
        string productName;
        uint256 amount;
        bool active;
        uint256 totalPaid;
        uint256 paymentCount;
    }

    uint256 public nextLinkId;
    mapping(uint256 => PaymentLink) public paymentLinks;
    
    /// @notice Platform fee in basis points (100 = 1%)
    uint256 public constant FEE_BPS = 100;
    
    /// @notice Platform wallet for fee withdrawals
    /// @dev 0x74845980e8300c10bA9A84dde3d611037eBD529B
    address public constant PLATFORM_WALLET = 0x74845980e8300c10bA9A84dde3d611037eBD529B;

    // Events
    event PaymentLinkCreated(
        uint256 indexed linkId, 
        address indexed seller, 
        uint256 amount, 
        string productName
    );
    
    event PaymentReceived(
        uint256 indexed linkId, 
        address indexed buyer, 
        address indexed seller, 
        uint256 amount, 
        uint256 fee
    );
    
    event LinkToggled(uint256 indexed linkId, bool active);
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
        nextLinkId = 1;
    }

    /**
     * @notice Create a new payment link for a product
     * @param amount The price in USDC (in smallest unit, e.g., 1000000 = 1 USDC)
     * @param productName The name of the product
     * @return linkId The ID of the created payment link
     */
    function createPaymentLink(
        uint256 amount, 
        string calldata productName
    ) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(productName).length > 0, "Product name required");
        require(bytes(productName).length <= 100, "Product name too long");

        uint256 linkId = nextLinkId++;
        
        paymentLinks[linkId] = PaymentLink({
            id: linkId,
            seller: msg.sender,
            productName: productName,
            amount: amount,
            active: true,
            totalPaid: 0,
            paymentCount: 0
        });

        emit PaymentLinkCreated(linkId, msg.sender, amount, productName);
        return linkId;
    }

    /**
     * @notice Pay for a product via its payment link
     * @dev Buyer must have approved USDC spending before calling this
     * @param linkId The ID of the payment link to pay
     */
    function payLink(uint256 linkId) external nonReentrant {
        PaymentLink storage link = paymentLinks[linkId];
        
        require(link.id != 0, "Link does not exist");
        require(link.active, "Link is inactive");
        
        uint256 amount = link.amount;
        uint256 fee = (amount * FEE_BPS) / 10000;
        uint256 payout = amount - fee;

        // Transfer USDC from buyer to this contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        // Send payout to seller
        require(
            usdc.transfer(link.seller, payout),
            "Payout to seller failed"
        );
        
        // Fee stays in contract for platform withdrawal

        // Update link stats
        link.totalPaid += amount;
        link.paymentCount += 1;

        emit PaymentReceived(linkId, msg.sender, link.seller, amount, fee);
    }

    /**
     * @notice Toggle a payment link's active status
     * @dev Only the link's seller can toggle it
     * @param linkId The ID of the payment link to toggle
     */
    function toggleLink(uint256 linkId) external {
        PaymentLink storage link = paymentLinks[linkId];
        require(link.id != 0, "Link does not exist");
        require(link.seller == msg.sender, "Not the seller");
        
        link.active = !link.active;
        emit LinkToggled(linkId, link.active);
    }

    /**
     * @notice Withdraw accumulated platform fees to platform wallet
     * @dev Only owner can withdraw fees, always goes to PLATFORM_WALLET
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        
        require(usdc.transfer(PLATFORM_WALLET, balance), "Fee withdrawal failed");
        emit FeesWithdrawn(PLATFORM_WALLET, balance);
    }

    /**
     * @notice Get payment link details
     * @param linkId The ID of the payment link
     * @return The payment link struct
     */
    function getPaymentLink(uint256 linkId) external view returns (PaymentLink memory) {
        require(paymentLinks[linkId].id != 0, "Link does not exist");
        return paymentLinks[linkId];
    }

    /**
     * @notice Check if a payment link exists and is active
     * @param linkId The ID of the payment link
     * @return True if the link exists and is active
     */
    function isLinkActive(uint256 linkId) external view returns (bool) {
        PaymentLink storage link = paymentLinks[linkId];
        return link.id != 0 && link.active;
    }
}
