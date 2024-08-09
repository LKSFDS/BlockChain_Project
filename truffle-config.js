module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
    },
  },

  // Configurar o compilador Solidity
  compilers: {
    solc: {
      version: "0.8.0",      // Versão específica do compilador Solidity
      settings: {            // Configurações adicionais do compilador
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "istanbul"
      }
    }
  }
};