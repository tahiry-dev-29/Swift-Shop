import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';

type AddressSnapshot = {
  firstname: string;
  lastname: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  postcode: string;
  city: string;
  countryId: string;
  phone?: string | null;
  phoneMobile?: string | null;
};

/**
 * Resolves customer addresses and converts them into immutable order snapshots.
 */
@Injectable()
export class OrderAddressSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeliveryAddresses(addressIds: string[]) {
    const addresses = await this.prisma.address.findMany({
      where: { id: { in: addressIds } },
    });
    const orderedAddresses = addressIds
      .map((addressId) => addresses.find((address) => address.id === addressId))
      .filter((address): address is NonNullable<typeof address> =>
        Boolean(address),
      );

    if (orderedAddresses.length === 0) {
      throw new NotFoundException('Address not found');
    }

    return orderedAddresses;
  }

  async getBillingAddress(
    addressId: string | undefined,
    fallback: AddressSnapshot,
  ) {
    if (!addressId) {
      return fallback;
    }

    const billingAddress = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!billingAddress) {
      throw new NotFoundException('Address not found');
    }

    return billingAddress;
  }

  toOrderAddressSnapshot(address: AddressSnapshot) {
    return {
      firstname: address.firstname,
      lastname: address.lastname,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      postcode: address.postcode,
      city: address.city,
      country: address.countryId,
      phone: address.phone || address.phoneMobile,
    };
  }
}
