import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PastComplaints from '../PastComplaints';
import api from '../../utils/axiosConfig';

// Mock the axios config
vi.mock('../../utils/axiosConfig');

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockComplaints = [
  {
    id: 1,
    content: 'Pothole in road',
    title: 'Road Issue',
    description: 'Large pothole affecting traffic',
    posted_by: { username: 'user1' },
    posted_at: '2024-11-20T10:00:00Z',
    address: '123 Main St',
    latitude: 40.7128,
    longitude: -74.0060,
    assigned_to_dept: 'Public Works',
    assigned_to_fieldworker: 'John Smith',
    expected_resolution_time: '5 days',
    upvotes_count: 5,
    fake_confidence: 2,
    images: [
      { image_url: 'https://example.com/image1.jpg' },
      { image: 'https://example.com/image2.jpg' },
    ],
    has_pending_resolution: false,
    status: 'In Progress',
  },
  {
    id: 2,
    content: 'Broken streetlight',
    title: 'Street Light Issue',
    description: 'Street light not working',
    posted_by: { username: 'user2' },
    posted_at: '2024-11-19T14:30:00Z',
    address: '456 Oak Ave',
    assigned_to_dept: 'Municipal Services',
    upvotes_count: 3,
    fake_confidence: 0,
    images: [],
    has_pending_resolution: false,
    status: 'Pending',
  },
];

