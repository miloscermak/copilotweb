# Copilot – Cvičební příručka (C&W)

Statický web s cvičební příručkou pro workshop Microsoft Copilot pro Cushman & Wakefield ČR.

## Stack
- Čisté HTML + CSS + vanilla JavaScript (žádné frameworky, žádný build)
- Obsah kapitol jako HTML v `chapters.json` (pole `chapters[]` s poli `slug`, `title`, `section`, `html`)
- Hostováno jako statika (GitHub Pages nebo lokálně přes `serve.sh` / `python3 -m http.server`)

## Struktura souborů
- `index.html` – kostra appky (sidebar s navigací + main s článkem)
- `styles.css` – veškerý styling
- `app.js` – načítání `chapters.json`, routing přes hash (`#/slug`), render navigace, vyhledávání, sanitizace HTML
- `chapters.json` – obsah všech kapitol (jediný zdroj pravdy pro obsah)
- `serve.sh` – spuštění lokálního serveru
- `README.txt` – instrukce pro nasazení

## Práce s obsahem
- Obsah kapitol se edituje **výhradně v `chapters.json`** v poli `html` (řetězec s HTML).
- Pozor na escapování v JSON: nové řádky jako `\n`, uvozovky jako `\"`. Viz commit `14a8ed8`.
- Při přidávání kapitoly přidat objekt do `chapters[]` – `slug` musí být unikátní (používá se v URL hashi).

## Konvence
- Kód musí zůstat vanilla – žádné npm balíčky, žádný bundler.
- HTML vkládané z `chapters.json` jde přes `sanitizeHtml()` v `app.js` – neobcházet.
- Změny obsahu kapitol commitnout zvlášť od změn kódu/stylů.

## Spuštění lokálně
```
./serve.sh
# nebo
python3 -m http.server 8000
```
Pak otevřít http://localhost:8000/
