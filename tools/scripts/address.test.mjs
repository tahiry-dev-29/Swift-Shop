import { gql, log } from './test-utils.mjs';

export const testAddressModule = async (customerToken) => {
  console.log('\n=== 📍 Address Module ===');
  
  const createRes = await gql(`
    mutation {
      createAddress(input: {
        alias: "Home"
        firstname: "Jane"
        lastname: "Doe"
        address1: "123 Main St"
        postcode: "75001"
        city: "Paris"
        countryId: 1
        phone: "0123456789"
      }) {
        id alias firstname lastname address1 city
      }
    }
  `, customerToken);
  log('➕', 'Create Address', !createRes.errors, createRes.data?.createAddress || createRes.errors);
  
  const addressId = createRes.data?.createAddress?.id;
  
  if (addressId) {
    const myAddressesRes = await gql(`
      query {
        myAddresses {
          id alias address1 city
        }
      }
    `, customerToken);
    log('📋', 'My Addresses', !myAddressesRes.errors, myAddressesRes.data?.myAddresses || myAddressesRes.errors);
    
    const updateRes = await gql(`
      mutation {
        updateAddress(id: ${addressId}, input: { alias: "Work" }) {
          id alias
        }
      }
    `, customerToken);
    log('✏️', 'Update Address', !updateRes.errors, updateRes.data?.updateAddress || updateRes.errors);
    
    const deleteRes = await gql(`
      mutation {
        deleteAddress(id: ${addressId}) { id deleted }
      }
    `, customerToken);
    log('🗑️', 'Delete Address', !deleteRes.errors, deleteRes.data?.deleteAddress || deleteRes.errors);
  }
};
