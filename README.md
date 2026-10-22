# Natalia Isakova — Portfolio

Сайт-портфолио на Astro, Markdown/MDX и Tailwind CSS.

- Сайт: https://aromagirl.github.io/Portfolio/
- Основная рабочая ветка: `dev`.
- Главная и About: `src/content/pages/`.
- Тексты и изображения проектов: `src/content/projects/`.

## Локальный запуск

Используется Node.js 24, как в GitHub Actions.

```sh
npm install
npm run dev
```

Откройте адрес из терминала, обычно http://localhost:4321/Portfolio/.

- `npm run build` — сборка в `dist/`.
- `npm run preview` — просмотр готовой сборки.

После небольших изменений текста или CSS полная сборка обычно не нужна. Проверяйте сборку после изменения маршрутов, структуры контента или компонентов.

## Где редактировать контент

| Страница | Файл | Адрес без префикса /Portfolio |
| --- | --- | --- |
| Главная | `src/content/pages/home.mdx` | `/` |
| About me | `src/content/pages/about-me.mdx` | `/about/` |
| FraudScore | `src/content/projects/fraudscore/index.md` | `/fraudscore/` |
| Mafia Game | `src/content/projects/mafia-bot-mini-app/index.md` | `/work/mafia-bot-mini-app/` |
| Tickeron | `src/content/projects/tickeron/index.md` | `/work/tickeron/` |
| MyHospital | `src/content/projects/myhospital/index.md` | `/work/myhospital/` |
| KidswearCycle | `src/content/projects/kidswearcycle/index.md` | `/work/kidswearcycle/` |
| I-Jet Media | `src/content/projects/ijet-media/index.md` | `/work/ijet-media/` |

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

Все пути ниже указаны относительно `src/content/projects/`.

| Проект | Файлы направлений |
| --- | --- |
| Tickeron | `tickeron/website-ui.md`, `tickeron/landing-pages.md`, `tickeron/icons-banners.md` |
| FraudScore | `fraudscore/safeclick-website.md`, `fraudscore/fraudscore-website.md`, `fraudscore/ux-ui-design.md`, `fraudscore/social-media-blog.md`, `fraudscore/expo-design.md`, `fraudscore/presentations.md` |
| I-Jet Media | `ijet-media/game-interfaces.md`, `ijet-media/mobile-versions.md`, `ijet-media/technical-specifications.md` |

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

Отдельная папка `work-sections` больше не используется. Коллекция `workSections` в конфигурации остаётся: она загружает соседние с `index.md` файлы направлений.

## Изображения и документы

Изображения лежат рядом с Markdown каждого проекта:

```text
src/content/projects/
  fraudscore/
    index.md
    fraudscore-website.md
    images/
      cover.png
      cover-ux-ui.png
      safeclick/
        cover.png
```

- Для замены изображения сохраните его имя и расширение.
- Для нового файла используйте ссылку `/images/projects/<project>/<filename>`.
- Например: `![Описание](/images/projects/fraudscore/cover-ux-ui.png)`.
- Обложки и логотипы задаются в метаданных `cover` и `logo`.
- `cover: null` оставляет карточку каталога без изображения.
- Изображения SafeClick: `fraudscore/images/safeclick/`.
- Изображения Mafia Game: `mafia-bot-mini-app/images/`.
- Обложки Tickeron, MyHospital и KidswearCycle: `images/cover.webp` в папке каждого проекта.
- Обложка FraudScore в каталоге: `fraudscore/images/cover.png`; UX/UI Design: `fraudscore/images/cover-ux-ui.png`.

Интеграция `src/integrations/project-images.mjs` отдаёт изображения в режиме разработки и копирует их в сборку. Дублировать их в `public` не нужно.

Изображения главной и About, которые не относятся к кейсам, остаются в `public/images/projects/home/` и `public/images/projects/about-me/`. Фирменные логотипы сайта — в `public/images/brand/`.

PDF FraudScore хранится в `public/documents/marketing-design/fraudscore.pdf`. Обычная Markdown-ссылка на PDF автоматически создаёт встроенный просмотр. Несколько изображений подряд без пустых строк формируют галерею.

## Каталог Work

Каталог `src/pages/work/index.astro` показывает одну карточку на родительский проект. SafeClick Website входит во FraudScore и не имеет отдельной карточки каталога.

- `title`, `summary`, `cover`, `order` берутся из метаданных проекта.
- Допустимые теги `expertise` и `industries` заданы в `src/data/work-tags.ts`; пустые массивы разрешены.
- Внутри группы фильтры работают по OR, между Expertise и Industries — по AND.
- Фильтры сохраняются в URL, поддерживаются перезагрузка и Back/Forward.
- Числа возле тегов показывают общее количество публичных проектов с этим тегом независимо от выбранных фильтров.
- `visibility: hidden` исключает проект только из каталога и его счётчиков; страница и sitemap сохраняются.
- `status` проекта допускает `placeholder`, `in-progress` и `published`; страница создаётся для каждого статуса.

Пример: `/Portfolio/work/?expertise=ui-design&industries=healthcare`.

### Новый проект

1. Создайте `src/content/projects/<project>/index.md`. Начальные поля можно взять из `templates/project.template.md`.
2. Заполните `title`, уникальный `slug`, `summary`, `cover`, теги и `order`.
3. Поместите изображения в соседнюю папку `images/`.
4. Для общего шаблона добавьте описание и заголовок `## My role …` со списком обязанностей. Название проекта уже выводит шаблон, дублировать его в тексте не нужно.
5. Если нужны отдельные направления, создайте соседние Markdown-файлы с полем `project`.

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
