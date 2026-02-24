module.exports = {
  apps: [{
    name: 'sherusites',
    script: 'server.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx/esm',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 10,
    autorestart: true,
    watch: false,
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
  }],
};
