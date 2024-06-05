import * as net from 'net';
import { Request } from './Request';
import { Response } from './Response';
import {
  handleGetFiles,
  handlePostFiles,
  handleUserAgent,
  handleEcho,
} from './controllers';

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const req = new Request(data.toString());
    const res = new Response(socket);

    const path = req.path;

    if (path.startsWith('/files/')) {
      if (req.method === 'GET') {
        return handleGetFiles(req, res);
      }

      if (req.method === 'POST') {
        return handlePostFiles(req, res);
      }
    } else if (path.startsWith('/user-agent')) {
      return handleUserAgent(req, res);
    } else if (path.startsWith('/echo')) {
      return handleEcho(req, res);
    } else if (path === '/') {
      return res.status(200).send();
    } else {
      return res.status(404).send();
    }
  });
});

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});
