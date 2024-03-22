import { GameServerConfig } from './config/game-server.config';
import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import {
  commonTypeOrmModuleOptions,
  gameTypeOrmModuleOptions,
} from '@libs/common/database/typeorm/typeorm-module.options';
import { SessionModule } from '@libs/dao/redis/session/session.module';
import { AuthModule } from './auth/auth.module';
import { LoginController } from './login/login.controller';
import { UserModule } from '@libs/dao/common/user/user.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionFilter } from '@libs/common/filter/all-exception.filter';
import { LoginService } from './login/login.service';
import { UserService } from './user/user.service';
import { UserDetailModule } from '@libs/dao/game/user-detail/user-detail.module';
import { UserLevelLockInterceptor } from '@libs/common/interceptor/user-level-lock.interceptor';
import { UserController } from './user/user.controller';
import { TransactionInterceptor } from '@libs/common/interceptor/transaction.interceptor';
import { GameService } from './default/game.service';
import { GameController } from './default/game.controller';
import { RequestLogInterceptor } from '@libs/common/interceptor/request-log.interceptor';
import { ClsModule } from 'nestjs-cls';
import { StaticModule } from '@libs/dao/static/static.module';
import { CurrencyModule } from '@libs/dao/game/currency/currency.module';
import { ItemModule } from '@libs/dao/game/item/item.module';
import { CharacterModule } from '@libs/dao/game/character/character.module';
import { EquipmentModule } from '@libs/dao/game/equipment/equipment.module';
import { UserProvider } from '@libs/common/provider/user.provider';
import { UserDetailProvider } from '@libs/common/provider/user-detail.provider';

@Module({
  imports: [
    GameServerConfig,
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    TypeOrmExModule.forRoot(commonTypeOrmModuleOptions),
    ...Object.values(gameTypeOrmModuleOptions).map((options) =>
      TypeOrmExModule.forRoot(options),
    ),
    SessionModule,

    // auth
    AuthModule,

    // static
    StaticModule,

    // Dao
    UserModule,
    UserDetailModule,
    CurrencyModule,
    ItemModule,
    CharacterModule,
    EquipmentModule,
  ],
  controllers: [GameController, LoginController, UserController],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe({ transform: true }) },
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLogInterceptor },
    { provide: APP_INTERCEPTOR, useClass: UserLevelLockInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransactionInterceptor },

    //service
    GameService,
    LoginService,
    UserService,

    // provider
    UserProvider,
    UserDetailProvider,
  ],
})
export class GameModule {}
