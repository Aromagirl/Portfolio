# Natalia Isakova — Portfolio

Сайт-портфолио на Astro, Markdown/MDX и Tailwind CSS.

- Сайт: https://aromagirl.github.io/Portfolio/
- Основная рабочая ветка: `dev`.
- Главная и About: `src/content/pages/`.
- Тексты и изображения проектов: `src/content/companies/`.

## Локальный запуск

Используется Node.js 24, как в GitHub Actions.

```sh
npm install
npm run dev
```

Откройте адрес из терминала, обычно http://localhost:4321/Portfolio/.

- `npm run build` — сборка в `dist/`.
- `npm run preview` — просмотр готовой сборки.
- `npm run screenshots` — ручная съёмка сайтов в PNG; конфигурация и команды в [scripts/README.md](scripts/README.md).

После небольших изменений текста или CSS полная сборка обычно не нужна. Проверяйте сборку после изменения маршрутов, структуры контента или компонентов.

## Где редактировать контент

| Страница | Файл | Адрес без префикса /Portfolio |
| --- | --- | --- |
| Главная | `src/content/pages/home.mdx` | `/` |
| About me | `src/content/pages/about-me.mdx` | `/about/` |
| FraudScore | `src/content/companies/fraudscore/index.md` | `/fraudscore/` |
| Mafia Game | `src/content/companies/mafia-bot-mini-app/index.md` | `/work/mafia-bot-mini-app/` |
| Tickeron | `src/content/companies/tickeron/index.md` | `/work/tickeron/` |
| MyHospital | `src/content/companies/myhospital/index.md` | `/work/myhospital/` |
| KidswearCycle | `src/content/companies/kidswearcycle/index.md` | `/work/kidswearcycle/` |
| I-Jet Media | `src/content/companies/ijet-media/index.md` | `/work/ijet-media/` |

Главная содержит собственные карточки SafeClick Website и FraudScore Website. Они редактируются в `home.mdx` независимо от каталога Work. Если у карточки с классом `home-project-cover` нет изображения, сайт сохраняет пустую область обложки.

В файлах проектов используется обычный Markdown с метаданными в начале. HTML, JSX и импорты для оформления кейсов не нужны. Главная и About остаются в MDX.

### Шаблоны кейсов

Общий компонент: `src/components/theme/CompanyOverview.astro`.

- Вверху отображаются название, логотип при наличии и краткое описание.
- Блок About … & my role содержит описание слева и роль справа.
- Колонка роли начинается с заголовка `## My role …`.
- На узких экранах колонки располагаются друг под другом.

Tickeron, FraudScore и I-Jet Media имеют блок Explore the work со ссылками на отдельные направления.

MyHospital и KidswearCycle — цельные кейсы: описание и роль находятся сверху, остальные разделы идут ниже на той же странице. Весь текст хранится в одном `index.md`.

Mafia Game использует такой же верх страницы, без дополнительных разделов. Текущий текст и обязанности — черновая «рыба», их нужно заменить фактическим описанием проекта.

### Файлы направлений

Все пути ниже указаны относительно `src/content/companies/`.

| Проект | Файлы направлений |
| --- | --- |
| Tickeron | `tickeron/projects/website-ui/website-ui.md`, `tickeron/projects/landing-pages/landing-pages.md`, `tickeron/projects/icons-banners/icons-banners.md` |
| FraudScore | `fraudscore/projects/safeclick-website/safeclick-website.md`, `fraudscore/projects/fraudscore-website/fraudscore-website.md`, `fraudscore/projects/ux-ui-design/ux-ui-design.md`, `fraudscore/projects/social-media-blog/social-media-blog.md`, `fraudscore/projects/expo-design/expo-design.md`, `fraudscore/projects/presentations/presentations.md` |
| I-Jet Media | `ijet-media/projects/game-interfaces/game-interfaces.md`, `ijet-media/projects/mobile-versions/mobile-versions.md`, `ijet-media/projects/technical-specifications/technical-specifications.md` |

Файлы направлений автоматически появляются на обзорной странице родительского проекта. Их адрес: `/work/<project-slug>/<section-slug>/`.

Пример метаданных нового направления:

