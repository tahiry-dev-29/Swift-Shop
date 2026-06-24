import * as fs from 'fs';
import * as path from 'path';
import {
  buildSchema,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
  isEnumType,
  isObjectType,
} from 'graphql';

const schemaStr = fs.readFileSync('dist/apps/api/schema.gql', 'utf8');
const schema = buildSchema(schemaStr);
const queryType = schema.getQueryType();
const mutationType = schema.getMutationType();

function getBaseType(type: unknown): unknown {
  if (isNonNullType(type) || isListType(type)) {
    return getBaseType(type.ofType);
  }
  return type;
}

function generateDummyValue(type: unknown): unknown {
  if (isNonNullType(type)) {
    return generateDummyValue(type.ofType);
  }
  if (isListType(type)) {
    return [generateDummyValue(type.ofType)];
  }
  if (isScalarType(type)) {
    switch (type.name) {
      case 'String':
        return 'string';
      case 'Int':
        return 1;
      case 'Float':
        return 1.5;
      case 'Boolean':
        return true;
      case 'ID':
        return 'uuid-string';
      case 'DateTime':
        return '2023-01-01T00:00:00Z';
      default:
        return 'something';
    }
  }
  if (isEnumType(type)) {
    return type.getValues()[0].value;
  }
  if (isInputObjectType(type)) {
    const fields = type.getFields();
    const obj: Record<string, unknown> = {};
    for (const key of Object.keys(fields)) {
      obj[key] = generateDummyValue(fields[key].type);
    }
    return obj;
  }
  return null;
}

function generateReturnFields(type: unknown, depth = 0): string {
  if (depth > 2) return ''; // Prevent infinite recursion
  const base = getBaseType(type);
  if (isScalarType(base) || isEnumType(base)) {
    return '';
  }
  if (isObjectType(base)) {
    const fields = base.getFields();
    let str = ' {\n';
    let added = false;
    for (const key of Object.keys(fields)) {
      const fieldType = fields[key].type;
      const baseField = getBaseType(fieldType);
      if (isScalarType(baseField) || isEnumType(baseField)) {
        str += '  '.repeat(depth + 1) + key + '\n';
        added = true;
      } else if (depth < 2) {
        str +=
          '  '.repeat(depth + 1) +
          key +
          generateReturnFields(fieldType, depth + 1) +
          '\n';
        added = true;
      }
    }
    str += '  '.repeat(depth) + '}';
    if (!added) return ' { id }';
    return str;
  }
  return ' { id }';
}

function generateOperationDoc(
  operationName: string,
  opField: Record<string, unknown>,
  isMutation = false,
): string {
  const args = opField.args;

  const varDefs = (args as Record<string, unknown>[])
    .map(
      (a: Record<string, unknown>) =>
        `$${a['name']}: ${(a['type'] as { toString: () => string }).toString()}`,
    )
    .join(', ');
  const varCalls = (args as Record<string, unknown>[])
    .map((a: Record<string, unknown>) => `${a['name']}: $${a['name']}`)
    .join(', ');

  const opTypeStr = isMutation ? 'mutation' : 'query';

  let doc = `${opTypeStr} ${operationName.charAt(0).toUpperCase() + operationName.slice(1)}`;
  if (varDefs) {
    doc += `(${varDefs})`;
  }
  doc += ' {\n';
  doc += `  ${operationName}`;
  if (varCalls) {
    doc += `(${varCalls})`;
  }
  doc += generateReturnFields(opField.type, 1) + '\n';
  doc += '}\n';

  const variables: Record<string, unknown> = {};
  for (const a of args as Record<string, unknown>[]) {
    variables[a['name'] as string] = generateDummyValue(a['type']);
  }

  return `### ${operationName}

\`\`\`graphql
${doc}\`\`\`

**Variables:**
\`\`\`json
${JSON.stringify(variables, null, 2)}
\`\`\`

`;
}

const { execSync } = require('child_process');
const files = execSync('find apps libs -name "*.resolver.ts"')
  .toString()
  .trim()
  .split('\n');

const queries = queryType ? Object.keys(queryType.getFields()) : [];
const mutations = mutationType ? Object.keys(mutationType.getFields()) : [];
const allOps = [...queries, ...mutations];

for (const file of files) {
  if (!file) continue;

  const content = fs.readFileSync(file, 'utf8');

  let readme = `# GraphQL API - ${path.basename(file)}\n\n`;
  readme += `Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans \`${path.basename(file)}\` qu'on peut copier et coller pour tester.\n\n`;

  let count = 0;

  // Try to find each operation in the file
  for (const op of allOps) {
    // Look for exact word match followed by Optional space and parenthesis.
    // Ensure it's preceded by space, new line or async
    const regex = new RegExp(`\\b${op}\\s*\\(`, 'g');
    if (regex.test(content)) {
      // It exists in this file!
      const isMutation = mutations.includes(op);
      let opField;
      if (!isMutation && queryType) {
        opField = queryType.getFields()[op];
      } else if (isMutation && mutationType) {
        opField = mutationType.getFields()[op];
      }

      if (opField) {
        readme += generateOperationDoc(op, opField, isMutation);
        count++;
      }
    }
  }

  if (count > 0) {
    const dir = path.dirname(file);
    const baseName = path.basename(file).replace('.ts', '');
    const readmePath = path.join(dir, `README-${baseName}.md`);
    fs.writeFileSync(readmePath, readme);
    // eslint-disable-next-line no-console
    console.log(`Created ${readmePath} with ${count} operations.`);
  }
}
