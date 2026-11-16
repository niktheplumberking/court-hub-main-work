// Produce a standalone worker from the same modules Next uses. No new runtime dependencies.
const fs = require('node:fs');
const ts = require('typescript');
const target = '.next/order-email-worker';
fs.mkdirSync(target, { recursive: true });
for (const file of ['order-email', 'resend', 'outbox', 'worker']) {
  const result = ts.transpileModule(fs.readFileSync(`lib/email/${file}.ts`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  fs.writeFileSync(`${target}/${file}.js`, result.outputText);
}
