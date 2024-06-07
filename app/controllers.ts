import { parseArgs } from 'util';
import { Request } from './lib/Request';
import { Response } from './lib/Response';

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

export function handleGetFiles(req: Request, res: Response) {
  const filename = req.path.split('/files/')[1];
  const filePath = `${values.directory}/${filename}`;

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
}

export function handlePostFiles(req: Request, res: Response) {
  const filename = req.path.split('/files/')[1];
  const filePath = `${values.directory}/${filename}`;

  Bun.write(filePath, req.body).then(() => {
    return res.status(201).send();
  });
}

export function handleUserAgent(req: Request, res: Response) {
  const userAgent = req.headers['User-Agent'];

  return res
    .status(200)
    .headers({
      'Content-Type': 'text/plain',
    })
    .body(userAgent)
    .send();
}

export function handleEcho(req: Request, res: Response) {
  const echoStr = req.path.split('/echo/')[1];
  const supportedEncodings = new Set(['gzip']);

  const acceptEncoding = req.headers['Accept-Encoding'];
  const encodings = acceptEncoding ? acceptEncoding.split(', ') : [];
  const matchingEncoding = encodings.find((encoding) => supportedEncodings.has(encoding));

  if (!matchingEncoding) {
    return res
      .status(200)
      .headers({
        'Content-Type': 'text/plain',
      })
      .body(echoStr)
      .send();
  }

  const zipped = Bun.gzipSync(echoStr);

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
