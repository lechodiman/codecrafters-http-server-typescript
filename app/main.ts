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
    const method = req.method;

    if (path.startsWith('/files/')) {
      if (method === 'GET') {
        handleGetFiles(req, res);
      }

      if (method === 'POST') {
        handlePostFiles(req, res);
      }
    } else if (path.startsWith('/user-agent')) {
      handleUserAgent(req, res);
    } else if (path.startsWith('/echo')) {
      handleEcho(req, res);
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