```yaml
---
project: tickeron
slug: new-section
title: "Section title"
summary: ""
cover: null
order: 100
---
```

`project` — ID родительского проекта, соответствующий его `slug`. `order` задаёт порядок карточек. `fillCover: true` заполняет обложкой всю область карточки.

Коллекция `workSections` загружает файлы `companies/<company>/projects/<project>/<project>.md`. Внутренние имена коллекций `projects` и `workSections` сохранены для совместимости компонентов.

## Изображения и документы

Текст и изображения хранятся рядом. Общий файл компании — `index.md`, каждый отдельный проект — папка в `projects/`:

```text
src/content/companies/
  fraudscore/
    index.md
    cover.png
    01.webp
    projects/
      safeclick-website/
        safeclick-website.md
        cover.png
      ux-ui-design/
        ux-ui-design.md
        cover.png
```

- Для замены изображения сохраните его имя и расширение.
- Для изображения отдельного проекта используйте ссылку `/images/projects/<company>/<project>/<filename>`.
- Например: `![Описание](/images/projects/fraudscore/ux-ui-design/cover.png)`.
- Общие обложки и логотипы компании лежат рядом с её `index.md`; компании без отдельных проектов хранят там все изображения.
- Обложки и логотипы задаются в метаданных `cover` и `logo`.
- `cover: null` оставляет карточку каталога без изображения.
- Изображения SafeClick: `fraudscore/projects/safeclick-website/`.
- Изображения Mafia Game: `mafia-bot-mini-app/`, рядом с `index.md`.
- Обложки Tickeron, MyHospital и KidswearCycle: `cover.webp` в папке каждой компании.
- Обложка FraudScore в каталоге: `fraudscore/cover.png`; UX/UI Design: `fraudscore/projects/ux-ui-design/cover.png`.
- Компании без отдельных проектов не требуют пустой папки `projects/`.

Интеграция `src/integrations/project-images.mjs` отдаёт изображения из новой структуры в режиме разработки и копирует их в сборку по прежним публичным URL. Markdown не публикуется как медиа. Дублировать изображения в `public` не нужно.

Изображения главной и About, которые не относятся к кейсам, остаются в `public/images/projects/home/` и `public/images/projects/about-me/`. Фирменные логотипы сайта — в `public/images/brand/`.

PDF FraudScore хранится в `public/documents/marketing-design/fraudscore.pdf`. Обычная Markdown-ссылка на PDF автоматически создаёт встроенный просмотр. Несколько изображений подряд без пустых строк формируют галерею.

## Каталог Work

Каталог `src/pages/work/index.astro` показывает отдельные проекты из `companies/<company>/projects/`. Если у компании нет отдельных проектов (например, MyHospital), показывается карточка самой компании. Родительская карточка не дублирует её проекты; название компании подписано над названием каждого проекта.

- `title`, `summary`, `cover`, `fillCover` берутся из метаданных отображаемого проекта. Сначала карточки упорядочены по `order` компании, затем по `order` её проектов.
- `expertise` и `industries` проекта наследуются от компании, если не указаны в его Markdown. Укажите собственный массив для переопределения или `[]`, чтобы убрать теги этой группы.
- Допустимые теги `expertise` и `industries` заданы в `src/data/work-tags.ts`; пустые массивы разрешены.
- Внутри группы фильтры работают по OR, между Expertise и Industries — по AND.
- Фильтры сохраняются в URL, поддерживаются перезагрузка и Back/Forward.
- Числа возле тегов считают отображаемые карточки проектов независимо от выбранных фильтров.
- `visibility: hidden` у компании исключает её и её проекты из каталога; у отдельного проекта — только его карточку. Страницы и sitemap сохраняются. Если все проекты компании скрыты, её карточка не появляется вместо них.
- `status` проекта допускает `placeholder`, `in-progress` и `published`; страница создаётся для каждого статуса.

Пример: `/Portfolio/work/?expertise=ui-design&industries=healthcare`.

### Новый проект

