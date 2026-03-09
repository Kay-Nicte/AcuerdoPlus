# Acuerdo Plus - React Native (Expo) + Firebase

## Stack
- React Native + Expo (TypeScript)
- Firebase (Auth, Firestore, Storage)
- React Navigation (tabs + stacks)
- Ionicons para iconografia (NO emojis)

## Estructura
- `src/screens/` — pantallas por modulo (auth, agreement, home, calendar, expenses, chat, settings)
- `src/services/` — logica de negocio y Firebase
- `src/components/` — componentes reutilizables (common, home, calendar, expenses, chat)
- `src/context/` — AuthContext, AgreementContext, SubscriptionContext
- `src/navigation/` — Tab + Stack navigators

## Convenciones
- Iconos: siempre Ionicons (`@expo/vector-icons`), nunca emojis literales
- Tema: usar COLORS, SPACING, FONT_SIZES de `src/config/theme.ts`
- Idioma: todo en espanol

## Sistema de agentes multi-modelo

| Comando | Modelo | Funcion |
|---------|--------|---------|
| `/architect [tarea]` | `--model claude-opus-4-6` | Investiga, analiza docs/SDKs, genera plan en `.claude/plans/` |
| `/implement [tarea]` | `--model claude-sonnet-4-6` | Ejecuta el plan paso a paso, no improvisa |
| `/test [tarea]` | `--model claude-haiku-4-5-20251001` | Traduce test plan a codigo, no decide que testear |
| `/fix [tarea]` | `--model claude-sonnet-4-6` | Diagnostica y arregla bugs con analisis de impacto |
| `/explore [pregunta]` | `--model claude-haiku-4-5-20251001` | Solo lectura, responde preguntas rapidas del codebase |

### Flujo
```
researcher (Opus) → /clear → implementer (Sonnet) → /clear → tester (Haiku)
```

Si hay bugs: `/fix` con Sonnet. Preguntas rapidas: `/explore` con Haiku.
