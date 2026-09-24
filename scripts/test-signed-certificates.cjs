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
  const { normalizeDocument, documentFromFilename, matchSignedCertificate, parseSignedCertificateFilename } = load('lib/certificates/signed-matching.ts');
  assert.equal(normalizeDocument(' 1.029-988 863x'), '1029988863');
  assert.equal(normalizeDocument(40396189), '40396189');
  assert.equal(normalizeDocument(null), '');
  for (const name of ['1029988863-juan-sebastian.pdf', 'ponente-1029988863-juan.pdf', 'carpeta/ponente-1.029.988.863-juan.pdf']) assert.equal(documentFromFilename(name), '1029988863');
  assert.equal(documentFromFilename('Lider-40396189-Astrid-Baquero.pdf'), '40396189');
  assert.equal(documentFromFilename('2026-1029988863-juan.pdf'), '1029988863');
  assert.equal(documentFromFilename('543210-1029988863-juan.pdf'), '');
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
  const namedArchive = new JSZip();
  namedArchive.file('Ponente - Juan Sebastian Bohorquez Torres - 1029988863.pdf', pdf);
  namedArchive.file('Líder de proyecto - Juan Sebastian Bohorquez Torres - 1.029-988 863.pdf', pdf);
  namedArchive.file('Evaluador - Juan Sebastian Bohorquez Torres - 1029988863.pdf', pdf);
  const namedReport = await zipModule.uploadSignedZip(await namedArchive.generateAsync({ type: 'nodebuffer' }), false);
  assert.equal(namedReport.resumen.asociados, 2);
  assert.equal(namedReport.resumen.noAsociados, 1);
  assert.equal(namedReport.results[2].estado, 'No asociado');
  assert.equal(namedReport.results[2].motivo, 'No se encontró certificado generado para este documento y tipo.');
  assert.deepEqual(saved, ['a', 'a', 'b']);
  const largeArchive = new JSZip();
  largeArchive.file('ponente-1029988863-juan.pdf', oversized);
  const largeReport = await zipModule.uploadSignedZip(await largeArchive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), false);
  assert.equal(largeReport.resumen.errores, 1);
  assert.match(largeReport.results[0].motivo, /15 MB/);
  assert.deepEqual(saved, ['a', 'a', 'b']);

  for (const path of ['upload', 'upload-zip', 'descargar']) {
    const adminRoute = load(`app/api/admin/certificados/firmados/${path}/route.ts`, {
      '@/lib/admin-auth': { isAdminAuthenticated: async () => false },
    });
    const handler = adminRoute.POST || adminRoute.GET;
    assert.equal((await handler(new Request('https://example.test/admin'))).status, 401);
  }

  let lookupRows = [person, { ...leader, estado_firma: 'Firmado', certificado_firmado_path: existing.certificado_firmado_path }];
  const route = load('app/api/certificados/consultar/route.ts', {
    '@/lib/certificates/lookup-limit': { allowCertificateLookup: () => true },
    '@/lib/certificates/signed': { listSignedCertificates: async document => { assert.equal(document, '1029988863'); return lookupRows; }, signedDownload: async () => 'https://signed.example/token' },
  });
  const request = body => new Request('https://example.test/api/certificados/consultar', { method: 'POST', body: JSON.stringify(body) });
  let response = await route.POST(request({ documento: '1.029.988.863' }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store, private');
  let body = await response.json();
  assert.equal(body.certificados.length, 1);
  assert.equal(body.certificados[0].tipo_certificado, 'Líder de proyecto');
  assert.equal(JSON.stringify(body).includes('certificado_firmado_path'), false);
  assert.equal(JSON.stringify(body).includes('documento_persona'), false);
  lookupRows = [person];
  body = await (await route.POST(request({ documento: '1029988863' }))).json();
  assert.match(body.message, /aún no/);
  lookupRows = [];
  body = await (await route.POST(request({ documento: '1029988863' }))).json();
  assert.match(body.message, /No se encontraron/);
  assert.equal((await route.POST(request({ documento: '' }))).status, 400);
  assert.equal((await route.POST(request({ documento: '1029988863', listar: true }))).status, 400);
  console.log('Signed certificate tests passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
