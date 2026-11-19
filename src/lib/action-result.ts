/** What a server action hands back: an error to show, or success (with any extra fields). Both keys exist on both shapes so `result?.error` always type-checks. */
export type ActionResult<T extends object = object> =
  | { error: string; success?: undefined }
  | ({ success: true; error?: undefined } & T)
