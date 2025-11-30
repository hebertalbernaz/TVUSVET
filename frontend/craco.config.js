// Load configuration from environment or config file
const path = require('path');

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === 'true',
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      
      // 🔴 CORREÇÃO DO ERRO DE WEBKAÇK 5
      // Define fallbacks para módulos do Node que não existem no navegador
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback, // Mantém outros fallbacks se existirem
        "fs": false,   // O navegador não tem file system, então desligamos
        "path": false, // Desliga o módulo path (ou use require.resolve("path-browserify") se precisar)
        "crypto": false // Às vezes necessário para bibliotecas de criptografia antigas
      };

      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });
        
        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }
      
      return webpackConfig;
    },
  },
};