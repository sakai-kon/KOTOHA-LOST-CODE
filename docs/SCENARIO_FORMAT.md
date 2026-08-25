# Scenario format

Each scenario is JSON with a `commands` array.

Example character command:

```json
{
  "type": "character",
  "id": "kotoha",
  "src": "assets/characters/kotoha/normal.webp",
  "position": "center"
}
```

Example background:

```json
{
  "type": "background",
  "src": "assets/backgrounds/school.webp"
}
```

The engine is intentionally data-driven so new story scenes and assets can be added without editing the HTML structure.
