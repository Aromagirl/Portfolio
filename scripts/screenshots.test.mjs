import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { parseOptions, validateConfig, resolveOutputDirectories, screenshotTarget } from './screenshots.mjs';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const valid = () => ({ projects: [{ id: 'demo', urls: [{ name: 'home', url: 'https://example.com' }] }] });

test('configuration and CLI reject mistakes before opening a browser', () => {
  assert.doesNotThrow(() => validateConfig(valid()));
  for (const id of ['../escape', 'CON', 'con', 'lpt1', 'a/b']) {
    const config = valid();
    config.projects[0].id = id;
    assert.throws(() => validateConfig(config), /id/);
  }
  const duplicate = valid();
  duplicate.projects.push(duplicate.projects[0]);
  assert.throws(() => validateConfig(duplicate), /Повторяющийся/);
  const pages = valid();
  pages.projects[0].urls.push(pages.projects[0].urls[0]);
  assert.throws(() => validateConfig(pages), /Повторяющееся/);
  const invalidUrl = valid();
  invalidUrl.projects[0].urls[0].url = 'file:///secret';
  assert.throws(() => validateConfig(invalidUrl), /HTTP/);
  assert.throws(() => validateConfig({ ...valid(), viewports: { mobile: { width: 0, height: 844 } } }), /width/);
  assert.throws(() => validateConfig({ ...valid(), typo: true }), /неизвестное поле/);
  assert.throws(() => parseOptions(['--unknown']), /Unknown option/);
  assert.throws(() => parseOptions(['--device', 'tablet']), /desktop и mobile/);
  assert.throws(() => parseOptions(['--device', '']), /desktop и mobile/);
  assert.throws(() => parseOptions(['--project', '']), /--project/);
  assert.throws(() => parseOptions(['--config', '']), /укажите путь/);
  assert.throws(() => parseOptions(['--page', 'home']), /требует --project/);
  assert.throws(() => parseOptions(['extra']), /Unexpected argument/);
  assert.equal(parseOptions(['--project', 'demo', '--device', 'mobile']).device, 'mobile');
});

test('output routes to a project, a standalone company or fallback; ambiguous IDs fail safely', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'portfolio-output-'));
  const content = join(temporary, 'companies');
  const fallback = join(temporary, 'screenshots');
  const project = join(content, 'company', 'projects', 'website');
  const standalone = join(content, 'hospital');
  try {
    await mkdir(project, { recursive: true });
    await writeFile(join(project, 'website.md'), '---\n---');
    await writeFile(join(content, 'company', 'index.md'), '---\n---');
    await mkdir(standalone);
    await writeFile(join(standalone, 'index.mdx'), '---\n---');
    const destinations = await resolveOutputDirectories(['website', 'hospital', 'company', 'unknown'], content, fallback);
    assert.deepEqual(destinations.get('website'), { directory: project, inContent: true });
    assert.deepEqual(destinations.get('hospital'), { directory: standalone, inContent: true });
    assert.deepEqual(destinations.get('company'), { directory: join(fallback, 'company'), inContent: false });
    assert.deepEqual(destinations.get('unknown'), { directory: join(fallback, 'unknown'), inContent: false });
    assert.equal(screenshotTarget(destinations.get('website'), 'homepage', 'desktop', false), join(project, 'homepage-desktop.png'));
    assert.equal(screenshotTarget(destinations.get('hospital'), 'features', 'mobile', true), join(standalone, 'features-mobile-full.png'));
    assert.equal(screenshotTarget(destinations.get('unknown'), 'homepage', 'desktop', true), join(fallback, 'unknown', 'homepage', 'desktop-full.png'));
    const duplicate = join(content, 'other', 'projects', 'website');
    await mkdir(duplicate, { recursive: true });
    await writeFile(join(duplicate, 'website.md'), '---\n---');
    await assert.rejects(resolveOutputDirectories(['website'], content, fallback), /найден в нескольких папках/);
    const missing = await resolveOutputDirectories(['unknown'], join(temporary, 'missing'), fallback);
    assert.equal(missing.get('unknown').inContent, false);
  } finally {
    assert(resolve(temporary).startsWith(resolve(tmpdir())));
    await rm(temporary, { recursive: true, force: true });
  }
});

