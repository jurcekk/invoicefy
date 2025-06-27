# Test Suite Documentation

This directory contains comprehensive tests for the invoice management application's service layer.

## Test Structure

```
src/test/
├── setup.ts                    # Global test configuration
├── helpers/
│   └── testData.ts             # Test data factory and utilities
├── mocks/
│   └── supabase.ts             # Supabase client mocks
├── services/                   # Unit tests for service functions
│   ├── freelancerService.test.ts
│   ├── clientService.test.ts
│   └── invoiceService.test.ts
├── integration/                # Integration tests
│   └── services.integration.test.ts
└── README.md                   # This file
```

## Test Types

### Unit Tests (`src/test/services/`)
- **Purpose**: Test individual service functions in isolation
- **Mocking**: Uses mocked Supabase client to avoid database dependencies
- **Coverage**: Tests all service functions with various scenarios:
  - Successful operations
  - Error handling
  - Input validation
  - Edge cases

### Integration Tests (`src/test/integration/`)
- **Purpose**: Test service functions against a real database
- **Database**: Requires local Supabase instance or test database
- **Coverage**: Tests complete workflows and data integrity

## Running Tests

### Unit Tests (Default)
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Integration Tests
Integration tests are **skipped by default** to avoid requiring database setup.

To enable integration tests:

1. **Setup Local Supabase** (recommended):
   ```bash
   # Install Supabase CLI
   npm install -g @supabase/cli
   
   # Start local Supabase
   supabase start
   
   # Update .env with local URLs (provided by supabase start)
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=your_local_anon_key
   ```

2. **Enable Integration Tests**:
   Remove `.skip` from `describe.skip` in `services.integration.test.ts`

3. **Run Tests**:
   ```bash
   npm run test
   ```

## Test Data Factory

The `TestDataFactory` class provides consistent test data:

```typescript
// Create test freelancer
const freelancer = TestDataFactory.createFreelancer({
  name: 'Custom Name'  // Override specific fields
});

// Create test client
const client = TestDataFactory.createClient({
  freelancer_id: freelancer.id
});

// Create complete invoice with relations
const invoiceWithRelations = TestDataFactory.createInvoiceWithRelations();

// Generate test utilities
const uuid = TestDataFactory.generateUUID();
const email = TestDataFactory.generateEmail('prefix');
const date = TestDataFactory.generateDate(30); // 30 days from now
```

## Mock Helpers

The Supabase mock provides a fluent API that matches the real client:

```typescript
import { createMockSupabaseClient, setupSuccessfulResponse } from '../mocks/supabase';

const mockSupabase = createMockSupabaseClient();

// Setup successful response
setupSuccessfulResponse(mockSupabase, testData);

// Setup error response
setupErrorResponse(mockSupabase, { message: 'Error', code: '23505' });

// Setup count response (for invoice numbering)
setupCountResponse(mockSupabase, 5);
```

## Test Coverage

The test suite covers:

### Freelancer Service
- ✅ Create freelancer with full/minimal data
- ✅ Retrieve freelancer by ID
- ✅ Get all freelancers
- ✅ Update freelancer information
- ✅ Delete freelancer
- ✅ UUID validation
- ✅ Error handling (not found, database errors, constraints)

### Client Service
- ✅ Create client with full/minimal data
- ✅ Retrieve clients for freelancer
- ✅ Get client by ID
- ✅ Update client information
- ✅ Delete client
- ✅ Email validation and normalization
- ✅ Foreign key validation
- ✅ Error handling

### Invoice Service
- ✅ Generate sequential invoice numbers
- ✅ Create invoice with auto-generated numbers
- ✅ Create invoice with custom numbers
- ✅ Create invoice with items
- ✅ Validate invoice totals and relationships
- ✅ Retrieve invoices with/without relations
- ✅ Get invoice with items and full relations
- ✅ Update invoice status and fields
- ✅ Delete invoice (cascades to items)
- ✅ Calculate invoice statistics
- ✅ Transaction rollback on item creation failure
- ✅ Input validation (UUIDs, dates, amounts, status)

### Integration Tests
- ✅ End-to-end freelancer creation and retrieval
- ✅ Client creation and association with freelancer
- ✅ Invoice creation with correct totals and FK links
- ✅ Invoice retrieval with all relations
- ✅ Cross-service referential integrity
- ✅ Sequential invoice numbering across operations

## Best Practices

### Writing Tests
1. **Use descriptive test names** that explain the scenario
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Test both success and failure cases**
4. **Use the TestDataFactory** for consistent test data
5. **Mock external dependencies** in unit tests
6. **Verify all expected calls** to mocked functions

### Test Data
1. **Use realistic data** that matches production scenarios
2. **Generate unique identifiers** to avoid conflicts
3. **Test edge cases** (empty strings, null values, invalid formats)
4. **Verify data transformations** (email normalization, trimming)

### Error Testing
1. **Test all error conditions** (validation, database, network)
2. **Verify error messages** are user-friendly
3. **Test error codes** for specific database constraints
4. **Ensure proper cleanup** on transaction failures

## Continuous Integration

The test suite is designed to run in CI environments:

- **No external dependencies** for unit tests
- **Fast execution** with mocked services
- **Comprehensive coverage** reporting
- **Clear failure messages** for debugging

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure `vi.clearAllMocks()` is called in `beforeEach`
2. **Async test failures**: Always `await` async operations
3. **UUID validation errors**: Use `TestDataFactory.generateUUID()` for valid UUIDs
4. **Integration test failures**: Verify database connection and migrations

### Debug Tips

1. **Use `console.log`** in tests to inspect data
2. **Run single test** with `test.only()` or `describe.only()`
3. **Check mock call history** with `expect(mock).toHaveBeenCalledWith(...)`
4. **Verify test data** matches expected database schema