const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/')) return load(name.replace('@/', '') + '.ts', mocks);
    return require(name);
  }, module, module.exports);
  return module.exports;
}

async function main() {
  const { sanitizeStorageKey, certificateTypeToStorageFolder } = load('lib/certificates/storage-key.ts');
  assert.equal(sanitizeStorageKey(' /Líder Ñúñez: "A"\\ B! '), 'lider-nunez-a-b');
  assert.equal(certificateTypeToStorageFolder('Líder de proyecto'), 'lider-proyecto');
  assert.equal(certificateTypeToStorageFolder('Investigador'), 'investigadores');
  const rows = [];
  const people = Array.from({ length: 50 }, (_, i) => ({ id: String(i), nombre_evaluador: `Persona ${i}`, documento_evaluador: String(i + 100) }));
  let failStorage = true;
  const supabase = {
    storage: { from: () => ({ download: async () => ({ data: new Blob(['template']) }) }) },
    from(table) {
      let values, updating = false, id;
      const query = {
        select() { return query; }, not() { return query; }, in() { return query; },
        eq(column, value) { if (column === 'id') id = value; return query; },
        insert(value) { values = value; return query; },
        update(value) { values = value; updating = true; return query; },
        then(resolve) {
          if (values) {
            if ('rol_participacion' in values) return Promise.resolve({ error: { code: 'PGRST204', message: 'Missing rol_participacion' } }).then(resolve);
            if (updating) Object.assign(rows.find(row => row.id === id), values);
            else rows.push({ ...values, id: String(rows.length) });
            return Promise.resolve({ error: null }).then(resolve);
          }
          const data = table === 'evaluaciones' ? people.map(person => ({ evaluador_id: person.id })) : table === 'evaluadores' ? people : rows;
          return Promise.resolve({ data, error: null }).then(resolve);
        },
      };
      return query;
    },
  };
  const { generateCertificates } = load('lib/certificates/generate.ts', {
    '@/lib/supabase/server': { createSupabaseServerClient: () => supabase },
    '@/lib/certificates/templates': {
      getActiveCertificateTemplate: async () => ({ id: 'general', nombre: 'General', bucket: 'certificates', archivo_path: 'template.pdf' }),
      textPositionsFromTemplate: () => ({}),
    },
    '@/lib/certificates/pdf': { generateCertificatePdf: async input => { assert.equal(input.rol, 'Evaluador'); return Buffer.from('pdf'); } },
    '@/lib/supabase/storage': { uploadCertificatePdf: async path => {
      assert.match(path, /^certificados\/evaluadores\/[a-z0-9-]+\.pdf$/);
      if (failStorage) { failStorage = false; throw { message: 'Storage unavailable' }; }
    } },
  });
  const first = await generateCertificates('Evaluador', false, 0, 25);
  assert.equal(first.generados, 24);
  assert.equal(first.errores, 1);
  assert.match(first.erroresDetalle[0].motivo, /Storage unavailable/);
  assert.equal(first.remaining, 25);
  assert.equal(first.nextOffset, 25);
  const second = await generateCertificates('Evaluador', false, 25, 25);
  assert.equal(second.generados, 25);
  assert.equal(second.remaining, 0);
  const retry = await generateCertificates('Evaluador', false, 0, 25);
  assert.equal(retry.generados, 1);
  assert.equal(retry.omitidos, 24);
  const regenerate = await generateCertificates('Evaluador', true, 0, 25);
  assert.equal(regenerate.regenerados, 25);
  assert.equal(rows.length, 50);
  const { POST } = load('app/api/certificates/generate/route.ts', {
    '@/lib/admin-auth': { isAdminAuthenticated: async () => true },
    '@/lib/certificates/generate': { generateCertificates: async (type, regenerate, offset, limit) => ({ success: true, type, regenerate, offset, limit }) },
  });
  for (const tipo of ['ponentes', 'lideres', 'evaluadores', 'evaluadores-productores', 'investigadores', 'todos']) {
    const response = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ tipo, regenerate: true }) }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).regenerate, true);
  }
  const invalid = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ tipo: 'lideres', limit: 26 }) }));
  assert.equal(invalid.status, 400);
  const unauthorized = load('app/api/certificates/generate/route.ts', {
    '@/lib/admin-auth': { isAdminAuthenticated: async () => false },
    '@/lib/certificates/generate': {},
  });
  const denied = await unauthorized.POST(new Request('http://localhost'));
  assert.equal(denied.status, 401);
  assert.equal((await denied.json()).message, 'No autorizado');
  await testResearchers();
  console.log('Certificate regression checks passed. Supabase and PDF generation were mocked.');
}

