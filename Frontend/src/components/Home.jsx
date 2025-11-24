import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import TrendingComplaints from '../pages/TrendingComplaints';
import { clearAccessToken } from '../utils/auth';

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

const ArrowUpIcon = ({ className = 'w-5 h-5', filled = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25a.75.75 0 01-.75.75z"
      clipRule="evenodd"
    />
  </svg>
);

// Report uses a simple text button (no icon) — styled below where used

const ChatBubbleIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm5.25-1.25a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z"
      clipRule="evenodd"
    />
  </svg>
);

const ShareIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path d="M13 4.5a2.5 2.5 0 11.702 4.289l-4.117 2.428a2.503 2.503 0 010 1.566l4.117 2.428A2.5 2.5 0 1113 15.5V4.5z" />
  </svg>
);

const ImageIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm6.5 3A2.5 2.5 0 117 10.5 2.5 2.5 0 019.5 8zM6 18h12l-3.75-5-2.75 3.667L9 13l-3 5z" />
  </svg>
);

const FilterIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path d="M3 5a1 1 0 011-1h12a1 1 0 01.707 1.707L12 10.414V15a1 1 0 01-1.447.894L7 14.118V10.414L3.293 6.707A1 1 0 013 6V5z" />
  </svg>
);

const SortIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path d="M3 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6 10a1 1 0 100 2h8a1 1 0 100-2H6zM9 14a1 1 0 100 2h2a1 1 0 100-2H9z" />
  </svg>
);

