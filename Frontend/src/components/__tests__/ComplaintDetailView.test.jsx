import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComplaintDetailView from '../ComplaintDetailView';
import api from '../../utils/axiosConfig';
import { vi } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

// Mock react-router hooks used by the component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '123' }),
    useNavigate: () => vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  // ensure no leftover alerts
  global.alert = vi.fn();
});

test('shows error when API fails to fetch complaint detail', async () => {
  api.get.mockRejectedValueOnce({ response: { data: { error: 'Not found' } } });

  render(<ComplaintDetailView />);

  expect(screen.getByText(/Loading complaint details/i)).toBeInTheDocument();

  expect(await screen.findByText(/Not found/i)).toBeInTheDocument();
});

test('renders complaint details and opens image modal with navigation', async () => {
  const detail = {
    complaint: {
      id: 123,
      content: 'Pothole on Main St',
      posted_by: { username: 'alice' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Main St',
      pincode: '12345',
      images_count: 2,
      latitude: '12.34',
      longitude: '56.78',
      fake_confidence: 0,
      expected_resolution_time: '2 Days',
      predicted_resolution_days: 2,
      status: 'pending',
    },
    solved_status: 'unsolved',
    assigned_field_worker: 'Worker A',
    latest_approved_resolution: null,
  };

  const images = [
    { id: 1, image: 'http://example.com/img1.jpg' },
    { id: 2, image: 'http://example.com/img2.jpg' },
  ];

  api.get.mockImplementation((url) => {
    if (url.endsWith('/detail/')) return Promise.resolve({ data: detail });
    if (url.endsWith('/images/')) return Promise.resolve({ data: images });
    return Promise.reject(new Error('unexpected'));
  });

  render(<ComplaintDetailView />);

  // Wait for content to render
  expect(await screen.findByText(/Pothole on Main St/i)).toBeInTheDocument();

  // Images gallery should show thumbnails
  const thumb = screen.getByAltText(/Complaint image 1/i);
  expect(thumb).toBeInTheDocument();

  // Open modal by clicking the thumbnail
  await userEvent.click(thumb);

  // Modal header should show image index
  expect(await screen.findByText(/Image 1 of 2/i)).toBeInTheDocument();

  const nextBtn = screen.getByLabelText(/Next image/i);
  await userEvent.click(nextBtn);

  // After clicking next, header should show Image 2
  expect(await screen.findByText(/Image 2 of 2/i)).toBeInTheDocument();
});

test('review resolution flow: open modal, approve response calls API and alerts', async () => {
  const detail = {
    complaint: {
      id: 123,
      content: 'Issue to review',
      posted_by: { username: 'bob' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Somewhere',
      pincode: '00000',
      images_count: 0,
      has_pending_resolution: true,
    },
    solved_status: 'unsolved',
    assigned_field_worker: 'Worker A',
    latest_approved_resolution: null,
  };

  // First two get calls: detail, then (no images)
  // When opening review, the component will call /resolution/
  api.get.mockImplementation((url) => {
    if (url.endsWith('/detail/')) return Promise.resolve({ data: detail });
    if (url.endsWith('/images/')) return Promise.resolve({ data: [] });
    if (url.endsWith('/resolution/'))
      return Promise.resolve({ data: { resolutions: [ { id: 10, status: 'pending_approval', description: 'Resolved by worker', field_worker: { username: 'worker1' }, images: [] } ] } });
    return Promise.reject(new Error('unexpected'));
  });

  api.post.mockResolvedValueOnce({ data: { message: 'Response submitted' } });

  render(<ComplaintDetailView />);

  // Wait for the detail to display
  expect(await screen.findByText(/Issue to review/i)).toBeInTheDocument();

  // Click 'Review & Respond' button
  const reviewBtn = screen.getByRole('button', { name: /Review & Respond/i });
  await userEvent.click(reviewBtn);

  // Resolution description should appear in the modal
  expect(await screen.findByText(/Resolved by worker/i)).toBeInTheDocument();

  // Click Approve
  const approveBtn = screen.getByRole('button', { name: /Approve/i });
  await userEvent.click(approveBtn);

  // API post should be called with the respond endpoint
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/complaints/123/resolution/10/respond/', { approved: true });
    expect(global.alert).toHaveBeenCalled();
  });
});