test('Chromium captures both devices, lazy content, cookies; HTTP failures preserve files and continue', { timeout: 90000 }, async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'portfolio-screenshots-'));
  const id = `test-${randomUUID()}`;
  const output = join(root, 'screenshots', id);
  const observations = [];
  const server = createServer((request, response) => {
    if (request.url.startsWith('/observe?')) {
      observations.push(new URL(request.url, 'http://localhost').searchParams);
      response.writeHead(204).end();
    } else if (request.url === '/missing') {
      response.writeHead(503).end('Unavailable');
    } else {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body{margin:0;background:white}#banner{position:fixed;inset:0;background:blue;z-index:2}
        #spacer{height:1800px}#lazy{height:200px;background:white}</style>
        <button id="banner" onclick="this.remove()">Reject cookies</button><div id="spacer">Fixture</div><div id="lazy"></div>
        <script>
        const mobile = navigator.userAgent.includes('Mobile') && navigator.maxTouchPoints > 0;
        const observer = new IntersectionObserver(entries => {
          if(entries.some(entry => entry.isIntersecting)) {
            document.querySelector('#lazy').style.background = 'rgb(255,0,0)';
            fetch('/observe?mobile=' + mobile + '&width=' + innerWidth + '&cookie=' + !document.querySelector('#banner'));
            observer.disconnect();
          }
        });
        observer.observe(document.querySelector('#lazy'));
        </script>`);
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const configPath = join(temporary, 'config.json');
  const capture = args => run(process.execPath, [join(root, 'scripts/screenshots.mjs'), '--config', configPath, ...args], { cwd: root, timeout: 60000 });
  try {
    await writeFile(configPath, JSON.stringify({ projects: [{ id, cookieAction: { selector: '#banner' }, urls: [{ name: 'home', url }] }] }));
    const result = await capture([]);
    assert.match(result.stdout, /успешно 4, неудачно 0/);
    for (const [device, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      const viewport = await sharp(join(output, 'home', `${device}.png`)).metadata();
      assert.equal(viewport.width, width);
      assert.equal(viewport.height, height);
      const fullPath = join(output, 'home', `${device}-full.png`);
      const full = await sharp(fullPath).metadata();
      assert.equal(full.width, width);
      assert.equal(full.height, 2000);
      const pixel = await sharp(fullPath).extract({ left: 10, top: 1900, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
      assert.deepEqual([...pixel], [255, 0, 0], 'Lazy content was revealed before capture');
    }
    assert(observations.some(value => value.get('mobile') === 'true' && value.get('width') === '390' && value.get('cookie') === 'true'));
    assert(observations.some(value => value.get('mobile') === 'false' && value.get('width') === '1440'));
    // A successful repeat replaces files on Windows, too.
    const repeated = await capture(['--project', id, '--page', 'home', '--device', 'desktop']);
    assert.match(repeated.stdout, /успешно 2, неудачно 0/);
    const before = await readFile(join(output, 'home', 'desktop.png'));
    await writeFile(configPath, JSON.stringify({ projects: [{ id, urls: [
      { name: 'home', url: `${url}/missing` }, { name: 'next', url, cookieAction: { selector: '#banner' } },
    ] }] }));
    await assert.rejects(capture(['--device', 'desktop']), error => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /HTTP 503/);
      assert.match(error.stdout, /успешно 2, неудачно 2/);
      return true;
    });
    assert.deepEqual(await readFile(join(output, 'home', 'desktop.png')), before);
    assert((await readFile(join(output, 'next', 'desktop.png'))).length > 0);
    await assert.rejects(capture(['--project', 'unknown']), /Не найден проект/);
    await assert.rejects(capture(['--project', id, '--page', 'unknown']), /Не найдена страница/);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    // Both paths are generated for this test; never touch user screenshot folders.
    assert.equal(resolve(output), resolve(root, 'screenshots', id));
    assert(id.startsWith('test-'));
    await rm(output, { recursive: true, force: true });
    assert(resolve(temporary).startsWith(resolve(tmpdir())));
    await rm(temporary, { recursive: true, force: true });
  }
});
