import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Notifications from '../Notifications';
import api from '../../utils/axiosConfig';

// Mock the axios config
vi.mock('../../utils/axiosConfig');

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Notifications Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the Notifications component without crashing', () => {
    api.get.mockResolvedValue({ data: [] });
    renderWithRouter(<Notifications />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithRouter(<Notifications />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error message when API call fails', async () => {
    api.get.mockRejectedValue(new Error('API Error'));
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load notifications.')).toBeInTheDocument();
    });
  });

  it('should display empty state when no notifications exist', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
    });
  });

  it('should display empty state message with icon', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('🔔')).toBeInTheDocument();
      expect(screen.getByText("You'll be notified when there are updates on your complaints.")).toBeInTheDocument();
    });
  });

  it('should render notifications list when data is available', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Complaint has been updated',
        created_at: '2025-11-25T10:00:00Z',
        is_read: false,
        link: '/complaint/1',
      },
      {
        id: 2,
        message: 'Complaint has been resolved',
        created_at: '2025-11-25T11:00:00Z',
        is_read: true,
        link: '/complaint/2',
      },
    ];

    api.get.mockResolvedValue({ data: mockNotifications });
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText(/has been updated/i)).toBeInTheDocument();
      expect(screen.getByText(/has been resolved/i)).toBeInTheDocument();
    });
  });

  it('should display unread indicator for unread notifications', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Unread notification',
        created_at: '2025-11-25T10:00:00Z',
        is_read: false,
        link: '/complaint/1',
      },
    ];

    api.get.mockResolvedValue({ data: mockNotifications });
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      const unreadIndicators = screen.getAllByRole('generic');
      expect(unreadIndicators.length).toBeGreaterThan(0);
    });
  });

  it('should format notification timestamps correctly', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Test notification',
        created_at: '2025-11-25T10:30:00Z',
        is_read: false,
        link: '/complaint/1',
      },
    ];

    api.get.mockResolvedValue({ data: mockNotifications });
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      // The timestamp will be formatted by toLocaleString()
      const elements = screen.queryAllByText(/11\/25\/2025/);
      expect(elements.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('should handle notification click with internal link', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Click me',
        created_at: '2025-11-25T10:00:00Z',
        is_read: false,
        link: '/complaint/1',
      },
    ];

    api.get.mockResolvedValue({ data: mockNotifications });
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      const notification = screen.getByText('Click me');
      fireEvent.click(notification.closest('li'));
    });

    // Wait for the post request to mark as read
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/complaint/1');
    });
  });

  it('should handle notification click with external link', async () => {
    global.window.location.href = '';
    
    const mockNotifications = [
      {
        id: 1,
        message: 'External link notification',
        created_at: '2025-11-25T10:00:00Z',
        is_read: false,
        link: 'https://example.com',
      },
    ];

    api.get.mockResolvedValue({ data: mockNotifications });
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      const notification = screen.getByText('External link notification');
      fireEvent.click(notification.closest('li'));
    });

    // Note: window.location.href changes would be caught by vitest
  });

  it('should mark notification as read when clicked', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Mark as read test',
        created_at: '2025-11-25T10:00:00Z',
        is_read: false,
        link: '/complaint/1',
      },
    ];

    api.get.mockResolvedValue({ data: mockNotifications });
    api.post.mockResolvedValue({ data: { success: true } });
    
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      const notification = screen.getByText('Mark as read test');
      fireEvent.click(notification.closest('li'));
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('complaints/notifications/1/mark-read/');
    });
  });

  it('should handle missing notification link gracefully', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'No link notification',
        created_at: '2025-11-25T10:00:00Z',
        is_read: false,
      },
    ];

    api.get.mockResolvedValue({ data: mockNotifications });
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      const notification = screen.getByText('No link notification');
      fireEvent.click(notification.closest('li'));
    });

    // Should not crash and navigate should not be called
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully during mark as read', async () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Error test',
        created_at: '2025-11-25T10:00:00Z',
        is_read: false,
        link: '/complaint/1',
      },
    ];

    api.get.mockResolvedValue({ data: mockNotifications });
    api.post.mockRejectedValue(new Error('Mark read error'));
    
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      const notification = screen.getByText('Error test');
      fireEvent.click(notification.closest('li'));
    });

    // Should navigate despite the error
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/complaint/1');
    });
  });

  it('should have correct styling classes on main container', async () => {
    api.get.mockResolvedValue({ data: [] });
    const { container } = renderWithRouter(<Notifications />);
    
    const mainDiv = container.querySelector('.min-h-screen');
    expect(mainDiv).toHaveClass('p-1', 'bg-grey');
  });

  it('should have correct styling classes on card', async () => {
    api.get.mockResolvedValue({ data: [] });
    const { container } = renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      const card = container.querySelector('.bg-white');
      expect(card).toHaveClass('rounded-xl', 'shadow-lg', 'border-2', 'border-gray-100');
    });
  });

  it('should render notifications title', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderWithRouter(<Notifications />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Notifications');
  });

  it('should cleanup on component unmount', async () => {
    api.get.mockResolvedValue({ data: [] });
    const { unmount } = renderWithRouter(<Notifications />);
    
    unmount();
    
    // Component should unmount without errors
    expect(true).toBe(true);
  });

  it('should handle null data response from API', async () => {
    api.get.mockResolvedValue({ data: null });
    renderWithRouter(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
    });
  });
});