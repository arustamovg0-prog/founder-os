const http = require('http');
http.get('http://localhost:3000/founder', {
  headers: {
    'Cookie': '__session=demo_founder; __founder_os_role=founder'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Data length:', data.length);
  });
});