async function testResearchers() {
  const members = ['Investigador asociado', 'Investigador', 'Investigador/a asociado/a', 'Investigador asociado/a', 'Autor principal', 'Instructor']
    .map((rol_integrante, i) => ({ id: String(i), rol_integrante, nombre_completo: `Persona ${i}`, documento: String(100 + i), proyecto_id: 'project-1' }));
  members.push({ ...members[0], id: 'duplicate' });
  members.push({ ...members[0], id: 'other-project', proyecto_id: 'project-2' });
  const saved = [];
  const pdfInputs = [];
  const paths = [];
  const supabase = {
    storage: { from: () => ({ download: async () => ({ data: new Blob(['template']) }) }) },
    from(table) {
      let data = table === 'proyecto_integrantes' ? members : table === 'certificados' ? saved : [];
      let values, updating = false;
      const query = {
        select() { return query; }, order() { return query; }, not() { return query; },
        in(column, allowed) { data = data.filter(row => allowed.includes(row[column])); return query; },
        eq(column, value) { data = data.filter(row => row[column] === value); return query; },
        range(start, end) { data = data.slice(start, end + 1); return query; },
        insert(value) { values = value; return query; },
        update(value) { values = value; updating = true; return query; },
        then(resolve) {
          if (values) {
            if (updating) Object.assign(data[0], values);
            else saved.push({ ...values, id: String(saved.length) });
          }
          return Promise.resolve({ data, error: null }).then(resolve);
        },
      };
      return query;
    },
  };
  const mocks = {
    '@/lib/supabase/server': { createSupabaseServerClient: () => supabase },
    '@/lib/certificates/templates': {
      getActiveCertificateTemplate: async () => ({ id: 'general', nombre: 'General', bucket: 'certificates', archivo_path: 'template.pdf' }),
      textPositionsFromTemplate: () => ({}),
    },
    '@/lib/certificates/pdf': { generateCertificatePdf: async input => { pdfInputs.push(input); return Buffer.from('pdf'); } },
    '@/lib/supabase/storage': { uploadCertificatePdf: async path => { paths.push(path); } },
  };
  const { generateCertificates, getResearcherCertificateCount } = load('lib/certificates/generate.ts', mocks);
  assert.equal(await getResearcherCertificateCount(), 4);
  assert.equal((await generateCertificates('Investigador')).generados, 5);
  assert.equal(saved.length, 5);
  assert.ok(saved.every(row => row.tipo_certificado === 'Investigador' && row.rol_participacion === 'Investigador'));
  assert.ok(pdfInputs.every(input => input.rol === 'Investigador'));
  assert.ok(paths.every(path => /^certificados\/investigadores\/investigador-[a-z0-9-]+\.pdf$/.test(path)));
  assert.equal((await generateCertificates('Investigador')).omitidos, 5);
  const originalPaths = [...paths];
  assert.equal((await generateCertificates('Investigador', true)).regenerados, 5);
  assert.equal(saved.length, 5);
  assert.deepEqual(paths.slice(5), originalPaths);
  assert.equal((await generateCertificates('todos', true)).regenerados, 5);
  const { GET } = load('app/api/admin/certificados/package/route.ts', {
    '@/lib/admin-auth': { isAdminAuthenticated: async () => true },
    '@/lib/supabase/server': mocks['@/lib/supabase/server'],
    '@/lib/certificates/package': { createCertificatesZip: async certificates => {
      assert.equal(certificates.length, 5);
      assert.ok(certificates.every(row => row.tipo_certificado === 'Investigador'));
      return Buffer.from('zip');
    } },
  });
  saved.push({ tipo_certificado: 'Ponente', url_certificado: 'other.pdf' });
  const zip = await GET(new Request('http://localhost/api/admin/certificados/package?tipo=investigador&offset=0&limit=30'));
  assert.equal(zip.status, 200);
  assert.match(zip.headers.get('Content-Disposition'), /certificados-investigadores-paquete-1.zip/);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
