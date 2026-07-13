import { GraphQLError, ValidationContext, ASTVisitor } from 'graphql';

export function depthLimit(maxDepth: number) {
  return (context: ValidationContext): ASTVisitor => {
    let depth = 0;
    return {
      Field: {
        enter(node) {
          depth++;
          if (depth > maxDepth) {
            context.reportError(
              new GraphQLError(
                `Query depth exceeds maximum limit of ${maxDepth}`,
                {
                  nodes: [node],
                },
              ),
            );
          }
        },
        leave() {
          depth--;
        },
      },
    };
  };
}
