import { readFile, readdir, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { chromium, devices } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = join(root, 'screenshots');
const companiesRoot = join(root, 'src', 'content', 'companies');
const defaults = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const help = `Съёмка сайтов: npm run screenshots -- [параметры]
  --project ID       Один проект
  --page NAME        Одна страница (требует --project)
  --device TYPE      desktop или mobile; по умолчанию оба
  --config PATH      Другой JSON-файл (относительно текущей папки)
  --help             Эта справка`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function object(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}: ожидается объект.`);
  for (const key of Object.keys(value)) assert(keys.includes(key), `${label}: неизвестное поле "${key}".`);
}

function slug(value, label) {
  assert(typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    && value.length <= 80 && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(value),
  `${label}: используйте до 80 строчных латинских букв, цифр и дефисов; системные имена Windows запрещены.`);
}

function cookieAction(value, label) {
  if (value === undefined || value === null) return;
  object(value, ['selector'], label);
  assert(typeof value.selector === 'string' && value.selector.trim(), `${label}.selector: нужен непустой Playwright selector.`);
}

export function validateConfig(config) {
  object(config, ['projects', 'viewports'], 'Конфигурация');
  if (config.viewports !== undefined) {
    object(config.viewports, ['desktop', 'mobile'], 'viewports');
    for (const [device, viewport] of Object.entries(config.viewports)) {
      object(viewport, ['width', 'height'], `viewports.${device}`);
      for (const dimension of ['width', 'height']) assert(Number.isInteger(viewport[dimension])
        && viewport[dimension] > 0 && viewport[dimension] <= 10000,
      `viewports.${device}.${dimension}: ожидается целое число от 1 до 10000.`);
    }
  }
  assert(Array.isArray(config.projects) && config.projects.length, 'projects: нужен непустой массив проектов.');
  const ids = new Set();
  for (const [index, project] of config.projects.entries()) {
    const label = `projects[${index}]`;
    object(project, ['id', 'urls', 'cookieAction'], label);
    slug(project.id, `${label}.id`);
    assert(!ids.has(project.id), `Повторяющийся id проекта: ${project.id}.`);
    ids.add(project.id);
    cookieAction(project.cookieAction, `${label}.cookieAction`);
    assert(Array.isArray(project.urls) && project.urls.length, `${label}.urls: нужен непустой массив страниц.`);
    const names = new Set();
    for (const [pageIndex, page] of project.urls.entries()) {
      const pageLabel = `${label}.urls[${pageIndex}]`;
      object(page, ['name', 'url', 'cookieAction'], pageLabel);
      slug(page.name, `${pageLabel}.name`);
      assert(!names.has(page.name), `Повторяющееся имя страницы: ${project.id}/${page.name}.`);
      names.add(page.name);
      let url;
      try { url = new URL(page.url); } catch { throw new Error(`${pageLabel}.url: некорректный URL.`); }
      assert(typeof page.url === 'string' && ['http:', 'https:'].includes(url.protocol)
        && !url.username && !url.password, `${pageLabel}.url: нужен HTTP(S) URL без логина и пароля.`);
      cookieAction(page.cookieAction, `${pageLabel}.cookieAction`);
    }
  }
  return config;
}

export function parseOptions(args) {
  const { values } = parseArgs({ args, allowPositionals: false, strict: true, options: {
    project: { type: 'string' }, page: { type: 'string' }, device: { type: 'string' },
    config: { type: 'string' }, help: { type: 'boolean' },
  } });
  for (const key of ['project', 'page']) {
    if (values[key] !== undefined) slug(values[key], `--${key}`);
  }
  if (values.config !== undefined) assert(values.config.trim(), '--config: укажите путь к JSON-файлу.');
  assert(!values.page || values.project, '--page требует --project.');
  assert(values.device === undefined || ['desktop', 'mobile'].includes(values.device), '--device: допустимы desktop и mobile.');
  return values;
}

export async function resolveOutputDirectories(ids, contentRoot = companiesRoot, fallbackRoot = outputRoot) {
  const matches = new Map(ids.map(id => [id, []]));
  let companies;
  try { companies = await readdir(contentRoot, { withFileTypes: true }); }
  catch (error) { if (error.code !== 'ENOENT') throw error; companies = []; }
  const hasMarkdown = (files, name) => files.some(file => file.isFile() && [name + '.md', name + '.mdx'].includes(file.name));
  for (const company of companies.filter(entry => entry.isDirectory())) {
    const directory = join(contentRoot, company.name);
    const files = await readdir(directory, { withFileTypes: true });
    let hasProjects = false;
    if (files.some(file => file.name === 'projects' && file.isDirectory())) {
      for (const project of await readdir(join(directory, 'projects'), { withFileTypes: true })) {
        if (!project.isDirectory()) continue;
        const projectDirectory = join(directory, 'projects', project.name);
        if (!hasMarkdown(await readdir(projectDirectory, { withFileTypes: true }), project.name)) continue;
        hasProjects = true;
        matches.get(project.name)?.push(projectDirectory);
      }
    }
    if (!hasProjects && hasMarkdown(files, 'index')) matches.get(company.name)?.push(directory);
  }
  return new Map(ids.map(id => {
    slug(id, 'id');
    const candidates = matches.get(id);
    assert(candidates.length <= 1, `ID "${id}" найден в нескольких папках. Используйте уникальные ID проектов:\n${candidates.join('\n')}`);
    return [id, { directory: candidates[0] ?? join(fallbackRoot, id), inContent: candidates.length === 1 }];
  }));
}

export function screenshotTarget(destination, page, device, fullPage) {
  const filename = `${device}${fullPage ? '-full' : ''}.png`;
  return destination.inContent
    ? join(destination.directory, `${page}-${filename}`)
    : join(destination.directory, page, filename);
}

async function settle(page, warn) {
  try {
    await page.waitForFunction(() => [...document.images].every(image => image.complete), null, { timeout: 8000 });
  } catch (error) {
    if (error.name !== 'TimeoutError') throw error;
    warn('Часть изображений не завершила загрузку за 8 секунд.');
  }
  const broken = await page.evaluate(() => [...document.images].filter(image => image.complete && image.currentSrc && !image.naturalWidth).length);
  if (broken) warn(`Не загрузилось изображений: ${broken}.`);
  try {
    await page.waitForFunction(() => !document.fonts || document.fonts.status === 'loaded', null, { timeout: 5000 });
  } catch (error) {
    if (error.name !== 'TimeoutError') throw error;
    warn('Шрифты не завершили загрузку за 5 секунд.');
  }
}

async function prepare(page, url, action, warn) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  assert(response && response.ok(), `HTTP ${response?.status() ?? 'нет ответа'}: ${url}`);
  // Live analytics and long polling must not hold the run indefinitely.
  try { await page.waitForLoadState('load', { timeout: 10000 }); }
  catch (error) {
    if (error.name !== 'TimeoutError') throw error;
    warn('Событие load не наступило за 10 секунд; продолжаем после DOMContentLoaded.');
  }
  if (action) {
    try { await page.locator(action.selector).click({ timeout: 5000 }); }
    catch (error) { throw new Error(`Не удалось выполнить cookieAction (${action.selector}): ${error.message}`); }
  }
  // Step through the page to trigger native lazy images and IntersectionObserver.
  const started = Date.now();
  let bottomPasses = 0;
  let reachedBottom = false;
  for (let step = 0; step < 100 && Date.now() - started < 30000; step++) {
    const atBottom = await page.evaluate(() => {
      window.scrollBy({ top: Math.max(200, window.innerHeight * 0.75), behavior: 'instant' });
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    });
    await page.waitForTimeout(300);
    bottomPasses = atBottom ? bottomPasses + 1 : 0;
    if (bottomPasses >= 3) { reachedBottom = true; break; }
  }
  if (!reachedBottom) warn('Достигнут лимит прокрутки (30 секунд / 100 шагов); часть lazy-контента может отсутствовать.');
  await settle(page, warn);
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await page.waitForTimeout(500);
  await settle(page, warn);
}

async function saveScreenshot(page, target, fullPage) {
  // Capture to memory first, then replace via a sibling file. A failed capture or
  // write never truncates a previous PNG; rename also works on Windows.
  const buffer = await page.screenshot({ type: 'png', fullPage, animations: 'disabled', timeout: 30000 });
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, buffer, { flag: 'wx' });
    await rename(temporary, target);
  } finally { await rm(temporary, { force: true }); }
}

export async function main(args = process.argv.slice(2)) {
  const options = parseOptions(args);
  if (options.help) { console.log(help); return; }
  const configPath = options.config ? resolve(options.config) : join(root, 'scripts', 'screenshots.config.json');
  let config;
  try { config = validateConfig(JSON.parse(await readFile(configPath, 'utf8'))); }
  catch (error) { throw new Error(`Ошибка конфигурации ${configPath}: ${error.message}`); }
  const projects = config.projects.filter(project => !options.project || project.id === options.project);
  assert(projects.length, `Не найден проект: ${options.project}.`);
  if (options.page) assert(projects[0].urls.some(page => page.name === options.page), `Не найдена страница ${options.project}/${options.page}.`);
  const selectedDevices = options.device ? [options.device] : ['desktop', 'mobile'];
  const destinations = await resolveOutputDirectories(projects.map(project => project.id));
  const outputDirectories = [...destinations.values()].map(destination => destination.directory);
  let success = 0;
  let failed = 0;
  const failures = [];
  console.log(`Конфигурация: ${configPath}\nПапки результатов:\n${outputDirectories.join('\n')}`);
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch (error) { throw new Error(`Не удалось запустить Chromium. Выполните: npx playwright install chromium\n${error.message}`); }
  try {
    for (const project of projects) {
      for (const entry of project.urls.filter(page => !options.page || page.name === options.page)) {
        for (const device of selectedDevices) {
          const label = `${project.id}/${entry.name} [${device}] ${entry.url}`;
          console.log(`\nОбработка: ${label}`);
          let context;
          let remaining = 2;
          try {
            context = await browser.newContext({
              ...(device === 'mobile' ? devices['Pixel 5'] : {}),
              viewport: config.viewports?.[device] ?? defaults[device],
              screen: config.viewports?.[device] ?? defaults[device],
              deviceScaleFactor: 1, isMobile: device === 'mobile', hasTouch: device === 'mobile',
              reducedMotion: 'reduce',
            });
            const page = await context.newPage();
            page.setDefaultTimeout(10000);
            const action = entry.cookieAction === undefined ? project.cookieAction : entry.cookieAction;
            await prepare(page, entry.url, action, message => console.warn(`  Предупреждение: ${message}`));
            for (const fullPage of [false, true]) {
              const target = screenshotTarget(destinations.get(project.id), entry.name, device, fullPage);
              try {
                await saveScreenshot(page, target, fullPage);
                success++;
                console.log(`  Создан: ${target}`);
              } catch (error) {
                failed++;
                failures.push(`${label} → ${target}: ${error.message}`);
                console.error(`  Ошибка снимка: ${error.message}`);
              }
              remaining--;
            }
          } catch (error) {
            failed += remaining;
            failures.push(`${label}: ${error.message}`);
            console.error(`  Ошибка: ${error.message}`);
          } finally {
            if (context) await context.close().catch(error => console.warn(`  Не удалось закрыть контекст: ${error.message}`));
          }
        }
      }
    }
  } finally {
    await browser.close();
    console.log(`\nИтого операций (PNG): успешно ${success}, неудачно ${failed}.\nПапки результатов:\n${outputDirectories.join('\n')}`);
    if (failures.length) console.error(`\nНе удалось обработать:\n${failures.map(message => `- ${message}`).join('\n')}`);
  }
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(`Ошибка: ${error.message}`); process.exitCode = 1; });
}
