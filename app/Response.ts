import * as net from 'net';

export class Response {
  private STATUS_CODES = {
    200: '200 OK',
    201: '201 Created',
    404: '404 Not Found',
  } as const;

  private requestLine: string;
  private _headers: { [key: string]: string };
  private _body: string | Buffer | Uint8Array;

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

  body(body: string | Uint8Array | Buffer) {
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
