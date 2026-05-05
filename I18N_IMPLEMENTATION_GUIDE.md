# i18n Implementation Guide

## Current Status
✅ **Completed:**
- next-intl package installed
- Translation files created (en.json, de.json)
- LanguageSwitcher component created
- Sidebar fully translated
- Root layout wrapped with NextIntlClientProvider

⚠️ **Pending:**
- Main page content translation
- All other page components need to use translations

## How to Add Translations to a Component

### 1. Import useTranslations hook:
```typescript
import { useTranslations } from 'next-intl';
```

### 2. Use the hook in your component:
```typescript
function MyComponent() {
  const t = useTranslations('home'); // 'home' is the namespace from en.json/de.json
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

### 3. Example for Home Page (page.tsx):

**Before:**
```typescript
<h2 className="text-[52px]...">
  Analyze Your Conversation
</h2>
<p className="text-[#1F3A3460]...">
  Select a strategic campaign and upload your audio signal...
</p>
```

**After:**
```typescript
function HomeContent() {
  const t = useTranslations('home');
  
  return (
    // ...
    <h2 className="text-[52px]...">
      {t('title')}
    </h2>
    <p className="text-[#1F3A3460]...">
      {t('subtitle')}
    </p>
    // ...
  );
}
```

### 4. Example for InputSection Component:

```typescript
import { useTranslations } from 'next-intl';

export function InputSection({ onAnalysisComplete, onPartialResult }: Props) {
  const t = useTranslations('input');
  
  return (
    <div>
      <button>{t('uploadAudio')}</button>
      <input placeholder={t('transcriptPlaceholder')} />
      <button>{t('analyze')}</button>
    </div>
  );
}
```

## Files That Need Translation

### Priority 1 - Main User-Facing Pages:
1. **src/app/page.tsx** - Use `useTranslations('home')`
2. **src/components/InputSection.tsx** - Use `useTranslations('input')`
3. **src/components/ResultsPanel.tsx** - Use `useTranslations('results')`

### Priority 2 - Feature Pages:
4. **src/app/analytics/page.tsx** - Use `useTranslations('analytics')`
5. **src/app/red-flags/page.tsx** - Use `useTranslations('redFlags')`
6. **src/app/scripts/page.tsx** - Use `useTranslations('scripts')`
7. **src/app/campaigns/page.tsx** - Use `useTranslations('campaigns')`
8. **src/app/questionnaires/page.tsx** - Use `useTranslations('questionnaires')`

### Priority 3 - Common Components:
9. **src/components/Navbar.tsx** - Use `useTranslations('common')`

## Available Translation Namespaces

All translations are in `messages/en.json` and `messages/de.json`:

- `common` - Generic terms (save, cancel, delete, etc.)
- `nav` - Navigation/sidebar items
- `home` - Homepage content
- `analytics` - Call Analytics page
- `redFlags` - Red Flags page
- `scripts` - Scripts page
- `questionnaires` - Questionnaires page
- `campaigns` - Campaigns page
- `input` - Input section (upload/paste)
- `results` - Results panel

## Testing Translations

1. Start dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Click **DE** button in sidebar (bottom left)
4. Page reloads with German translations
5. Click **EN** to switch back

## Adding New Translations

1. Add to `messages/en.json`:
```json
{
  "mySection": {
    "newKey": "English text"
  }
}
```

2. Add to `messages/de.json`:
```json
{
  "mySection": {
    "newKey": "Deutscher Text"
  }
}
```

3. Use in component:
```typescript
const t = useTranslations('mySection');
<div>{t('newKey')}</div>
```

## Quick Implementation Example

Here's a complete example for the home page:

```typescript
// src/app/page.tsx
import { useTranslations } from 'next-intl';

function HomeContent() {
  const t = useTranslations('home');
  
  return (
    <div>
      {pipelineState === "input" && (
        <>
          <div className="flex flex-col gap-4 text-center items-center">
            <span className="px-3 py-1 bg-[#1F3A3410]...">
              {t('signalIngestion')}
            </span>
            <h2 className="text-[52px]...">
              {t('title')}
            </h2>
            <p className="text-[#1F3A3460]...">
              {t('subtitle')}
            </p>
          </div>
          <InputSection ... />
        </>
      )}
      
      {pipelineState === "processing" && (
        <div>
          <h3>{t('aiAnalysis')}</h3>
          <p>{t('syncMessage')}</p>
        </div>
      )}
      
      {pipelineState === "results" && (
        <button onClick={resetPipeline}>
          {t('resetFramework')}
        </button>
      )}
    </div>
  );
}
```

## Notes

- Language preference is stored in `NEXT_LOCALE` cookie
- Language persists across page refreshes
- All translations are already written in both English and German
- Just need to replace hardcoded text with `t('key')` calls
