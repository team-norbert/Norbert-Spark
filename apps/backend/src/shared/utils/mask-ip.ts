/**
 * Masks an IP address (IPv4 or IPv6) to anonymize the last portion for GDPR compliance.
 *
 * For IPv4: Replaces the last octet with 'xxx' (e.g., 192.168.1.1 → 192.168.1.xxx)
 * For IPv6: Keeps first 3 hextets (48 bits), replaces last 5 with 'xxxx' (e.g., 2001:0db8:85a3::7334 → 2001:0db8:85a3:xxxx:xxxx:xxxx:xxxx:xxxx)
 *
 * In the UK law logging IP addresses is considered personal data,
 * so this function helps to anonymize them while still retaining
 * some information for analytics and debugging.
 *
 * @param ip - The IP address to mask (IPv4 or IPv6 format)
 * @returns The masked IP address
 * @throws {Error} If the IP address format is invalid
 *
 * @example
 * maskIpAddress('192.168.1.100') // Returns '192.168.1.xxx'
 * maskIpAddress('2001:0db8:85a3::7334') // Returns '2001:0db8:85a3:xxxx:xxxx:xxxx:xxxx:xxxx'
 */
export function maskIpAddress(ip: string): string {
  if (isIPv4(ip)) {
    return maskIPv4(ip)
  }

  if (isIPv6(ip)) {
    return maskIPv6(ip)
  }

  throw new Error('Invalid IP address')
}

/* ---------------- IPv4 ---------------- */

/**
 * Validates if a string is a valid IPv4 address.
 *
 * @param ip - The string to validate
 * @returns True if the string is a valid IPv4 address, false otherwise
 */
function isIPv4(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false

  return parts.every((p) => {
    const n = Number(p)
    return Number.isInteger(n) && n >= 0 && n <= 255
  })
}

/**
 * Masks an IPv4 address by replacing the last octet with 'xxx'.
 *
 * @param ip - A valid IPv4 address
 * @returns The masked IPv4 address with the last octet replaced
 *
 * @example
 * maskIPv4('192.168.1.100') // Returns '192.168.1.xxx'
 */
function maskIPv4(ip: string): string {
  const parts = ip.split('.')
  return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
}

/* ---------------- IPv6 ---------------- */

/**
 * Validates if a string is potentially an IPv6 address.
 * Note: This is a simple check that only verifies the presence of colons.
 *
 * @param ip - The string to validate
 * @returns True if the string contains colons (potential IPv6), false otherwise
 */
function isIPv6(ip: string): boolean {
  return ip.includes(':')
}

/**
 * Masks an IPv6 address by keeping the first 3 hextets (48 bits) and replacing the last 5 with 'xxxx'.
 *
 * @param ip - A valid IPv6 address (can be compressed with ::)
 * @returns The masked IPv6 address
 * @throws {Error} If the expanded address doesn't have exactly 8 hextets
 *
 * @example
 * maskIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334') // Returns '2001:0db8:85a3:xxxx:xxxx:xxxx:xxxx:xxxx'
 * maskIPv6('2001:db8:85a3::7334') // Returns '2001:0db8:85a3:xxxx:xxxx:xxxx:xxxx:xxxx'
 */
function maskIPv6(ip: string): string {
  const expanded = expandIPv6(ip)
  const parts = expanded.split(':')

  if (parts.length !== 8) {
    throw new Error('Invalid IPv6 address')
  }

  // Keep first 3 hextets (48 bits), zero the rest
  return [parts[0], parts[1], parts[2], 'xxxx', 'xxxx', 'xxxx', 'xxxx', 'xxxx'].join(':')
}

/**
 * Expands a compressed IPv6 address to its full 8-hextet format.
 * Handles the :: compression notation by filling in the missing hextets with zeros.
 *
 * @param address - An IPv6 address (can be compressed with ::)
 * @returns The fully expanded IPv6 address with all 8 hextets padded to 4 characters
 *
 * @example
 * expandIPv6('2001:db8::1') // Returns '2001:0db8:0000:0000:0000:0000:0000:0001'
 * expandIPv6('::1') // Returns '0000:0000:0000:0000:0000:0000:0000:0001'
 * expandIPv6('2001:db8:85a3:0:0:8a2e:370:7334') // Returns '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
 */
function expandIPv6(address: string): string {
  if (address.includes('::')) {
    const [left, right] = address.split('::')
    const leftParts = left ? left.split(':') : []
    const rightParts = right ? right.split(':') : []

    const missing = 8 - (leftParts.length + rightParts.length)
    const middle = Array(missing).fill('0000')

    return [...leftParts, ...middle, ...rightParts].map((p) => p.padStart(4, '0')).join(':')
  }

  return address
    .split(':')
    .map((p) => p.padStart(4, '0'))
    .join(':')
}
