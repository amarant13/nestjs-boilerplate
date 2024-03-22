import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { AdminServer } from './admin.server';

async function adminServer() {
  const app = await NestFactory.create(AdminModule);

  const adminServer = new AdminServer(app);

  await adminServer.init();
  await adminServer.run();
}
adminServer();
