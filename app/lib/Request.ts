export class Request {
  public method: string;
  public path: string;
  public body: string;
  public headers: { [key: string]: string };

  private requestLine: string;
  private lines: string[];

  constructor(private request: string) {
    this.lines = this.request.split('\r\n');
    this.requestLine = this.lines[0];
    this.method = this.requestLine.split(' ')[0];
    this.path = this.requestLine.split(' ')[1];
    this.body = this.lines[this.lines.length - 1];

    this.headers = parseHeaders(this.lines);
  }
}

function parseHeaders(lines: string[]) {
  const headers = lines.slice(1, -2); // last two elements are empty strings
  const headersObject: { [key: string]: string } = {};

  headers.forEach((header) => {
    const [key, value] = header.split(': ');
    headersObject[key] = value;
  });

  return headersObject;
}
