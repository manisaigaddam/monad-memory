require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz", // Replace
      chainId: 10143, // Replace
      accounts: ["1c19156030f7faafd822b53cd1721eb7e9bd78f1f829644eb322cdf2171c25bc"] // From MetaMask
    }
  }
};