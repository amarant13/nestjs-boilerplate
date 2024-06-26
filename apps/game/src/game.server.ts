import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import { SWAGGER_CUSTOM_OPTIONS } from '@libs/common/constants/swagger.constants';

export class GameServer {
  constructor(private readonly app: INestApplication) {}

  async init(): Promise<void> {
    if (process.env.NODE_ENV !== 'prod') {
      const config = new DocumentBuilder()
        .setTitle('game-server-boilerplate project')
        .setDescription('The game-server-boilerplate project description')
        .setVersion('1.0')
        .addBasicAuth(
          {
            type: 'http',
            name: 'Authorization',
            in: 'header',
            description: 'Username:userId & Password:sessionId',
          },
          'basic',
        )
        .build();
      const document = SwaggerModule.createDocument(this.app, config);

      SwaggerModule.setup(
        'api-docs',
        this.app,
        document,
        SWAGGER_CUSTOM_OPTIONS,
      );
    }

    this.app.use(compression({ level: 6 }));
  }

  async run(): Promise<void> {
    Logger.log('Game Server is running on port ' + process.env.SERVER_PORT);
    await this.app.listen(process.env.SERVER_PORT, '0.0.0.0');
  }

  async close(): Promise<void> {
    await this.app.close();
  }
}
