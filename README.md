# Natalia Isakova — portfolio

Сайт на Astro + MDX. Автоматическая публикация пока не настроена.

## Запуск

```sh
npm install
npm run dev
```

Локальный адрес выводится в терминале. Сборка: `npm run build`; просмотр сборки: `npm run preview`.

## Оформление

Применена адаптация [Maria от Andrei Alba](https://github.com/xocothemes/maria) (страница Astro: `https://astro.build/themes/details/alba/`). Используются стили, шрифты и компоненты темы; исходные MDX и адреса кейсов сохранены. Для стилей добавлены Tailwind CSS и его Vite-плагин.

Контакты, навигация и оформление карточек: `src/config/site.ts`. Компоненты темы: `src/components/theme/`. Шрифты хранятся локально, лицензии — в `public/fonts/` и `public/licenses/maria-theme.txt`.

Локальная копия сайта до смены оформления: `migration/raw/before-alba-theme.zip` (исключена из Git). Демонстрационные кейсы, отзывы, метрики, резюме и cookie-баннер темы не добавлялись.

## Контент

- Главная: `src/content/home/home.mdx`.
- Кейсы: `src/content/projects/*.mdx`.
- Остальные страницы: `src/content/pages/*.mdx` (About, User research, UX/UI design, Marketing design).
- Общий макет: `src/layouts/BaseLayout.astro`; оформление: `src/styles/global.css`.
- `status: draft` или `archived` исключает кейс из генерации страниц. При скрытии кейса также обновите ссылку на него на главной.
- Новый кейс: создайте MDX по образцу существующего и добавьте ссылку на главной. Имя файла определяет `/work/<имя>/`.

## Миграция

`migration/manifest.json` содержит источники, порядок медиа, SHA-256, исходные текстовые блоки и соответствия URL. `migration/migration-report.md` — пропуски и проверки.

`migration/raw/` и `migration/assets-original/` хранят локальные резервные копии, исключённые из Git. Не удаляйте их до завершения проверки. WebP в `public/images/` — версии для сайта.

`npm run migrate` заново генерирует MDX из локальных HTML и скачивает изображения. **Не запускайте после ручной редактуры MDX** без сохранения изменений: импорт перезаписывает перенесённый контент. Google Sites может отдавать HTML с истёкшими ссылками изображений; потребуется заново скачать страницы с параметром обхода кэша.

Для импорта только выбранных страниц передайте их имена: `npm run migrate -- about-me user-research uxui-design ijet-media marketing-design`. Остальные MDX не перегенерируются; обновляются только ссылки на уже перенесённые страницы.

После сборки `node migration/scripts/validate.mjs` проверяет полноту текста, порядок изображений, документы, локальные ссылки и якоря. PDF-презентация хранится в `public/documents/marketing-design/`.

Перенесены все девять найденных страниц: главная, Tickeron, MyHospital, KidswearCycle, About me, User research, UX/UI design, i-Jet Media и Marketing design. Исходный язык и формулировки сохранены. Редактура и GitHub Pages — отдельные этапы.
