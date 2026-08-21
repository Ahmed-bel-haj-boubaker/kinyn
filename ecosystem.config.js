/* ================================================================
   PM2 process configuration — KINYN
   ================================================================
   NODE_ENV must be set in the real process environment, not in .env:
   server.js reads it at startup, before Next.js loads any env file.
   Without it the app boots in development mode.

   Start:    pm2 start ecosystem.config.js
   Reload:   pm2 reload kinyn
   ================================================================ */

module.exports = {
  apps: [
    {
      name: "kinyn",
      script: "server.js",
      cwd: "/home/kinyn/app",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