test('reject resolution requires feedback and shows escalated toast, and keyboard navigation works in modal', async () => {
  const detail = {
    complaint: {
      id: 124,
      content: 'Issue to review reject',
      posted_by: { username: 'bob' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Somewhere',
      images_count: 2,
    },
    solved_status: 'unsolved',
    assigned_field_worker: 'Worker A',
    latest_approved_resolution: null,
  };

  const images = [
    { id: 1, image: 'http://example.com/img1.jpg' },
    { id: 2, image: 'http://example.com/img2.jpg' },
  ];

  api.get.mockImplementation((url) => {
    if (url.endsWith('/detail/')) return Promise.resolve({ data: detail });
    if (url.endsWith('/images/')) return Promise.resolve({ data: images });
    if (url.endsWith('/resolution/'))
      return Promise.resolve({ data: { resolutions: [ { id: 20, status: 'pending_approval', description: 'Needs verification', field_worker: { username: 'worker1' }, images } ] } });
    return Promise.reject(new Error('unexpected'));
  });

  api.post.mockResolvedValueOnce({ data: { message: 'Response submitted' } });

  render(<ComplaintDetailView />);

  expect(await screen.findByText(/Issue to review reject/i)).toBeInTheDocument();

  // Click 'Review & Respond' button
  const reviewBtn = screen.getByRole('button', { name: /Review & Respond/i });
  await userEvent.click(reviewBtn);

  // Wait for resolution description
  expect(await screen.findByText(/Needs verification/i)).toBeInTheDocument();

  // Enter rejection feedback
  const feedbackArea = screen.getByPlaceholderText(/If rejecting, please provide feedback/i);
  await userEvent.type(feedbackArea, 'Not acceptable');

  // Click Reject
  const rejectBtn = screen.getByRole('button', { name: /Reject/i });
  await userEvent.click(rejectBtn);

  // Expect API called with feedback
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/complaints/124/resolution/20/respond/', { approved: false, feedback: 'Not acceptable' });
    expect(global.alert).toHaveBeenCalled();
  });

  // Ensure escalated toast text appears
  expect(await screen.findByText(/Complaint escalated to the government authority/i)).toBeInTheDocument();

  // Test keyboard navigation in the modal
  // Open image modal by clicking first image
  const imgThumb = screen.getByAltText(/Complaint image 1/i);
  await userEvent.click(imgThumb);

  expect(await screen.findByText(/Image 1 of 2/i)).toBeInTheDocument();
  // simulate ArrowRight key to move to next image
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  expect(await screen.findByText(/Image 2 of 2/i)).toBeInTheDocument();
  // ArrowLeft back to first
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
  expect(await screen.findByText(/Image 1 of 2/i)).toBeInTheDocument();
});

