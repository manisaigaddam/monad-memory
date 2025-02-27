// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CosmicMemory is ERC721, Ownable {
    uint256 public tokenIdCounter;
    mapping(address => uint256) public matches;
    mapping(address => bool) public completed;

    event MatchFound(address indexed player, uint256 matchCount);
    event GameCompleted(address indexed player);

    constructor() ERC721("CosmicMemory", "CMM") Ownable(msg.sender) {
        tokenIdCounter = 1;
    }

    function startGame() external {
        matches[msg.sender] = 0;
        completed[msg.sender] = false;
    }

    function recordMatch() external {
        require(matches[msg.sender] < 8, "All pairs matched");
        matches[msg.sender]++;
        emit MatchFound(msg.sender, matches[msg.sender]);

        // Mint NFT for each match
        _safeMint(msg.sender, tokenIdCounter);
        tokenIdCounter++;
    }

    function finishGame() external {
        require(matches[msg.sender] == 8, "Not all pairs matched");
        require(!completed[msg.sender], "Already completed");
        completed[msg.sender] = true;
        emit GameCompleted(msg.sender);
    }

    function reset() external {
        matches[msg.sender] = 0;
        completed[msg.sender] = false;
    }
}