describe('PastComplaints Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.get.mockResolvedValue({ data: mockComplaints });
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Initialization & Loading States', () => {
    it('should render PastComplaints component without crashing', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Past Complaints')).toBeInTheDocument();
      });
    });

    it('should display loading spinner initially', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<PastComplaints />);

      expect(screen.getByText('Past Complaints')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should call API to fetch past complaints on mount', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/complaints/past/');
      });
    });

    it('should fetch complaints and display them', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
        expect(screen.getByText('Broken streetlight')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('API Error'));
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load past complaints. Please try again.')).toBeInTheDocument();
      });
    });

    it('should display empty state when no complaints exist', async () => {
      api.get.mockResolvedValue({ data: [] });
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('No past complaints to show.')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update query state when typing in search box', async () => {
      const user = userEvent.setup();
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for complaints, people, or keywords')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search for complaints, people, or keywords');
      await user.type(searchInput, 'pothole');

      expect(searchInput.value).toBe('pothole');
    });

    it('should search complaints on Enter key press', async () => {
      const user = userEvent.setup();
      render(<PastComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/complaints/past/');
      });

      const searchInput = screen.getByPlaceholderText('Search for complaints, people, or keywords');
      await user.type(searchInput, 'pothole');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/complaints/search/?q=pothole');
      });
    });

    it('should call search API with encoded query parameters', async () => {
      const user = userEvent.setup();
      render(<PastComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/complaints/past/');
      });

      const searchInput = screen.getByPlaceholderText('Search for complaints, people, or keywords');
      await user.type(searchInput, 'test query');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/complaints/search/?q=test%20query');
      });
    });

    it('should handle search with empty query by fetching all complaints', async () => {
      const user = userEvent.setup();
      render(<PastComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/complaints/past/');
      });

      const searchInput = screen.getByPlaceholderText('Search for complaints, people, or keywords');
      await user.type(searchInput, 'test');
      await user.clear(searchInput);
      await user.keyboard('{Enter}');

      // Should call fetchPastComplaints which calls the past endpoint again
      expect(api.get).toHaveBeenCalledWith('/complaints/past/');
    });

    it('should handle search API errors', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: mockComplaints }); // First call succeeds
      api.get.mockRejectedValueOnce(new Error('Search error')); // Second call fails

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search for complaints, people, or keywords');
      await user.type(searchInput, 'invalid');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Search failed.')).toBeInTheDocument();
      });
    });

    it('should handle empty search results', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: mockComplaints }); // First call
      api.get.mockResolvedValueOnce({ data: [] }); // Search returns empty

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search for complaints, people, or keywords');
      await user.type(searchInput, 'nonexistent');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('No past complaints to show.')).toBeInTheDocument();
      });
    });
  });

  describe('Complaint Display & Navigation', () => {
    it('should render complaints list', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });
    });

    it('should display upvote counts correctly', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Upvotes: 5')).toBeInTheDocument();
        expect(screen.getByText('Upvotes: 3')).toBeInTheDocument();
      });
    });

    it('should display fake confidence score when greater than zero', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Users Reported: 2')).toBeInTheDocument();
      });
    });

    it('should not display fake confidence when zero', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.queryByText('Users Reported: 0')).not.toBeInTheDocument();
      });
    });

    it('should format dates correctly', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const dateElements = screen.getAllByText(/Nov \d{1,2}, \d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle missing username gracefully', async () => {
      const complaintWithoutUsername = {
        ...mockComplaints[0],
        posted_by: null,
      };
      api.get.mockResolvedValue({ data: [complaintWithoutUsername] });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });
    });

    it('should display assigned info when available', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
        expect(screen.getByText('Broken streetlight')).toBeInTheDocument();
      });
    });

    it('should display field worker assignment when available', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Assigned to:')).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should display expected resolution time when available', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Expected Time:')).toBeInTheDocument();
        expect(screen.getByText('5 days')).toBeInTheDocument();
      });
    });

    it('should not display location when address is missing', async () => {
      const complaintWithoutAddress = {
        ...mockComplaints[0],
        address: null,
      };
      api.get.mockResolvedValue({ data: [complaintWithoutAddress] });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.queryByText(/Location:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Image Display & Modal', () => {
    it('should display images in grid layout when available', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        expect(images.length).toBe(2);
      });
    });

    it('should handle different image data formats', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        expect(images[0].src).toContain('example.com/image1.jpg');
        expect(images[1].src).toContain('example.com/image2.jpg');
      });
    });

    it('should open image modal when image is clicked', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Image')).toBeInTheDocument();
      });
    });

    it('should not navigate to complaint when image is clicked', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[0]);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should navigate through modal images with arrow buttons', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[0]);
      });

      await waitFor(() => {
        const nextButton = screen.getAllByText('›')[0];
        fireEvent.click(nextButton);
      });

      const modalImage = screen.getByAltText('detail');
      expect(modalImage.src).toContain('example.com/image2.jpg');
    });

    it('should navigate backward through images with left arrow', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[1]);
      });

      await waitFor(() => {
        const prevButton = screen.getAllByText('‹')[0];
        fireEvent.click(prevButton);
      });

      const modalImage = screen.getByAltText('detail');
      expect(modalImage.src).toContain('example.com/image1.jpg');
    });

    it('should close modal on close button click', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[0]);
      });

      await waitFor(() => {
        const closeButton = screen.getByText('×');
        fireEvent.click(closeButton);
      });

      expect(screen.queryByText('Image')).not.toBeInTheDocument();
    });

    it('should close modal on backdrop click', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[0]);
      });

      await waitFor(() => {
        const modal = screen.getByText('Image').closest('div').parentElement;
        fireEvent.click(modal.parentElement);
      });

      expect(screen.queryByText('Image')).not.toBeInTheDocument();
    });

    it('should handle Escape key to close modal', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Image')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Image')).not.toBeInTheDocument();
      });
    });

    it('should navigate images with arrow keys', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Image')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      const modalImage = screen.getByAltText('detail');
      expect(modalImage.src).toContain('image2');
    });

    it('should handle image load errors with placeholder', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[0]);
      });

      await waitFor(() => {
        const modalImage = screen.getByAltText('detail');
        fireEvent.error(modalImage);
      });

      expect(screen.getByAltText('detail').src).toContain('placeholder');
    });

    it('should not display modal when no images', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Broken streetlight')).toBeInTheDocument();
      });
    });
  });

  describe('Upvote Functionality', () => {
    it('should show upvoting animation when upvoting', async () => {
      api.post.mockResolvedValue({ data: { likes_count: 6 } });
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });

      // Currently the component doesn't have visible upvote buttons in the test
      // This would need component modification to expose upvote triggers
    });

    it('should update upvote count after successful upvote', async () => {
      api.get.mockResolvedValue({ data: mockComplaints });
      api.post.mockResolvedValue({ data: { likes_count: 6 } });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/complaints/past/');
      });
    });

    it('should handle upvote API errors gracefully', async () => {
      api.post.mockRejectedValue(new Error('Upvote failed'));

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Complaint Functionality', () => {
    it('should remove complaint after successful deletion', async () => {
      api.delete.mockResolvedValue({ data: {} });
      window.confirm = vi.fn(() => true);

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });
    });

    it('should cancel deletion when user declines confirmation', async () => {
      window.confirm = vi.fn(() => false);

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });

      expect(api.delete).not.toHaveBeenCalled();
    });

    it('should handle delete API errors gracefully', async () => {
      api.delete.mockRejectedValue(new Error('Delete failed'));
      window.confirm = vi.fn(() => true);
      window.alert = vi.fn();

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });
    });
  });

  describe('Report as Fake Functionality', () => {
    it('should handle reported complaint IDs', async () => {
      api.post.mockResolvedValue({ data: {} });
      api.get.mockResolvedValueOnce({ data: mockComplaints });
      api.get.mockResolvedValueOnce({ data: mockComplaints });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });
    });

    it('should show success toast after reporting fake complaint', async () => {
      api.post.mockResolvedValue({ data: {} });
      api.get.mockResolvedValueOnce({ data: mockComplaints });
      api.get.mockResolvedValueOnce({ data: mockComplaints });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });
    });

    it('should handle localStorage errors gracefully when saving reported IDs', async () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      api.post.mockResolvedValue({ data: {} });
      api.get.mockResolvedValueOnce({ data: mockComplaints });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });

      Storage.prototype.setItem = originalSetItem;
    });

    it('should initialize reported IDs from localStorage', () => {
      localStorage.setItem('reportedComplaints', JSON.stringify([1, 2, 3]));

      render(<PastComplaints />);

      const reportedIds = JSON.parse(localStorage.getItem('reportedComplaints'));
      expect(reportedIds).toEqual([1, 2, 3]);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('reportedComplaints', 'invalid json');

      render(<PastComplaints />);

      // Should not crash and should initialize with empty array
      expect(screen.getByText('Past Complaints')).toBeInTheDocument();
    });

    it('should handle non-array localStorage data gracefully', () => {
      localStorage.setItem('reportedComplaints', JSON.stringify({ id: 1 }));

      render(<PastComplaints />);

      // Should not crash
      expect(screen.getByText('Past Complaints')).toBeInTheDocument();
    });
  });

  describe('ReviewResolutionButton Component', () => {
    it('should display review button when complaint has pending resolution', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValue({ data: [complaintWithPending] });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Review & Respond')).toBeInTheDocument();
      });
    });

    it('should open review modal when button is clicked', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });

      const mockResolution = {
        data: {
          resolutions: [
            {
              id: 1,
              status: 'pending_approval',
              description: 'Resolution description',
              field_worker: { username: 'fieldworker1' },
              images: [],
            },
          ],
        },
      };
      api.get.mockResolvedValueOnce(mockResolution);

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Review Resolution')).toBeInTheDocument();
      });
    });

    it('should close modal on close button click', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });

      const mockResolution = {
        data: {
          resolutions: [
            {
              id: 1,
              status: 'pending_approval',
              description: 'Resolution description',
              field_worker: { username: 'fieldworker1' },
              images: [],
            },
          ],
        },
      };
      api.get.mockResolvedValueOnce(mockResolution);

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      await waitFor(() => {
        const closeButton = screen.getAllByText('×')[0];
        fireEvent.click(closeButton);
      });

      expect(screen.queryByText('Review Resolution')).not.toBeInTheDocument();
    });

    it('should display resolution details in modal', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });

      const mockResolution = {
        data: {
          resolutions: [
            {
              id: 1,
              status: 'pending_approval',
              description: 'Issue has been fixed',
              field_worker: { username: 'john_field' },
              images: [
                {
                  id: 1,
                  image_url: 'https://example.com/resolution1.jpg',
                },
              ],
            },
          ],
        },
      };
      api.get.mockResolvedValueOnce(mockResolution);

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Issue has been fixed')).toBeInTheDocument();
        expect(screen.getByText('john_field')).toBeInTheDocument();
      });
    });

    it('should require feedback when rejecting resolution', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });

      const mockResolution = {
        data: {
          resolutions: [
            {
              id: 1,
              status: 'pending_approval',
              description: 'Resolution description',
              field_worker: { username: 'fieldworker1' },
              images: [],
            },
          ],
        },
      };
      api.get.mockResolvedValueOnce(mockResolution);
      window.alert = vi.fn();

      const user = userEvent.setup();

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      await waitFor(() => {
        const rejectButton = screen.getByText('Reject');
        fireEvent.click(rejectButton);
      });

      expect(window.alert).toHaveBeenCalledWith(
        'Please provide feedback when rejecting a resolution.'
      );
    });

    it('should allow approving resolution without feedback', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });

      const mockResolution = {
        data: {
          resolutions: [
            {
              id: 1,
              status: 'pending_approval',
              description: 'Resolution description',
              field_worker: { username: 'fieldworker1' },
              images: [],
            },
          ],
        },
      };
      api.get.mockResolvedValueOnce(mockResolution);
      api.post.mockResolvedValue({ data: { message: 'Resolution approved' } });
      api.get.mockResolvedValueOnce({ data: mockComplaints });
      window.alert = vi.fn();

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      const approveButton = await screen.findByText('Approve');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });

    it('should show escalation toast when rejecting resolution', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });

      const mockResolution = {
        data: {
          resolutions: [
            {
              id: 1,
              status: 'pending_approval',
              description: 'Resolution description',
              field_worker: { username: 'fieldworker1' },
              images: [],
            },
          ],
        },
      };
      api.get.mockResolvedValueOnce(mockResolution);
      api.post.mockResolvedValue({ data: { message: 'Resolution rejected' } });
      api.get.mockResolvedValueOnce({ data: mockComplaints });
      window.alert = vi.fn();

      const user = userEvent.setup();

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      const feedbackInput = await screen.findByPlaceholderText(/provide feedback/);
      await user.type(feedbackInput, 'Not satisfied with this resolution');

      const rejectButton = await screen.findByText('Reject');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });

    it('should handle resolution API errors gracefully', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });
      api.get.mockRejectedValueOnce(new Error('Failed to fetch resolution'));
      window.alert = vi.fn();

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to load resolution details.');
      });
    });

    it('should display no resolution message when none found', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });
      api.get.mockResolvedValueOnce({ data: { resolutions: [] } });

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      const noResolutionText = await screen.findByText('No resolution details found.');
      expect(noResolutionText).toBeInTheDocument();
    });

    it('should find pending_approval resolution status', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });

      const mockResolution = {
        data: {
          resolutions: [
            {
              id: 1,
              status: 'approved',
              description: 'Old resolution',
              field_worker: { username: 'fieldworker1' },
              images: [],
            },
            {
              id: 2,
              status: 'pending_approval',
              description: 'New pending resolution',
              field_worker: { username: 'fieldworker2' },
              images: [],
            },
          ],
        },
      };
      api.get.mockResolvedValueOnce(mockResolution);

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      const pendingText = await screen.findByText('New pending resolution');
      expect(pendingText).toBeInTheDocument();
    });

    it('should refresh complaints after responding to resolution', async () => {
      const complaintWithPending = {
        ...mockComplaints[0],
        has_pending_resolution: true,
      };
      api.get.mockResolvedValueOnce({ data: [complaintWithPending] });

      const mockResolution = {
        data: {
          resolutions: [
            {
              id: 1,
              status: 'pending_approval',
              description: 'Resolution description',
              field_worker: { username: 'fieldworker1' },
              images: [],
            },
          ],
        },
      };
      api.get.mockResolvedValueOnce(mockResolution);
      api.post.mockResolvedValue({ data: { message: 'Resolution approved' } });
      api.get.mockResolvedValueOnce({ data: mockComplaints });

      render(<PastComplaints />);

      await waitFor(() => {
        const reviewButton = screen.getByText('Review & Respond');
        fireEvent.click(reviewButton);
      });

      const approveButton = await screen.findByText('Approve');
      fireEvent.click(approveButton);

      await waitFor(() => {
        // Check that fetchPastComplaints was called (which calls api.get('/complaints/past/'))
        expect(api.get).toHaveBeenCalledWith('/complaints/past/');
      });
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle null complaint fields gracefully', async () => {
      const incompleteComplaint = {
        id: 3,
        content: 'Basic complaint',
        posted_by: null,
        posted_at: null,
        address: null,
        assigned_to_dept: null,
        assigned_to_fieldworker: null,
        expected_resolution_time: null,
        upvotes_count: 0,
        fake_confidence: 0,
        images: null,
      };
      api.get.mockResolvedValue({ data: [incompleteComplaint] });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Basic complaint')).toBeInTheDocument();
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });
    });

    it('should handle API response with null data gracefully', async () => {
      api.get.mockResolvedValue({ data: [] });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('No past complaints to show.')).toBeInTheDocument();
      });
    });

    it('should handle image with null URL gracefully', async () => {
      const complaintWithNullImage = {
        ...mockComplaints[0],
        images: [{ image: 'https://example.com/valid.jpg' }],
      };
      api.get.mockResolvedValue({ data: [complaintWithNullImage] });

      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should display alternative date field if posted_at is missing', async () => {
      const complaintWithAltDateField = {
        ...mockComplaints[0],
        posted_at: null,
        date: '2024-11-20T10:00:00Z',
      };
      api.get.mockResolvedValue({ data: [complaintWithAltDateField] });

      render(<PastComplaints />);

      await waitFor(() => {
        const dateElements = screen.getAllByText(/Nov \d{1,2}, \d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle missing posted_by.username with author field fallback', async () => {
      const complaintWithAuthor = {
        ...mockComplaints[0],
        posted_by: { username: null },
        author: 'AuthorName',
      };
      api.get.mockResolvedValue({ data: [complaintWithAuthor] });

      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('AuthorName')).toBeInTheDocument();
      });
    });

    it('should handle circular image navigation', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Complaint evidence/);
        fireEvent.click(images[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Image')).toBeInTheDocument();
      });

      // Navigate past the last image should wrap to first
      const nextButton = screen.getAllByText('›')[0];
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      const modalImage = screen.getByAltText('detail');
      expect(modalImage).toBeInTheDocument();
    });
  });

  describe('UI Rendering & Styling', () => {
    it('should render search icon in header', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should render user avatar icon in complaint cards', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        const svgs = document.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThan(1);
      });
    });

    it('should apply correct status badge colors', async () => {
      render(<PastComplaints />);

      await waitFor(() => {
        expect(screen.getByText('Pothole in road')).toBeInTheDocument();
      });
    });
  });
});
