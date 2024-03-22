import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_CUSTOM_OPTIONS } from '@libs/common/constants/swagger.constants';
import compression from 'compression';

export class AdminServer {
  constructor(private readonly app: INestApplication) {}

  async init(): Promise<void> {
    const config = new DocumentBuilder()
      .setTitle('Server boilerplate Admin Server')
      .setDescription('Server boilerplate ADMIN API description')
      .setVersion('1.0')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-KEY',
          in: 'header',
          description: 'Server boilerplate Admin API',
        },
        'apiKey',
      )
      .build();

    const document = SwaggerModule.createDocument(this.app, config);

    SwaggerModule.setup('api-docs', this.app, document, SWAGGER_CUSTOM_OPTIONS);

    this.app.use(compression({ level: 6 }));
  }

  async run(): Promise<void> {
    Logger.log('Admin Server is running on port ' + process.env.SERVER_PORT);
    await this.app.listen(process.env.SERVER_PORT, '0.0.0.0');
  }
}
