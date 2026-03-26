const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('nginx -t', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.exec('cat /etc/nginx/sites-available/whatsapp-crm', (err2, stream2) => {
          stream2.on('close', () => conn.end())
                 .on('data', data => process.stdout.write(data))
                 .stderr.on('data', data => process.stderr.write(data));
      });
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
