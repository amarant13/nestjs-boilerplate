import { DynamicModule, Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '@adminjs/nestjs';
import { Database, Resource } from '@adminjs/typeorm';
import AdminJS from 'adminjs';
import { adminResource } from './resource/admin.resource';
import { ResourceProvider } from './resource.provider';

AdminJS.registerAdapter({
  Resource: Resource,
  Database: Database,
});

/**
 * env 별 authentication
 */
const authentication = (authService: AuthService) => {
  return ['', 'test'].includes(process.env.NODE_ENV)
    ? {}
    : {
        auth: {
          authenticate: async (
            email: string,
            password: string,
          ): Promise<any> => {
            return await authService.login(email, password);
          },
          cookieName: 'adminjs',
          cookiePassword: 'secret',
        },
        sessionOptions: {
          secret: 'secret',
          resave: true,
          saveUninitialized: true,
        },
      };
};

@Module({})
export class AdminJsModule {
  static async createAdminAsync(): Promise<DynamicModule> {
    return AdminModule.createAdminAsync({
      imports: [AuthModule],
      inject: [AuthService],
      useFactory: async (authService: AuthService) => {
        const resources = await ResourceProvider.getResources(adminResource);

        return {
          adminJsOptions: {
            rootPath: '/admin',
            resources: resources,
          },
          ...authentication(authService),
        };
      },
    });
  }
}
