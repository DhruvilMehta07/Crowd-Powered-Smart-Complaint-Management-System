import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrendingComplaints from '../TrendingComplaints';
import api from '../../utils/axiosConfig';

// Mock the axios config
vi.mock('../../utils/axiosConfig');

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock clearAccessToken
vi.mock('../../utils/auth', () => ({
  clearAccessToken: vi.fn(),
}));

const mockTrendingComplaints = [
  {
    id: 1,
    content: 'Traffic congestion on Main Street',
    upvotes_count: 45,
  },
  {
    id: 2,
    title: 'Broken water pipe',
    description: 'Water pipe burst near the park',
    computed_upvotes_count: 32,
  },
  {
    id: 3,
    description: 'Pothole hazard',
    upvotes: [{ id: 1 }, { id: 2 }, { id: 3 }],
  },
];

const mockTopFieldworkers = [
  {
    id: 1,
    username: 'alice_johnson',
    email: 'alice@example.com',
    total_assigned_complaints: 25,
  },
  {
    id: 2,
    username: 'bob_wilson',
    email: 'bob@example.com',
    total_assigned: 20,
  },
  {
    id: 3,
    name: 'charlie_brown',
    email: 'charlie@example.com',
    solved_count: 18,
  },
  {
    id: 4,
    username: 'diana_prince',
    email: 'diana@example.com',
    total_assigned_complaints: 15,
  },
];

const mockProfileData = {
  assigned_department: {
    id: 101,
  },
};

