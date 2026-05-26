import { gql, log } from './test-utils.mjs';

export const testCatalogAttributes = async (superAdminToken) => {
  console.log('\n=== 🎨 Catalog Module - Attributes ===');
  
  // Create Attribute Group (Size)
  const createGroupRes = await gql(`
    mutation {
      createAttributeGroup(input: {
        name: "Size"
        publicName: "Taille"
        type: "select"
        position: 0
      }) {
        id name publicName values { id name }
      }
    }
  `, superAdminToken);
  log('➕', 'Create Attribute Group (Size)', !createGroupRes.errors, createGroupRes.data?.createAttributeGroup || createGroupRes.errors);
  
  const groupId = createGroupRes.data?.createAttributeGroup?.id;
  
  if (groupId) {
    // Create Attribute Values
    const createValueS = await gql(`
      mutation {
        createAttributeValue(groupId: ${groupId}, input: { name: "S", position: 1 }) {
          id name position
        }
      }
    `, superAdminToken);
    const createValueM = await gql(`
      mutation {
        createAttributeValue(groupId: ${groupId}, input: { name: "M", position: 2 }) {
          id name position
        }
      }
    `, superAdminToken);
    
    log('➕', 'Create Attribute Values (S, M)', !createValueS.errors && !createValueM.errors, [createValueS.data, createValueM.data]);
    
    // Get Group with Values
    const getGroupRes = await gql(`
      query {
        attributeGroup(id: ${groupId}) {
          id name values { id name position }
        }
      }
    `, superAdminToken);
    log('🔍', 'Get Group with Values', !getGroupRes.errors, getGroupRes.data?.attributeGroup || getGroupRes.errors);
    
    // List All Groups
    const listRes = await gql(`
      query {
        attributeGroups {
          id name publicName values { id name }
        }
      }
    `, superAdminToken);
    log('📋', 'List Attribute Groups', !listRes.errors, listRes.data?.attributeGroups || listRes.errors);
    
    // Delete Group
    const deleteGroupRes = await gql(`
      mutation {
        deleteAttributeGroup(id: ${groupId}) { id name }
      }
    `, superAdminToken);
    log('🗑️', 'Delete Attribute Group', !deleteGroupRes.errors, deleteGroupRes.data?.deleteAttributeGroup || deleteGroupRes.errors);
  }
};
