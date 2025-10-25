export const mapZodErrors = (error, fields) => {
  if (!error) {
    return fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
  }

  const flattened = error.flatten().fieldErrors;
  return fields.reduce((acc, field) => ({ ...acc, [field]: flattened[field]?.[0] ?? '' }), {});
};
