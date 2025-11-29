import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Homepage from '../Home';
import api from '../../utils/axiosConfig';
import { vi } from 'vitest';

const navigateMock = vi.fn();

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
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
  localStorage.clear();
  global.alert = vi.fn();
  global.confirm = vi.fn(() => true);
});

test('renders complaints and navigates when card clicked', async () => {
  const complaints = [
    { id: 21, content: 'Streetlight broken', posted_by: { username: 'alice' }, posted_at: '2025-11-01T12:00:00Z', address: 'Lane 1', upvotes_count: 0, is_upvoted: false },
  ];

  api.get.mockResolvedValue({ data: complaints });

  render(<Homepage />);

  expect(await screen.findByText(/Streetlight broken/i)).toBeInTheDocument();
  await userEvent.click(screen.getByText(/Streetlight broken/i));
  expect(navigateMock).toHaveBeenCalledWith('/complaint/21');
});

test('upvote flow updates displayed count when authenticated', async () => {
  const complaints = [
    { id: 31, content: 'Pothole', posted_by: { username: 'bob' }, posted_at: '2025-11-01T12:00:00Z', address: 'Road', upvotes_count: 0, is_upvoted: false },
  ];

  localStorage.setItem('access_token', 'T');
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('username', 'bob');

  api.get.mockResolvedValue({ data: complaints });
  api.post.mockResolvedValue({ data: { upvotes_count: 1, is_upvoted: true } });

  render(<Homepage />);

  expect(await screen.findByText(/Pothole/i)).toBeInTheDocument();

  const countSpan = screen.getByText('0');
  const upvoteBtn = countSpan.closest('button');
  await userEvent.click(upvoteBtn);

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/complaints/31/upvote/'), { timeout: 3000 });
  expect(await screen.findByText('1')).toBeInTheDocument();
});

test('report flow calls API and shows toast', async () => {
  const complaints = [
    { id: 41, content: 'Illegal dumping', posted_by: { username: 'carol' }, posted_at: '2025-11-01T12:00:00Z', address: 'Park', upvotes_count: 2, is_upvoted: false },
  ];

  localStorage.setItem('access_token', 'T');
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('username', 'carol');

  api.get.mockResolvedValue({ data: complaints });
  api.post.mockResolvedValue({ data: {} });

  render(<Homepage />);

  expect(await screen.findByText(/Illegal dumping/i)).toBeInTheDocument();

  const reportBtn = screen.getByRole('button', { name: /Report as Fake/i });
  await userEvent.click(reportBtn);

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/complaints/41/fake-confidence/'), { timeout: 3000 });
  expect(await screen.findByText(/Reported successfully/i)).toBeInTheDocument();
});

test('delete complaint failure when not owner shows specific alert', async () => {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('username', 'someone');

  const complaints = [
    { id: 9, content: 'DeleteMe', posted_by: { username: 'other' }, posted_at: '2025-11-01T12:00:00Z', address: 'Test', upvotes_count: 0, is_upvoted: false }
  ];

  api.get.mockResolvedValue({ data: complaints });
  api.delete.mockRejectedValue({ response: { status: 403 } });

  render(<Homepage />);

  expect(await screen.findByText(/DeleteMe/i)).toBeInTheDocument();

  const deleteBtn = screen.getByRole('button', { name: /Delete/i });
  await userEvent.click(deleteBtn);

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('You can only delete your own complaints.');
  });
});

test('delete complaint success refreshes list', async () => {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('username', 'owner');

  const complaints = [
    { id: 71, content: 'Delete success', posted_by: { username: 'owner' }, posted_at: '2025-11-01T12:00:00Z', address: 'Test', upvotes_count: 0, is_upvoted: false }
  ];

  api.get.mockResolvedValue({ data: complaints });
  api.delete.mockResolvedValue({ data: { message: 'Deleted' } });

  render(<Homepage />);

  expect(await screen.findByText(/Delete success/i)).toBeInTheDocument();

  const deleteBtn = screen.getByRole('button', { name: /Delete/i });
  await userEvent.click(deleteBtn);

  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/complaints/71/delete/'), { timeout: 3000 });
});

test('Raise First Complaint prompts login when unauthenticated', async () => {
  api.get.mockResolvedValue({ data: [] });

  render(<Homepage />);

  expect(await screen.findByText(/No complaints found/i)).toBeInTheDocument();

  const raiseBtn = screen.getByRole('button', { name: /Raise First Complaint/i });
  await userEvent.click(raiseBtn);

  expect(global.alert).toHaveBeenCalledWith('Please login to raise a complaint.');
  expect(navigateMock).toHaveBeenCalledWith('/auth');
});

test('raise complaint with authentication token opens modal', async () => {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('username', 'user');

  api.get.mockResolvedValue({ data: [] });

  render(<Homepage />);

  expect(await screen.findByText(/No complaints found/i)).toBeInTheDocument();

  const raiseBtn = screen.getByRole('button', { name: /Raise First Complaint/i });
  await userEvent.click(raiseBtn);

  expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
});

test('department filter renders successfully', async () => {
  api.get.mockResolvedValue({ data: [] });

  render(<Homepage />);

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });
});