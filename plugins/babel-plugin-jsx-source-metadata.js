/**
 * Babel plugin to inject source location metadata into JSX elements
 * This enables the double-click-to-edit feature in the preview
 */

module.exports = function ({ types: t }) {
  return {
    name: 'jsx-source-metadata',
    visitor: {
      JSXOpeningElement(path, state) {
        const { node } = path;
        const { loc } = node;

        // Skip if no location info (shouldn't happen in normal code)
        if (!loc) return;

        // Get the source file path
        const filename = state.file.opts.filename;
        if (!filename) return;

        // Get relative path from project root
        const relativePath = filename.replace(process.cwd() + '/', '');

        // Don't add attributes if they already exist (avoid duplicates)
        const hasSourceFile = node.attributes.some(
          attr => t.isJSXAttribute(attr) && attr.name.name === 'data-source-file'
        );
        if (hasSourceFile) return;

        // Add source file attribute
        node.attributes.push(
          t.jSXAttribute(
            t.jSXIdentifier('data-source-file'),
            t.stringLiteral(relativePath)
          )
        );

        // Add source location (line:column)
        node.attributes.push(
          t.jSXAttribute(
            t.jSXIdentifier('data-source-loc'),
            t.stringLiteral(`${loc.start.line}:${loc.start.column}`)
          )
        );

        // Analyze the text content type of this element
        const parent = path.parent;
        if (t.isJSXElement(parent)) {
          const children = parent.children;

          // Find text content in children
          for (const child of children) {
            if (t.isJSXText(child) && child.value.trim()) {
              // Static literal text
              node.attributes.push(
                t.jSXAttribute(
                  t.jSXIdentifier('data-text-type'),
                  t.stringLiteral('literal')
                )
              );
              break;
            } else if (t.isJSXExpressionContainer(child)) {
              const expr = child.expression;

              if (t.isIdentifier(expr)) {
                // Simple variable: {name}
                node.attributes.push(
                  t.jSXAttribute(
                    t.jSXIdentifier('data-text-type'),
                    t.stringLiteral('variable')
                  )
                );
                node.attributes.push(
                  t.jSXAttribute(
                    t.jSXIdentifier('data-text-source'),
                    t.stringLiteral(expr.name)
                  )
                );
                break;
              } else if (t.isMemberExpression(expr)) {
                // Object property: {user.name}
                const source = generateMemberExpressionPath(expr);
                node.attributes.push(
                  t.jSXAttribute(
                    t.jSXIdentifier('data-text-type'),
                    t.stringLiteral('property')
                  )
                );
                node.attributes.push(
                  t.jSXAttribute(
                    t.jSXIdentifier('data-text-source'),
                    t.stringLiteral(source)
                  )
                );
                break;
              } else if (t.isCallExpression(expr) || t.isConditionalExpression(expr) || t.isBinaryExpression(expr)) {
                // Complex expression
                node.attributes.push(
                  t.jSXAttribute(
                    t.jSXIdentifier('data-text-type'),
                    t.stringLiteral('expression')
                  )
                );
                // Try to get a simplified source representation
                try {
                  const source = generateExpressionSource(expr, t);
                  node.attributes.push(
                    t.jSXAttribute(
                      t.jSXIdentifier('data-text-source'),
                      t.stringLiteral(source)
                    )
                  );
                } catch (e) {
                  // If we can't generate source, just mark it as expression
                }
                break;
              }
            }
          }
        }
      }
    }
  };
};

/**
 * Generate a string path for member expressions like user.name or data.items[0].title
 */
function generateMemberExpressionPath(node) {
  const parts = [];
  let current = node;

  while (current) {
    if (current.type === 'MemberExpression') {
      if (current.computed) {
        // Handle array access: items[0]
        if (current.property.type === 'NumericLiteral') {
          parts.unshift(`[${current.property.value}]`);
        } else if (current.property.type === 'StringLiteral') {
          parts.unshift(`["${current.property.value}"]`);
        } else if (current.property.type === 'Identifier') {
          parts.unshift(`[${current.property.name}]`);
        }
      } else {
        // Handle property access: user.name
        if (current.property.type === 'Identifier') {
          parts.unshift(current.property.name);
        }
      }
      current = current.object;
    } else if (current.type === 'Identifier') {
      parts.unshift(current.name);
      break;
    } else if (current.type === 'ThisExpression') {
      parts.unshift('this');
      break;
    } else {
      break;
    }
  }

  return parts.join('.');
}

/**
 * Generate simplified source representation for complex expressions
 */
function generateExpressionSource(expr, t) {
  if (t.isIdentifier(expr)) {
    return expr.name;
  } else if (t.isMemberExpression(expr)) {
    return generateMemberExpressionPath(expr);
  } else if (t.isBinaryExpression(expr)) {
    // For binary expressions like firstName + ' ' + lastName
    const left = generateExpressionSource(expr.left, t);
    const right = generateExpressionSource(expr.right, t);
    return `${left} ${expr.operator} ${right}`;
  } else if (t.isConditionalExpression(expr)) {
    // For ternary: condition ? a : b
    return 'conditional';
  } else if (t.isCallExpression(expr)) {
    // For function calls
    if (t.isIdentifier(expr.callee)) {
      return `${expr.callee.name}()`;
    } else if (t.isMemberExpression(expr.callee)) {
      return `${generateMemberExpressionPath(expr.callee)}()`;
    }
    return 'function';
  } else {
    return 'expression';
  }
}
