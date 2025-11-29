import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GovAuthHomepage from '../govauthhomepage';
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
});

test('shows error when gov complaints fetch fails', async () => {
  api.get.mockRejectedValueOnce(new Error('network'));

  render(<GovAuthHomepage />);

  expect(screen.getByText(/Loading/i)).toBeInTheDocument();

  expect(await screen.findByText(/Failed to load complaints\./i)).toBeInTheDocument();
});

test('shows no complaints when API returns empty', async () => {
  // first call: govhome, second call: available-workers
  api.get
    .mockResolvedValueOnce({ data: [] })
    .mockResolvedValueOnce({ data: [] });

  render(<GovAuthHomepage />);

  expect(await screen.findByText(/No complaints found/i)).toBeInTheDocument();
});

test('renders complaints and navigates on card click', async () => {
  const complaints = [
    { id: 7, content: 'Complaint A', posted_by: { username: 'alice' }, posted_at: '2025-11-01T12:00:00Z', address: 'Addr' },
  ];

  api.get
    .mockResolvedValueOnce({ data: complaints }) // govhome
    .mockResolvedValueOnce({ data: [] }); // available-workers

  render(<GovAuthHomepage />);

  expect(await screen.findByText(/Complaint A/i)).toBeInTheDocument();

  await userEvent.click(screen.getByText(/Complaint A/i));

  expect(navigateMock).toHaveBeenCalledWith('/complaint/7');
});

test('assign flow: open modal, show workers, prediction, assign API call', async () => {
  const complaints = [
    { id: 8, content: 'To assign', posted_by: { username: 'bob' }, posted_at: '2025-11-01T12:00:00Z', address: 'Addr' },
  ];

  // api.get calls order: govhome, available-workers (initial), available-workers/{id} (on assign click), final fetchGovComplaints (after assign)
  api.get.mockImplementation((url) => {
    if (url.includes('/complaints/govhome/')) return Promise.resolve({ data: complaints });
    if (url.endsWith('/available-workers/')) return Promise.resolve({ data: [] });
    if (url.includes('/available-workers/8/')) return Promise.resolve({ data: [{ id: 5, username: 'worker1' }] });
    return Promise.resolve({ data: [] });
  });

  // api.post for predict-resolution and assign
  api.post
    .mockImplementationOnce(() => Promise.resolve({ data: { time_prediction: { estimated_days: 2, explanation: 'fast', weather_impact: 'low', urgency_tier: 'medium' } } }))
    .mockImplementationOnce(() => Promise.resolve({ data: { message: 'Assigned' } }));

  render(<GovAuthHomepage />);

  // Wait for complaint to render
  expect(await screen.findByText(/To assign/i)).toBeInTheDocument();

  // Click 'Assign to Field Worker' button
  const assignBtn = screen.getByRole('button', { name: /Assign to Field Worker/i });
  await userEvent.click(assignBtn);

  // After clicking, the AssignModal should open and fetch predictions (api.post called)
  expect(await screen.findByText(/Assign Complaint/i)).toBeInTheDocument();

  // Field worker select should populate (from available-workers/8/)
  expect(await screen.findByRole('combobox')).toBeInTheDocument();

  // select the worker
  await userEvent.selectOptions(screen.getByRole('combobox'), '5');

  // click Assign button inside modal
  const modalAssign = screen.getByRole('button', { name: /^Assign$/i });
  await userEvent.click(modalAssign);

  // api.post should be called for assigning
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/complaints/assign/8/', expect.objectContaining({ fieldworker_id: '5' }))); 
});
