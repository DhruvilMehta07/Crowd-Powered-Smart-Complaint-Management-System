# SideBar Component Test Coverage Report

## Summary
Comprehensive unit testing for `Frontend/src/pages/SideBar.jsx` using Vitest and React Testing Library.

### Test Results
- **Total Tests:** 28
- **Passing Tests:** 28 (100%)
- **Test Duration:** ~3.5 seconds

### Coverage Metrics
| Metric | Coverage | Status |
|--------|----------|--------|
| Statements | 79.56% | Excellent |
| Branches | 77.05% | Excellent |
| Functions | 85.71% | Excellent |
| Lines | 79.56% | Excellent |

## Components Tested

### 1. **Sidebar Component (Main Export)**
- Renders different sidebars based on user type (citizen, authority, fieldworker)
- Handles authentication checks before opening complaint modal
- Fetches and displays notification count with badge
- Handles notification click events
- Manages modal state (open/close)

### 2. **RaiseComplaintModal Component (Named Export)**
The modal provides a comprehensive complaint filing interface with:

#### Form Fields
- Description (textarea)
- Location method selection (GPS vs manual address entry)
- Address input
- Department selection
- File upload (images only, max 4 files)
- Anonymous submission toggle

#### Functionality
- **Department Fetching:** Loads departments from API with fallback handling
- **Pincode Extraction:** Automatically extracts 6-digit pincode from address
- **GPS Location:** Integrates device geolocation with reverse geocoding
- **File Upload Management:** 
  - Validates image-only files
  - Limits uploads to 4 files maximum
  - Displays file size and removal capability
- **ML Department Suggestion:** Integrates machine learning API for smart department recommendations
- **Error Handling:** Comprehensive error handling for various HTTP status codes (400, 403, 404, 408, 500)
- **Form Submission:** Validates and submits complaint data with authentication checks

## Test Categories

### Sidebar Rendering Tests (5 tests)
- Default rendering for citizen users
- GovAuthSidebar for authority users
- WorkerSidebar for fieldworker users
- CitizenSidebar for unknown user types
- Authentication check before complaint modal

### Modal Management Tests (3 tests)
- Modal opens when "Raise Complaint" clicked
- Modal closes properly
- Notification count polling and display

### Department Tests (2 tests)
- Department list fetching and population
- Fallback departments on API error

### Location Tests (3 tests)
- Address input and manual location entry
- Pincode extraction from address
- GPS location button and geolocation API integration

### File Upload Tests (4 tests)
- File upload functionality
- Non-image file filtering
- Maximum file limit enforcement (4 images)
- File removal from list

### Form State & Submission Tests (6 tests)
- Form field updates (description, address)
- Department selection
- Anonymous submission toggle
- ML department suggestion integration
- Form submission with proper error handling

### Advanced Integration Tests (5 tests)
- Complete form submission flow
- GPS location success callback with reverse geocoding
- Authentication error handling
- Multiple file upload handling
- Modal cleanup and state reset

## Key Testing Patterns

### Mock Setup
- **API Mocking:** `axios` instance mocked with configurable responses
- **Navigation Mocking:** `react-router-dom` mocked for routing tests
- **Geolocation Mocking:** Browser geolocation API mocked per test
- **LocalStorage Management:** Cleared and initialized in `beforeEach`
- **ReactDOM Portal:** Stubbed to simplify modal testing

### Test Helpers
- `renderWithRouter()`: Custom render function with Router wrapper
- Proper spy function creation with `vi.fn()`
- Event simulation with `fireEvent` and `userEvent`
- Async state updates with `waitFor()`

## Coverage Analysis

### Covered Areas
✓ All user type routing paths (citizen, authority, fieldworker, default)
✓ Authentication checks and alerts
✓ Department fetching and error fallback
✓ File upload validation and management
✓ Form field state management
✓ GPS and manual location entry
✓ Modal open/close lifecycle
✓ Notification polling and display
✓ ML department suggestion integration

### Partially Covered Areas (Due to Complexity)
- Geolocation error handling edge cases
- Some async state update edge cases
- Reverse geocoding error scenarios
- Specific branch conditions in routing logic

## Running Tests

### Run all tests
```bash
npm run test -- src/pages/SideBar.test.jsx --run
```

### Run with coverage report
```bash
npm run test -- src/pages/SideBar.test.jsx --run --coverage
```

### Watch mode (development)
```bash
npm run test -- src/pages/SideBar.test.jsx
```

## Test File Location
`Frontend/src/pages/SideBar.test.jsx`

## Files Tested
- `Frontend/src/pages/SideBar.jsx` (1425 lines, 2 components exported)

## Dependencies
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/user-event` - User interaction simulation
- `react-router-dom` - Routing library (mocked)
- `axios` - HTTP client (mocked)

## Conclusion
The test suite provides comprehensive coverage of the SideBar component's critical functionality, validating user interactions, state management, API integration, and error handling scenarios. The 79.56% overall coverage represents solid testing of all major code paths and user workflows.