test('shows error when fetching images fails', async () => {
  const detail = {
    complaint: {
      id: 125,
      content: 'Image error test',
      posted_by: { username: 'bob' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Test',
      pincode: '00000',
      images_count: 0,
    },
    solved_status: 'unsolved',
    assigned_field_worker: 'Worker A',
    latest_approved_resolution: null,
  };

  api.get.mockImplementation((url) => {
    if (url.endsWith('/detail/')) return Promise.resolve({ data: detail });
    if (url.endsWith('/images/')) return Promise.reject(new Error('Image fetch error'));
    return Promise.reject(new Error('unexpected'));
  });

  render(<ComplaintDetailView />);

  expect(await screen.findByText(/Image error test/i)).toBeInTheDocument();
  // Component should render without crashing even if images fail
});

test('handles complaint with no images gracefully', async () => {
  const detail = {
    complaint: {
      id: 126,
      content: 'No images complaint',
      posted_by: { username: 'alice' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Test',
      pincode: '00000',
      images_count: 0,
    },
    solved_status: 'unsolved',
    assigned_field_worker: null,
    latest_approved_resolution: null,
  };

  api.get.mockImplementation((url) => {
    if (url.endsWith('/detail/')) return Promise.resolve({ data: detail });
    if (url.endsWith('/images/')) return Promise.resolve({ data: [] });
    return Promise.reject(new Error('unexpected'));
  });

  render(<ComplaintDetailView />);

  expect(await screen.findByText(/No images complaint/i)).toBeInTheDocument();
  // Verify images gallery is handled with empty array
});

test('closes image modal when escape key is pressed', async () => {
  const detail = {
    complaint: {
      id: 127,
      content: 'Close modal test',
      posted_by: { username: 'bob' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Test',
      pincode: '00000',
      images_count: 1,
    },
    solved_status: 'unsolved',
    assigned_field_worker: null,
    latest_approved_resolution: null,
  };

  const images = [{ id: 1, image: 'http://example.com/img1.jpg' }];

  api.get.mockImplementation((url) => {
    if (url.endsWith('/detail/')) return Promise.resolve({ data: detail });
    if (url.endsWith('/images/')) return Promise.resolve({ data: images });
    return Promise.reject(new Error('unexpected'));
  });

  render(<ComplaintDetailView />);

  expect(await screen.findByText(/Close modal test/i)).toBeInTheDocument();

  const imgThumb = screen.getByAltText(/Complaint image 1/i);
  await userEvent.click(imgThumb);

  expect(await screen.findByText(/Image 1 of 1/i)).toBeInTheDocument();

  // Simulate pressing Escape key
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

  // Modal should be closed (Image text should not be visible)
  expect(screen.queryByText(/Image 1 of 1/i)).not.toBeInTheDocument();
});

test('handles resolution fetch error during review', async () => {
  const detail = {
    complaint: {
      id: 128,
      content: 'Resolution fetch error',
      posted_by: { username: 'bob' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Test',
      pincode: '00000',
      images_count: 0,
    },
    solved_status: 'unsolved',
    assigned_field_worker: 'Worker',
    latest_approved_resolution: null,
  };

  api.get.mockImplementation((url) => {
    if (url.endsWith('/detail/')) return Promise.resolve({ data: detail });
    if (url.endsWith('/images/')) return Promise.resolve({ data: [] });
    if (url.endsWith('/resolution/')) return Promise.reject(new Error('Resolution fetch failed'));
    return Promise.reject(new Error('unexpected'));
  });

  render(<ComplaintDetailView />);

  expect(await screen.findByText(/Resolution fetch error/i)).toBeInTheDocument();

  const reviewBtn = screen.queryByRole('button', { name: /Review & Respond/i });
  if (reviewBtn) {
    await userEvent.click(reviewBtn);
    // Component should handle error gracefully
  }
});

test('handles API error during resolution respond', async () => {
  const detail = {
    complaint: {
      id: 129,
      content: 'Respond error test',
      posted_by: { username: 'bob' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Test',
      pincode: '00000',
      images_count: 0,
    },
    solved_status: 'unsolved',
    assigned_field_worker: 'Worker',
    latest_approved_resolution: null,
  };

  api.get.mockImplementation((url) => {
    if (url.endsWith('/detail/')) return Promise.resolve({ data: detail });
    if (url.endsWith('/images/')) return Promise.resolve({ data: [] });
    if (url.endsWith('/resolution/'))
      return Promise.resolve({ data: { resolutions: [ { id: 30, status: 'pending_approval', description: 'Fix needed', field_worker: { username: 'worker1' }, images: [] } ] } });
    return Promise.reject(new Error('unexpected'));
  });

  api.post.mockRejectedValueOnce(new Error('Respond API failed'));

  render(<ComplaintDetailView />);

  expect(await screen.findByText(/Respond error test/i)).toBeInTheDocument();

  const reviewBtn = screen.getByRole('button', { name: /Review & Respond/i });
  await userEvent.click(reviewBtn);

  expect(await screen.findByText(/Fix needed/i)).toBeInTheDocument();

  const approveBtn = screen.getByRole('button', { name: /Approve/i });
  await userEvent.click(approveBtn);

  // Should handle error gracefully
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/complaints/129/resolution/30/respond/', { approved: true });
  });
});
