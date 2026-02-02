import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const ARC_RPC_URL = process.env.ARC_RPC_URL || "https://rpc.example.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY; 

export default {
  solidity: "0.8.20",
  networks: {
    arcTestnet: {
      url: ARC_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
