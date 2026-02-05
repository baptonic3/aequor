// Configuration for Aequor frontend
export const config = {
  // Backend API endpoint (for integration)
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  
  // Arc testnet configuration
  arcTestnet: {
    chainId: 'arc-testnet', // To be configured 
    rpcUrl: 'https://arc-testnet.rpc.caldera.xyz/http', // Placeholder
    treasuryContract: '0x...', // Deploy treasury contract first
  },
  
  // Circle Gateway configuration
  circleGateway: {
    apiUrl: 'https://api.circle.com', // Circle API endpoint
    usdcAddress: '0x...', // Circle USDC contract address on Arc
  },
};
