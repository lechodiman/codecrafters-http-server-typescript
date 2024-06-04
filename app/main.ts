import * as net from 'net';

function createResponse({
  body,
  headers,
  statusCode,
}: {
  headers: {
    [key: string]: string;
  };
  statusCode: string;
  body: string;
}) {
  const responseHeaders = Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\r\n');

  return `HTTP/1.1 ${statusCode}\r\n${responseHeaders}\r\n\r\n${body}`;
}

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const requestLine = data.toString().split('\r\n')[0];
    const [method, path, version] = requestLine.split(' ');

    console.log([method, path, version]);

    if (path.includes('/echo')) {
      const echoStr = path.split('/echo/')[1];
      console.log(echoStr);
      socket.write(
        createResponse({
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': echoStr.length.toString(),
          },
          statusCode: '200 OK',
          body: echoStr,
        })
      );
      socket.end();
    }

    if (path !== '/') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.end();
      return;
    }

    socket.write('HTTP/1.1 200 OK\r\n\r\n');
    socket.end();
  });
});

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here!');

// Uncomment this to pass the first stage
server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});
