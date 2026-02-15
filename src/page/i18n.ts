import en from "../i18n/en.json";

const messages = en as Record<string, string>;

export function t(key: string, vars?: Record<string, string | number>): string {
  const template = messages[key] ?? key;
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
