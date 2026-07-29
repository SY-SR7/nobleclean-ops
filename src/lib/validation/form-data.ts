export function pickFormData(formData: FormData, keys: readonly string[]) {
  const allowedKeys = new Set(keys);
  const raw: Record<string, string | undefined> = {};

  for (const key of formData.keys()) {
    if (key.startsWith("$ACTION_")) {
      continue;
    }

    if (!allowedKeys.has(key)) {
      throw new Error("Unexpected form field.");
    }
  }

  keys.forEach((key) => {
    const values = formData.getAll(key);

    if (values.length > 1) {
      throw new Error("Duplicate form field.");
    }

    const [value] = values;

    if (value === undefined) {
      raw[key] = undefined;
      return;
    }

    if (typeof value !== "string") {
      throw new Error("Unexpected file field.");
    }

    raw[key] = value;
  });

  return raw;
}
