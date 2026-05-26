import { gql, log } from './test-utils.mjs';

export const testCatalogModule = async (superAdminToken) => {
  console.log('\n=== 📂 Catalog Module - Categories ===');
  
  const createParentRes = await gql(`
    mutation {
      createCategory(input: {
        name: "Electronics"
        description: "Electronic devices"
        position: 1
      }) {
        id name description parentId
      }
    }
  `, superAdminToken);
  log('➕', 'Create Category (Parent)', !createParentRes.errors, createParentRes.data?.createCategory || createParentRes.errors);
  
  const parentId = createParentRes.data?.createCategory?.id;
  
  if (parentId) {
    const createChildRes = await gql(`
      mutation {
        createCategory(input: {
          name: "Smartphones"
          description: "Mobile phones"
          parentId: ${parentId}
          position: 1
        }) {
          id name parentId
        }
      }
    `, superAdminToken);
    log('➕', 'Create Category (Child)', !createChildRes.errors, createChildRes.data?.createCategory || createChildRes.errors);
    
    const childId = createChildRes.data?.createCategory?.id;
    
    const treeRes = await gql(`
      query {
        categoryTree {
          id name children { id name }
        }
      }
    `, superAdminToken);
    log('🌳', 'Category Tree', !treeRes.errors, treeRes.data?.categoryTree || treeRes.errors);
    
    if (childId) {
      const pathRes = await gql(`
        query {
          categoryPath(id: ${childId})
        }
      `, superAdminToken);
      log('🔍', 'Category Path (Breadcrumb)', !pathRes.errors, pathRes.data?.categoryPath || pathRes.errors);
    }
    
    const listRes = await gql(`
      query {
        categories {
          id name parentId active
        }
      }
    `, superAdminToken);
    log('📋', 'List Categories', !listRes.errors, listRes.data?.categories || listRes.errors);
    
    if (childId) {
      const updateRes = await gql(`
        mutation {
          updateCategory(id: ${childId}, input: { name: "Mobile Phones" }) {
            id name
          }
        }
      `, superAdminToken);
      log('✏️', 'Update Category', !updateRes.errors, updateRes.data?.updateCategory || updateRes.errors);
      
      const deleteChildRes = await gql(`
        mutation {
          deleteCategory(id: ${childId}) { id name }
        }
      `, superAdminToken);
      log('🗑️', 'Delete Category (Child)', !deleteChildRes.errors, deleteChildRes.data?.deleteCategory || deleteChildRes.errors);
    }
    
    const deleteParentRes = await gql(`
      mutation {
        deleteCategory(id: ${parentId}) { id name }
      }
    `, superAdminToken);
    log('🗑️', 'Delete Category (Parent)', !deleteParentRes.errors, deleteParentRes.data?.deleteCategory || deleteParentRes.errors);
  }
};
