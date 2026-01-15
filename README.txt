# Copilot – cvičební příručka (statický web)

## Lokální spuštění
Kvůli načítání `chapters.json` spusť lokální server (ne file://):

python3 -m http.server 8000

Otevři: http://localhost:8000/

## GitHub Pages
Nahraj soubory do repozitáře a v Settings → Pages nastav:
- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

Hotovo.

## Úprava obsahu
Obsah kapitol je v `chapters.json` jako HTML v poli `chapters[].html`.
