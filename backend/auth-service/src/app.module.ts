import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';

const isSupabaseDatabase = (databaseUrl?: string) =>
  Boolean(databaseUrl?.includes('supabase'));
const isDevelopment = (nodeEnv?: string) =>
  nodeEnv !== 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV');

        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: isDevelopment(nodeEnv),
          logging: true,
          ssl: isSupabaseDatabase(databaseUrl)
            ? { rejectUnauthorized: false }
            : false,
        };
      },
    }),
    AuthModule,
  ],
})
export class AppModule {}
