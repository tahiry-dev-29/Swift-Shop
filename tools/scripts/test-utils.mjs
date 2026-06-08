const API_URL = 'http://localhost:3000/graphql';

export const gql = async (query, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  return res.json();
};

export const log = (emoji, name, success, data = null) => {
  console.log(`\n${emoji} ${name}`);
  if (success) {
    console.log('✅ SUCCESS');
    if (data) console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('❌ FAILED');
    if (data) console.log(JSON.stringify(data, null, 2));
  }
};
