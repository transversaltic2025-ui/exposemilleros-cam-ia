const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const JSZip = require('jszip');

function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/')) return load(name.replace('@/', '') + '.ts', mocks);
    if (name.startsWith('./')) return load(require('node:path').join(require('node:path').dirname(file), name + '.ts'), mocks);
    return require(name);
  }, module, module.exports);
  return module.exports;
}

async function main() {
  const documento = process.argv[2];
  if (!documento) throw new Error('Indique el documento como argumento.');
  const route = load('app/api/certificados/consultar/route.ts');
  const response = await route.POST(new Request('https://local.test/api/certificados/consultar', { method: 'POST', body: JSON.stringify({documento,nombre:''}), headers:{'content-type':'application/json'} }));
  const result = await response.json();
  console.log('Public lookup:', response.status, 'success:', result.success, 'results:', result.results?.length ?? 0, 'message:', result.message);
  if (!response.ok || !result.results?.length) process.exitCode = 1;
  if (result.results?.length) {
    const download = await fetch(result.results[0].downloadUrl, {headers:{Range:'bytes=0-4'}});
    console.log('Signed download:', download.status, download.headers.get('content-type'));
    await download.body?.cancel();
    if (!download.ok) process.exitCode = 1;
  }
  const schema = load('lib/certificates/signed-schema.ts');
  const missing = await schema.inspectSignedCertificateColumns();
  const warnings = [];
  const rows = await load('lib/certificates/signed.ts').listSignedCertificates(undefined, missing, warnings);
  console.log('Admin signed module:', rows.length, 'records;', missing.length, 'missing required columns;', warnings.length, 'warnings');
}
main().catch(error=> {console.error('Diagnostic failed:', error.message || error.code);process.exitCode=1;});
