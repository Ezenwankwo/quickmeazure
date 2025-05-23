# ESLint, Prettier, and Pre-commit Hooks Setup

This document outlines the ESLint configuration, Prettier formatting, and pre-commit hooks setup for the QuickMeazure project.

## ESLint Configuration

The project uses ESLint with the Nuxt.js ESLint module to enforce code quality standards. The configuration is defined in `eslint.config.mjs` and has been adjusted to balance code quality with developer productivity.

### Key Configuration Points

- **Error vs. Warning Levels**: Most rules are set to "warning" level to allow commits while still highlighting potential issues.
- **TypeScript Rules**: TypeScript-specific rules have been configured to be less strict about `any` types.
- **Unused Variables**: Variables, parameters, and caught errors with underscore prefixes (e.g., `_variable`) are ignored by the unused variable rule.
- **Vue-specific Rules**: Several Vue-specific rules are set to warning level to avoid blocking commits.

### Running ESLint

You can run ESLint manually with the following commands:

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically where possible
npm run lint:fix
```

## Prettier Configuration

Prettier is set up to automatically format code for consistency. The configuration is defined in `.prettierrc` with settings optimized for the project.

### Key Configuration Points

- **Semicolons**: Disabled (no semicolons at the end of statements)
- **Quotes**: Single quotes for strings
- **Tab Width**: 2 spaces
- **Print Width**: 100 characters
- **Trailing Commas**: ES5 style (for objects, arrays, etc.)
- **Arrow Function Parentheses**: Avoid when possible

### Running Prettier

You can run Prettier manually with the following commands:

```bash
# Format all files
npm run format

# Check if files are formatted correctly without changing them
npm run format:check
```

## Pre-commit Hooks

Pre-commit hooks are set up using Husky and lint-staged to automatically run ESLint on staged files before each commit.

### How It Works

1. When you attempt to commit changes, the pre-commit hook is triggered.
2. The hook first runs Prettier to format the code according to the defined style rules:
   - For JavaScript, TypeScript, Vue, and MJS files, both Prettier and ESLint are run.
   - For JSON, CSS, SCSS, and Markdown files, only Prettier is run.
3. Then ESLint runs with the `--fix` flag on all staged JavaScript, TypeScript, Vue, and MJS files.
4. If Prettier and ESLint can automatically fix the issues, they will do so.
5. If there are errors that cannot be automatically fixed, the commit will still proceed (since most rules are set to "warning" level).

### Configuration Files

- `.husky/pre-commit`: The Husky pre-commit hook script that runs lint-staged.
- `package.json`: Contains the lint-staged configuration that defines which commands to run on which files.
- `.prettierrc`: Defines the Prettier formatting rules.
- `.prettierignore`: Specifies files and directories that should be ignored by Prettier.
- `eslint.config.mjs`: Includes Prettier integration with ESLint to avoid conflicts.

## Best Practices

While the current configuration allows commits with warnings, it's recommended to:

1. Regularly run `npm run lint:fix` to address fixable issues.
2. Gradually fix remaining warnings to improve code quality.
3. Consider prefixing unused variables with an underscore (e.g., `_variable`) to comply with the configured rules.
4. For new code, aim to avoid using `any` types in TypeScript files.

## Future Improvements

As the codebase matures, consider:

1. Gradually increasing the strictness of the ESLint rules.
2. Converting more warnings to errors once the codebase is in better shape.
3. Adding additional code quality tools like Prettier for code formatting.
