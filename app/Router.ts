import { Request } from './Request';
import { Response } from './Response';

export class Router {
  private routes: {
    [method: string]: {
      [path: string]: (req: Request, res: Response) => void;
    };
  };

  constructor(private req: Request, private res: Response) {
    this.routes = {};
  }

  get(path: string, handler: (req: Request, res: Response) => void) {
    this.registerRoute('GET', path, handler);
  }

  post(path: string, handler: (req: Request, res: Response) => void) {
    this.registerRoute('POST', path, handler);
  }

  private registerRoute(
    method: string,
    path: string,
    handler: (req: Request, res: Response) => void
  ) {
    if (!this.routes[method]) {
      this.routes[method] = {};
    }
    this.routes[method][path] = handler;
  }

  handle() {
    const method = this.req.method;
    const path = this.req.path;

    // Check for exact match
    if (this.routes[method] && this.routes[method][path]) {
      this.routes[method][path](this.req, this.res);
      return;
    }

    // Check if the path starts with any registered path
    const registeredPaths = Object.keys(this.routes[method] || {});
    for (const registeredPath of registeredPaths) {
      if (registeredPath === '/' && path !== '/') continue;

      if (path.startsWith(registeredPath)) {
        this.routes[method][registeredPath](this.req, this.res);
        return;
      }
    }

    // Check for wildcard match
    if (this.routes[method] && this.routes[method]['*']) {
      this.routes[method]['*'](this.req, this.res);
      return;
    }

    // If no route is matched, return a 404 response
    return this.res.status(404).send();
  }
}
