import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FieldWorkerHomepage from '../fieldworkerhomepage';
import api from '../../utils/axiosConfig';
import { vi } from 'vitest';

const navigateMock = vi.fn();

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  global.alert = vi.fn();
  // mock reload to avoid actual reloads
  delete window.location;
  window.location = { reload: vi.fn() };
});

test('shows error when API fails to fetch field complaints', async () => {
  api.get.mockRejectedValueOnce(new Error('network'));

  render(<FieldWorkerHomepage />);

  expect(screen.getByText(/Loading/i)).toBeInTheDocument();

  expect(await screen.findByText(/Failed to load complaints./i)).toBeInTheDocument();
});

test('shows no complaints message when API returns empty array', async () => {
  api.get.mockResolvedValueOnce({ data: [] });

  render(<FieldWorkerHomepage />);

  expect(await screen.findByText(/No complaints found/i)).toBeInTheDocument();
});

test('renders complaints and navigates when card clicked', async () => {
  const complaints = [
    {
      id: 1,
      content: 'Test complaint content',
      posted_by: { username: 'alice' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Some address',
      images_count: 0,
    },
  ];

  api.get.mockResolvedValueOnce({ data: complaints });

  render(<FieldWorkerHomepage />);

  expect(await screen.findByText(/Test complaint content/i)).toBeInTheDocument();

  // Click the complaint content to trigger navigation
  await userEvent.click(screen.getByText(/Test complaint content/i));

  expect(navigateMock).toHaveBeenCalledWith('/complaint/1');
});

test('image modal opens and navigates images', async () => {
  const complaints = [
    {
      id: 2,
      content: 'With images',
      posted_by: { username: 'bob' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Address',
      images: [
        { id: 11, image: 'http://example.com/a.jpg' },
        { id: 12, image: 'http://example.com/b.jpg' },
      ],
    },
  ];

  api.get.mockResolvedValueOnce({ data: complaints });

  render(<FieldWorkerHomepage />);

  expect(await screen.findByText(/With images/i)).toBeInTheDocument();

  const thumb = screen.getByAltText(/Complaint image 1/i);
  expect(thumb).toBeInTheDocument();

  // Open modal
  await userEvent.click(thumb);

  expect(await screen.findByText(/Complaint Image/i)).toBeInTheDocument();

  const nextBtn = screen.getByLabelText(/Next image/i);
  await userEvent.click(nextBtn);

  // click previous
  const prevBtn = screen.getByLabelText(/Previous image/i);
  await userEvent.click(prevBtn);

  // close modal by clicking close button
  const closeBtn = screen.getByRole('button', { name: /×/i });
  await userEvent.click(closeBtn);
});

test('submit resolution flow submits and reloads', async () => {
  const complaints = [
    {
      id: 3,
      content: 'Needs resolution',
      posted_by: { username: 'charlie' },
      posted_at: '2025-11-01T12:00:00Z',
      address: 'Addr',
      status: 'In Progress',
      images_count: 0,
    },
  ];

  api.get.mockResolvedValueOnce({ data: complaints });
  api.post.mockResolvedValueOnce({ data: { message: 'Resolution submitted.' } });

  render(<FieldWorkerHomepage />);

  expect(await screen.findByText(/Needs resolution/i)).toBeInTheDocument();

  // Click Submit Resolution (button text)
  const submitBtn = screen.getByRole('button', { name: /Submit Resolution/i });
  await userEvent.click(submitBtn);

  // Modal should open with heading
  expect(await screen.findByText(/Submit Resolution/i)).toBeInTheDocument();

  // Fill description
  const textarea = screen.getByPlaceholderText(/Describe the work you completed/i);
  await userEvent.type(textarea, 'Fixed it');

  // Click Submit
  const confirm = screen.getByRole('button', { name: /Submit/i });
  await userEvent.click(confirm);

  await waitFor(() => expect(api.post).toHaveBeenCalled());
  // ensure post called with expected endpoint
  expect(api.post).toHaveBeenCalledWith('/complaints/3/submit-resolution/', expect.any(FormData), { headers: { 'Content-Type': 'multipart/form-data' } });

  expect(global.alert).toHaveBeenCalled();
  expect(window.location.reload).toHaveBeenCalled();
});

test('submit resolution failure shows alert message', async () => {
  api.get.mockResolvedValueOnce({ data: { complaints: [ { id: 6, title: 'Resolve me', description: 'desc' } ] } });
  // images fetch
  api.get.mockResolvedValueOnce({ data: [] });

  // Make the post fail
  api.post.mockRejectedValueOnce(new Error('server error'));

  render(<FieldWorkerHomepage />);

  expect(await screen.findByText(/Resolve me/i)).toBeInTheDocument();

  // Open submit modal
  const resolveBtn = screen.getByRole('button', { name: /Resolve/i });
  await userEvent.click(resolveBtn);

  // Enter resolution and submit
  const textarea = screen.getByPlaceholderText(/Describe resolution/i);
  await userEvent.type(textarea, 'Tried to fix');
  const submitBtn = screen.getByRole('button', { name: /Submit/i });
  await userEvent.click(submitBtn);

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Failed to submit resolution.');
  });
});
