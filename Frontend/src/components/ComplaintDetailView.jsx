import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

const UserIcon = ({ className = 'w-12 h-12' }) => (
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

const BackIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckCircleIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const ClockIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-2.828 2.829a1 1 0 101.415 1.415L9 10.414V6z"
      clipRule="evenodd"
    />
  </svg>
);

const AlertIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

// ReviewResolutionButton component for approval/rejection flow
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
      const message = resp.data?.message || 'Response submitted';
      alert(message);

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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
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
            className="px-4 py-3 bg-[#4B687A] text-white rounded-lg hover:bg-[#3A4F5E] transition-colors font-semibold"
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
            className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-2xl"
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
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      {responding ? 'Submitting...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleRespond(true)}
                      disabled={responding}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
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

const ComplaintDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaintData, setComplaintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  useEffect(() => {
    const fetchComplaintDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/complaints/${id}/detail/`);
        setComplaintData(response.data);

        // Fetch images if available
        if (response.data.complaint && response.data.complaint.images_count > 0) {
          try {
            const imagesResponse = await api.get(`/complaints/${id}/images/`);
            setImages(imagesResponse.data);
          } catch (imgErr) {
            console.error('Failed to fetch images:', imgErr);
          }
        }
      } catch (err) {
        console.error('Error fetching complaint detail:', err);
        setError(err.response?.data?.error || 'Failed to load complaint details');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaintDetail();
  }, [id]);

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showImageModal) return;
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((i) => (i - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((i) => (i + 1) % images.length);
      } else if (e.key === 'Escape') {
        setShowImageModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showImageModal, images.length]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    if (typeof imageData === 'string') return imageData;
    if (imageData.image_url) return imageData.image_url;
    if (imageData.image) return imageData.image;
    return null;
  };

  const getStatusBadge = (solvedStatus) => {
    switch (solvedStatus) {
      case 'solved':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            <CheckCircleIcon className="w-4 h-4" />
            Solved
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            <ClockIcon className="w-4 h-4" />
            In Progress
          </div>
        );
      case 'unsolved':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            <AlertIcon className="w-4 h-4" />
            Unsolved
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="font-inter min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#4B687A]"></div>
        <p className="mt-4 text-gray-600 font-semibold">Loading complaint details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-inter min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center max-w-md">
          <p className="text-red-700 font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!complaintData) {
    return (
      <div className="font-inter min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 font-semibold">No complaint data available.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-[#4B687A] text-white px-4 py-2 rounded-lg hover:bg-[#3A4F5E] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const complaint = complaintData.complaint;
  const solvedStatus = complaintData.solved_status;
  const assignedWorker = complaintData.assigned_field_worker;
  const latestResolution = complaintData.latest_approved_resolution;

  return (
    <div className="font-inter min-h-screen flex flex-col bg-gray-50">
      {/* Header with back button */}
      <header className="bg-white w-full p-4 sticky top-0 z-10 border-b-3 border-gray-400 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#4B687A] hover:text-[#3A4F5E] transition-colors font-semibold"
          >
            <BackIcon className="w-5 h-5" />
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex justify-center px-1 py-1">
        <div className="w-full max-w-2xl lg:max-w-4xl">
          {/* Main Complaint Card */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 mb-6 border border-gray-100">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-1 text-[#4B687A]">
                  <UserIcon className="w-10 h-10" />
                </div>
                <div className="flex flex-col">
                  <p className="font-bold text-lg text-gray-800">
                    {complaint.posted_by?.username || 'Anonymous User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(complaint.posted_at)}
                  </p>
                </div>
              </div>
              <div>{getStatusBadge(solvedStatus)}</div>
            </div>

            {/* Complaint Title */}
            <p className="text-lg text-gray-800 mb-3">{complaint.content}</p>

            {/* Address Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-gray-600 text-sm font-semibold mb-1">Address</p>
              <p className="text-gray-800 text-base">{complaint.address}</p>
              {complaint.pincode && (
                <p className="text-gray-600 text-sm mt-2">PIN: {complaint.pincode}</p>
              )}
            </div>

            {/* Images Gallery */}
            {images.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Images</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div
                      key={image.id || index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm hover:shadow-md"
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setShowImageModal(true);
                      }}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Complaint image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/fallback-image.png';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fake Confidence Section */}
            {complaint.fake_confidence !== undefined && complaint.fake_confidence > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-yellow-800">
                  Fake Reports: <span className="text-lg">{complaint.fake_confidence}</span>
                </p>
              </div>
            )}

            {/* Assignment Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-blue-800 mb-1">Assigned To</p>
              <p className="text-base text-blue-900">
                {assignedWorker || 'Not yet assigned'}
              </p>
              
              {complaint.expected_resolution_time && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm font-semibold text-green-800 mb-1">Expected Resolution Time</p>
                  <p className="text-base text-green-900 font-semibold">
                    {complaint.expected_resolution_time}
                  </p>
                  {complaint.predicted_resolution_days && (
                    <p className="text-xs text-gray-600 mt-1">
                      (~{complaint.predicted_resolution_days} Days)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Location Details */}
            {complaint.latitude && complaint.longitude && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Location</p>
                <p className="text-gray-600 text-sm">
                  Latitude: {Number(complaint.latitude).toFixed(4)}, Longitude: {Number(complaint.longitude).toFixed(4)}
                </p>
              </div>
            )}

            {/* Status Badge - Additional */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Status</p>
              <p className="text-base text-gray-800 capitalize">{complaint.status || 'Pending'}</p>
            </div>
          </div>

          {/* Pending Resolution Review Section */}
          {complaint.has_pending_resolution && (
            <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-100">
              <ReviewResolutionButton
                complaint={complaint}
                onRefresh={() => window.location.reload()}
              />
            </div>
          )}

          {/* Resolution Card */}
          {latestResolution && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-green-800">Resolution</h2>
              </div>

              <div className="bg-white rounded-lg p-4 mb-4 border border-green-100">
                <p className="text-sm font-semibold text-gray-700 mb-2">Field Worker</p>
                <p className="text-base text-gray-800 font-semibold">{latestResolution.field_worker}</p>
              </div>

              <div className="bg-white rounded-lg p-4 mb-4 border border-green-100">
                <p className="text-sm font-semibold text-gray-700 mb-2">Resolution Details</p>
                <p className="text-base text-gray-800">{latestResolution.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Submitted</p>
                  <p className="text-sm text-gray-800">{formatDate(latestResolution.submitted_at)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Status</p>
                  <p className="text-sm text-green-600 font-semibold capitalize">{latestResolution.status}</p>
                </div>
              </div>

              {latestResolution.citizen_feedback && (
                <div className="bg-white rounded-lg p-4 mt-4 border border-green-100">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Citizen Feedback</p>
                  <p className="text-base text-gray-800">{latestResolution.citizen_feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImageIndex !== null && images.length > 0 && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">
                Image {selectedImageIndex + 1} of {images.length}
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 flex items-center justify-center bg-gray-50">
              <button
                onClick={() =>
                  setSelectedImageIndex((i) => (i - 1 + images.length) % images.length)
                }
                className="p-3 rounded-full bg-white hover:bg-gray-100 mr-6 shadow-md hover:shadow-lg transition-all"
                aria-label="Previous image"
              >
                ‹
              </button>

              <img
                src={getImageUrl(images[selectedImageIndex])}
                alt={`Complaint detail ${selectedImageIndex + 1}`}
                className="max-w-full max-h-96 object-contain rounded-lg"
                onError={(e) => {
                  e.target.src = '/fallback-image.png';
                }}
              />

              <button
                onClick={() =>
                  setSelectedImageIndex((i) => (i + 1) % images.length)
                }
                className="p-3 rounded-full bg-white hover:bg-gray-100 ml-6 shadow-md hover:shadow-lg transition-all"
                aria-label="Next image"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailView;
