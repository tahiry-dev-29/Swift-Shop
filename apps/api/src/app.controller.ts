import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('/graphql/', 302)
  redirectToGraphql() {
    // Redirect root path to GraphQL playground
  }
}
