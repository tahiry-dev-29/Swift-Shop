import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { PaymentService } from './payment.service';
import {
  InitiatePaymentInput,
  PaymentType,
  PaymentWebhookInput,
  RefundPaymentInput,
  RefundType,
} from './dto';

@Resolver(() => PaymentType)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => PaymentType)
  async initiatePayment(@Args('input') input: InitiatePaymentInput) {
    return this.paymentService.initiatePayment(
      input.orderId,
      input.provider,
      input.amount,
      input.currency,
      input.idempotencyKey,
    );
  }

  @Mutation(() => PaymentType)
  async verifyPayment(
    @Args('paymentId', { type: () => ID }) paymentId: string,
  ) {
    return this.paymentService.verifyPayment(paymentId);
  }

  @Mutation(() => RefundType)
  async processRefund(@Args('input') input: RefundPaymentInput) {
    return this.paymentService.processRefund(
      input.paymentId,
      input.amount,
      input.reason,
    );
  }

  @Mutation(() => Boolean)
  async processPaymentWebhook(@Args('input') input: PaymentWebhookInput) {
    return this.paymentService.processWebhook(
      input.provider,
      input.eventId,
      input.payload,
      input.signature,
    );
  }
}
