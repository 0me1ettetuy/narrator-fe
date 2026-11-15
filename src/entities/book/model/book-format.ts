export function getLanguageName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

export function formatFileSize(bytes: number, locale: string): string {
  const megabyte = 1024 * 1024;
  const [unit, value] =
    bytes >= megabyte
      ? (['megabyte', bytes / megabyte] as const)
      : (['kilobyte', bytes / 1024] as const);

  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'narrow',
    maximumFractionDigits: 1,
  }).format(value);
}