1. Создайте `src/content/companies/<project>/index.md`. Начальные поля можно взять из `templates/project.template.md`.
2. Заполните `title`, уникальный `slug`, `summary`, `cover`, теги и `order`.
3. Поместите общие изображения рядом с `index.md`.
4. Для общего шаблона добавьте описание и заголовок `## My role …` со списком обязанностей. Название проекта уже выводит шаблон, дублировать его в тексте не нужно.
5. Для отдельного проекта создайте `projects/<project>/<project>.md` с полем `project`, указывающим ID компании. Поместите его изображения в ту же папку.

Обычный адрес проекта — `/work/<slug>/`. FraudScore использует `casePage: fraudscore`, чтобы сохранить адрес `/fraudscore/`.

## Старые ссылки и sitemap

| Старый адрес | Куда ведёт |
| --- | --- |
| `/user-research/` | `/work/?expertise=ux-research` |
| `/uxui-design/` | `/work/?expertise=ui-design` |
| `/marketing-design/` | `/fraudscore/` |
| `/work/safeclick/` | `/work/fraudscore/safeclick-website/` |
| `/work/fraudscore/safeclick/` | `/work/fraudscore/safeclick-website/` |
| `/work/fraudscore/website/` | `/work/fraudscore/fraudscore-website/` |

Старые MDX-подборки User research и UX/UI design удалены. Ссылки в футере ведут прямо в каталог с фильтрами.

Совместимость старых якорей хранится в `src/config/content-anchors.ts`. При изменении заголовков проверяйте связанные якоря.

Sitemap: `/Portfolio/sitemap.xml`. В него входят главная, опубликованные страницы, проекты и направления; страницы перенаправлений не включаются.

## Настройки и оформление

- Контакты и навигация: `src/config/site.ts`.
- Общий макет: `src/layouts/BaseLayout.astro`.
- Компоненты оформления: `src/components/theme/`.
- Основные стили: `src/styles/global.css`.
- Цветовая библиотека: `src/styles/colors.css`.

| Цвет | HEX | Токен |
| --- | --- | --- |
| Charcoal | #151817 | `--palette-charcoal` |
| Ivory | #F3F1E9 | `--palette-ivory` |
| Forest | #245443 | `--palette-forest` |
| Sage | #B8C9A8 | `--palette-sage` |
| Lime | #D6FF43 | `--palette-lime` |

Компоненты используют семантические токены `--canvas`, `--ink`, `--body` и другие для светлой и тёмной темы. Кнопки и CTA используют Charcoal из палитры.

Логотипы светлой и тёмной темы подключены через `Logomark.astro`. Фавикон `public/favicon.svg` выбирает вариант по теме браузера/системы, независимо от переключателя темы сайта.

Исходные графические референсы находятся в `docs/`. Оформление основано на теме [Maria от Andrei Alba](https://github.com/xocothemes/maria). Локальные шрифты — в `public/fonts/`, лицензия темы — `public/licenses/maria-theme.txt`.

## Миграционные материалы

`migration/` хранит материалы исходного переноса с Google Sites. `manifest.json` содержит исходные блоки текста, ссылки и сведения об изображениях; компоненты используют его для размеров изображений и постеров анимаций.

`migration/raw/` и `migration/assets-original/` — локальные резервные копии, исключённые из Git.

`npm run migrate` — исторический импорт из сохранённого HTML. Он может перезаписать контент и восстановить устаревшую структуру: не используйте его для обычного редактирования сайта.

`migration/scripts/validate.mjs` сравнивает сайт с первоначальным переносом. После изменения текстов и структуры кейсов его результат не является проверкой текущей версии сайта. Для структурных изменений используйте `npm run build` и проверку затронутых страниц.

## Публикация

Адрес и префикс `/Portfolio` заданы в `astro.config.mjs`. В компонентах используйте `withBase()` из `src/utils/paths.ts`; обычные Markdown-ссылки обрабатываются компонентами сайта.

В GitHub Settings → Pages → Source должен быть выбран GitHub Actions. Workflow `.github/workflows/deploy.yml` использует Node.js 24 и публикует сайт из `main`. Push в `dev` публикацию не запускает. Ручной запуск workflow также публикует только ветку `main`.

Публикация выполняется после отдельного разрешения; локальная сборка сайт не публикует.
