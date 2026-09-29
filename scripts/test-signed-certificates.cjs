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
  process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://supabase.example.test';
  const schema = load('lib/certificates/signed-schema.ts');
  for (const column of schema.SIGNED_CERTIFICATE_COLUMNS) {
    const expected = `Falta la columna certificados.${column}. Ejecute la migración de certificados firmados.`;
    assert.equal(schema.signedCertificateError({ code: '42703', message: `column certificados.${column} does not exist` }), expected);
    assert.equal(schema.signedCertificateError({ code: 'PGRST204', message: `Could not find the '${column}' column of 'certificados' in the schema cache` }), expected);
  }
  assert.match(schema.signedCertificateError({ code: 'PGRST205', message: "Could not find the table 'public.certificados_firma_errores' in the schema cache" }), /Falta la tabla certificados_firma_errores/);
  assert.match(schema.signedCertificateError({ message: 'Bucket not found' }), /bucket certificates/);
  const checkedColumns = [];
  const diagnosticDb = {
    from: table => ({ select(column, options) {
      assert.equal(table, 'certificados'); assert.equal(options.head, true); checkedColumns.push(column);
      return { limit: async () => ({ error: ['estado_firma', 'rol_participacion'].includes(column) ? { code: '42703' } : null }) };
    } }),
    storage: { getBucket: async bucket => { assert.equal(bucket, 'certificates'); return { data: { public: false }, error: null }; } },
  };
  const diagnostic = load('lib/certificates/signed-schema.ts', { '@/lib/supabase/server': { createSupabaseServerClient: () => diagnosticDb } });
  assert.deepEqual(await diagnostic.inspectSignedCertificateColumns(), ['estado_firma']);
  assert.deepEqual(checkedColumns, [...schema.SIGNED_CERTIFICATE_COLUMNS]);
  await diagnostic.inspectSignedCertificateBucket();
  const listDb = { from: () => ({ select(columns) {
    assert.equal(columns.split(',').includes('rol'), false);
    assert.equal(columns.split(',').includes('rol_participacion'), false);
    return { order: () => ({ range: async () => ({ data: [{ id: 'pending', estado_firma: null }], error: null }) }) };
  } }) };
  const listing = load('lib/certificates/signed.ts', { '@/lib/supabase/server': { createSupabaseServerClient: () => listDb } });
  assert.equal((await listing.listSignedCertificates(undefined, ['rol_participacion']))[0].estado_firma, 'Pendiente de firma');
  const { normalizeDocument, documentFromFilename, matchSignedCertificate, parseSignedCertificateFilename } = load('lib/certificates/signed-matching.ts');
  assert.equal(normalizeDocument(' 1.029-988 863x'), '1029988863');
  assert.equal(normalizeDocument(40396189), '40396189');
  assert.equal(normalizeDocument(null), '');
  for (const name of ['1029988863-juan-sebastian.pdf', 'ponente-1029988863-juan.pdf', 'carpeta/ponente-1.029.988.863-juan.pdf']) assert.equal(documentFromFilename(name), '1029988863');
  assert.equal(documentFromFilename('Lider-40396189-Astrid-Baquero.pdf'), '40396189');
  assert.equal(documentFromFilename('2026-1029988863-juan.pdf'), '1029988863');
  assert.equal(documentFromFilename('543210-1029988863-juan.pdf'), '1029988863');
  const person = { id: 'a', documento_persona: '1.029.988.863', nombre_persona: 'Juan Bohórquez', tipo_certificado: 'Ponente', url_certificado: 'generated.pdf' };
  const leader = { ...person, id: 'b', tipo_certificado: 'Líder de proyecto' };
  assert.equal(matchSignedCertificate('1029988863-juan.pdf', [person, leader]).certificate, null);
  assert.equal(matchSignedCertificate('ponente-1029988863-juan.pdf', [person, leader]).certificate.id, 'a');
  assert.equal(matchSignedCertificate('lider-1029988863-juan.pdf', [person, leader]).certificate.id, 'b');
  assert.equal(matchSignedCertificate('ponente-1029988863-juan.pdf', [person, { ...person, id: 'c' }]).certificate, null);
  assert.equal(matchSignedCertificate('99999999-otro.pdf', [person]).certificate, null);
  assert.deepEqual(parseSignedCertificateFilename('Evaluador - Yesny Alejandra Chavez Veloza - 1120563238.pdf'), {
    tipo: 'Evaluador', nombre: 'Yesny Alejandra Chavez Veloza', documento: '1120563238',
  });
  for (const [prefix, name, document, type] of [
    ['Evaluador', 'Yesny Alejandra Chavez Veloza', '1120563238', 'Evaluador'],
    ['Ponente', 'Juan Sebastian Bohorquez Torres', '1029988863', 'Ponente'],
    ['Líder de proyecto', 'Astrid Pilar Baquero Ospina', '40396189', 'Líder de proyecto'],
    ['Lider de proyecto', 'Astrid Pilar Baquero Ospina', '40396189', 'Líder de proyecto'],
    ['Investigador', 'Nombre Apellido', '123456789', 'Investigador'],
    ['Evaluador productores campesinos', 'Nombre Apellido', '123456789', 'Evaluador productores campesinos'],
  ]) {
    const filename = `carpeta/${prefix} - ${name} - ${document}.pdf`;
    const record = { ...person, id: 'expected', documento_persona: document, tipo_certificado: type };
    const other = { ...record, id: 'other', tipo_certificado: 'Otro' };
    assert.deepEqual(parseSignedCertificateFilename(filename), { tipo: type, nombre: name, documento: document });
    assert.equal(matchSignedCertificate(filename, [record, other]).certificate.id, 'expected');
    const unmatched = matchSignedCertificate(filename, [other]);
    assert.equal(unmatched.certificate, null);
    assert.equal(unmatched.motivo, 'No se encontró certificado generado para este documento y tipo.');
  }
  for (const document of ['1.120.563.238', '1 120 563 238', '1120-563238', '1.120-563 238']) {
    assert.equal(documentFromFilename(`Evaluador - Nombre Apellido - ${document}.pdf`), '1120563238');
  }
  assert.equal(documentFromFilename('Evaluador - Persona - 12.34.pdf'), '');
  assert.equal(documentFromFilename('Evaluador - Persona - 12345.pdf'), '12345');
  assert.equal(documentFromFilename('Evaluador - Persona - 123456789012345678901234567890.pdf'), '123456789012345678901234567890');
  assert.equal(matchSignedCertificate('Evaluador - Ponente Lider - 1029988863.pdf', [person, leader]).certificate, null);

  assert.equal(matchSignedCertificate('Ponente - Juan Bohórquez - 1029988863.pdf', [person, { ...person, id: 'different', nombre_persona: 'Otra Persona' }]).certificate.id, 'a');
  assert.equal(matchSignedCertificate('Desconocido - Juan - 1029988863.pdf', [person]).certificate, null);
  const { readUploadResponse } = load('lib/certificates/upload-response.ts');
  await assert.rejects(() => readUploadResponse(new Response('Request Entity Too Large', { status: 413 })), /La carga debe hacerse mediante Supabase Storage/);
  await assert.rejects(() => readUploadResponse(new Response('<html>Error</html>', { status: 502 })), /Error/);
  assert.equal((await readUploadResponse(new Response('{"success":true}'))).success, true);
  let failUpdate = false, conflict = false;
  const uploaded = [], removed = [], updates = [];
  const db = {
    storage: { from: () => ({
      upload: async (path, bytes, options) => { assert.equal(options.upsert, false); uploaded.push(path); return { error: null }; },
      remove: async paths => { removed.push(...paths); return { error: null }; },
      createSignedUrl: async (path, ttl) => { assert.equal(ttl, 600); return { data: { signedUrl: 'https://signed.example/token' }, error: null }; },
    }) },
    from: () => {
      const query = { update(values) { updates.push(values); return query; }, eq() { return query; }, is() { return query; }, select: async () => ({ data: conflict ? [] : [{ id: person.id }], error: failUpdate ? { message: 'DB failed' } : null }) };
      return query;
    },
  };
  const signed = load('lib/certificates/signed.ts', { '@/lib/supabase/server': { createSupabaseServerClient: () => db } });
  const pdf = Buffer.from('%PDF-1.7\nexample signed bytes');
  assert.throws(() => signed.validateSignedPdf('fake.pdf', Buffer.from('not pdf')));
  assert.throws(() => signed.validateSignedPdf('fake.exe', pdf));
  const oversized = Buffer.alloc(signed.MAX_SIGNED_PDF + 1); pdf.copy(oversized);
  assert.throws(() => signed.validateSignedPdf('large.pdf', oversized));
  assert.equal(await signed.saveSignedCertificate(person, 'signed.pdf', pdf, false), 'Asociado');
  assert.equal(uploaded.at(-1), 'firmados/ponentes/1029988863-juan-bohorquez.pdf');
  assert.equal(updates.at(-1).estado_firma, 'Firmado');
  assert.equal(updates.at(-1).certificado_firmado_tipo, 'application/pdf');
  const existing = { ...person, certificado_firmado_path: uploaded.at(-1) };
  await assert.rejects(() => signed.saveSignedCertificate(existing, 'signed.pdf', pdf, false), /Confirme/);
  assert.equal(await signed.saveSignedCertificate(existing, 'signed.pdf', pdf, true), 'Reemplazado');
  assert.notEqual(uploaded.at(-1), existing.certificado_firmado_path);
  assert.equal(removed.at(-1), existing.certificado_firmado_path);
  failUpdate = true;
  await assert.rejects(() => signed.saveSignedCertificate(existing, 'signed.pdf', pdf, true));
  assert.equal(removed.at(-1), uploaded.at(-1));
  failUpdate = false; conflict = true;
  await assert.rejects(() => signed.saveSignedCertificate(existing, 'signed.pdf', pdf, true), /cambió/);
  assert.equal(removed.at(-1), uploaded.at(-1));
  await assert.rejects(() => signed.signedDownload('https://public.example/file.pdf'));
  assert.equal(await signed.signedDownload(existing.certificado_firmado_path), 'https://signed.example/token');

  const errors = [], saved = [];
  const zipModule = load('lib/certificates/signed-zip.ts', {
    './signed': { ...signed, listSignedCertificates: async () => [person, leader], saveSignedCertificate: async row => { saved.push(row.id); return 'Asociado'; } },
    '@/lib/supabase/server': { createSupabaseServerClient: () => ({ from: () => ({ insert: async value => { errors.push(value); return { error: null }; } }) }) },
  });
  const archive = new JSZip();
  archive.file('ponente-1029988863-juan.pdf', pdf);
  archive.file('repetido/ponente-1029988863-juan.pdf', pdf);
  archive.file('1029988863-ambiguo.pdf', pdf);
  archive.file('99999999-no-existe.pdf', pdf);
  archive.file('readme.txt', 'ignored');
  const report = await zipModule.uploadSignedZip(await archive.generateAsync({ type: 'nodebuffer' }), false);
  assert.deepEqual(report.resumen, { procesados: 4, asociados: 1, noAsociados: 2, duplicados: 1, reemplazados: 0, errores: 0 });
  assert.deepEqual(saved, ['a']); assert.equal(errors.length, 2);
  assert.equal(errors[0].estado, 'No asociado');
  assert.ok('archivo_nombre' in errors[0]);
  assert.ok('tipo_detectado' in errors[0]);
  const firstBatch = await zipModule.uploadSignedZip(await archive.generateAsync({ type: 'nodebuffer' }), true, 0, 1);
  assert.equal(firstBatch.remaining, 3);
  assert.equal(firstBatch.nextCursor, 1);
  const secondBatch = await zipModule.uploadSignedZip(await archive.generateAsync({ type: 'nodebuffer' }), true, 1, 1);
  assert.equal(secondBatch.results[0].estado, 'Duplicado');
  assert.equal(secondBatch.nextCursor, 2);
  assert.equal(secondBatch.remaining, 2);

  const many = new JSZip();
  for (let i = 0; i < 31; i++) many.file(`${i}/ponente-1029988863-juan.pdf`, pdf);
  const manyBytes = await many.generateAsync({ type: 'nodebuffer' });
  const manyFirst = await zipModule.uploadSignedZip(manyBytes, true);
  assert.equal(manyFirst.processed, 30);
  assert.equal(manyFirst.remaining, 1);
  const manyLast = await zipModule.uploadSignedZip(manyBytes, true, manyFirst.nextCursor);
  assert.equal(manyLast.processed, 1);
  assert.equal(manyLast.remaining, 0);
  assert.equal(manyLast.results[0].estado, 'Duplicado');
  saved.pop();
  const missingHistory = load('lib/certificates/signed-zip.ts', {
    './signed': { ...signed, listSignedCertificates: async () => [] },
    '@/lib/supabase/server': { createSupabaseServerClient: () => ({ from: () => ({ insert: async () => ({ error: { code: 'PGRST205' } }) }) }) },
  });
  const noHistoryReport = await missingHistory.uploadSignedZip(manyBytes, false);
  assert.equal(noHistoryReport.processed, 30);
  assert.match(noHistoryReport.warning, /Falta la tabla/);
  const badCursorBytes = await archive.generateAsync({ type: 'nodebuffer' });
  await assert.rejects(() => zipModule.uploadSignedZip(badCursorBytes, false, -1));
  await assert.rejects(() => zipModule.uploadSignedZip(badCursorBytes, false, 0, 31));
  const excessive = new JSZip();
  for (let i = 0; i < 201; i++) excessive.file(`${i}.pdf`, pdf);
  const excessiveBytes = await excessive.generateAsync({ type: 'nodebuffer' });
  await assert.rejects(() => zipModule.uploadSignedZip(excessiveBytes, false), /200 archivos/);
  // Forge a central-directory declared size to verify the whole-archive guard
  // rejects before any association, including entries outside the first batch.
  const declared = Buffer.from(badCursorBytes);
  const central = declared.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  declared.writeUInt32LE(201 * 1024 * 1024, central + 24);
  await assert.rejects(() => zipModule.uploadSignedZip(declared, false), /200 MB/);
  const namedArchive = new JSZip();
  namedArchive.file('Ponente - Juan Sebastian Bohorquez Torres - 1029988863.pdf', pdf);
  namedArchive.file('Líder de proyecto - Juan Sebastian Bohorquez Torres - 1.029-988 863.pdf', pdf);
  namedArchive.file('Evaluador - Juan Sebastian Bohorquez Torres - 1029988863.pdf', pdf);
  const namedReport = await zipModule.uploadSignedZip(await namedArchive.generateAsync({ type: 'nodebuffer' }), false);
  assert.equal(namedReport.resumen.asociados, 2);
  assert.equal(namedReport.resumen.noAsociados, 1);
  assert.equal(namedReport.results[2].estado, 'No asociado');
  assert.equal(namedReport.results[2].motivo, 'No se encontró certificado generado para este documento y tipo.');
  assert.deepEqual(saved, ['a', 'a', 'a', 'b']);
  const largeArchive = new JSZip();
  largeArchive.file('ponente-1029988863-juan.pdf', oversized);
  const largeReport = await zipModule.uploadSignedZip(await largeArchive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), false);
  assert.equal(largeReport.resumen.errores, 1);
  assert.match(largeReport.results[0].motivo, /15 MB/);
  assert.deepEqual(saved, ['a', 'a', 'a', 'b']);

  for (const path of ['upload', 'upload-zip', 'descargar', 'create-zip-upload-url', 'process-zip', 'process-zip-batch']) {
    const adminRoute = load(`app/api/admin/certificados/firmados/${path}/route.ts`, {
      '@/lib/admin-auth': { isAdminAuthenticated: async () => false },
    });
    const handler = adminRoute.POST || adminRoute.GET;
    assert.equal((await handler(new Request('https://example.test/admin'))).status, 401);
  }

  let signedPath;
  const createUpload = load('app/api/admin/certificados/firmados/create-zip-upload-url/route.ts', {
    '@/lib/certificates/signed-zip-request': { authorizeZipRequest: async () => null },
    '@/lib/supabase/server': { createSupabaseServerClient: () => ({ storage: { from: bucket => {
      assert.equal(bucket, 'certificates');
      return { createSignedUploadUrl: async path => { signedPath = path; return { data: { token: 'upload-token', signedUrl: 'https://storage.example/upload/sign' }, error: null }; } };
    } } }) },
  });
  const uploadRequest = body => new Request('https://example.test/api/admin/certificados/firmados/create-zip-upload-url', { method: 'POST', body: JSON.stringify(body) });
  const metadata = { fileName: 'Paquete 1.zip', fileType: 'application/zip', fileSize: 12345678 };
  const created = await createUpload.POST(uploadRequest(metadata));
  assert.equal(created.status, 200);
  const createdBody = await created.json();
  assert.equal(createdBody.path, signedPath);
  assert.match(createdBody.path, /^firmados\/zips\/\d+-[a-f0-9-]+-paquete-1\.zip$/);
  assert.equal(createdBody.token, 'upload-token');
  assert.equal(createdBody.signedUrl, 'https://storage.example/upload/sign');
  for (const invalid of [{ fileName: 'file.pdf' }, { fileName: '../file.zip' }, { fileType: 'text/html' }, { fileSize: 51 * 1024 * 1024 }, { fileSize: 0 }]) {
    assert.equal((await createUpload.POST(uploadRequest({ ...metadata, ...invalid }))).status, 400);
  }
  const manager = fs.readFileSync('app/admin/certificados/firmados/signed-manager.tsx', 'utf8');
  assert.equal(manager.includes('"upload-zip"'), false);
  assert.equal(manager.includes('response.json()'), false);
  assert.ok(manager.includes('fetch(prepared.signedUrl'));
  assert.ok(manager.includes('zipPath: prepared.path'));
  assert.ok(manager.includes('Restantes: report.remaining'));

  let lookupRows = [];
  let queryError = null, storageError = null, storageUrl = 'https://signed.example/file', unexpected = false;
  const signedPaths = [];
  const route = load('app/api/certificados/consultar/route.ts', {
    '@supabase/supabase-js': { createClient(url, key, options) {
      assert.equal(key, process.env.SUPABASE_SERVICE_ROLE_KEY);
      assert.equal(options.auth.persistSession, false);
      if (unexpected) throw new Error('Unexpected client error');
      return {
        from(table) { assert.equal(table, 'certificados'); return { select: async columns => {
          assert.equal(columns, 'id,nombre_persona,documento_persona,tipo_certificado,estado_firma,certificado_firmado_path,certificado_firmado_nombre,certificado_firmado_at');
          return {data: lookupRows, error: queryError};
        } }; },
        storage: {from(bucket) { assert.equal(bucket, 'certificates'); return {createSignedUrl: async (path, ttl) => {
          assert.equal(ttl,600); signedPaths.push(path);
          return {data: storageUrl ? {signedUrl: storageUrl} : null, error: storageError};
        }}; }},
      };
    } },
  });
  const request = body => new Request('https://example.test/api/certificados/consultar', {method:'POST',body:JSON.stringify(body)});
  const publicRow = {...person, documento_persona:'1.074-131 863', estado_firma:'  fIrMaDo  ', certificado_firmado_path:' firmados/ponentes/archivo.pdf '};
  const originalPublicLog = console.log, originalPublicError = console.error;
  console.log = () => {}; console.error = () => {};
  try {
    for (const input of [null, {}, {documento:''}, {documento:'abc'}]) assert.equal((await route.POST(request(input))).status,400);
    assert.equal((await route.POST(new Request('https://example.test', {method:'POST',body:'bad-json'}))).status,400);
    for (const variable of ['SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_SUPABASE_URL']) {
      const saved = process.env[variable]; delete process.env[variable];
      try { const response = await route.POST(request({documento:'1074131863'})); assert.equal(response.status,500); assert.match((await response.json()).message,/Falta configurar/); }
      finally {process.env[variable]=saved;}
    }
    let body = await (await route.POST(request({documento:'1074131863'}))).json();
    assert.equal(body.message,'No se encontraron certificados asociados a este documento.');
    lookupRows = [{...publicRow,estado_firma:'Pendiente de firma'}];
    body = await (await route.POST(request({documento:'1074131863'}))).json();
    assert.match(body.message,/a\u00fan no se encuentran/);
    lookupRows = [{...publicRow,certificado_firmado_path:'  '}];
    body = await (await route.POST(request({documento:'1074131863'}))).json();
    assert.equal(body.message,'El certificado figura como firmado, pero no tiene archivo asociado.');
    lookupRows.push(publicRow);
    const response = await route.POST(request({documento:1074131863}));
    assert.equal(response.status,200);
    body = await response.json();
    assert.equal(body.results.length,1);
    assert.equal(body.message,'Certificados encontrados.');
    assert.equal(body.results[0].downloadUrl,storageUrl);
    assert.equal(signedPaths.at(-1),'firmados/ponentes/archivo.pdf');
    assert.equal(JSON.stringify(body).includes('certificado_firmado_path'),false);
    queryError = {message:'column missing'};
    body = await (await route.POST(request({documento:'1074131863'}))).json();
    assert.equal(body.detail,'column missing'); assert.equal(body.success,false);
    queryError = null; storageError = {message:'Object not found'};
    body = await (await route.POST(request({documento:'1074131863'}))).json();
    assert.equal(body.detail,'Object not found'); assert.equal(body.path,'firmados/ponentes/archivo.pdf');
    storageError = null; storageUrl = null;
    body = await (await route.POST(request({documento:'1074131863'}))).json();
    assert.match(body.detail,/No se recibi/);
    unexpected = true;
    body = await (await route.POST(request({documento:'1074131863'}))).json();
    assert.equal(body.message,'Error consultando certificados.'); assert.equal(body.detail,'Unexpected client error');
  } finally { console.log=originalPublicLog; console.error=originalPublicError; }
  const { signedStatusFilter } = load('lib/certificates/signed-status.ts');
  assert.equal(signedStatusFilter('Firmado'), 'Firmado');
  assert.equal(signedStatusFilter('Pendiente de firma'), 'Pendiente de firma');
  assert.equal(signedStatusFilter('firmados'), 'Firmado');
  assert.equal(signedStatusFilter(undefined), 'Todos');
  assert.equal(schema.signedCertificateError({ message: 'Supabase query failed' }), 'Supabase query failed');
  const adminPage = fs.readFileSync('app/admin/certificados/page.tsx', 'utf8');
  assert.ok(adminPage.includes('/admin/certificados/firmados?estado=Firmado'));
  assert.ok(adminPage.includes('/admin/certificados/firmados?estado=Pendiente%20de%20firma'));
  const auxiliaryWarnings = [];
  const tolerantList = load('lib/certificates/signed.ts', { '@/lib/supabase/server': { createSupabaseServerClient: () => ({ from: table => {
    if (table === 'certificados') return { select: () => ({ order: () => ({ range: async () => ({ data: [{ ...person, proyecto_id: 'p1', iniciativa_id: 'i1' }], error: null }) }) }) };
    return { select: () => ({ in: async () => ({ data: null, error: { message: 'Auxiliary project lookup failed' } }) }) };
  } }) } });
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    assert.equal((await tolerantList.listSignedCertificates(undefined, [], auxiliaryWarnings)).length, 1);
    assert.equal(auxiliaryWarnings.length, 2);
  } finally { console.error = originalConsoleError; }
  console.log('Signed certificate tests passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
