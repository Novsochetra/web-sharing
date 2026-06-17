module.exports = {
  apps: [
    {
      name: 'webshare',
      script: './dist/webshare',
      exec_interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      log_file: './logs/webshare.log',
      out_file: './logs/webshare-out.log',
      error_file: './logs/webshare-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      kill_timeout: 3000,
    },
  ],
};
