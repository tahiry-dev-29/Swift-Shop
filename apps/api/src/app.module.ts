import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthModule } from '@dima-new/backend/auth';
import { CustomerModule } from '@dima-new/backend/customer';
import { EmployeeModule } from '@dima-new/backend/employee';
import { CustomerGroupModule } from '@dima-new/backend/customer-group';
import { AddressModule } from '@dima-new/backend/address';
import { CatalogModule } from '@dima-new/backend/catalog';
import { PricingModule } from '@dima-new/backend/pricing';

@Module({
  imports: [
    
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(__dirname, 'schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req }) => ({ req }),
    }),
    
    DataAccessPrismaModule,
    
    AuthModule,
    CustomerModule,
    EmployeeModule,
    CustomerGroupModule,
    AddressModule,
    CatalogModule,
    PricingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
