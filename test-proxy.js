const http = require('http');

function testReq(path, cookies) {
  return new Promise((resolve) => {
    http.get('http://localhost:3001' + path, {
      headers: { 'Cookie': cookies }
    }, (res) => {
      resolve({ path, cookies, status: res.statusCode, location: res.headers.location });
    });
  });
}

async function run() {
  console.log(await testReq('/founder', ''));
  console.log(await testReq('/founder', '__session=uid123'));
  console.log(await testReq('/founder', '__session=uid123; __founder_os_role=founder'));
  console.log(await testReq('/founder/onboarding', '__session=uid123; __founder_os_role=founder'));
  console.log(await testReq('/', '__session=uid123; __founder_os_role=founder'));
  console.log(await testReq('/', '__session=uid123'));
}
run();
