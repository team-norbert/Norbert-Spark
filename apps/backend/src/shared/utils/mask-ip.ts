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

function isIPv4(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false

  return parts.every((p) => {
    const n = Number(p)
    return Number.isInteger(n) && n >= 0 && n <= 255
  })
}

function maskIPv4(ip: string): string {
  const parts = ip.split('.')
  return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
}

/* ---------------- IPv6 ---------------- */

function isIPv6(ip: string): boolean {
  return ip.includes(':')
}

function maskIPv6(ip: string): string {
  const expanded = expandIPv6(ip)
  const parts = expanded.split(':')

  if (parts.length !== 8) {
    throw new Error('Invalid IPv6 address')
  }

  // Keep first 3 hextets (48 bits), zero the rest
  return [parts[0], parts[1], parts[2], 'xxxx', 'xxxx', 'xxxx', 'xxxx', 'xxxx'].join(':')
}

/* Expand compressed IPv6 (::) */
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