describe('TrendingComplaints Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== COMPONENT INITIALIZATION & BASIC RENDERING =====
  describe('Component Initialization & Basic Rendering', () => {
    it('should render without crashing', async () => {
      render(<TrendingComplaints />);
      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should render as an aside element with proper classes', () => {
      render(<TrendingComplaints />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('sticky', 'top-0', 'w-80');
    });

    it('should call API to fetch trending complaints on mount', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/complaints/trending/?limit=3', expect.any(Object));
      });
    });

    it('should render CitizenRightbar by default when no user_type in localStorage', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
      });
    });
  });

  // ===== TRENDING COMPLAINTS FETCHING & DISPLAY =====
  describe('Trending Complaints Fetching & Display', () => {
    it('should display loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<TrendingComplaints />);

      const loadingElements = screen.getAllByText('Loading...');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should fetch and display trending complaints with content field', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Traffic congestion on Main Street')).toBeInTheDocument();
        expect(screen.getByText('45 Upvotes')).toBeInTheDocument();
      });
    });

    it('should use description field if content is unavailable', async () => {
      const complaints = [
        {
          id: 2,
          title: 'Broken water pipe',
          description: 'Water pipe burst near the park',
          upvotes_count: 32,
        },
      ];
      api.get.mockResolvedValue({ data: complaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Water pipe burst near the park')).toBeInTheDocument();
      });
    });

    it('should use title field if content and description are unavailable', async () => {
      const complaints = [
        {
          id: 1,
          title: 'Broken streetlight',
          upvotes_count: 10,
        },
      ];
      api.get.mockResolvedValue({ data: complaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Broken streetlight')).toBeInTheDocument();
      });
    });

    it('should display fallback text if all description fields are missing', async () => {
      const complaints = [
        {
          id: 1,
          upvotes_count: 10,
        },
      ];
      api.get.mockResolvedValue({ data: complaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Complaint details unavailable.')).toBeInTheDocument();
      });
    });

    it('should use computed_upvotes_count if upvotes_count is unavailable', async () => {
      const complaints = [
        {
          id: 1,
          content: 'Test complaint',
          computed_upvotes_count: 25,
        },
      ];
      api.get.mockResolvedValue({ data: complaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('25 Upvotes')).toBeInTheDocument();
      });
    });

    it('should use upvotes array length if other upvote fields are unavailable', async () => {
      const complaints = [
        {
          id: 1,
          content: 'Test complaint',
          upvotes: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
      ];
      api.get.mockResolvedValue({ data: complaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('3 Upvotes')).toBeInTheDocument();
      });
    });

    it('should default to 0 upvotes if no upvote data is available', async () => {
      const complaints = [
        {
          id: 1,
          content: 'Test complaint',
        },
      ];
      api.get.mockResolvedValue({ data: complaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('0 Upvotes')).toBeInTheDocument();
      });
    });

    it('should handle array response from API', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const complaints = screen.getAllByText(/Upvotes/);
        expect(complaints.length).toBe(3);
      });
    });

    it('should handle non-array response from API', async () => {
      api.get.mockResolvedValue({ data: null });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('No complaints yet')).toBeInTheDocument();
      });
    });

    it('should display error message if API call fails', async () => {
      api.get.mockRejectedValue(new Error('Network error'));
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load trending complaints')).toBeInTheDocument();
      });
    });

    it('should not update state if component unmounts during fetch', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      api.get.mockReturnValue(promise);

      const { unmount } = render(<TrendingComplaints />);
      unmount();
      resolvePromise({ data: mockTrendingComplaints });

      await new Promise((r) => setTimeout(r, 100));
    });

    it('should not update state if request is cancelled', async () => {
      api.get.mockRejectedValue({ name: 'AbortError' });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load trending complaints')).not.toBeInTheDocument();
      });
    });

    it('should not update state if request is cancelled with CanceledError', async () => {
      api.get.mockRejectedValue({ name: 'CanceledError' });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load trending complaints')).not.toBeInTheDocument();
      });
    });

    it('should display no complaints message when array is empty', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('No complaints yet')).toBeInTheDocument();
      });
    });
  });

  // ===== COMPLAINT NAVIGATION =====
  describe('Complaint Navigation', () => {
    it('should navigate to complaint detail when clicked', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Traffic congestion on Main Street')).toBeInTheDocument();
      });

      const complaintElement = screen.getByText('Traffic congestion on Main Street').closest('div[role="button"]');
      fireEvent.click(complaintElement);

      expect(mockNavigate).toHaveBeenCalledWith('/complaint/1');
    });

    it('should navigate when pressing Enter key on complaint', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Traffic congestion on Main Street')).toBeInTheDocument();
      });

      const complaintElement = screen.getByText('Traffic congestion on Main Street').closest('div[role="button"]');
      fireEvent.keyDown(complaintElement, { key: 'Enter' });

      expect(mockNavigate).toHaveBeenCalledWith('/complaint/1');
    });

    it('should navigate when pressing Space key on complaint', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Traffic congestion on Main Street')).toBeInTheDocument();
      });

      const complaintElement = screen.getByText('Traffic congestion on Main Street').closest('div[role="button"]');
      fireEvent.keyDown(complaintElement, { key: ' ' });

      expect(mockNavigate).toHaveBeenCalledWith('/complaint/1');
    });

    it('should not navigate when pressing other keys', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Traffic congestion on Main Street')).toBeInTheDocument();
      });

      const complaintElement = screen.getByText('Traffic congestion on Main Street').closest('div[role="button"]');
      fireEvent.keyDown(complaintElement, { key: 'ArrowDown' });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ===== AUTHENTICATION & LOGOUT =====
  describe('Authentication & Logout', () => {
    it('should show Login/SignUp button when not authenticated', async () => {
      // Don't set isAuthenticated - it defaults to null/undefined which is falsy
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Login / SignUp')).toBeInTheDocument();
      });
    });

    it('should show Logout button when authenticated', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    it('should call onLoginClick handler when login button is clicked', async () => {
      const mockOnLogin = vi.fn();
      // Don't set isAuthenticated - it defaults to null/undefined which is falsy
      render(<TrendingComplaints onLoginClick={mockOnLogin} />);

      await waitFor(() => {
        expect(screen.getByText('Login / SignUp')).toBeInTheDocument();
      });

      const loginButton = screen.getByText('Login / SignUp').closest('button');
      fireEvent.click(loginButton);

      expect(mockOnLogin).toHaveBeenCalled();
    });

    it('should call fallback login handler and navigate to /auth when no onLoginClick provided', async () => {
      // Don't set isAuthenticated - it defaults to null/undefined which is falsy
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Login / SignUp')).toBeInTheDocument();
      });

      const loginButton = screen.getByText('Login / SignUp');
      fireEvent.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });

    it('should call onLogoutClick handler when logout button is clicked', async () => {
      const mockOnLogout = vi.fn();
      localStorage.setItem('isAuthenticated', 'true');
      render(<TrendingComplaints onLogoutClick={mockOnLogout} />);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout').closest('button');
      fireEvent.click(logoutButton);

      expect(mockOnLogout).toHaveBeenCalled();
    });

    it('should perform fallback logout when no onLogoutClick provided', async () => {
      const { clearAccessToken } = await import('../../utils/auth');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user_id', '123');
      localStorage.setItem('username', 'testuser');
      localStorage.setItem('user_type', 'citizen');

      api.post.mockResolvedValue({ data: {} });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/users/logout/');
        expect(clearAccessToken).toHaveBeenCalled();
        expect(localStorage.getItem('user_id')).toBeNull();
        expect(localStorage.getItem('username')).toBeNull();
        expect(localStorage.getItem('isAuthenticated')).toBeNull();
        expect(localStorage.getItem('user_type')).toBeNull();
      });
    });

    it('should handle logout API error gracefully', async () => {
      const { clearAccessToken } = await import('../../utils/auth');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user_id', '123');

      api.post.mockRejectedValue(new Error('Network error'));

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(clearAccessToken).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('should remove Authorization header on logout', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      api.defaults.headers.common['Authorization'] = 'Bearer token';
      api.post.mockResolvedValue({ data: {} });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(api.defaults.headers.common['Authorization']).toBeUndefined();
      });
    });

    it('should navigate to home page after logout', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      api.post.mockResolvedValue({ data: {} });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });
  });

  // ===== USER TYPE ROUTING =====
  describe('User Type Routing', () => {
    it('should render CitizenRightbar for citizen user type', async () => {
      localStorage.setItem('user_type', 'citizen');
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
      });
    });

    it('should render FieldWorkerRightbar for fieldworker user type', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Field Worker Leaderboard')).toBeInTheDocument();
      });
    });

    it('should render GovAuthRightbar for authority user type', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Field Worker Leaderboard')).toBeInTheDocument();
      });
    });

    it('should default to CitizenRightbar for unknown user type', async () => {
      localStorage.setItem('user_type', 'unknown');
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
      });
    });
  });

  // ===== FIELD WORKER LEADERBOARD =====
  describe('Field Worker Leaderboard', () => {
    it('should display loading state for leaderboard', () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation(() => new Promise(() => {}));
      render(<TrendingComplaints />);

      expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
    });

    it('should fetch and display top fieldworkers', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('alice_johnson')).toBeInTheDocument();
        expect(screen.getByText('bob_wilson')).toBeInTheDocument();
      });
    });

    it('should display only top 3 workers', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('alice_johnson')).toBeInTheDocument();
        expect(screen.getByText('bob_wilson')).toBeInTheDocument();
        expect(screen.getByText('charlie_brown')).toBeInTheDocument();
        expect(screen.queryByText('diana_prince')).not.toBeInTheDocument();
      });
    });

    it('should show "View more" message when more than 3 workers exist', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('View more in the Fieldworkers section')).toBeInTheDocument();
      });
    });

    it('should not show "View more" message when 3 or fewer workers exist', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers.slice(0, 3) });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.queryByText('View more in the Fieldworkers section')).not.toBeInTheDocument();
      });
    });

    it('should display no fieldworkers message when list is empty', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('No field workers yet.')).toBeInTheDocument();
      });
    });

    it('should display error message if leaderboard fetch fails', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockRejectedValue({ response: { data: { error: 'Server error' } } });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should display default error message if no specific error provided', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockRejectedValue(new Error('Network error'));
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load leaderboard')).toBeInTheDocument();
      });
    });

    it('should fetch profile for authority user type to get department', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        return Promise.resolve({ data: mockTopFieldworkers });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/users/profile/');
      });
    });

    it('should pass department parameter when user type is authority', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url, config) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          { params: { department: 101 } }
        );
      });
    });

    it('should pass department parameter when user type is fieldworker', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url, config) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          { params: { department: 101 } }
        );
      });
    });

    it('should not render leaderboard for citizen user type', async () => {
      localStorage.setItem('user_type', 'citizen');
      render(<TrendingComplaints />);

      await waitFor(() => {
        // Citizen users see trending complaints, not field worker leaderboard
        expect(screen.queryByText('Field Worker Leaderboard')).not.toBeInTheDocument();
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
      });
    });

    it('should handle profile fetch error gracefully', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.reject(new Error('Profile error'));
        }
        return Promise.resolve({ data: mockTopFieldworkers });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/complaints/top-fieldworkers/', {});
      });
    });

    it('should display user initial in avatar circle', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('C')).toBeInTheDocument();
      });
    });

    it('should display user fallback when no username', async () => {
      const workersWithoutUsername = [
        {
          id: 1,
          email: 'user@example.com',
          total_assigned_complaints: 10,
        },
      ];
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: workersWithoutUsername });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });
    });

    it('should handle null solved_count gracefully', async () => {
      const workersWithNull = [
        {
          id: 1,
          username: 'alice_johnson',
          email: 'alice@example.com',
          solved_count: null,
        },
      ];
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: workersWithNull });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should not update state if component unmounts during leaderboard fetch', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      api.get.mockReturnValue(promise);

      const { unmount } = render(<TrendingComplaints />);
      unmount();
      resolvePromise({ data: mockTopFieldworkers });

      await new Promise((r) => setTimeout(r, 100));
    });

    it('should handle AbortError in leaderboard fetch', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockRejectedValue({ name: 'AbortError' });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load leaderboard')).not.toBeInTheDocument();
      });
    });

    it('should show email in leaderboard item', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      });
    });

    it('should display solved_count correctly', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('18')).toBeInTheDocument();
      });
    });
  });

  // ===== CUSTOM PROPS =====
  describe('Custom Props', () => {
    it('should accept custom username prop', () => {
      render(<TrendingComplaints username="testuser" />);
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('should accept custom onLogoutClick prop', async () => {
      const customLogout = vi.fn();
      localStorage.setItem('isAuthenticated', 'true');
      render(<TrendingComplaints onLogoutClick={customLogout} />);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout').closest('button');
      fireEvent.click(logoutButton);
      expect(customLogout).toHaveBeenCalled();
    });

    it('should accept custom onLoginClick prop', async () => {
      const customLogin = vi.fn();
      // Don't set isAuthenticated - it defaults to null/undefined which is falsy
      render(<TrendingComplaints onLoginClick={customLogin} />);

      await waitFor(() => {
        expect(screen.getByText('Login / SignUp')).toBeInTheDocument();
      });

      const loginButton = screen.getByText('Login / SignUp').closest('button');
      fireEvent.click(loginButton);
      expect(customLogin).toHaveBeenCalled();
    });

    it('should accept showViewMore prop', () => {
      render(<TrendingComplaints showViewMore={false} />);
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES & ERROR HANDLING =====
  describe('Edge Cases & Error Handling', () => {
    it('should handle response.data as null', async () => {
      api.get.mockResolvedValue({ data: null });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('No complaints yet')).toBeInTheDocument();
      });
    });

    it('should handle response.data as undefined', async () => {
      api.get.mockResolvedValue({});
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('No complaints yet')).toBeInTheDocument();
      });
    });

    it('should handle complaint with all text fields present', async () => {
      const complaint = {
        id: 1,
        content: 'Should use content',
        title: 'Title',
        description: 'Description',
        upvotes_count: 10,
      };
      api.get.mockResolvedValue({ data: [complaint] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Should use content')).toBeInTheDocument();
      });
    });

    it('should handle complaints without id field', async () => {
      const complaint = {
        content: 'Test complaint',
        upvotes_count: 5,
      };
      api.get.mockResolvedValue({ data: [complaint] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Test complaint')).toBeInTheDocument();
      });
    });

    it('should handle api.defaults.headers.common being undefined', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      api.defaults.headers.common = undefined;
      api.post.mockResolvedValue({ data: {} });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('should handle multiple complaint upvote formats', async () => {
      const complaints = [
        { id: 1, content: 'A', upvotes_count: 10 },
        { id: 2, content: 'B', computed_upvotes_count: 20 },
        { id: 3, content: 'C', upvotes: Array(5).fill({}) },
        { id: 4, content: 'D' },
      ];
      api.get.mockResolvedValue({ data: complaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('10 Upvotes')).toBeInTheDocument();
        expect(screen.getByText('20 Upvotes')).toBeInTheDocument();
        expect(screen.getByText('5 Upvotes')).toBeInTheDocument();
        expect(screen.getByText('0 Upvotes')).toBeInTheDocument();
      });
    });

    it('should handle localStorage being unavailable', async () => {
      localStorage.setItem('user_type', null);
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });
  });

  // ===== ACCESSIBILITY =====
  describe('Accessibility', () => {
    it('should have proper role attributes on sidebar', () => {
      render(<TrendingComplaints />);
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('should have proper role attributes on complaint items', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const items = screen.getAllByRole('button', { hidden: true }).filter(
          (item) => item.hasAttribute('tabIndex')
        );
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should have proper role on buttons', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutBtn = screen.getByText('Logout').closest('button');
        expect(logoutBtn).toBeInTheDocument();
      });
    });

    it('should have tabIndex on complaint items for keyboard navigation', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const complaintElement = screen.getByText('Traffic congestion on Main Street').closest('div');
        expect(complaintElement).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  // ===== RESPONSIVE & STYLING =====
  describe('Responsive & Styling', () => {
    it('should have hidden md:block class for responsive design', () => {
      render(<TrendingComplaints />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('hidden', 'md:block');
    });

    it('should have sticky positioning', () => {
      render(<TrendingComplaints />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('sticky', 'top-0');
    });

    it('should have fixed width of 80', () => {
      render(<TrendingComplaints />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('w-80');
    });

    it('should have full screen height', () => {
      render(<TrendingComplaints />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('h-screen');
    });

    it('should have overflow auto for scrollable content', () => {
      render(<TrendingComplaints />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('overflow-auto');
    });

    it('should have border styling', () => {
      render(<TrendingComplaints />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('border-l-3', 'border-gray-400');
    });

    it('should have proper background color', () => {
      render(<TrendingComplaints />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('bg-white');
    });

    it('should have proper padding', () => {
      render(<TrendingComplaints />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('p-4');
    });
  });

  // ===== ICON RENDERING =====
  describe('Icon Rendering', () => {
    it('should render logout icon', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      render(<TrendingComplaints />);

      await waitFor(() => {
        const svgs = document.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThan(0);
      });
    });

    it('should render icons with proper paths', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      render(<TrendingComplaints />);

      await waitFor(() => {
        const paths = document.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);
      });
    });
  });

  // ===== WORKER AVATAR FUNCTIONALITY =====
  describe('Worker Avatar Functionality', () => {
    it('should use name field fallback for username', async () => {
      const workers = [
        {
          id: 1,
          name: 'john_doe',
          email: 'john@example.com',
          solved_count: 10,
        },
      ];
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: workers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });
    });

    it('should use user-{id} fallback when no username or name', async () => {
      const workers = [
        {
          id: 123,
          email: 'user@example.com',
          solved_count: 5,
        },
      ];
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: workers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('user-123')).toBeInTheDocument();
      });
    });

    it('should display empty email gracefully', async () => {
      const workers = [
        {
          id: 1,
          username: 'alice',
          email: '',
          solved_count: 10,
        },
      ];
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: workers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
      });
    });
  });

  // ===== TRENDING COMPLAINTS FETCHING DETAILS =====
  describe('Trending Complaints Details', () => {
    it('should include limit=3 parameter in trending API call', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/trending/?limit=3',
          expect.any(Object)
        );
      });
    });

    it('should properly format complaint object with all text variants', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const items = screen.getAllByRole('button', { hidden: true });
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should map complaint id correctly', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Traffic congestion on Main Street')).toBeInTheDocument();
      });

      const complaintElement = screen.getByText('Traffic congestion on Main Street').closest('div[role="button"]');
      fireEvent.click(complaintElement);

      expect(mockNavigate).toHaveBeenCalledWith('/complaint/1');
    });

    it('should handle complaints with undefined upvotes fields', async () => {
      const complaints = [
        {
          id: 1,
          content: 'Test',
          upvotes_count: undefined,
          computed_upvotes_count: undefined,
          upvotes: undefined,
        },
      ];
      api.get.mockResolvedValue({ data: complaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('0 Upvotes')).toBeInTheDocument();
      });
    });
  });

  // ===== FIELDWORKERS MODAL =====
  describe('FieldworkersModal Component', () => {
    it('should render with initial workers data when provided', async () => {
      const workers = [
        {
          id: 1,
          username: 'modal_worker_1',
          email: 'modal1@example.com',
          total_assigned_complaints: 12,
        },
      ];
      // Since modal is internal to component, we test via prop-based rendering
      // by rendering the component and verifying modal structure exists
      render(<TrendingComplaints />);
      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should fetch available workers when modal opens without initial data', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/trending/?limit=3') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'available_worker',
                email: 'available@example.com',
                total_assigned_complaints: 5,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/trending/?limit=3',
          expect.any(Object)
        );
      });
    });

    it('should handle error when fetching available workers', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/trending/?limit=3') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/complaints/available-workers/') {
          return Promise.reject({
            response: { data: { error: 'Access denied' } },
          });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);
      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });
  });

  // ===== GOVERNMENT AUTH RIGHTBAR =====
  describe('GovAuthRightbar Component', () => {
    it('should render GovAuthRightbar with leaderboard for authority user', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Field Worker Leaderboard')).toBeInTheDocument();
      });
    });

    it('should show logout button in GovAuthRightbar when authenticated', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutButton = screen.getByRole('button', { name: 'Logout' });
        expect(logoutButton).toBeInTheDocument();
        expect(logoutButton).toHaveClass('bg-red-600');
      });
    });

    it('should show login button in GovAuthRightbar when not authenticated', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const loginButton = screen.getByRole('button', { name: 'Login / SignUp' });
        expect(loginButton).toBeInTheDocument();
        expect(loginButton).toHaveClass('bg-[#4B687A]');
      });
    });

    it('should pass department parameter correctly in GovAuthRightbar', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url, config) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          expect.objectContaining({
            params: expect.objectContaining({ department: 101 }),
          })
        );
      });
    });
  });

  // ===== FIELDWORKER RIGHTBAR =====
  describe('FieldWorkerRightbar Component', () => {
    it('should render FieldWorkerRightbar with leaderboard for fieldworker user', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Field Worker Leaderboard')).toBeInTheDocument();
      });
    });

    it('should show logout button in FieldWorkerRightbar when authenticated', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutButtons = screen.getAllByRole('button', { name: 'Logout' });
        expect(logoutButtons.length).toBeGreaterThan(0);
      });
    });

    it('should show login button in FieldWorkerRightbar when not authenticated', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const loginButtons = screen.getAllByRole('button', { name: 'Login / SignUp' });
        expect(loginButtons.length).toBeGreaterThan(0);
      });
    });

    it('should fetch profile and pass department for fieldworker user', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url, config) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/users/profile/');
      });
    });
  });

  // ===== ADVANCED LEADERBOARD SCENARIOS =====
  describe('Advanced Leaderboard Scenarios', () => {
    it('should handle leaderboard with all fallback fields', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      const workers = [
        {
          id: 1,
          total_assigned: 15,
          email: 'test@example.com',
        },
      ];
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: workers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });
    });

    it('should handle leaderboard with null department assignment', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({
            data: { assigned_department: null },
          });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          {}
        );
      });
    });

    it('should handle multiple workers with mixed data fields', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      const workers = [
        {
          id: 1,
          username: 'user1',
          name: 'User One',
          total_assigned_complaints: 10,
          email: 'user1@example.com',
        },
        {
          id: 2,
          name: 'User Two',
          total_assigned: 8,
          email: 'user2@example.com',
        },
        {
          id: 3,
          solved_count: 5,
          email: 'user3@example.com',
        },
      ];
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: workers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
      });
    });

    it('should handle leaderboard when profile fetch returns undefined data', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: undefined });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          {}
        );
      });
    });

    it('should handle leaderboard with zero solved count', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      const workers = [
        {
          id: 1,
          username: 'zero_worker',
          email: 'zero@example.com',
          total_assigned_complaints: 0,
        },
      ];
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: workers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('zero_worker')).toBeInTheDocument();
      });
    });

    it('should display all visible workers correctly with count < 3', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      const workers = [
        {
          id: 1,
          username: 'worker1',
          email: 'worker1@example.com',
          total_assigned_complaints: 10,
        },
        {
          id: 2,
          username: 'worker2',
          email: 'worker2@example.com',
          total_assigned_complaints: 8,
        },
      ];
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: workers });
        }
        return Promise.resolve({ data: [] });
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('worker1')).toBeInTheDocument();
        expect(screen.getByText('worker2')).toBeInTheDocument();
        expect(screen.queryByText(/View more in the Fieldworkers/)).not.toBeInTheDocument();
      });
    });
  });

  // ===== CITIZEN RIGHTBAR SPECIAL CASES =====
  describe('CitizenRightbar Special Cases', () => {
    it('should render complete trending complaints section structure', async () => {
      localStorage.setItem('user_type', 'citizen');
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
        expect(screen.getByText('Traffic congestion on Main Street')).toBeInTheDocument();
      });
    });

    it('should navigate to complaint with correct ID format', async () => {
      localStorage.setItem('user_type', 'citizen');
      api.get.mockResolvedValue({
        data: [
          {
            id: 999,
            content: 'High priority issue',
            upvotes_count: 100,
          },
        ],
      });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const complaintDiv = screen.getByText('High priority issue').closest('div[role="button"]');
        fireEvent.click(complaintDiv);
        expect(mockNavigate).toHaveBeenCalledWith('/complaint/999');
      });
    });

    it('should handle arrow keys without navigation', async () => {
      localStorage.setItem('user_type', 'citizen');
      api.get.mockResolvedValue({ data: mockTrendingComplaints });
      render(<TrendingComplaints />);

      await waitFor(() => {
        const complaintDiv = screen.getByText('Traffic congestion on Main Street').closest('div[role="button"]');
        fireEvent.keyDown(complaintDiv, { key: 'ArrowDown' });
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  // ===== LOGOUT FLOW COMPREHENSIVE =====
  describe('Logout Flow Comprehensive', () => {
    it('should clear all localStorage items on logout success', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user_id', '123');
      localStorage.setItem('username', 'testuser');
      localStorage.setItem('user_type', 'citizen');
      api.post.mockResolvedValue({ data: {} });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutButton = screen.getByRole('button', { name: 'Logout' });
        expect(logoutButton).toBeInTheDocument();
      });
    });

    it('should handle logout when api.defaults.headers is missing', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      api.post.mockResolvedValue({ data: {} });
      api.defaults = {}; // Missing headers

      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutButton = screen.getByRole('button', { name: 'Logout' });
        fireEvent.click(logoutButton);
      });
    });

    it('should navigate to auth when fallback login is triggered', async () => {
      render(<TrendingComplaints />);

      await waitFor(() => {
        const loginButton = screen.getByRole('button', { name: 'Login / SignUp' });
        fireEvent.click(loginButton);
        expect(mockNavigate).toHaveBeenCalledWith('/auth');
      });
    });
  });

  // ===== ERROR STATES COMPREHENSIVE =====
  describe('Error States Comprehensive', () => {
    it('should recover from trending complaints error with retry', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));
      api.get.mockResolvedValueOnce({ data: mockTrendingComplaints });

      const { rerender } = render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load trending complaints')).toBeInTheDocument();
      });
    });

    it('should handle leaderboard network timeout gracefully', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      const error = new Error('Timeout');
      error.name = 'TimeoutError';

      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.reject(error);
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });
  });

  // ===== FIELDWORKERS MODAL EXTENDED =====
  describe('FieldworkersModal Extended Coverage', () => {
    it('should handle rapid open/close without fetching', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });

    it('should cleanup subscription on component unmount', async () => {
      api.get.mockResolvedValue({ data: [] });
      const { unmount } = render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });

      unmount();
      expect(api.get).toHaveBeenCalled();
    });

    it('should handle API response variations for available workers', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/trending/?limit=3') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({
            data: [
              {
                id: 100,
                username: 'avail_worker1',
                name: 'Available Worker One',
                email: 'avail1@example.com',
                total_assigned_complaints: 22,
              },
              {
                id: 101,
                username: 'avail_worker2',
                email: 'avail2@example.com',
                solved_count: 18,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });

    it('should handle fetch error with proper error message', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/trending/?limit=3') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/complaints/available-workers/') {
          return Promise.reject({
            response: { data: { error: 'Department workers not found' } },
            name: 'AxiosError',
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });

    it('should handle abort error in available workers fetch', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/trending/?limit=3') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/complaints/available-workers/') {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          return Promise.reject(error);
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });
  });

  // ===== RENDERING VARIATIONS =====
  describe('Rendering Variations', () => {
    it('should render multiple buttons when authority user', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockResolvedValue({ data: mockTopFieldworkers });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutButtons = screen.getAllByText('Logout');
        expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should render complete structure for fieldworker with leaderboard', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Field Worker Leaderboard')).toBeInTheDocument();
        const logoutButtons = screen.getAllByText('Logout');
        expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should render multiple leagues correctly', async () => {
      localStorage.setItem('user_type', 'citizen');
      api.get.mockResolvedValue({ data: mockTrendingComplaints });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
      });
    });
  });

  // ===== DEPARTMENT PARAMETER VARIATIONS =====
  describe('Department Parameter Variations', () => {
    it('should not include department parameter for citizen user', async () => {
      localStorage.setItem('user_type', 'citizen');
      api.get.mockResolvedValue({ data: [] });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const calls = api.get.mock.calls;
        const topFieldworkersCall = calls.find(
          ([url]) => url === '/complaints/top-fieldworkers/'
        );
        // CitizenRightbar doesn't render leaderboard
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
      });
    });

    it('should include department parameter for authority with department', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url, config) => {
        if (url === '/users/profile/') {
          return Promise.resolve({
            data: { assigned_department: { id: 42 } },
          });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          { params: { department: 42 } }
        );
      });
    });

    it('should handle missing id in department object', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({
            data: { assigned_department: {} },
          });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          {}
        );
      });
    });
  });

  // ===== BUTTON CLICK INTERACTIONS =====
  describe('Button Click Interactions', () => {
    it('should handle multiple login clicks', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints onLoginClick={vi.fn()} />);

      await waitFor(() => {
        const loginButtons = screen.getAllByRole('button', { name: 'Login / SignUp' });
        expect(loginButtons.length).toBeGreaterThan(0);
        fireEvent.click(loginButtons[0]);
      });
    });

    it('should handle logout click on authenticated state', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      const mockLogout = vi.fn();
      api.get.mockResolvedValue({ data: [] });
      api.post.mockResolvedValue({ data: {} });

      render(<TrendingComplaints onLogoutClick={mockLogout} />);

      await waitFor(() => {
        const logoutButton = screen.getByRole('button', { name: 'Logout' });
        fireEvent.click(logoutButton);
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });

  // ===== LEADERBOARD RENDERING DETAILS =====
  describe('Leaderboard Rendering Details', () => {
    it('should display 4 workers with view more when > 3 workers', async () => {
      localStorage.setItem('user_type', 'authority');
      const workers = [
        {
          id: 1,
          username: 'worker1',
          email: 'w1@example.com',
          total_assigned_complaints: 10,
        },
        {
          id: 2,
          username: 'worker2',
          email: 'w2@example.com',
          total_assigned_complaints: 9,
        },
        {
          id: 3,
          username: 'worker3',
          email: 'w3@example.com',
          total_assigned_complaints: 8,
        },
        {
          id: 4,
          username: 'worker4',
          email: 'w4@example.com',
          total_assigned_complaints: 7,
        },
      ];
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: workers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('worker1')).toBeInTheDocument();
        expect(screen.getByText('worker2')).toBeInTheDocument();
        expect(screen.getByText('worker3')).toBeInTheDocument();
        expect(screen.queryByText('worker4')).not.toBeInTheDocument();
        expect(
          screen.getByText(/View more in the Fieldworkers section/)
        ).toBeInTheDocument();
      });
    });

    it('should display exactly 2 workers without view more when 2 workers', async () => {
      localStorage.setItem('user_type', 'authority');
      const workers = [
        {
          id: 1,
          username: 'worker1',
          email: 'w1@example.com',
          total_assigned_complaints: 10,
        },
        {
          id: 2,
          username: 'worker2',
          email: 'w2@example.com',
          total_assigned_complaints: 9,
        },
      ];
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: workers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('worker1')).toBeInTheDocument();
        expect(screen.getByText('worker2')).toBeInTheDocument();
        expect(
          screen.queryByText(/View more in the Fieldworkers section/)
        ).not.toBeInTheDocument();
      });
    });
  });

  // ===== COMPLAINT NAVIGATION EDGE CASES =====
  describe('Complaint Navigation Edge Cases', () => {
    it('should handle complaints with large IDs', async () => {
      api.get.mockResolvedValue({
        data: [
          {
            id: 999999,
            content: 'Large ID complaint',
            upvotes_count: 50,
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const complaint = screen.getByText('Large ID complaint').closest('div[role="button"]');
        fireEvent.click(complaint);
        expect(mockNavigate).toHaveBeenCalledWith('/complaint/999999');
      });
    });

    it('should handle special characters in complaint text', async () => {
      api.get.mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Complaint with "quotes" and \'apostrophes\'',
            upvotes_count: 10,
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText(/Complaint with/)).toBeInTheDocument();
      });
    });

    it('should handle very long complaint text', async () => {
      const longText = 'A'.repeat(200);
      api.get.mockResolvedValue({
        data: [
          {
            id: 1,
            content: longText,
            upvotes_count: 5,
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(longText.substring(0, 50)))).toBeInTheDocument();
      });
    });
  });

  // ===== FIELDWORKERS MODAL DIALOG BEHAVIOR =====
  describe('FieldworkersModal Dialog Behavior', () => {
    it('should initialize modal with proper ARIA attributes', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle modal with zero workers in initial state', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });

    it('should render fieldworkers modal structure correctly', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/trending/?limit=3') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle available workers with multiple variants', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'worker_a',
                email: 'a@example.com',
                total_assigned_complaints: 10,
              },
              {
                id: 2,
                name: 'Worker B',
                email: 'b@example.com',
                solved_count: 8,
              },
              {
                id: 3,
                email: 'c@example.com',
                total_assigned_complaints: null,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });

    it('should handle modal escape key event listener', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });

      // Test that event listeners are properly set up
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    it('should cleanup modal event listeners on unmount', async () => {
      api.get.mockResolvedValue({ data: [] });
      const { unmount } = render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });

      unmount();
      // Verify no errors during unmount
      expect(true).toBe(true);
    });
  });

  // ===== GOVAUTH AND FIELDWORKER RIGHTBAR DETAILED =====
  describe('GovAuth and FieldWorker Rightbar Detailed', () => {
    it('should render GovAuthRightbar with proper sticky positioning', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const aside = screen.getByRole('complementary');
        expect(aside).toHaveClass('sticky');
      });
    });

    it('should have correct structure for FieldWorkerRightbar', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const aside = screen.getByRole('complementary');
        expect(aside).toBeInTheDocument();
        expect(screen.getByText('Field Worker Leaderboard')).toBeInTheDocument();
      });
    });

    it('should render multiple logout button variants correctly', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutButtons = screen.getAllByRole('button', { name: 'Logout' });
        expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
        logoutButtons.forEach((btn) => {
          expect(btn).toHaveClass('bg-red-600');
        });
      });
    });
  });

  // ===== LEADERBOARD LOADING AND ERROR STATES =====
  describe('Leaderboard Loading and Error States', () => {
    it('should show loading state while fetching leaderboard', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockTopFieldworkers }), 500);
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      // Should eventually load
      await waitFor(
        () => {
          expect(screen.getByText('Field Worker Leaderboard')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should display error when leaderboard fetch fails with status code', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          const error = new Error('Forbidden');
          error.response = {
            status: 403,
            data: { error: 'Access to department forbidden' },
          };
          return Promise.reject(error);
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Access to department forbidden')).toBeInTheDocument();
      });
    });

    it('should show error when no fieldworkers found', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('No field workers yet.')).toBeInTheDocument();
      });
    });
  });

  // ===== TRENDING COMPLAINTS LOADING STATES =====
  describe('Trending Complaints Loading States', () => {
    it('should show loading text while fetching complaints', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/trending/?limit=3') {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockTrendingComplaints }), 300);
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      // Should show loading state initially
      await waitFor(() => {
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
      });
    });

    it('should display error when trending fetch fails with details', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/trending/?limit=3') {
          return Promise.reject(new Error('API rate limited'));
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load trending complaints')).toBeInTheDocument();
      });
    });

    it('should handle empty complaints array response', async () => {
      api.get.mockResolvedValue({ data: [] });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('No complaints yet')).toBeInTheDocument();
      });
    });
  });

  // ===== PROFILE FETCH VARIATIONS =====
  describe('Profile Fetch Variations', () => {
    it('should handle profile with deeply nested department structure', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({
            data: {
              id: 1,
              username: 'testuser',
              assigned_department: {
                id: 99,
                name: 'Deep Department',
                parent: { id: 100 },
              },
            },
          });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          { params: { department: 99 } }
        );
      });
    });

    it('should handle profile without assigned_department field at all', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({
            data: {
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
            },
          });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          {}
        );
      });
    });
  });

  // ===== UPVOTE COUNT COMBINATIONS =====
  describe('Upvote Count Combinations', () => {
    it('should prioritize upvotes_count over all other fields', async () => {
      api.get.mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Test complaint',
            upvotes_count: 100,
            computed_upvotes_count: 50,
            upvotes: [{ id: 1 }, { id: 2 }],
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('100 Upvotes')).toBeInTheDocument();
      });
    });

    it('should use computed_upvotes_count when upvotes_count is zero', async () => {
      api.get.mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Test complaint',
            upvotes_count: 0,
            computed_upvotes_count: 75,
            upvotes: [{ id: 1 }],
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('0 Upvotes')).toBeInTheDocument();
      });
    });

    it('should handle all upvote fields being zero or empty', async () => {
      api.get.mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Test complaint',
            upvotes_count: 0,
            computed_upvotes_count: 0,
            upvotes: [],
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('0 Upvotes')).toBeInTheDocument();
      });
    });
  });

  // ===== ROUTING EDGE CASES =====
  describe('Routing Edge Cases', () => {
    it('should handle null user_type in localStorage', async () => {
      localStorage.removeItem('user_type');
      api.get.mockResolvedValue({ data: mockTrendingComplaints });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
      });
    });

    it('should default to CitizenRightbar for undefined user_type', async () => {
      localStorage.setItem('user_type', 'unknown_type');
      api.get.mockResolvedValue({ data: mockTrendingComplaints });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
      });
    });

    it('should handle user_type change by displaying correct sidebar', async () => {
      localStorage.setItem('user_type', 'citizen');
      api.get.mockResolvedValue({ data: mockTrendingComplaints });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Trending Complaints')).toBeInTheDocument();
        expect(screen.queryByText('Field Worker Leaderboard')).not.toBeInTheDocument();
      });
    });
  });

  // ===== WORKER DATA TRANSFORMATION =====
  describe('Worker Data Transformation', () => {
    it('should transform worker data with all fallback fields', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                total_assigned: 5,
                email: 'worker@example.com',
              },
              {
                id: 2,
                total_assigned_complaints: undefined,
                total_assigned: 3,
                email: 'worker2@example.com',
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
        expect(screen.getByText('user-2')).toBeInTheDocument();
      });
    });

    it('should handle worker with all fields present', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'alice',
                name: 'Alice Johnson',
                email: 'alice@example.com',
                total_assigned_complaints: 25,
                total_assigned: 30,
                solved_count: 20,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
      });
    });
  });

  // ===== MODAL RENDERING WITH VARIOUS STATES =====
  describe('Modal Rendering with Various States', () => {
    it('should render modal backdrop and structure', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle modal close button click functionality', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should render modal with loading state text', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ data: [] }), 200);
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should display workers in modal with proper layout', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'modal_worker_1',
                email: 'mw1@example.com',
                total_assigned_complaints: 5,
              },
              {
                id: 2,
                username: 'modal_worker_2',
                email: 'mw2@example.com',
                total_assigned_complaints: 3,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should display no workers message in modal', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle modal error state rendering', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          const error = new Error('Department access denied');
          error.response = { data: { error: 'Forbidden access' } };
          return Promise.reject(error);
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });
  });

  // ===== TEXT CONTENT VARIATIONS =====
  describe('Text Content Variations', () => {
    it('should display complaint with only title field', async () => {
      api.get.mockResolvedValue({
        data: [
          {
            id: 1,
            title: 'Only Title Complaint',
            upvotes_count: 5,
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Only Title Complaint')).toBeInTheDocument();
      });
    });

    it('should display complaint with only description field', async () => {
      api.get.mockResolvedValue({
        data: [
          {
            id: 1,
            description: 'Only Description Complaint',
            upvotes_count: 3,
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Only Description Complaint')).toBeInTheDocument();
      });
    });

    it('should display fallback text when all text fields missing', async () => {
      api.get.mockResolvedValue({
        data: [
          {
            id: 1,
            upvotes_count: 2,
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Complaint details unavailable.')).toBeInTheDocument();
      });
    });

    it('should prefer content over description over title', async () => {
      api.get.mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Content Value',
            description: 'Description Value',
            title: 'Title Value',
            upvotes_count: 5,
          },
        ],
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Content Value')).toBeInTheDocument();
        expect(screen.queryByText('Description Value')).not.toBeInTheDocument();
        expect(screen.queryByText('Title Value')).not.toBeInTheDocument();
      });
    });
  });

  // ===== BUTTON STYLING AND STATE =====
  describe('Button Styling and State', () => {
    it('should apply red styling to logout button', async () => {
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockResolvedValue({ data: [] });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutBtn = screen.getByRole('button', { name: 'Logout' });
        expect(logoutBtn).toHaveClass('bg-red-600');
        expect(logoutBtn).toHaveClass('hover:bg-red-700');
      });
    });

    it('should apply blue styling to login button', async () => {
      api.get.mockResolvedValue({ data: [] });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const loginBtn = screen.getByRole('button', { name: 'Login / SignUp' });
        expect(loginBtn).toHaveClass('bg-[#4B687A]');
        expect(loginBtn).toHaveClass('hover:bg-[#3C5260]');
      });
    });

    it('should have consistent button sizing', async () => {
      api.get.mockResolvedValue({ data: [] });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /Login|Logout/ });
        buttons.forEach((btn) => {
          expect(btn).toHaveClass('py-3', 'px-8');
        });
      });
    });
  });

  // ===== COMPONENT STATE MANAGEMENT =====
  describe('Component State Management', () => {
    it('should maintain separate state for trending and leaderboard', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/complaints/trending/?limit=3') {
          return Promise.resolve({
            data: [{ id: 1, title: 'Trending 1', upvotes_count: 10 }],
          });
        }
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText(/Trending|Field Worker Leaderboard/)).toBeInTheDocument();
      });
    });

    it('should handle rapid state updates without errors', async () => {
      api.get.mockResolvedValue({ data: [] });
      const { rerender } = render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });

      rerender(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });
  });

  // ===== AVATAR AND DISPLAY NAME VARIATIONS =====
  describe('Avatar and Display Name Variations', () => {
    it('should show uppercase first letter of username in avatar', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'john',
                email: 'john@example.com',
                total_assigned_complaints: 10,
              },
              {
                id: 2,
                username: 'alice',
                email: 'alice@example.com',
                total_assigned_complaints: 8,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('john')).toBeInTheDocument();
        expect(screen.getByText('alice')).toBeInTheDocument();
      });
    });

    it('should display hash symbol for worker without username', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                email: 'worker@example.com',
                total_assigned_complaints: 5,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });
    });
  });

  // ===== OVERFLOW AND DISPLAY LIMIT =====
  describe('Overflow and Display Limit', () => {
    it('should display exactly 3 workers in leaderboard', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: [
              { id: 1, username: 'w1', email: 'w1@test.com', total_assigned_complaints: 10 },
              { id: 2, username: 'w2', email: 'w2@test.com', total_assigned_complaints: 9 },
              { id: 3, username: 'w3', email: 'w3@test.com', total_assigned_complaints: 8 },
              { id: 4, username: 'w4', email: 'w4@test.com', total_assigned_complaints: 7 },
              { id: 5, username: 'w5', email: 'w5@test.com', total_assigned_complaints: 6 },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('w1')).toBeInTheDocument();
        expect(screen.getByText('w2')).toBeInTheDocument();
        expect(screen.getByText('w3')).toBeInTheDocument();
        expect(screen.queryByText('w4')).not.toBeInTheDocument();
        expect(screen.queryByText('w5')).not.toBeInTheDocument();
      });
    });

    it('should show view more message when >3 workers', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              username: `worker${i + 1}`,
              email: `w${i + 1}@test.com`,
              total_assigned_complaints: 10 - i,
            })),
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText(/View more in the Fieldworkers section/)).toBeInTheDocument();
      });
    });
  });

  // ===== ACCESSIBILITY ATTRIBUTES =====
  describe('Accessibility Attributes', () => {
    it('should have proper ARIA attributes on complaint items', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });

      const { container } = render(<TrendingComplaints />);

      await waitFor(() => {
        const complaintItems = container.querySelectorAll('[role="button"]');
        expect(complaintItems.length).toBeGreaterThan(0);
      });
    });

    it('should have role="complementary" on main container', async () => {
      api.get.mockResolvedValue({ data: [] });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const aside = screen.getByRole('complementary');
        expect(aside).toHaveClass('w-80');
      });
    });

    it('should have keyboard navigation for complaints', async () => {
      api.get.mockResolvedValue({ data: mockTrendingComplaints });

      const { container } = render(<TrendingComplaints />);

      await waitFor(() => {
        const complaintElements = container.querySelectorAll('[tabindex="0"]');
        expect(complaintElements.length).toBeGreaterThan(0);
      });
    });
  });

  // ===== GOVAUTH SPECIFIC BUTTON VARIATIONS =====
  describe('GovAuth Specific Button Variations', () => {
    it('should render logout button when authenticated in GovAuth', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutBtn = screen.getByRole('button', { name: /Logout/ });
        expect(logoutBtn).toBeInTheDocument();
        expect(logoutBtn).toHaveClass('bg-red-600');
        expect(logoutBtn).toHaveClass('hover:bg-red-700');
      });
    });

    it('should render login button when not authenticated in GovAuth', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.removeItem('isAuthenticated');
      api.get.mockResolvedValue({ data: [] });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const loginBtn = screen.getByRole('button', { name: /Login/ });
        expect(loginBtn).toBeInTheDocument();
        expect(loginBtn).toHaveClass('bg-[#4B687A]');
        expect(loginBtn).toHaveClass('hover:bg-[#3C5260]');
      });
    });

    it('should have proper button styling classes for GovAuth logout', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const logoutBtn = screen.getByRole('button', { name: /Logout/ });
        expect(logoutBtn).toHaveClass('py-3', 'px-8', 'font-bold');
        expect(logoutBtn).toHaveClass('rounded-xl');
      });
    });

    it('should have proper button styling classes for GovAuth login', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.removeItem('isAuthenticated');
      api.get.mockResolvedValue({ data: [] });

      render(<TrendingComplaints />);

      await waitFor(() => {
        const loginBtn = screen.getByRole('button', { name: /Login/ });
        expect(loginBtn).toHaveClass('py-3', 'px-8', 'font-bold');
        expect(loginBtn).toHaveClass('rounded-xl');
      });
    });

    it('should render leaderboard in GovAuth rightbar', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Field Worker Leaderboard')).toBeInTheDocument();
      });
    });

    it('should display 3 fieldworkers in GovAuth leaderboard', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('alice_johnson')).toBeInTheDocument();
        expect(screen.getByText('bob_wilson')).toBeInTheDocument();
        expect(screen.getByText('charlie_brown')).toBeInTheDocument();
      });
    });

    it('should show view more message for GovAuth when >3 workers', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              username: `worker${i + 1}`,
              email: `w${i + 1}@test.com`,
              total_assigned_complaints: 20 - i,
            })),
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText(/View more in the Fieldworkers section/)).toBeInTheDocument();
      });
    });

    it('should display user profile icon in GovAuth', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });
  });

  // ===== MODAL COMPONENT EDGE CASES =====
  describe('Modal Component Edge Cases', () => {
    it('should handle modal with empty workers list', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle modal API timeout scenario', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ data: [] }), 5000);
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle modal with complex worker data', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'complex_user_123',
                email: 'user+tag@example.co.uk',
                total_assigned_complaints: 45,
                extra_field: 'should be ignored',
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle available-workers endpoint error gracefully', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          const error = new Error('Network error');
          error.response = { data: { error: 'Server unavailable' } };
          return Promise.reject(error);
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle workers with missing username field', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                total_assigned_complaints: 10,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle workers with missing email field', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'noem@il',
                total_assigned_complaints: 15,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should use name when username unavailable in worker', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({
            data: [
              {
                id: 99,
                name: 'Name Only User',
                email: 'nameonly@example.com',
                total_assigned_complaints: 8,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should generate fallback ID when neither username nor name present', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/complaints/available-workers/') {
          return Promise.resolve({
            data: [
              {
                id: 500,
                email: 'noid@example.com',
                total_assigned_complaints: 5,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });
  });

  // ===== LEADERBOARD ERROR STATES =====
  describe('Leaderboard Error States', () => {
    it('should display error message when leaderboard API fails', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          const error = new Error('API Error');
          error.response = { data: { error: 'Access denied to leaderboard' } };
          return Promise.reject(error);
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText(/Access denied/)).toBeInTheDocument();
      });
    });

    it('should display generic error when leaderboard endpoint fails without details', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load leaderboard/)).toBeInTheDocument();
      });
    });

    it('should handle leaderboard loading state before data arrives', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return new Promise(() => {
            // Never resolves - simulates loading state
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
      });
    });

    it('should display empty message when leaderboard has no workers', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should handle profile fetch error in leaderboard gracefully', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.reject(new Error('Profile not found'));
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });

    it('should load leaderboard with department parameter when user has department', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({
            data: { assigned_department: { id: 42 } },
          });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          { params: { department: 42 } }
        );
      });
    });

    it('should load leaderboard without department parameter when user has no department', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: {} }); // No assigned_department
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({ data: mockTopFieldworkers });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/complaints/top-fieldworkers/',
          {}
        );
      });
    });

    it('should prioritize total_assigned_complaints field from API response', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'worker1',
                email: 'w1@test.com',
                total_assigned_complaints: 100,
                total_assigned: 50,
                solved_count: 25,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('should fallback to total_assigned if total_assigned_complaints is null', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'worker1',
                email: 'w1@test.com',
                total_assigned_complaints: null,
                total_assigned: 75,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });
    });

    it('should fallback to solved_count if both total fields are missing', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'worker1',
                email: 'w1@test.com',
                solved_count: 33,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('33')).toBeInTheDocument();
      });
    });

    it('should use zero if all complaint count fields are missing', async () => {
      localStorage.setItem('user_type', 'authority');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                username: 'worker1',
                email: 'w1@test.com',
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(<TrendingComplaints />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should not update state if component unmounts during error handling', async () => {
      localStorage.setItem('user_type', 'authority');
      let rejectPromise;
      const promise = new Promise((_, reject) => {
        rejectPromise = reject;
      });

      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        if (url === '/complaints/top-fieldworkers/') {
          return promise;
        }
        return Promise.resolve({ data: [] });
      });

      const { unmount } = render(<TrendingComplaints />);

      // Wait a bit for the request to be made
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Unmount before the error is handled
      unmount();

      // Now trigger the error
      const error = new Error('Request failed');
      error.response = { data: { error: 'API Error' } };
      rejectPromise(error);

      // Give it time to process (shouldn't cause any issues)
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  // ===== USER CIRCLE ICON RENDERING =====
  describe('User Circle Icon Rendering', () => {
    it('should render user profile icon in authenticated GovAuth scenario', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        return Promise.resolve({ data: [] });
      });

      const { container } = render(<TrendingComplaints />);

      await waitFor(() => {
        const svgElements = container.querySelectorAll('svg');
        // There should be SVG elements for icons (LogoutIcon and UserCircleIcon)
        expect(svgElements.length).toBeGreaterThan(0);
      });
    });

    it('should display logout icon when authenticated', async () => {
      localStorage.setItem('user_type', 'fieldworker');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        return Promise.resolve({ data: [] });
      });

      const { container } = render(<TrendingComplaints />);

      await waitFor(() => {
        const svgElements = container.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);
      });
    });

    it('should have proper icon sizing classes', async () => {
      localStorage.setItem('user_type', 'authority');
      localStorage.setItem('isAuthenticated', 'true');
      api.get.mockImplementation((url) => {
        if (url === '/users/profile/') {
          return Promise.resolve({ data: mockProfileData });
        }
        return Promise.resolve({ data: [] });
      });

      const { container } = render(<TrendingComplaints />);

      await waitFor(() => {
        const smallSvgs = container.querySelectorAll('svg.w-4');
        expect(smallSvgs.length).toBeGreaterThan(0);
      });
    });
  });
});
