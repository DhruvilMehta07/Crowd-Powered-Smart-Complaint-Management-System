import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

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

const ImageUploadIcon = ({ className = 'w-10 h-10' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm6.5 3A2.5 2.5 0 117 10.5 2.5 2.5 0 019.5 8zM6 18h12l-3.75-5-2.75 3.667L9 13l-3 5z" />
  </svg>
);

const ComplaintCard = ({ complaint }) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString) => {
    const d = dateString || complaint.posted_at || complaint.date;
    if (!d) return 'Unknown date';
    try {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(d).toLocaleDateString('en-GB', options);
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
    className="bg-white p-4 rounded-xl border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:border-gray-300 cursor-pointer"
    onClick={() => navigate(`/complaint/${complaint.id}`)}
  >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <div className="rounded-full p-1 text-[#4B687A]">
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4B687A]"></div>
        </div>
      )}

      {showImageModal && selectedImageIndex !== null && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 "
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

      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg inline-block border border-gray-200">
            <span className="font-semibold text-[#4B687A]">Assigned to:</span>{' '}
            <span className="text-gray-800">
              {complaint.assigned_to_fieldworker || 'Unassigned'}
            </span>
          </div>
          {complaint.expected_resolution_time && (
            <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg inline-block border border-green-200">
              <span className="font-semibold text-green-700">Expected:</span>{' '}
              <span className="text-gray-800">
                {complaint.expected_resolution_time}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {complaint.status === 'In Progress' && (
            <SubmitResolutionButton complaintId={complaint.id} />
          )}
          <ReportButton complaintId={complaint.id} />
        </div>
      </div>
    </div>
  );
};

const ReportButton = ({ complaintId }) => {
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(() => {
    try {
      const raw = localStorage.getItem('reportedComplaints');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.includes(complaintId) : false;
    } catch (e) {
      return false;
    }
  });
  const navigate = useNavigate();

  const handleReport = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('access_token');
    const isAuth = token || localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuth) {
      alert('Please login to report a complaint.');
      navigate('/auth');
      return;
    }

    if (reported) return;

    try {
      setIsReporting(true);
      await api.post(`/complaints/${complaintId}/fake-confidence/`);

      // persist locally
      try {
        const raw = localStorage.getItem('reportedComplaints');
        const parsed = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(parsed) ? (parsed.includes(complaintId) ? parsed : [...parsed, complaintId]) : [complaintId];
        localStorage.setItem('reportedComplaints', JSON.stringify(next));
      } catch (e) {
        // ignore
      }

      setReported(true);
      // optionally reload to reflect backend changes
      window.location.reload();
    } catch (err) {
      console.error('Error reporting complaint:', err);
      alert('Failed to report complaint. Please try again.');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <button
      onClick={handleReport}
      className={`py-2 px-3 rounded-lg text-sm font-medium ${reported ? 'bg-gray-200 text-gray-500' : 'bg-red-600 text-white hover:bg-red-700'}`}
      disabled={isReporting || reported}
      title={reported ? 'Already reported' : 'Report this complaint'}
    >
      {isReporting ? 'Reporting...' : reported ? 'Reported' : 'Report'}
    </button>
  );
};

const SubmitResolutionButton = ({ complaintId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => {
    if (!submitting) {
      // revoke preview URLs
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
      setIsOpen(false);
      setDescription('');
      setFiles([]);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  const onFileChange = (e) => {
    const chosen = Array.from(e.target.files).slice(0, 5);
    setFiles(chosen);
    // create object URLs for previews
    const urls = chosen.map((f) => URL.createObjectURL(f));
    // revoke previous previews
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return urls;
    });
  };

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  const handleSubmit = async () => {
    if (!description && files.length === 0) {
      alert('Please provide a description or at least one image.');
      return;
    }

    const formData = new FormData();
    formData.append('description', description);
    files.forEach((f) => formData.append('images', f));

    try {
      setSubmitting(true);
      const res = await api.post(
        `/complaints/${complaintId}/submit-resolution/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      alert(res.data?.message || 'Resolution submitted.');
      close();
      window.location.reload();
    } catch (err) {
      console.error('Error submitting resolution', err);
      alert(err.response?.data?.error || 'Failed to submit resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); open(); }}
        className="bg-[#4B687A] text-white px-3 py-2 rounded-md hover:bg-[#3C5260] transition-colors"
      >
        Submit Resolution
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
          onClick={handleBackdropClick}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute top-4 right-3 w-8 h-8 flex items-center justify-center text-[#4B687A] hover:bg-gray-100 transition-colors text-xl font-bold"
              aria-label="Close"
            >
              ×
            </button>

            <h2 className="text-xl font-semibold text-center text-[#4B687A] mb-6">
              Submit Resolution
            </h2>

            <div className="space-y-4">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work you completed..."
                className="w-full border border-gray-300 rounded-lg p-3 h-32 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4B687AD9] resize-none"
              />

              <div>
                <input
                  id={`file-input-${complaintId}`}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileChange}
                  className="hidden"
                />

                <label
                  htmlFor={`file-input-${complaintId}`}
                  className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#4B687A] hover:bg-gray-50 transition-colors"
                >
                  <ImageUploadIcon className="w-8 h-8 text-[#4B687A]" />
                  <span className="mt-2 text-sm font-medium text-gray-700">
                    Upload images
                  </span>
                  <span className="text-xs text-gray-500">Up to 5 images</span>
                </label>

                {previews.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {previews.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`preview-${idx}`}
                        className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={close}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[#4B687A] hover:bg-[#3C5260] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const FieldWorkerHomepage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const fetchFieldComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        '/complaints/fieldhome/',
        {},
        { withCredentials: true }
      );
      setComplaints(res.data || []);
    } catch (err) {
      console.error('Error loading field complaints', err);
      setError('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchComplaints = useCallback(
    async (q) => {
      if (!q) {
        return fetchFieldComplaints();
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
    [fetchFieldComplaints]
  );

  useEffect(() => {
    fetchFieldComplaints();
  }, [fetchFieldComplaints]);

  return (
    <div className="bg-gradient-to-br from-gray-50 via-[#4B687A]/10 to-gray-50 font-inter min-h-screen flex flex-col">
      <header className="bg-white w-full p-4 flex justify-between items-center sticky top-0 z-10 border-b-3 border-gray-400">
        <div className="flex-1 max-w-2xl mx-auto w-full">
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
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4B687A] focus:border-gray-500 hover:border-[#4B687A] transition-all duration-200"
            />
          </div>
        </div>
        {/* <div className="flex items-center gap-4">
          <button className="p-3 rounded-full hover:bg-[#4B687A]/10 hover:shadow-md transition-all duration-200">
            <FilterIcon className="w-6 h-6 text-[#4B687A]" />
          </button>
        </div> */}
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 flex justify-center px-1 py-1">
          <div className="w-full max-w-2xl lg:max-w-4xl space-y-1">
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#4B687A]"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center mb-6">
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            {!loading && complaints.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
                <p className="text-gray-700 text-lg font-semibold">
                  No complaints found.
                </p>
                <p className="text-gray-500 mt-2">
                  Try adjusting your search or check back later.
                </p>
              </div>
            )}

            {!loading && complaints.length > 0 && (
              <div className="space-y-1">
                {complaints.map((complaint) => (
                  <ComplaintCard key={complaint.id} complaint={complaint} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldWorkerHomepage;
