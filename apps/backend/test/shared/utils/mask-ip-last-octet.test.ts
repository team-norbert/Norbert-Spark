import { describe, expect, it } from 'vitest'

import { maskIpAddress } from '../../../src/shared/utils/mask-ip.js'

describe('maskIpAddress', () => {
  describe('valid IPv4 addresses', () => {
    it('should mask the last octet of a standard IPv4 address', () => {
      expect(maskIpAddress('192.168.1.1')).toBe('192.168.1.xxx')
    })

    it('should mask the last octet of a private IP address', () => {
      expect(maskIpAddress('10.0.0.1')).toBe('10.0.0.xxx')
    })

    it('should mask the last octet of a loopback address', () => {
      expect(maskIpAddress('127.0.0.1')).toBe('127.0.0.xxx')
    })

    it('should mask the last octet when it is 0', () => {
      expect(maskIpAddress('192.168.1.0')).toBe('192.168.1.xxx')
    })

    it('should mask the last octet when it is 255', () => {
      expect(maskIpAddress('192.168.1.255')).toBe('192.168.1.xxx')
    })

    it('should mask the last octet of a public IP address', () => {
      expect(maskIpAddress('8.8.8.8')).toBe('8.8.8.xxx')
    })

    it('should preserve first three octets correctly', () => {
      expect(maskIpAddress('172.16.254.100')).toBe('172.16.254.xxx')
    })
  })

  describe('valid IPv6 addresses', () => {
    it('should mask IPv6 full address', () => {
      expect(maskIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(
        '2001:0db8:85a3:xxxx:xxxx:xxxx:xxxx:xxxx'
      )
    })

    it('should mask IPv6 compressed address', () => {
      expect(maskIpAddress('2001:db8:85a3::8a2e:370:7334')).toBe(
        '2001:0db8:85a3:xxxx:xxxx:xxxx:xxxx:xxxx'
      )
    })

    it('should mask IPv6 loopback', () => {
      expect(maskIpAddress('::1')).toBe('0000:0000:0000:xxxx:xxxx:xxxx:xxxx:xxxx')
    })

    it('should mask IPv6 all zeros', () => {
      expect(maskIpAddress('::')).toBe('0000:0000:0000:xxxx:xxxx:xxxx:xxxx:xxxx')
    })
  })

  describe('invalid IP addresses', () => {
    it('should throw error for address with too few octets', () => {
      expect(() => maskIpAddress('192.168.1')).toThrow('Invalid IP address')
    })

    it('should throw error for address with too many octets', () => {
      expect(() => maskIpAddress('192.168.1.1.1')).toThrow('Invalid IP address')
    })

    it('should throw error for address with non-numeric octets', () => {
      expect(() => maskIpAddress('192.168.1.abc')).toThrow('Invalid IP address')
    })

    it('should throw error for address with negative octets', () => {
      expect(() => maskIpAddress('192.168.1.-1')).toThrow('Invalid IP address')
    })

    it('should throw error for address with octets greater than 255', () => {
      expect(() => maskIpAddress('192.168.1.256')).toThrow('Invalid IP address')
    })

    it('should throw error for empty string', () => {
      expect(() => maskIpAddress('')).toThrow('Invalid IP address')
    })

    it('should throw error for address with trailing dot', () => {
      expect(() => maskIpAddress('192.168.1.1.')).toThrow('Invalid IP address')
    })

    it('should throw error for address with leading dot', () => {
      expect(() => maskIpAddress('.192.168.1.1')).toThrow('Invalid IP address')
    })

    it('should throw error for address with multiple consecutive dots', () => {
      expect(() => maskIpAddress('192..168.1.1')).toThrow('Invalid IP address')
    })

    it('should throw error for address with special characters', () => {
      expect(() => maskIpAddress('192.168.1.1#')).toThrow('Invalid IP address')
    })
  })

  describe('edge cases', () => {
    it('should handle IPv4 all zeros', () => {
      expect(maskIpAddress('0.0.0.0')).toBe('0.0.0.xxx')
    })

    it('should handle IPv4 all max values', () => {
      expect(maskIpAddress('255.255.255.255')).toBe('255.255.255.xxx')
    })

    it('should handle IPv4 broadcast address', () => {
      expect(maskIpAddress('192.168.1.255')).toBe('192.168.1.xxx')
    })
  })
})
