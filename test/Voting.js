import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Voting Contract", function () {
  let owner;
  let voter1;
  let voting;

  beforeEach(async function () {
    [owner, voter1] = await ethers.getSigners();
    voting = await ethers.deployContract("Voting");
    await voting.waitForDeployment();
  });

  it("assigns the deployer as owner", async function () {
    expect(await voting.owner()).to.equal(owner.address);
  });
  it("starts with zero candidates", async function () {
    expect(await voting.candidateCount()).to.equal(0n);
  });

  it("allows the owner to add a candidate", async function () {
    await voting.addCandidate("Alice");

    expect(await voting.candidateCount()).to.equal(1n);
    const candidate = await voting.candidates(1);
    expect(candidate.name).to.equal("Alice");
    expect(candidate.voteCount).to.equal(0n);
  });

  it("allows a voter to vote once", async function () {
    await voting.addCandidate("Alice");
    await voting.connect(voter1).vote(1);

    const candidate = await voting.candidates(1);
    expect(candidate.voteCount).to.equal(1n);
    expect(await voting.hasVoted(voter1.address)).to.equal(true);
  });

  it("rejects a second vote from the same address", async function () {
    await voting.addCandidate("Alice");
    await voting.connect(voter1).vote(1);

    await expect(
      voting.connect(voter1).vote(1)
    ).to.be.revertedWith("You have already voted");
  });
});
