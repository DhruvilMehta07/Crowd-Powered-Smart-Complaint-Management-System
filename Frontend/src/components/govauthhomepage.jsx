import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import axios from 'axios';

// --- Icon Components (Keeping all your existing icons) ---

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

const FilterIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
      clipRule="evenodd"
    />
  </svg>
);

const UserIcon = ({ className = 'w-12 h-12', color = '#4B687A' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={color}
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      clipRule="evenodd"
    />
  </svg>
);


const ComplaintCard = ({ complaint, onAssignClick }) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(complaint.posted_at || dateString).toLocaleDateString(
        'en-GB',
        options
      );
    } catch (error) {
      return 'Invalid date';
    }
  };

  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    if (typeof imageData === 'string') return imageData;
    if (imageData.image_url) return imageData.image_url;
    if (imageData.image) return imageData.image;
    return null;
  };

  useEffect(() => {
    const fetchImages = async () => {
      if (complaint.images && complaint.images.length > 0) {
        setImages(complaint.images);
        return;
      }
      try {
        setLoadingImages(true);
        const res = await api.get(`/complaints/${complaint.id}/images/`);
        setImages(res.data || []);
      } catch (err) {
        console.error('Error fetching complaint images', err);
      } finally {
        setLoadingImages(false);
      }
    };

    if (complaint.id) fetchImages();
  }, [complaint.id, complaint.images]);

  // keyboard navigation for modal
  useEffect(() => {
    if (!showImageModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((i) => (i - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((i) => (i + 1) % images.length);
      } else if (e.key === 'Escape') {
        setShowImageModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showImageModal, images.length]);

  return (
    <div 
      className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:border-indigo-300 cursor-pointer"
      onClick={() => navigate(`/complaint/${complaint.id}`)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-1 text-indigo-600">
            <UserIcon className="w-10 h-10" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <p className="font-bold text-lg text-gray-800">
              {complaint.author ||
                complaint.posted_by?.username ||
                'Anonymous User'}
            </p>
            <p className="text-sm text-gray-500 sm:pl-0">
              {formatDate(complaint.posted_at || complaint.date)}
            </p>
          </div>
        </div>
      
      </div>

      <p className="text-lg text-gray-800 mb-1 clamped-text">{complaint.content}</p>
      <p className="text-gray-600 text-base leading-relaxed mb-4">
        Address: {complaint.address}
      </p>

      {complaint.fake_confidence !== undefined && (
        <div className="mb-4">
          <p className="text-sm">
            <span className="font-medium text-red-600">No. of Reports:</span>{' '}
            <span className="text-black">{complaint.fake_confidence}</span>
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            {images.slice(0, 4).map((image, index) => (
              <div
                key={image.id || index}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedImageIndex(index);
                  setShowImageModal(true);
                }}
              >
                <img
                  src={getImageUrl(image)}
                  alt={`Complaint image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/150?text=Image+Not+Found';
                  }}
                />
                {index === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      +{images.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingImages && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {showImageModal && selectedImageIndex !== null && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/20"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4">
              <h3 className="text-lg font-semibold">Complaint Image</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 flex items-center justify-center">
              <button
                onClick={() =>
                  setSelectedImageIndex(
                    (i) => (i - 1 + images.length) % images.length
                  )
                }
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 mr-4"
                aria-label="Previous image"
              >
                ‹
              </button>
              <img
                src={getImageUrl(images[selectedImageIndex])}
                alt="Complaint detail"
                className="max-w-full max-h-96 object-contain"
                onError={(e) => {
                  e.target.src =
                    'https://via.placeholder.com/400x300?text=Image+Not+Found';
                }}
              />
              <button
                onClick={() =>
                  setSelectedImageIndex((i) => (i + 1) % images.length)
                }
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 ml-4"
                aria-label="Next image"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg inline-block border border-gray-200">
            <span className="font-semibold text-black">Assigned to:</span>{' '}
            <span className="text-gray-800">
              {complaint.assignedTo ||
                complaint.assigned_to_fieldworker ||
                complaint.category ||
                'Not assigned'}
            </span>
          </div>
          {complaint.expected_resolution_time && (
            <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg inline-block border border-green-200">
              <span className="font-semibold text-green-700">⏱️ Expected:</span>{' '}
              <span className="text-gray-800">
                {complaint.expected_resolution_time}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssignClick(complaint);
          }}
          className="bg-[#4B687A] text-white px-4 py-2 rounded-lg hover:bg-[#3A4F5E] transition-colors duration-200"
        >
          Assign to Field Worker
        </button>
      </div>
    </div>
  );
};

const AssignModal = ({
  isOpen,
  onClose,
  onAssign,
  complaint,
  fieldWorkers,
}) => {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [predictedTime, setPredictedTime] = useState(null);
  const [predictedDays, setPredictedDays] = useState(null);
  const [predictedExplanation, setPredictedExplanation] = useState('');
  const [weatherImpact, setWeatherImpact] = useState('');
  const [predictedUrgency, setPredictedUrgency] = useState('');
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState('');

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!complaint || !complaint.id) return;
      
      setLoadingPrediction(true);
      setPredictionError('');
      
      try {
        const response = await api.post(`/complaints/${complaint.id}/predict-resolution/`);
        const data = response.data;
        
        if (data.time_prediction) {
          // Preferred values from the API
          const estHours = data.time_prediction.estimated_hours ?? null;
          const estDays = data.time_prediction.estimated_days ?? (estHours ? (estHours / 24).toFixed(2) : null);

          setPredictedDays(estDays);

          // Display a friendly predicted time string (prefer hours)
          if (estHours) setPredictedTime(`${estHours} hours`);
          else if (estDays) setPredictedTime(`${estDays} days`);
          else setPredictedTime(null);

          // Explanation and weather impact
          const explanation = data.time_prediction.explanation || data.time_prediction.explain || '';
          setPredictedExplanation(explanation);
          const wImpact = data.time_prediction.weather_impact || data.time_prediction.weatherImpact || '';
          setWeatherImpact(wImpact);

          const urgency = data.time_prediction.urgency_tier || data.time_prediction.urgency || '';
          setPredictedUrgency(urgency);
        }
      } catch (error) {
        console.error('Failed to fetch prediction:', error);
        setPredictionError('Could not fetch resolution time prediction');
      } finally {
        setLoadingPrediction(false);
      }
    };

    if (isOpen) {
      fetchPrediction();
    }
  }, [isOpen, complaint]);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-[#4B687A] hover:text-[#AAAAAA] text-lg bg-white w-10 h-10 flex items-center justify-center"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-center text-[#4B687A] mb-6">
          Assign Complaint
        </h2>

        {loadingPrediction && (
          <div className="mb-4 p-3 bg-[#F1F4F7] border border-[#D7E1EA] rounded-xl">
            <div className="flex items-center gap-2 text-sm text-[#4B687A]">
              <span className="w-4 h-4 border-2 border-[#4B687A] border-t-transparent rounded-full animate-spin" />
              <span>Analyzing complaint...</span>
            </div>
          </div>
        )}

        {!loadingPrediction &&
          (predictedTime || predictedDays || predictedExplanation || weatherImpact) && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <p className="text-sm font-semibold text-[#4B687A]">📊 AI Prediction</p>

              {predictedDays && (
                <p className="text-sm text-gray-700">
                  Predicted Urgency:
                  {predictedUrgency && (
                    <span className="font-bold ml-1">{predictedUrgency.toUpperCase()}</span>
                  )}
                  <br />
                  Estimated days to solve the issue:
                  <span className="font-bold ml-1">{predictedDays} days</span>
                </p>
              )}

              {predictedExplanation && (
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Explanation:</span> {predictedExplanation}
                </p>
              )}

              {weatherImpact && (
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Weather Impact:</span> {weatherImpact}
                </p>
              )}
            </div>
          )}

        {!loadingPrediction && predictionError && (
          <div className="mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-700">
            {predictionError}
          </div>
        )}

        <div className="space-y-2 mb-5">
          <p className="text-gray-600 text-sm font-medium">
            Select a field worker to assign this complaint
          </p>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4B687AD9] hover:border-gray-500"
          >
            <option value="" disabled>
              Select a field worker
            </option>
            {fieldWorkers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.username}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full">
          <button
            type="button"
            onClick={() => {
              if (selectedWorker) {
                onAssign(selectedWorker, predictedTime, predictedDays);
              }
            }}
            disabled={!selectedWorker}
            className="w-full px-5 py-2 rounded-lg bg-[#4B687A] text-white font-medium hover:bg-[#3C5260] transition-colors disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

const GovAuthHomepage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [fieldWorkers, setFieldWorkers] = useState([]);

  const [activeMenu, setActiveMenu] = useState('home');

  const fetchGovComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/complaints/govhome/');

      setComplaints(res.data || []);
    } catch (err) {
      console.error('Error loading gov complaints', err);
      setError('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchComplaints = useCallback(
    async (q) => {
      if (!q) {
        return fetchGovComplaints();
      }
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(
          `/complaints/search/?q=${encodeURIComponent(q)}`
        );
        setComplaints(res.data || []);
      } catch (err) {
        console.error('Search error', err);
        setError('Search failed.');
      } finally {
        setLoading(false);
      }
    },
    [fetchGovComplaints]
  );

  const fetchFieldWorkers = useCallback(async (complaintId) => {
    try {
      const endpoint = complaintId
        ? `/complaints/available-workers/${complaintId}/`
        : '/complaints/available-workers/';

      const res = await api.get(endpoint);
      setFieldWorkers(res.data || []);
    } catch (err) {
      console.error('Error loading field workers', err);
      setFieldWorkers([]);
    }
  }, []);

  const handleAssignClick = async (complaint) => {
    setSelectedComplaint(complaint);
    await fetchFieldWorkers(complaint.id); // fetch workers for this specific complaint
    setIsAssignModalOpen(true);
  };

  const handleAssign = async (workerId, expectedTime, predictedDays) => {
    try {
      const payload = {
        fieldworker_id: workerId,
      };
      
      // Add expected time if available
      if (expectedTime) {
        payload.expected_resolution_time = expectedTime;
      }
      if (predictedDays !== null && predictedDays !== undefined) {
        payload.predicted_resolution_days = predictedDays;
      }
      
      await api.post(`/complaints/assign/${selectedComplaint.id}/`, payload);
      // Refresh the complaints list
      fetchGovComplaints();
      setIsAssignModalOpen(false);
      setSelectedComplaint(null);
    } catch (err) {
      console.error('Error assigning complaint', err);
      setError('Failed to assign complaint.');
    }
  };

  useEffect(() => {
    fetchGovComplaints();
    fetchFieldWorkers();
  }, [fetchGovComplaints, fetchFieldWorkers]);

  return (
    <div className="font-inter min-h-screen flex flex-col">
      <header className="bg-white w-full p-4 flex justify-between items-center sticky top-0 z-10 border-b-3 border-gray-400">
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search complaints"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  searchComplaints(query);
                }
              }}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-400 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-[#4B687A] focus:border-gray-500 hover:border-[#4B687A] transition-all"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 flex justify-center px-1 py-1">
          <div className="w-full max-w-2xl lg:max-w-4xl space-y-1">
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center mb-6">
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            {!loading && complaints.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-indigo-200 shadow-lg">
                <p className="text-gray-700 text-lg font-semibold">
                  No complaints found.
                </p>
                <p className="text-gray-500 mt-2">
                  Try adjusting your search or check back later.
                </p>
              </div>
            )}

            {!loading &&
              complaints.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onAssignClick={handleAssignClick}
                />
              ))}
          </div>
        </div>
      </div>

      <AssignModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedComplaint(null);
        }}
        onAssign={handleAssign}
        complaint={selectedComplaint}
        fieldWorkers={fieldWorkers}
      />
    </div>
  );
};

export default GovAuthHomepage;
