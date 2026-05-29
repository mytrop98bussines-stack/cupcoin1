// contracts/CubaXEscrow.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CubaXEscrow is ReentrancyGuard {
    struct Trade {
        address seller;
        address buyer;
        address token;
        uint256 amount;
        uint256 createdAt;
        TradeStatus status;
    }
    
    enum TradeStatus { 
        Created,
        Funded,
        PaymentConfirmed,
        Released,
        Disputed,
        Cancelled
    }
    
    mapping(bytes32 => Trade) public trades;
    address public arbiter;
    uint256 public feePercent = 50; // 0.5%
    
    event TradeCreated(bytes32 indexed tradeId, address seller, address buyer);
    event TradeFunded(bytes32 indexed tradeId);
    event TradeReleased(bytes32 indexed tradeId);
    event TradeDisputed(bytes32 indexed tradeId);
    
    constructor(address _arbiter) {
        arbiter = _arbiter;
    }
    
    function createTrade(
        bytes32 tradeId,
        address buyer,
        address token,
        uint256 amount
    ) external {
        require(trades[tradeId].seller == address(0), "Trade exists");
        
        trades[tradeId] = Trade({
            seller: msg.sender,
            buyer: buyer,
            token: token,
            amount: amount,
            createdAt: block.timestamp,
            status: TradeStatus.Created
        });
        
        emit TradeCreated(tradeId, msg.sender, buyer);
    }
    
    function fundTrade(bytes32 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(msg.sender == trade.seller, "Not seller");
        require(trade.status == TradeStatus.Created, "Invalid status");
        
        IERC20(trade.token).transferFrom(msg.sender, address(this), trade.amount);
        trade.status = TradeStatus.Funded;
        
        emit TradeFunded(tradeId);
    }
    
    function releaseFunds(bytes32 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(
            msg.sender == trade.seller || msg.sender == arbiter,
            "Not authorized"
        );
        require(trade.status == TradeStatus.Funded, "Not funded");
        
        uint256 fee = (trade.amount * feePercent) / 10000;
        uint256 buyerAmount = trade.amount - fee;
        
        IERC20(trade.token).transfer(trade.buyer, buyerAmount);
        IERC20(trade.token).transfer(arbiter, fee);
        
        trade.status = TradeStatus.Released;
        emit TradeReleased(tradeId);
    }
    
    function disputeTrade(bytes32 tradeId) external {
        Trade storage trade = trades[tradeId];
        require(
            msg.sender == trade.buyer || msg.sender == trade.seller,
            "Not participant"
        );
        require(trade.status == TradeStatus.Funded, "Not funded");
        
        trade.status = TradeStatus.Disputed;
        emit TradeDisputed(tradeId);
    }
    
    function resolveDispute(
        bytes32 tradeId,
        address winner
    ) external nonReentrant {
        require(msg.sender == arbiter, "Not arbiter");
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.Disputed, "Not disputed");
        
        IERC20(trade.token).transfer(winner, trade.amount);
        trade.status = TradeStatus.Released;
    }
}