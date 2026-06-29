import { Field, ID, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL representation of a generated invoice record.
 */
@ObjectType()
export class InvoiceType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field()
  invoiceNumber!: string;

  @Field({ nullable: true })
  pdfStorageRef?: string;

  @Field()
  dateAdd!: Date;
}

/**
 * GraphQL payload for downloadable order export content.
 */
@ObjectType()
export class OrderExportType {
  @Field()
  format!: string;

  @Field()
  filename!: string;

  @Field()
  mimeType!: string;

  @Field()
  base64!: string;
}