const Header = ({
  query,
  setQuery,
  onSearch,
  departments = [],
  department,
  setDepartment,
  pincode,
  setPincode,
  sortBy,
  setSortBy,
  order,
  setOrder,
}) => {
  const [showPanel, setShowPanel] = React.useState(false);
  const panelWrapperRef = React.useRef(null);

  // Close panel when clicking outside
  React.useEffect(() => {
    if (!showPanel) return;

    const handleOutsideClick = (e) => {
      if (panelWrapperRef.current && !panelWrapperRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPanel]);
  return (
    <header className="bg-white w-full p-4 flex justify-between items-center sticky top-0 z-10 border-b-3 border-gray-400">
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative flex items-center gap-4">
          {/* Search input (left) and a single combined Filter/Sort button to the right */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4B687A] focus:border-gray-500 transition-all"
            />
          </div>

          <div className="relative" ref={panelWrapperRef}>
            <button
              title="Filter and Sort"
              onClick={() => setShowPanel((s) => !s)}
              className="w-12 h-12 flex items-center gap-2 px-3 py-2 rounded-full bg-[#4B687A] text-white hover:bg-[#3C5260] transition-shadow shadow-sm"
              aria-label="Open filter and sort options"
            >
              <FilterIcon className="w-10 h-10 text-white" />
            </button>

            {showPanel && (
              <div className="absolute right-0 top-full mt-3 w-96 bg-gray-100 border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Department</label>
                    <select
                      value={department || ''}
                      onChange={(e) => setDepartment(e.target.value || null)}
                      className="w-full border rounded p-2 my-2"
                    >
                      <option value="">All departments</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Pincode</label>
                    <input
                      value={pincode || ''}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Enter pincode"
                      className="w-full border rounded p-2 my-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Sort by</label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        const nextSort = e.target.value;
                        setSortBy(nextSort);

                        if (nextSort === 'oldest' || nextSort === 'least_votes') {
                          setOrder('asc');
                        } else {
                          setOrder('desc');
                        }
                      }}
                      className="w-full border rounded p-2 my-2"
                    >
                      <option value="latest">Latest</option>
                      <option value="upvotes">Most UpVotes</option>
                      <option value="least_votes">Least UpVotes</option>
                      <option value="oldest">Oldest</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setDepartment(null);
                        setPincode('');
                        setSortBy('latest');
                        setOrder('desc');
                      }}
                      className="px-3 py-1 rounded bg-gray-100"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => {
                        onSearch();
                        setShowPanel(false);
                      }}
                      className="px-4 py-1 rounded bg-[#4B687A] text-white hover:bg-[#3C5260]"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const ComplaintCard = ({
  complaint,
  onUpvote,
  isAuthenticated,
  onDelete,
  onReport,
  reported = false,
}) => {
  const navigate = useNavigate();
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(
    // prefer serializer-provided `upvotes_count`, fall back to older fields
    complaint.upvotes_count ??
      complaint.upvote_count ??
      (complaint.upvotes || 0)
  );
  const [userHasUpvoted, setUserHasUpvoted] = useState(
    // prefer serializer-provided `is_upvoted`, fall back to older fields
    complaint.is_upvoted ?? complaint.user_has_upvoted ?? false
  );
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [fullImagesLoaded, setFullImagesLoaded] = useState(false);
  const [localReported, setLocalReported] = useState(reported);
  const [isReporting, setIsReporting] = useState(false);

  // Keep localReported in sync if parent reported prop changes (e.g. persisted state)
  useEffect(() => {
    setLocalReported(Boolean(reported));
  }, [reported]);

  // Use thumbnail if available to avoid fetching full image list on mount.
  // Full images are fetched lazily when opening the modal.
  useEffect(() => {
    const initImages = () => {
      // If the serializer provided full images, use them
      if (complaint.images && complaint.images.length > 0) {
        setImages(complaint.images);
        setFullImagesLoaded(true);
        return;
      }

      // If a thumbnail_url is available, use that as a single preview image
      if (complaint.thumbnail_url) {
        setImages([{ image_url: complaint.thumbnail_url }]);
        setFullImagesLoaded(false);
        return;
      }

      // No images or thumbnail available
      setImages([]);
      setFullImagesLoaded(false);
    };

    initImages();
  }, [complaint.id, complaint.images, complaint.thumbnail_url]);

  const handleDeleteComplaint = async () => {
    if (!isAuthenticated) {
      alert('Please login to delete complaints.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this complaint?')) {
      return;
    }

    try {
      await onDelete(complaint.id);
    } catch (error) {
      console.error('Error deleting complaint:', error);
      if (error.response?.status === 403) {
        alert('You can only delete your own complaints.');
      } else {
        alert('Failed to delete complaint. Please try again.');
      }
    }
  };

  const handleImageClick = (index) => {
    const openModalWithImages = async () => {
      // If we only have a thumbnail, fetch full images before opening the modal
      if (!fullImagesLoaded && complaint.id) {
        try {
          setLoadingImages(true);
          const response = await api.get(`/complaints/${complaint.id}/images/`);
          setImages(response.data);
          setFullImagesLoaded(true);
          // map index remains valid; if thumbnail was single image, index 0 maps to first
        } catch (error) {
          console.error('Error fetching complaint images:', error);
        } finally {
          setLoadingImages(false);
        }
      }

      setSelectedImageIndex(index);
      setShowImageModal(true);
    };

    openModalWithImages();
  };

  // keyboard navigation for image modal
  useEffect(() => {
    if (!showImageModal) return;

    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => {
          if (prev === null) return 0;
          return (prev - 1 + images.length) % images.length;
        });
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => {
          if (prev === null) return 0;
          return (prev + 1) % images.length;
        });
      } else if (e.key === 'Escape') {
        setShowImageModal(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showImageModal, images.length]);

  const handleUpvote = async () => {
    if (!isAuthenticated) {
      alert('Please login to upvote complaints.');
      return;
    }

    if (isUpvoting) return;

    const previousUpvotes = localUpvotes;
    const previousUpvotedStatus = userHasUpvoted;

    const newUpvotedStatus = !userHasUpvoted;
    const newUpvotes = newUpvotedStatus
      ? previousUpvotes + 1
      : previousUpvotes - 1;

    setUserHasUpvoted(newUpvotedStatus);
    setLocalUpvotes(newUpvotes);
    setIsUpvoting(true);

    try {
      await onUpvote(complaint.id, newUpvotedStatus, newUpvotes);
    } catch (error) {
      setUserHasUpvoted(previousUpvotedStatus);
      setLocalUpvotes(previousUpvotes);
      console.error('Failed to update upvote:', error);
    } finally {
      setIsUpvoting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-GB', options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatUpvotes = (upvotes) => {
    const count = upvotes || 0;
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`.replace('.0', '');
    }
    return count.toString();
  };

  const getImageUrl = (imageData) => {
    // If imageData is a string (direct URL)
    if (typeof imageData === 'string') {
      return imageData;
    }

    // If imageData is an object with image_url field (from updated serializer)
    if (imageData.image_url) {
      return imageData.image_url;
    }

    // If object has thumbnail_url provided by serializer
    if (imageData.thumbnail_url) {
      return imageData.thumbnail_url;
    }

    // If imageData is an object with image field (legacy format)
    if (imageData.image) {
      // For Cloudinary, the image field should already be a full URL
      return imageData.image;
    }

    return null;
  };

  return (
    <>
      <div
        className="bg-white p-4 rounded-xl border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:border-gray-300 cursor-pointer"
        onClick={() => navigate(`/complaint/${complaint.id}`)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-1 text-[#4B687A]">
              <UserIcon />
            </div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg text-gray-800">
                {complaint.author ||
                  complaint.posted_by?.username ||
                  'Anonymous User'}
              </p>
              <p className="pl-5 text-sm text-gray-500">
                {formatDate(complaint.posted_at || complaint.date)}
              </p>
            </div>
          </div>
          {isAuthenticated && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteComplaint();
              }}
              className="text-red-600 hover:text-red-800 text-sm font-semibold transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        <p className="text-lg text-gray-800 mb-1 clamped-text">{complaint.content}</p>
        <p className="text-gray-600 text-base leading-relaxed mb-4">
          Address: {complaint.address}
        </p>

        {/* Display Images */}
        {images.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
              {images.slice(0, 4).map((image, index) => (
                <div
                  key={image.id || index}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleImageClick(index);
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

        <div className="text-sm text-gray-600 mb-4 bg-gray-50 px-3 py-2 rounded-lg inline-block">
          <span className="font-semibold text-[#4B687A]">Assigned to:</span>{' '}
          <span className="text-gray-800">
            {complaint.assigned_to_dept ||
              complaint.assignedTo ||
              complaint.category ||
              'Not assigned'}
          </span>
        </div>
        
        {complaint.assigned_to_fieldworker && (
          <div className="text-sm text-gray-600 mb-4 bg-indigo-50 px-3 py-2 rounded-lg inline-block border border-indigo-200 ml-2">
            <span className="font-semibold text-indigo-700">Field Worker:</span>{' '}
            <span className="text-gray-800">
              {complaint.assigned_to_fieldworker}
            </span>
          </div>
        )}
        
        {complaint.assigned_to_fieldworker && (
          <div className="text-sm text-gray-600 mb-4 bg-green-50 px-3 py-2 rounded-lg inline-block border border-green-200 ml-2">
            <span className="font-semibold text-green-700">Expected Time:</span>{' '}
            <span className="text-gray-800">
              {complaint.expected_resolution_time}
            </span>
          </div>
        )}

        <div className="flex items-center gap-10 pt-4 border-t-2 border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpvote();
            }}
            disabled={isUpvoting}
            className={`flex items-center gap-2 transition-all ${
              isUpvoting
                ? 'text-gray-400 cursor-not-allowed'
                : userHasUpvoted
                  ? 'text-[#4B687A] hover:text-[#3C5260]'
                  : 'text-gray-600 hover:text-[#4B687A]'
            } hover:scale-105 transform font-semibold`}
          >
            <ArrowUpIcon
              className={`w-5 h-5 ${isUpvoting ? 'animate-pulse' : ''} ${userHasUpvoted ? 'text-[#4B687A]' : ''}`}
            />
            <span>{formatUpvotes(localUpvotes)}</span>
          </button>

          {/* Don't render Report button if this user already reported this complaint */}
          {!localReported && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!isAuthenticated) {
                  alert('Please login to report complaints.');
                  return;
                }
                if (!onReport) return;

                if (isReporting) return;
                setIsReporting(true);
                try {
                  await onReport(complaint.id);
                  // parent will update persisted reportedIds; keep local too for immediate feedback
                  setLocalReported(true);
                } catch (err) {
                  console.error('Error reporting complaint', err);
                  alert('Failed to report complaint. Please try again.');
                } finally {
                  setIsReporting(false);
                }
              }}
              disabled={isReporting}
              className={`px-3 py-1 rounded-md border transition-all text-sm font-semibold ${
                isReporting
                  ? 'bg-red-100 text-red-500 border-red-200 cursor-not-allowed opacity-80'
                  : 'bg-transparent text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-600'
              }`}
              title="Report as fake"
            >
              {isReporting ? 'Reporting...' : 'Report as Fake'}
            </button>
          )}

          {localReported && (
            <span className="ml-2 text-sm text-red-600 font-semibold">
              Reported
            </span>
          )}
        </div>
      </div>

      {/* Image Modal */}
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

      {/* per-card toast removed; homepage-level toast is used instead */}
    </>
  );
};

// Toast rendering for report success is inside each ComplaintCard; render popup element

const Homepage = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showReportToast, setShowReportToast] = useState(false);
  const [department, setDepartment] = useState(null);
  const [pincode, setPincode] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [order, setOrder] = useState('desc');
  const [departmentsList, setDepartmentsList] = useState([]);
  const isFetchingRef = useRef(false);
  // persist reported complaint ids for this user in localStorage so the "Report" button
  // stays disabled after reporting (survives reloads)
  const [reportedIds, setReportedIds] = useState(() => {
    try {
      const raw = localStorage.getItem('reportedComplaints');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('access_token');
      const authStatus = localStorage.getItem('isAuthenticated');
      const storedUsername = localStorage.getItem('username');

      if (token && authStatus === 'true' && storedUsername) {
        setIsAuthenticated(true);
        setUsername(storedUsername);
      } else {
        setIsAuthenticated(false);
        setUsername('');
      }
    };

    checkAuthStatus();
    window.addEventListener('storage', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  // Fetch departments for filter dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/users/departments/');
        setDepartmentsList(response.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const mapSortParams = useCallback((uiSortKey, uiOrder) => {
    const normalizedSort = uiSortKey || 'latest';
    const normalizedOrder = uiOrder || 'desc';

    if (normalizedSort === 'least_votes') {
      return { sort_by: 'upvotes', order: 'asc' };
    }

    if (normalizedSort === 'oldest') {
      return { sort_by: 'oldest', order: 'asc' };
    }

    if (normalizedSort === 'upvotes') {
      return { sort_by: 'upvotes', order: normalizedOrder };
    }

    return { sort_by: 'latest', order: normalizedOrder };
  }, []);

  const fetchComplaints = useCallback(
    async (opts = {}) => {
      // prevent duplicate concurrent fetches (e.g., React StrictMode double-invoke in dev)
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        setLoading(true);
        setError(null);
        const params = {};
        // merge filters from opts or current state
        const dept = opts.department ?? department;
        const pin = opts.pincode ?? pincode;
        const uiSort = opts.sortBy ?? sortBy;
        const uiOrder = opts.order ?? order;
        const { sort_by: apiSortBy, order: apiOrder } = mapSortParams(uiSort, uiOrder);

        if (dept) params.department = dept;
        if (pin) params.pincode = pin;
        if (apiSortBy) params.sort_by = apiSortBy;
        if (apiOrder) params.order = apiOrder;

        const response = await api.get('/complaints/', { params });
        setComplaints(response.data);
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setError('Failed to load complaints. Please try again later.');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [department, pincode, sortBy, order, mapSortParams]
  );

  const searchComplaints = useCallback(
    async (q) => {
      if (!q) {
        return fetchComplaints();
      }
      setLoading(true);
      setError(null);
      try {
        const params = {
          q: q,
        };
        if (department) params.department = department;
        if (pincode) params.pincode = pincode;
        const { sort_by: apiSortBy, order: apiOrder } = mapSortParams(sortBy, order);
        if (apiSortBy) params.sort_by = apiSortBy;
        if (apiOrder) params.order = apiOrder;

        const query = new URLSearchParams(params).toString();
        const response = await api.get(`/complaints/search/?${query}`);
        setComplaints(response.data || []);
      } catch (err) {
        console.error('Search error', err);
        setError('Search failed.');
      } finally {
        setLoading(false);
      }
    },
    [fetchComplaints, department, pincode, sortBy, order, mapSortParams]
  );
  const handleUpvote = async (
    complaintId,
    expectedUpvotedStatus,
    expectedUpvotes
  ) => {
    try {
      const response = await api.post(`/complaints/${complaintId}/upvote/`);

      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) =>
          complaint.id === complaintId
            ? {
                ...complaint,
                // prefer canonical serializer name `upvotes_count`; accept other shapes
                upvotes_count:
                  response.data.upvotes_count ??
                  response.data.upvote_count ??
                  response.data.upvotes ??
                  response.data.likes_count ??
                  expectedUpvotes,
                // keep old field for compatibility
                upvote_count:
                  response.data.upvotes_count ??
                  response.data.upvote_count ??
                  response.data.upvotes ??
                  response.data.likes_count ??
                  expectedUpvotes,
                // user upvote boolean - prefer `is_upvoted` but accept older name
                is_upvoted:
                  response.data.is_upvoted !== undefined
                    ? response.data.is_upvoted
                    : response.data.user_has_upvoted !== undefined
                      ? response.data.user_has_upvoted
                      : expectedUpvotedStatus,
                user_has_upvoted:
                  response.data.is_upvoted !== undefined
                    ? response.data.is_upvoted
                    : response.data.user_has_upvoted !== undefined
                      ? response.data.user_has_upvoted
                      : expectedUpvotedStatus,
              }
            : complaint
        )
      );

      return response.data;
    } catch (err) {
      console.error('Error upvoting complaint:', err);
      throw err;
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    try {
      await api.delete(`/complaints/${complaintId}/delete/`);
      alert('Complaint deleted successfully!');
      fetchComplaints();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  };

  const handleReport = async (complaintId) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    try {
      await api.post(`/complaints/${complaintId}/fake-confidence/`);
      // refresh to get updated fake confidence values
      await fetchComplaints();
      setShowReportToast(true);
      setTimeout(() => setShowReportToast(false), 2200);
      // persist reported id locally so the same user cannot click report again
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
    } catch (err) {
      console.error('Error reporting complaint:', err);
      throw err;
    }
  };

  const onLoginClick = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const onLogoutClick = useCallback(async () => {
    try {
      await api.post('/users/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      clearAccessToken();
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user_type');

      delete api.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUsername('');
      navigate('/', { replace: true });
      window.location.reload();
    }
  }, [navigate]);

  const openRaiseComplaint = useCallback(() => {
    if (!isAuthenticated) {
      alert('Please login to raise a complaint.');
      navigate('/auth');
      return;
    }
    setIsRaiseOpen(true);
  }, [isAuthenticated, navigate]);

  const closeRaiseComplaint = useCallback(() => {
    setIsRaiseOpen(false);
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return (
    <div className="bg-gradient-to-br from-gray-50 via-[#4B687A]/10 to-gray-50 font-inter min-h-screen flex flex-col">
      <Header
        query={query}
        setQuery={setQuery}
        onSearch={() => searchComplaints(query)}
        departments={departmentsList}
        department={department}
        setDepartment={setDepartment}
        pincode={pincode}
        setPincode={setPincode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        order={order}
        setOrder={setOrder}
      />

      {showReportToast && (
        <div className="fixed top-5 right-5 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Reported successfully
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        <div className="flex-1 flex justify-center px-1 py-1 ">
          <div className="w-full max-w-2xl lg:max-w-4xl space-y-1">
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#4B687A]"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center mb-6">
                <p className="text-red-700 font-semibold">{error}</p>
                <button
                  onClick={fetchComplaints}
                  className="mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-lg"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {complaints.length > 0 ? (
                  complaints.map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onUpvote={handleUpvote}
                      onDelete={handleDeleteComplaint}
                      onReport={handleReport}
                      isAuthenticated={isAuthenticated}
                      reported={reportedIds.includes(complaint.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
                    <p className="text-gray-700 text-lg font-semibold">
                      No complaints found.
                    </p>
                    <p className="text-gray-500 mt-2">
                      Be the first to raise a complaint!
                    </p>
                    <button
                      onClick={openRaiseComplaint}
                      className="mt-4 bg-gradient-to-r from-gray-600 to-[#4B687A] hover:from-gray-700 hover:to-[#4B687A] text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-lg"
                    >
                      Raise First Complaint
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isRaiseOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-indigo-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Raise a Complaint
            </h2>
            <p className="text-gray-600 mb-6">
              Complaint form would go here. This is a placeholder modal.
            </p>
            <div className="flex gap-4">
              <button
                onClick={closeRaiseComplaint}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  closeRaiseComplaint();
                  alert('Complaint raised successfully!');
                }}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-[#4B687A] hover:from-indigo-700 hover:to-[#4B687A] text-white font-semibold py-3 rounded-lg transition-all shadow-lg"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
