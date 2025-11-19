import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';

// Search icon + header (copied from Home.jsx to provide same search UX)
const SearchIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const Header = ({ query, setQuery, onSearch }) => (
  <header className="bg-white w-full p-4 flex justify-between items-center sticky top-0 z-10 border-b-3 border-indigo-400">
    {/* increase max width so header/search is longer on larger screens */}
    <div className="flex-1 max-w-2xl mx-auto">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
        <input
          type="search"
          placeholder="Search for complaints, people, or keywords"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearch();
            }
          }}
          className="w-full pl-12 pr-4 py-3 border-2 border-indigo-200 rounded-full bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
      </div>
    </div>
  </header>
);

// small user avatar icon (copied style from Home.jsx)
const UserIcon = ({ className = 'w-10 h-10' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      clipRule="evenodd"
    />
  </svg>
);

export default function PastComplaints() {
  const [query, setQuery] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [reportingId, setReportingId] = useState(null);
  const [reportedIds, setReportedIds] = useState(() => {
    try {
      const raw = localStorage.getItem('reportedComplaints');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const [showReportToast, setShowReportToast] = useState(false);
  // UI states for image modal and small animations
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [modalIndex, setModalIndex] = useState(null);
  const [upvotingIds, setUpvotingIds] = useState([]);

  const fetchPastComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/complaints/past/');
      setComplaints(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching past complaints:', err);
      setError('Failed to load past complaints. Please try again.');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) {
      return;
    }

    try {
      await api.delete(`/complaints/${complaintId}/delete/`);
      // Remove the deleted complaint from the state
      setComplaints(
        complaints.filter((complaint) => complaint.id !== complaintId)
      );
    } catch (err) {
      console.error('Error deleting complaint:', err);
      alert('Failed to delete complaint. Please try again.');
    }
  };

  const handleUpvote = async (complaintId) => {
    try {
      const response = await api.post(`/complaints/${complaintId}/upvote/`);
      // Update the complaint in the state with new upvote count
      setComplaints(
        complaints.map((complaint) =>
          complaint.id === complaintId
            ? { ...complaint, upvotes_count: response.data.likes_count }
            : complaint
        )
      );
    } catch (err) {
      console.error('Error upvoting complaint:', err);
      alert('Failed to upvote complaint. Please try again.');
    }
  };

  const handleMarkFake = async (complaintId) => {
    try {
      setReportingId(complaintId);
      await api.post(`/complaints/${complaintId}/fake-confidence/`);
      // persist reported id locally so this user cannot report again
      setReportedIds((prev) => {
        try {
          const next = prev.includes(complaintId)
            ? prev
            : [...prev, complaintId];
          localStorage.setItem('reportedComplaints', JSON.stringify(next));
          return next;
        } catch (e) {
          return prev;
        }
      });
      // Refresh the complaints to get updated fake confidence data
      await fetchPastComplaints();
      // show transient success popup
      setShowReportToast(true);
      setTimeout(() => setShowReportToast(false), 2200);
    } catch (err) {
      console.error('Error marking complaint as fake:', err);
      alert('Failed to mark complaint as fake. Please try again.');
    } finally {
      setReportingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // helper to handle different image shapes (string or object)
  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    if (typeof imageData === 'string') return imageData;
    if (imageData.image_url) return imageData.image_url;
    if (imageData.image) return imageData.image;
    return null;
  };

  const openImageModal = (images, index = 0) => {
    const urls = Array.isArray(images)
      ? images.map(getImageUrl).filter(Boolean)
      : [];
    if (urls.length === 0) return;
    setModalImages(urls);
    setModalIndex(index);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
      if (e.key === 'ArrowLeft')
        setModalIndex((i) =>
          i === null ? 0 : (i - 1 + modalImages.length) % modalImages.length
        );
      if (e.key === 'ArrowRight')
        setModalIndex((i) => (i === null ? 0 : (i + 1) % modalImages.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, modalImages.length]);

  const triggerUpvote = async (complaintId) => {
    // show a short pulse animation
    setUpvotingIds((s) => (s.includes(complaintId) ? s : [...s, complaintId]));
    setTimeout(
      () => setUpvotingIds((s) => s.filter((id) => id !== complaintId)),
      700
    );
    await handleUpvote(complaintId);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      Resolved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Escalated: 'bg-red-50 text-red-700',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  useEffect(() => {
    fetchPastComplaints();
  }, []);

  const searchComplaints = async (q) => {
    if (!q) {
      return fetchPastComplaints();
    }
    try {
      setLoading(true);
      setError('');
      const response = await api.get(
        `/complaints/search/?q=${encodeURIComponent(q)}`
      );
      setComplaints(response.data || []);
    } catch (err) {
      console.error('Search error', err);
      setError('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Past Complaints</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auto-w-full">
      <div className="sticky top-0 z-20 bg-white px-0">
        <Header
          query={query}
          setQuery={setQuery}
          onSearch={() => searchComplaints(query)}
        />
      </div>

      <div className="px-1 py-1">
        {showReportToast && (
          <div className="fixed top-5 right-5 z-50">
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
              Reported successfully
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {complaints.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No past complaints to show.
            </div>
            <p className="text-gray-600">
              Complaints you create will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="bg-white p-4 rounded-xl border-indigo-100 shadow-md hover:shadow-xl transition-all duration-300 hover:border-indigo-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-1 text-indigo-600 bg-indigo-50">
                      <UserIcon className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {complaint.posted_by?.username ||
                          complaint.author ||
                          'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(complaint.posted_at || complaint.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {(() => {
                      const isReported =
                        reportedIds.includes(complaint.id) ||
                        (complaint.fake_confidence &&
                          complaint.fake_confidence > 0);
                      const isReportingNow = reportingId === complaint.id;
                    })()}

                    <button
                      onClick={() => handleDeleteComplaint(complaint.id)}
                      className="bg-red-50 hover:bg-red-100 border border-red-200 text-sm font-semibold transition-colors px-3 py-1 rounded-md text-red-600 hover:text-red-800"
                      title="Delete complaint"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="text-lg text-gray-800 mb-1">
                  {complaint.content}
                </p>

                {complaint.address && (
                  <div className="mb-3">
                    <p className="text-gray-600 text-base leading-relaxed mb-4">
                      Location: {complaint.address}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                  {complaint.assigned_to_dept && (
                    <span className="text-sm text-gray-600 bg-indigo-50 px-3 py-2 rounded-lg">
                      <span className="font-semibold text-indigo-700">
                        Department:
                      </span>{' '}
                      <span className="text-gray-800">
                        {complaint.assigned_to_dept}
                      </span>
                    </span>
                  )}

                  {complaint.assigned_to_fieldworker && (
                    <span className="text-sm text-gray-600 bg-indigo-50 px-3 py-2 rounded-lg">
                      <span className="font-semibold text-indigo-700">
                        Assigned to:
                      </span>{' '}
                      <span className="text-gray-800">
                        {complaint.assigned_to_fieldworker}
                      </span>
                    </span>
                  )}
                  
                  {complaint.expected_resolution_time && (
                    <span className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <span className="font-semibold text-green-700">
                        Expected Time:
                      </span>{' '}
                      <span className="text-gray-800">
                        {complaint.expected_resolution_time}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t-2 border-indigo-100">
                  <span className="text-sm font-medium">
                    Upvotes: {complaint.upvotes_count}
                  </span>
                  {complaint.fake_confidence > 0 && (
                    <span className="text-sm font-medium text-red-600">
                      Users Reported: {complaint.fake_confidence}
                    </span>
                  )}
                </div>

                {complaint.images && complaint.images.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {complaint.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={getImageUrl(image)}
                            alt={`Complaint evidence ${index + 1}`}
                            className="w-full h-36 object-cover rounded border border-gray-200 cursor-pointer"
                            onClick={() =>
                              openImageModal(complaint.images, index)
                            }
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/300?text=Image+Not+Found';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* If there's a pending resolution for this complaint, show review prompt */}
                {complaint.has_pending_resolution && (
                  <div className="mt-4">
                    <ReviewResolutionButton
                      complaint={complaint}
                      onRefresh={fetchPastComplaints}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Image Modal */}
        {modalOpen && modalIndex !== null && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/30"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4">
                <h3 className="text-lg font-semibold">Image</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setModalIndex(
                        (i) => (i - 1 + modalImages.length) % modalImages.length
                      )
                    }
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() =>
                      setModalIndex((i) => (i + 1) % modalImages.length)
                    }
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-center">
                <img
                  src={modalImages[modalIndex]}
                  alt="detail"
                  className="max-w-full max-h-[70vh] object-contain"
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/600x400?text=Image+Not+Found';
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ReviewResolutionButton component: allows complaint owner to view pending resolution and approve/reject
function ReviewResolutionButton({ complaint, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolution, setResolution] = useState(null);
  const [responding, setResponding] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [escalatedToast, setEscalatedToast] = useState(false);

  const open = async () => {
    setIsOpen(true);
    setLoading(true);
    try {
      const res = await api.get(`/complaints/${complaint.id}/resolution/`);
      // pick the pending resolution
      const pending = Array.isArray(res.data.resolutions)
        ? res.data.resolutions.find((r) => r.status === 'pending_approval')
        : null;
      setResolution(
        pending || (res.data.resolutions && res.data.resolutions[0]) || null
      );
    } catch (err) {
      console.error('Error fetching resolution', err);
      alert('Failed to load resolution details.');
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    if (!responding) {
      setIsOpen(false);
      setResolution(null);
      setFeedback('');
    }
  };

  const handleRespond = async (approved) => {
    if (!resolution) return;
    if (!approved && !feedback.trim()) {
      alert('Please provide feedback when rejecting a resolution.');
      return;
    }
    setResponding(true);
    try {
      const payload = { approved };
      if (!approved) payload.feedback = feedback;
      const resp = await api.post(
        `/complaints/${complaint.id}/resolution/${resolution.id}/respond/`,
        payload
      );
      // show server message
      const message = resp.data?.message || 'Response submitted';
      alert(message);

      // If the citizen rejected the resolution the backend escalates the complaint to the government authority.
      // Show a transient toast here so the user sees the escalation happened.
      if (!approved) {
        setEscalatedToast(true);
        setTimeout(() => setEscalatedToast(false), 3000);
      }
      close();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error responding to resolution', err);
      alert('Failed to submit response.');
    } finally {
      setResponding(false);
    }
  };

  return (
    <>
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-yellow-800">
            A resolution has been submitted for this complaint.
          </p>
          <p className="text-sm text-yellow-700">
            Please review and confirm if the complaint is resolved.
          </p>
        </div>
        <div>
          <button
            onClick={open}
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Review & Respond
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/20"
          onClick={close}
        >
          <div
            className="bg-white rounded-lg w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Review Resolution</h3>
              <button
                onClick={close}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {loading && <div className="py-8 text-center">Loading...</div>}

            {!loading && resolution && (
              <div>
                {escalatedToast && (
                  <div className="mb-3">
                    <div className="bg-red-100 text-red-800 px-3 py-2 rounded">
                      Complaint escalated to the government authority for
                      reassignment.
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-600 mb-3">
                  Submitted by:{' '}
                  <span className="font-medium">
                    {resolution.field_worker?.username || 'Field worker'}
                  </span>
                </p>
                <p className="mb-4 text-gray-800">{resolution.description}</p>

                {resolution.images && resolution.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {resolution.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.image_url || img.image}
                        alt="resolution"
                        className="w-full h-28 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="If rejecting, please provide feedback (required)"
                    className="w-full border rounded p-2 mb-3 h-24"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleRespond(false)}
                      disabled={responding}
                      className="px-4 py-2 bg-red-600 text-white rounded"
                    >
                      {responding ? 'Submitting...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleRespond(true)}
                      disabled={responding}
                      className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                      {responding ? 'Submitting...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !resolution && (
              <div className="py-6 text-center text-gray-600">
                No resolution details found.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
