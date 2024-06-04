import * as net from 'net';
import { parseArgs } from 'util';
import * as zlib from 'zlib';

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
    const res = new Response(socket);

    const method = req.method;
    const path = req.path;

    if (path.startsWith('/files/')) {
      const filename = path.split('/files/')[1];
      const filePath = `${values.directory}/${filename}`;

      if (method === 'GET') {
        const file = Bun.file(filePath);

        file.exists().then((exists) => {
          if (!exists) {
            return res.status(404).send();
          }

          file.text().then((text) => {
            return res
              .status(200)
              .headers({
                'Content-Type': 'application/octet-stream',
                'Content-Length': file.size.toString(),
              })
              .body(text)
              .send();
          });
        });

        return;
      } else if (method === 'POST') {
        const body = req.body;

        Bun.write(filePath, body).then(() => {
          return res.status(201).send();
        });

        return;
      }
    }

    if (path.includes('/user-agent')) {
      const userAgent = req.headers['User-Agent'];

      return res
        .status(200)
        .headers({
          'Content-Type': 'text/plain',
        })
        .body(userAgent)
        .send();
    }

    if (path.includes('/echo')) {
      const echoStr = path.split('/echo/')[1];
      const supportedEncodings = new Set(['gzip']);

      const acceptEncoding = req.headers['Accept-Encoding'];
      const encodings = acceptEncoding ? acceptEncoding.split(', ') : [];
      const matchingEncoding = encodings.find((encoding) =>
        supportedEncodings.has(encoding)
      );

      if (!matchingEncoding) {
        return res
          .status(200)
          .headers({
            'Content-Type': 'text/plain',
          })
          .body(echoStr)
          .send();
      }

      const zipped = zlib.gzipSync(echoStr);

      return res
        .status(200)
        .headers({
          'Content-Type': 'text/plain',
          'Content-Encoding': matchingEncoding.trim(),
          'Content-Length': zipped.length.toString(),
        })
        .body(zipped)
        .send();
    }

    if (path !== '/') {
      return res.status(404).send();
    }

    return res.status(200).send();
  });
});

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});

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

class Response {
  private STATUS_CODES = {
    200: '200 OK',
    201: '201 Created',
    404: '404 Not Found',
  } as const;

  private requestLine: string;
  private _headers: { [key: string]: string };
  private _body: string | Buffer;

  constructor(private socket: net.Socket) {
    this.socket = socket;
    this.requestLine = 'HTTP/1.1 200 OK';
    this._headers = {};
    this._body = '';
  }

  status(code: keyof typeof this.STATUS_CODES) {
    this.requestLine = `HTTP/1.1 ${this.STATUS_CODES[code]}`;
    return this;
  }

  headers(headers: { [key: string]: string }) {
    this._headers = { ...this._headers, ...headers };
    return this;
  }

  body(body: string | Buffer) {
    this._body = body;

    if (!this._headers['Content-Length']) {
      this.headers({
        'Content-Length': body.length.toString(),
      });
    }

    return this;
  }

  private parseHeaders() {
    return Object.entries(this._headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n');
  }

  send() {
    const headersString = this.parseHeaders();

    this.socket.write(this.requestLine + '\r\n' + headersString + '\r\n\r\n');
    this.socket.write(this._body);

    this.socket.end();
  }
}
