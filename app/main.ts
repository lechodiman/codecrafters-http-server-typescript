import * as net from 'net';
import { parseArgs } from 'util';

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    directory: {
      type: 'string',
    },
  },
  strict: true,
  allowPositionals: true,
});

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const req = new Request(data.toString());

    const method = req.method;
    const path = req.path;

    if (path.startsWith('/files/')) {
      const filename = path.split('/files/')[1];
      const filePath = `${values.directory}/${filename}`;

      if (method === 'GET') {
        const file = Bun.file(filePath);

        file.exists().then((exists) => {
          if (!exists) {
            socket.write(createResponse({ statusCode: '404 Not Found' }));
            socket.end();
            return;
          }

          file.text().then((text) => {
            socket.write(
              createResponse({
                headers: {
                  'Content-Type': 'application/octet-stream',
                  'Content-Length': file.size.toString(),
                },
                statusCode: '200 OK',
                body: text,
              })
            );
            socket.end();
          });
        });

        return;
      } else if (method === 'POST') {
        const body = req.body;

        Bun.write(filePath, body).then(() => {
          socket.write(createResponse({ statusCode: '201 Created' }));
          socket.end();
        });

        return;
      }
    }

    if (path.includes('/user-agent')) {
      const userAgent = req.headers['User-Agent'];
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
      const supportedEncodings = new Set(['gzip']);

      const acceptEncoding = req.headers['Accept-Encoding'];

      socket.write(
        createResponse({
          headers: {
            'Content-Type': 'text/plain',
            ...(supportedEncodings.has(acceptEncoding)
              ? { 'Content-Encoding': acceptEncoding }
              : {}),
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

  if (body && !headers['Content-Length']) {
    headersArray.push('Content-Length: ' + body.length.toString());
  }

  const responseHeaders = headersArray.join('\r\n');

  return `HTTP/1.1 ${statusCode}\r\n${responseHeaders}\r\n\r\n${body}`;
}

class Request {
  constructor(private request: string) {
    this.request = request;
  }

  get headers() {
    const headers = this.lines.slice(1, -2); // last two elements are empty strings
    const headersObject: { [key: string]: string } = {};

    headers.forEach((header) => {
      const [key, value] = header.split(': ');
      headersObject[key] = value;
    });

    return headersObject;
  }

  get requestLine() {
    return this.lines[0];
  }

  get method() {
    return this.requestLine.split(' ')[0];
  }

  get path() {
    return this.requestLine.split(' ')[1];
  }

  get body() {
    return this.lines[this.lines.length - 1];
  }

  private get lines() {
    return this.request.split('\r\n');
  }
}
