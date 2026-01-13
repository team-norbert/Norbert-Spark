import { describe, expect, it } from 'vitest'

import {
  ErrorCode,
  POSTGRES_ERROR_CODE,
  type PostgresErrorCode,
} from '../../../src/shared/constants/error-codes.js'

describe('ErrorCode', () => {
  describe('enum values', () => {
    it('should have authentication error codes', () => {
      expect(ErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS')
      expect(ErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED')
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
    })

    it('should have validation error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
      expect(ErrorCode.INVALID_EMAIL).toBe('INVALID_EMAIL')
      expect(ErrorCode.INVALID_PASSWORD).toBe('INVALID_PASSWORD')
      expect(ErrorCode.TYPE_ERROR).toBe('TYPE_ERROR')
    })

    it('should have resource error codes', () => {
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND')
      expect(ErrorCode.ALREADY_EXISTS).toBe('ALREADY_EXISTS')
      expect(ErrorCode.DUPLICATE_ENTRY).toBe('DUPLICATE_ENTRY')
    })

    it('should have business logic error codes', () => {
      expect(ErrorCode.INSUFFICIENT_PERMISSIONS).toBe('INSUFFICIENT_PERMISSIONS')
      expect(ErrorCode.OPERATION_NOT_ALLOWED).toBe('OPERATION_NOT_ALLOWED')
    })

    it('should have system error codes', () => {
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR')
      expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR')
    })
  })

  describe('enum completeness', () => {
    it('should have all expected error codes', () => {
      const expectedCodes = [
        'INVALID_CREDENTIALS',
        'TOKEN_EXPIRED',
        'UNAUTHORIZED',
        'VALIDATION_ERROR',
        'INVALID_EMAIL',
        'INVALID_PASSWORD',
        'TYPE_ERROR',
        'UNPROCESSABLE_ENTITY',
        'NOT_FOUND',
        'ALREADY_EXISTS',
        'DUPLICATE_ENTRY',
        'INSUFFICIENT_PERMISSIONS',
        'OPERATION_NOT_ALLOWED',
        'INTERNAL_ERROR',
        'DATABASE_ERROR',
        'EXTERNAL_SERVICE_ERROR',
      ]

      const actualCodes = Object.values(ErrorCode)
      expect(actualCodes).toHaveLength(expectedCodes.length)
      expectedCodes.forEach((code) => {
        expect(actualCodes).toContain(code)
      })
    })
  })

  describe('enum usage', () => {
    it('should be usable in switch statements', () => {
      const getErrorMessage = (code: ErrorCode): string => {
        switch (code) {
          case ErrorCode.NOT_FOUND:
            return 'Resource not found'
          case ErrorCode.VALIDATION_ERROR:
            return 'Validation failed'
          case ErrorCode.UNAUTHORIZED:
            return 'Unauthorized access'
          default:
            return 'Unknown error'
        }
      }

      expect(getErrorMessage(ErrorCode.NOT_FOUND)).toBe('Resource not found')
      expect(getErrorMessage(ErrorCode.VALIDATION_ERROR)).toBe('Validation failed')
      expect(getErrorMessage(ErrorCode.UNAUTHORIZED)).toBe('Unauthorized access')
    })

    it('should be comparable with strict equality', () => {
      const code: ErrorCode = ErrorCode.NOT_FOUND
      expect(code === ErrorCode.NOT_FOUND).toBe(true)
      // Use a function to allow comparing different enum values
      const isDifferent = (a: ErrorCode, b: ErrorCode) => a !== b
      expect(isDifferent(code, ErrorCode.VALIDATION_ERROR)).toBe(true)
    })

    it('should be usable as object keys', () => {
      const errorMessages = {
        [ErrorCode.NOT_FOUND]: 'Resource not found',
        [ErrorCode.VALIDATION_ERROR]: 'Invalid input',
        [ErrorCode.UNAUTHORIZED]: 'Access denied',
      }

      expect(errorMessages[ErrorCode.NOT_FOUND]).toBe('Resource not found')
      expect(errorMessages[ErrorCode.VALIDATION_ERROR]).toBe('Invalid input')
    })
  })

  describe('type safety', () => {
    it('should only accept valid ErrorCode values', () => {
      const validCode: ErrorCode = ErrorCode.NOT_FOUND
      expect(validCode).toBe('NOT_FOUND')

      // TypeScript would catch this at compile time
      // const invalidCode: ErrorCode = 'INVALID_CODE' // Type error
    })

    it('should work with type guards', () => {
      const isValidErrorCode = (code: string): code is ErrorCode => {
        return Object.values(ErrorCode).includes(code as ErrorCode)
      }

      expect(isValidErrorCode('NOT_FOUND')).toBe(true)
      expect(isValidErrorCode('VALIDATION_ERROR')).toBe(true)
      expect(isValidErrorCode('INVALID_CODE')).toBe(false)
    })
  })

  describe('categorization', () => {
    it('should distinguish authentication errors', () => {
      const authErrors = [
        ErrorCode.INVALID_CREDENTIALS,
        ErrorCode.TOKEN_EXPIRED,
        ErrorCode.UNAUTHORIZED,
      ]

      authErrors.forEach((code) => {
        expect(Object.values(ErrorCode)).toContain(code)
      })
    })

    it('should distinguish validation errors', () => {
      const validationErrors = [
        ErrorCode.VALIDATION_ERROR,
        ErrorCode.INVALID_EMAIL,
        ErrorCode.INVALID_PASSWORD,
      ]

      validationErrors.forEach((code) => {
        expect(Object.values(ErrorCode)).toContain(code)
      })
    })

    it('should distinguish resource errors', () => {
      const resourceErrors = [
        ErrorCode.NOT_FOUND,
        ErrorCode.ALREADY_EXISTS,
        ErrorCode.DUPLICATE_ENTRY,
      ]

      resourceErrors.forEach((code) => {
        expect(Object.values(ErrorCode)).toContain(code)
      })
    })
  })
})

describe('POSTGRES_ERROR_CODE', () => {
  describe('Class 00 - Successful Completion', () => {
    it('should have successful completion code', () => {
      expect(POSTGRES_ERROR_CODE.SUCCESSFUL_COMPLETION).toBe('00000')
    })
  })

  describe('Class 01 - Warning', () => {
    it('should have warning codes', () => {
      expect(POSTGRES_ERROR_CODE.WARNING).toBe('01000')
      expect(POSTGRES_ERROR_CODE.DYNAMIC_RESULT_SETS_RETURNED).toBe('0100C')
      expect(POSTGRES_ERROR_CODE.IMPLICIT_ZERO_BIT_PADDING).toBe('01008')
      expect(POSTGRES_ERROR_CODE.NULL_VALUE_ELIMINATED_IN_SET_FUNCTION).toBe('01003')
      expect(POSTGRES_ERROR_CODE.PRIVILEGE_NOT_GRANTED).toBe('01007')
      expect(POSTGRES_ERROR_CODE.PRIVILEGE_NOT_REVOKED).toBe('01006')
      expect(POSTGRES_ERROR_CODE.STRING_DATA_RIGHT_TRUNCATION).toBe('01004')
      expect(POSTGRES_ERROR_CODE.DEPRECATED_FEATURE).toBe('01P01')
    })
  })

  describe('Class 02 - No Data', () => {
    it('should have no data codes', () => {
      expect(POSTGRES_ERROR_CODE.NO_DATA).toBe('02000')
      expect(POSTGRES_ERROR_CODE.NO_ADDITIONAL_DYNAMIC_RESULT_SETS_RETURNED).toBe('02001')
    })
  })

  describe('Class 08 - Connection Exception', () => {
    it('should have connection exception codes', () => {
      expect(POSTGRES_ERROR_CODE.CONNECTION_EXCEPTION).toBe('08000')
      expect(POSTGRES_ERROR_CODE.CONNECTION_DOES_NOT_EXIST).toBe('08003')
      expect(POSTGRES_ERROR_CODE.CONNECTION_FAILURE).toBe('08006')
      expect(POSTGRES_ERROR_CODE.SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION).toBe('08001')
      expect(POSTGRES_ERROR_CODE.SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION).toBe('08004')
      expect(POSTGRES_ERROR_CODE.TRANSACTION_RESOLUTION_UNKNOWN).toBe('08007')
      expect(POSTGRES_ERROR_CODE.PROTOCOL_VIOLATION).toBe('08P01')
    })
  })

  describe('Class 22 - Data Exception', () => {
    it('should have common data exception codes', () => {
      expect(POSTGRES_ERROR_CODE.DATA_EXCEPTION).toBe('22000')
      expect(POSTGRES_ERROR_CODE.DIVISION_BY_ZERO).toBe('22012')
      expect(POSTGRES_ERROR_CODE.NUMERIC_VALUE_OUT_OF_RANGE).toBe('22003')
      expect(POSTGRES_ERROR_CODE.INVALID_TEXT_REPRESENTATION).toBe('22P02')
      expect(POSTGRES_ERROR_CODE.INVALID_DATETIME_FORMAT).toBe('22007')
    })

    it('should have JSON-related error codes', () => {
      expect(POSTGRES_ERROR_CODE.DUPLICATE_JSON_OBJECT_KEY_VALUE).toBe('22030')
      expect(POSTGRES_ERROR_CODE.INVALID_JSON_TEXT).toBe('22032')
      expect(POSTGRES_ERROR_CODE.INVALID_SQL_JSON_SUBSCRIPT).toBe('22033')
      expect(POSTGRES_ERROR_CODE.SQL_JSON_ARRAY_NOT_FOUND).toBe('22039')
      expect(POSTGRES_ERROR_CODE.SQL_JSON_SCALAR_REQUIRED).toBe('2203F')
    })

    it('should have XML-related error codes', () => {
      expect(POSTGRES_ERROR_CODE.NOT_AN_XML_DOCUMENT).toBe('2200L')
      expect(POSTGRES_ERROR_CODE.INVALID_XML_DOCUMENT).toBe('2200M')
      expect(POSTGRES_ERROR_CODE.INVALID_XML_CONTENT).toBe('2200N')
    })
  })

  describe('Class 23 - Integrity Constraint Violation', () => {
    it('should have all constraint violation codes', () => {
      expect(POSTGRES_ERROR_CODE.INTEGRITY_CONSTRAINT_VIOLATION).toBe('23000')
      expect(POSTGRES_ERROR_CODE.RESTRICT_VIOLATION).toBe('23001')
      expect(POSTGRES_ERROR_CODE.NOT_NULL_VIOLATION).toBe('23502')
      expect(POSTGRES_ERROR_CODE.FOREIGN_KEY_VIOLATION).toBe('23503')
      expect(POSTGRES_ERROR_CODE.UNIQUE_VIOLATION).toBe('23505')
      expect(POSTGRES_ERROR_CODE.CHECK_VIOLATION).toBe('23514')
      expect(POSTGRES_ERROR_CODE.EXCLUSION_VIOLATION).toBe('23P01')
    })
  })

  describe('Class 25 - Invalid Transaction State', () => {
    it('should have transaction state codes', () => {
      expect(POSTGRES_ERROR_CODE.INVALID_TRANSACTION_STATE).toBe('25000')
      expect(POSTGRES_ERROR_CODE.ACTIVE_SQL_TRANSACTION).toBe('25001')
      expect(POSTGRES_ERROR_CODE.NO_ACTIVE_SQL_TRANSACTION).toBe('25P01')
      expect(POSTGRES_ERROR_CODE.IN_FAILED_SQL_TRANSACTION).toBe('25P02')
      expect(POSTGRES_ERROR_CODE.IDLE_IN_TRANSACTION_SESSION_TIMEOUT).toBe('25P03')
      expect(POSTGRES_ERROR_CODE.TRANSACTION_TIMEOUT).toBe('25P04')
    })
  })

  describe('Class 28 - Invalid Authorization Specification', () => {
    it('should have authorization codes', () => {
      expect(POSTGRES_ERROR_CODE.INVALID_AUTHORIZATION_SPECIFICATION).toBe('28000')
      expect(POSTGRES_ERROR_CODE.PG_AUTH_INVALID_PASSWORD).toBe('28P01')
    })
  })

  describe('Class 40 - Transaction Rollback', () => {
    it('should have transaction rollback codes', () => {
      expect(POSTGRES_ERROR_CODE.TRANSACTION_ROLLBACK).toBe('40000')
      expect(POSTGRES_ERROR_CODE.TRANSACTION_INTEGRITY_CONSTRAINT_VIOLATION).toBe('40002')
      expect(POSTGRES_ERROR_CODE.SERIALIZATION_FAILURE).toBe('40001')
      expect(POSTGRES_ERROR_CODE.STATEMENT_COMPLETION_UNKNOWN).toBe('40003')
      expect(POSTGRES_ERROR_CODE.DEADLOCK_DETECTED).toBe('40P01')
    })
  })

  describe('Class 42 - Syntax Error or Access Rule Violation', () => {
    it('should have syntax error codes', () => {
      expect(POSTGRES_ERROR_CODE.SYNTAX_ERROR_OR_ACCESS_RULE_VIOLATION).toBe('42000')
      expect(POSTGRES_ERROR_CODE.SYNTAX_ERROR).toBe('42601')
      expect(POSTGRES_ERROR_CODE.INSUFFICIENT_PRIVILEGE).toBe('42501')
    })

    it('should have object-related error codes', () => {
      expect(POSTGRES_ERROR_CODE.UNDEFINED_COLUMN).toBe('42703')
      expect(POSTGRES_ERROR_CODE.UNDEFINED_FUNCTION).toBe('42883')
      expect(POSTGRES_ERROR_CODE.UNDEFINED_TABLE).toBe('42P01')
      expect(POSTGRES_ERROR_CODE.UNDEFINED_OBJECT).toBe('42704')
    })

    it('should have duplicate object error codes', () => {
      expect(POSTGRES_ERROR_CODE.DUPLICATE_COLUMN).toBe('42701')
      expect(POSTGRES_ERROR_CODE.DUPLICATE_DATABASE).toBe('42P04')
      expect(POSTGRES_ERROR_CODE.DUPLICATE_FUNCTION).toBe('42723')
      expect(POSTGRES_ERROR_CODE.DUPLICATE_TABLE).toBe('42P07')
      expect(POSTGRES_ERROR_CODE.DUPLICATE_OBJECT).toBe('42710')
    })

    it('should have ambiguous reference error codes', () => {
      expect(POSTGRES_ERROR_CODE.AMBIGUOUS_COLUMN).toBe('42702')
      expect(POSTGRES_ERROR_CODE.AMBIGUOUS_FUNCTION).toBe('42725')
      expect(POSTGRES_ERROR_CODE.AMBIGUOUS_PARAMETER).toBe('42P08')
    })
  })

  describe('Class 53 - Insufficient Resources', () => {
    it('should have resource exhaustion codes', () => {
      expect(POSTGRES_ERROR_CODE.INSUFFICIENT_RESOURCES).toBe('53000')
      expect(POSTGRES_ERROR_CODE.DISK_FULL).toBe('53100')
      expect(POSTGRES_ERROR_CODE.OUT_OF_MEMORY).toBe('53200')
      expect(POSTGRES_ERROR_CODE.TOO_MANY_CONNECTIONS).toBe('53300')
      expect(POSTGRES_ERROR_CODE.CONFIGURATION_LIMIT_EXCEEDED).toBe('53400')
    })
  })

  describe('Class 54 - Program Limit Exceeded', () => {
    it('should have program limit codes', () => {
      expect(POSTGRES_ERROR_CODE.PROGRAM_LIMIT_EXCEEDED).toBe('54000')
      expect(POSTGRES_ERROR_CODE.STATEMENT_TOO_COMPLEX).toBe('54001')
      expect(POSTGRES_ERROR_CODE.TOO_MANY_COLUMNS).toBe('54011')
      expect(POSTGRES_ERROR_CODE.TOO_MANY_ARGUMENTS).toBe('54023')
    })
  })

  describe('Class 55 - Object Not In Prerequisite State', () => {
    it('should have prerequisite state codes', () => {
      expect(POSTGRES_ERROR_CODE.OBJECT_NOT_IN_PREREQUISITE_STATE).toBe('55000')
      expect(POSTGRES_ERROR_CODE.OBJECT_IN_USE).toBe('55006')
      expect(POSTGRES_ERROR_CODE.CANT_CHANGE_RUNTIME_PARAM).toBe('55P02')
      expect(POSTGRES_ERROR_CODE.LOCK_NOT_AVAILABLE).toBe('55P03')
    })
  })

  describe('Class 57 - Operator Intervention', () => {
    it('should have operator intervention codes', () => {
      expect(POSTGRES_ERROR_CODE.OPERATOR_INTERVENTION).toBe('57000')
      expect(POSTGRES_ERROR_CODE.QUERY_CANCELED).toBe('57014')
      expect(POSTGRES_ERROR_CODE.ADMIN_SHUTDOWN).toBe('57P01')
      expect(POSTGRES_ERROR_CODE.CRASH_SHUTDOWN).toBe('57P02')
      expect(POSTGRES_ERROR_CODE.CANNOT_CONNECT_NOW).toBe('57P03')
      expect(POSTGRES_ERROR_CODE.DATABASE_DROPPED).toBe('57P04')
      expect(POSTGRES_ERROR_CODE.IDLE_SESSION_TIMEOUT).toBe('57P05')
    })
  })

  describe('Class 58 - System Error', () => {
    it('should have system error codes', () => {
      expect(POSTGRES_ERROR_CODE.SYSTEM_ERROR).toBe('58000')
      expect(POSTGRES_ERROR_CODE.IO_ERROR).toBe('58030')
      expect(POSTGRES_ERROR_CODE.UNDEFINED_FILE).toBe('58P01')
      expect(POSTGRES_ERROR_CODE.DUPLICATE_FILE).toBe('58P02')
    })
  })

  describe('Class F0 - Configuration File Error', () => {
    it('should have config file error codes', () => {
      expect(POSTGRES_ERROR_CODE.CONFIG_FILE_ERROR).toBe('F0000')
      expect(POSTGRES_ERROR_CODE.LOCK_FILE_EXISTS).toBe('F0001')
    })
  })

  describe('Class HV - Foreign Data Wrapper Error', () => {
    it('should have FDW error codes', () => {
      expect(POSTGRES_ERROR_CODE.FDW_ERROR).toBe('HV000')
      expect(POSTGRES_ERROR_CODE.FDW_COLUMN_NAME_NOT_FOUND).toBe('HV005')
      expect(POSTGRES_ERROR_CODE.FDW_INVALID_DATA_TYPE).toBe('HV004')
      expect(POSTGRES_ERROR_CODE.FDW_OUT_OF_MEMORY).toBe('HV001')
      expect(POSTGRES_ERROR_CODE.FDW_UNABLE_TO_ESTABLISH_CONNECTION).toBe('HV00N')
    })
  })

  describe('Class P0 - PL/pgSQL Error', () => {
    it('should have PL/pgSQL error codes', () => {
      expect(POSTGRES_ERROR_CODE.PLPGSQL_ERROR).toBe('P0000')
      expect(POSTGRES_ERROR_CODE.RAISE_EXCEPTION).toBe('P0001')
      expect(POSTGRES_ERROR_CODE.NO_DATA_FOUND).toBe('P0002')
      expect(POSTGRES_ERROR_CODE.TOO_MANY_ROWS).toBe('P0003')
      expect(POSTGRES_ERROR_CODE.ASSERT_FAILURE).toBe('P0004')
    })
  })

  describe('Class XX - Internal Error', () => {
    it('should have internal error codes', () => {
      expect(POSTGRES_ERROR_CODE.POSTGRES_INTERNAL_ERROR).toBe('XX000')
      expect(POSTGRES_ERROR_CODE.DATA_CORRUPTED).toBe('XX001')
      expect(POSTGRES_ERROR_CODE.INDEX_CORRUPTED).toBe('XX002')
    })
  })

  describe('code format validation', () => {
    it('should have all codes in 5-character format', () => {
      const allCodes = Object.values(POSTGRES_ERROR_CODE)
      allCodes.forEach((code) => {
        expect(code).toHaveLength(5)
        expect(code).toMatch(/^[0-9A-Z]{5}$/)
      })
    })

    it('should have no duplicate codes', () => {
      const allCodes = Object.values(POSTGRES_ERROR_CODE)
      const uniqueCodes = new Set(allCodes)
      expect(uniqueCodes.size).toBe(allCodes.length)
    })
  })

  describe('type safety', () => {
    it('should work with PostgresErrorCode type', () => {
      const code: PostgresErrorCode = POSTGRES_ERROR_CODE.UNIQUE_VIOLATION
      expect(code).toBe('23505')
    })

    it('should work in switch statements', () => {
      const handleError = (code: PostgresErrorCode): string => {
        switch (code) {
          case POSTGRES_ERROR_CODE.UNIQUE_VIOLATION:
            return 'Duplicate entry'
          case POSTGRES_ERROR_CODE.FOREIGN_KEY_VIOLATION:
            return 'Foreign key constraint violated'
          case POSTGRES_ERROR_CODE.NOT_NULL_VIOLATION:
            return 'Required field is null'
          default:
            return 'Unknown database error'
        }
      }

      expect(handleError(POSTGRES_ERROR_CODE.UNIQUE_VIOLATION)).toBe('Duplicate entry')
      expect(handleError(POSTGRES_ERROR_CODE.FOREIGN_KEY_VIOLATION)).toBe(
        'Foreign key constraint violated'
      )
      expect(handleError(POSTGRES_ERROR_CODE.NOT_NULL_VIOLATION)).toBe('Required field is null')
    })

    it('should work with type guards', () => {
      const isPostgresErrorCode = (code: string): code is PostgresErrorCode => {
        return Object.values(POSTGRES_ERROR_CODE).includes(code as PostgresErrorCode)
      }

      expect(isPostgresErrorCode('23505')).toBe(true)
      expect(isPostgresErrorCode('42P01')).toBe(true)
      expect(isPostgresErrorCode('99999')).toBe(false)
    })
  })

  describe('commonly used error codes', () => {
    it('should have all Class 23 integrity constraint violations', () => {
      const constraintViolations = [
        POSTGRES_ERROR_CODE.UNIQUE_VIOLATION,
        POSTGRES_ERROR_CODE.FOREIGN_KEY_VIOLATION,
        POSTGRES_ERROR_CODE.NOT_NULL_VIOLATION,
        POSTGRES_ERROR_CODE.CHECK_VIOLATION,
      ]

      constraintViolations.forEach((code) => {
        expect(code).toMatch(/^23/)
      })
    })

    it('should have all Class 42 common syntax errors', () => {
      const syntaxErrors = [
        POSTGRES_ERROR_CODE.SYNTAX_ERROR,
        POSTGRES_ERROR_CODE.UNDEFINED_TABLE,
        POSTGRES_ERROR_CODE.UNDEFINED_COLUMN,
        POSTGRES_ERROR_CODE.UNDEFINED_FUNCTION,
      ]

      syntaxErrors.forEach((code) => {
        expect(code).toMatch(/^42/)
      })
    })
  })

  describe('error code grouping', () => {
    it('should group connection errors correctly', () => {
      const connectionCodes = [
        POSTGRES_ERROR_CODE.CONNECTION_EXCEPTION,
        POSTGRES_ERROR_CODE.CONNECTION_DOES_NOT_EXIST,
        POSTGRES_ERROR_CODE.CONNECTION_FAILURE,
      ]

      connectionCodes.forEach((code) => {
        expect(code).toMatch(/^08/)
      })
    })

    it('should group transaction errors correctly', () => {
      const transactionCodes = [
        POSTGRES_ERROR_CODE.TRANSACTION_ROLLBACK,
        POSTGRES_ERROR_CODE.SERIALIZATION_FAILURE,
        POSTGRES_ERROR_CODE.DEADLOCK_DETECTED,
      ]

      transactionCodes.forEach((code) => {
        expect(code).toMatch(/^40/)
      })
    })

    it('should group resource errors correctly', () => {
      const resourceCodes = [
        POSTGRES_ERROR_CODE.DISK_FULL,
        POSTGRES_ERROR_CODE.OUT_OF_MEMORY,
        POSTGRES_ERROR_CODE.TOO_MANY_CONNECTIONS,
      ]

      resourceCodes.forEach((code) => {
        expect(code).toMatch(/^53/)
      })
    })
  })
})
