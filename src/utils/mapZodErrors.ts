import { ZodError } from 'zod';
export const mapZodErrors = (error: ZodError, fields: string[]) => {
  if (!error) {
    return fields.reduce((acc: Record<string, string>, field: string) => ({ ...acc, [field]: '' }), {});
  }

  const flattened = error.flatten().fieldErrors as Record<string, string[]>;
  return fields.reduce(
    (acc: Record<string, string>, field: string) => ({ ...acc, [field]: flattened[field]?.[0] ?? '' }),
    {}
  );
};
