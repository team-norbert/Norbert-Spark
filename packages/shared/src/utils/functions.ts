export const validateKebabCase = (value: string): boolean => {
  const isValidKebabCase =
    value &&
    value.length >= 1 &&
    value.length <= 200 &&
    /^[a-z0-9]/.test(value) &&
    /[a-z0-9]$/.test(value) &&
    !value.includes('--') &&
    /^[a-z0-9-]+$/.test(value)

  return !!isValidKebabCase
}
