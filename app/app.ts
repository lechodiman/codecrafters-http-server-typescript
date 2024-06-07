import {
  handleEcho,
  handleGetFiles,
  handlePostFiles,
  handleUserAgent,
} from './controllers';
import { Router } from './lib/Router';
import { createApp } from './lib/createApp';

const router = new Router();

router.get('/files', handleGetFiles);
router.post('/files', handlePostFiles);
router.get('/user-agent', handleUserAgent);
router.get('/echo', handleEcho);
router.get('/', (req, res) => res.status(200).send());
router.get('*', (req, res) => res.status(404).send());

export const app = createApp(router);
