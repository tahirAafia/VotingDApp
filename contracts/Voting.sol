// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    address public owner;
    uint256 public candidateCount;
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    event CandidateAdded(uint256 id, string name);
    event VoteCast(address voter, uint256 candidateId);

    constructor() {
        owner = msg.sender;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    function addCandidate(string memory name) public onlyOwner {
        require(bytes(name).length > 0, "Candidate name cannot be empty");
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: name,
            voteCount: 0
        });
        emit CandidateAdded(candidateCount, name);
    }
    function vote(uint256 candidateId) public {
        require(!hasVoted[msg.sender], "You have already voted");
        require(candidateId > 0 && candidateId <= candidateCount, "Invalid candidate ID");
        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;
        emit VoteCast(msg.sender, candidateId);
    }
}
