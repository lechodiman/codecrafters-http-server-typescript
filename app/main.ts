import * as net from 'net';

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const request = data.toString().split('\r\n');
    const headers = getRequestHeaders(request);
    const requestLine = request[0];
    const [method, path, version] = requestLine.split(' ');

    if (path.includes('/user-agent')) {
      const userAgent = headers['User-Agent'];
      socket.write(
        createResponse({
          headers: {
            'Content-Type': 'text/plain',
          },
          statusCode: '200 OK',
          body: userAgent,
        })
      );
      socket.end();
      return;
    }

    if (path.includes('/echo')) {
      const echoStr = path.split('/echo/')[1];
      socket.write(
        createResponse({
          headers: {
            'Content-Type': 'text/plain',
          },
          statusCode: '200 OK',
          body: echoStr,
        })
      );
      socket.end();
      return;
    }

    if (path !== '/') {
      socket.write(createResponse({ statusCode: '404 Not Found' }));
      socket.end();
      return;
    }

    socket.write(createResponse({ statusCode: '200 OK' }));
    socket.end();
  });
});

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});

function createResponse({
  body,
  headers = {},
  statusCode,
}: {
  headers?: {
    [key: string]: string;
  };
  statusCode: string;
  body?: string;
}) {
  const headersArray = Object.entries(headers).map(([key, value]) => `${key}: ${value}`);

  if (body) {
    headersArray.push('Content-Length: ' + body.length.toString());
  }

  const responseHeaders = headersArray.join('\r\n');

  return `HTTP/1.1 ${statusCode}\r\n${responseHeaders}\r\n\r\n${body}`;
}

function getRequestHeaders(request: string[]) {
  const headers = request.slice(1, -2); // last two elements are empty strings
  const headersObject: { [key: string]: string } = {};

  headers.forEach((header) => {
    const [key, value] = header.split(': ');
    headersObject[key] = value;
  });

  return headersObject;
}
