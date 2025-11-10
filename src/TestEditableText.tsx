import { useState } from 'react';

/**
 * Test component for double-click-to-edit functionality
 * Tests different types of text content:
 * 1. Literal text (static strings)
 * 2. Variable text (simple variables)
 * 3. Object properties (nested data)
 * 4. Expressions (computed values)
 */

export function TestEditableText() {
  // Test 1: Simple variable
  const welcomeMessage = "Welcome to the Editor";

  // Test 2: State variable
  const [title, setTitle] = useState("My Amazing App");

  // Test 3: Object property
  const user = {
    name: "John Doe",
    role: "Developer"
  };

  // Test 4: Multiple variables (expression)
  const firstName = "Jane";
  const lastName = "Smith";

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-4">Double-Click to Edit Test</h1>

        <div className="space-y-4">
          {/* Test 1: Literal text - should be editable */}
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Literal Text:</p>
            <p className="text-lg font-medium">This is a static text that can be edited</p>
          </div>

          {/* Test 2: Variable text - should be editable */}
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Variable Text:</p>
            <p className="text-lg font-medium">{welcomeMessage}</p>
          </div>

          {/* Test 3: State variable - should be editable */}
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">State Variable:</p>
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>

          {/* Test 4: Object property - should be editable */}
          <div className="border-l-4 border-orange-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Object Property:</p>
            <p className="text-lg">Name: {user.name}</p>
            <p className="text-lg">Role: {user.role}</p>
          </div>

          {/* Test 5: Expression - may be editable or show message */}
          <div className="border-l-4 border-red-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Expression (concatenation):</p>
            <p className="text-lg">{firstName + " " + lastName}</p>
          </div>

          {/* Test 6: Button with text - should be editable */}
          <div className="border-l-4 border-teal-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Button Text:</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Click Me
            </button>
          </div>

          {/* Test 7: Nested spans - should be editable */}
          <div className="border-l-4 border-pink-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Text with nested spans:</p>
            <p className="text-lg">
              This is <strong>bold text</strong> and <em>italic text</em>
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Enable the inspector mode (click the selection icon)</li>
            <li>Double-click on any text above</li>
            <li>Edit the text directly in the preview</li>
            <li>Press Enter or click away to save</li>
            <li>Check that the source code was updated</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
