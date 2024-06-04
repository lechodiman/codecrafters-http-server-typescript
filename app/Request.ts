export class Request {
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
