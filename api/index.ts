import type { Request, Response } from 'express';

import { getServer } from '../src/serverless';

export default async function handler(req: Request, res: Response) {
  const server = await getServer();
  return server(req, res);
}
