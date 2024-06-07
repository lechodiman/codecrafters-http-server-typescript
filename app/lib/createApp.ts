import * as net from 'net';
import { Request } from './Request';
import { Response } from './Response';
import { Router } from './Router';

export function createApp(router: Router) {
  const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const req = new Request(data.toString());
      const res = new Response(socket);

      router.handle(req, res);
    });
  });

  return server;
}
