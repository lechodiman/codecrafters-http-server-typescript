import * as net from 'net';
import { Request } from './Request';
import { Response } from './Response';
import { Router } from './Router';
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

    const router = new Router(req, res);

    router.get('/files', handleGetFiles);
    router.post('/files', handlePostFiles);
    router.get('/user-agent', handleUserAgent);
    router.get('/echo', handleEcho);
    router.get('/', (req, res) => res.status(200).send());
    router.get('*', (req, res) => res.status(404).send());

    router.handle();
  });
});

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});
