const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== Nginx Enabled Sites ==="
    ls -la /etc/nginx/sites-enabled/
    echo ""
    echo "=== Server Names in Nginx ==="
    grep -rn "server_name" /etc/nginx/sites-enabled/
    echo ""
    echo "=== PM2 Status ==="
    pm2 status
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '147.93.108.218',
  port: 22,
  username: 'root',
  password: 'Itachi@143000'
});
