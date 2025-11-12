import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

const HomeIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
  </svg>
);

const BellIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
      clipRule="evenodd"
    />
  </svg>
);

const DocumentTextIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
      clipRule="evenodd"
    />
    <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-3.434-1.279h-1.875a3.375 3.375 0 01-3.375-3.375V5.25a9.768 9.768 0 00-1.279-.029c.118-.38.247-.754.386-1.128A5.23 5.23 0 0112.97 1.816z" />
  </svg>
);

const QuestionMarkCircleIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.377-1.34-.634-2.128-.634-1.727 0-3.25 1.067-3.25 2.792 0 .445.142.79.406 1.078.293.318.734.575 1.32.81.73.293 1.243.64 1.56 1.13.317.488.344 1.058.1 1.66-.224.557-.7.876-1.295.876-.512 0-.94-.233-1.175-.588-.2-.307-.243-.7-.113-1.082l-.784-.327c-.136.543.034 1.208.545 1.773.57.626 1.414.97 2.327.97 1.235 0 2.27-.672 2.692-1.673.42-.995.248-2.18-.477-3.05-.498-.6-1.22-.97-2.01-1.26-.52-.2-.86-.358-1.09-.516-.23-.158-.34-.3-.34-.492 0-.394.636-.792 1.5-.792.66 0 1.146.245 1.5.637.287.317.377.724.26 1.093l.815.34c.208-.695-.12-1.59-.89-2.233-.67-.55-1.555-.827-2.435-.827-1.753 0-3.15 1.135-3.15 2.792 0 .79.34 1.446.93 1.96.47.41 1.08.71 1.74.94.83.29 1.42.64 1.78 1.08.36.44.48.98.36 1.55l-.125.625h-1.25l.125-.625c.04-.2 0-.38-.12-.53-.12-.15-.32-.27-.6-.38-.52-.2-1.08-.41-1.58-.75-.63-.43-1.02-1.02-1.02-1.77 0-1.1 1.1-1.792 2.15-1.792.57 0 1.04.17 1.38.45.34.28.48.65.42 1.03l-.875-.365c.05-.3-.03-.57-.23-.78-.2-.21-.5-.33-.85-.33-.394 0-.75.233-.75.542 0 .15.08.27.22.37.14.1.33.18.56.25.45.14.93.3 1.35.53.42.23.75.53.98.9.23.37.33.8.3 1.26l.125.625h1.25l-.125-.625c-.03-.15 0-.29.08-.42.08-.13.21-.23.38-.32.34-.18.73-.33 1.14-.45.82-.24 1.54-.6 2.08-1.12.54-.52.85-1.18.85-1.96 0-1.36-1.23-2.542-2.85-2.542-1.1 0-2.05.5-2.6 1.3-.55.8-.6 1.8-.15 2.65z"
      clipRule="evenodd"
    />
  </svg>
);

const PlusCircleIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
      clipRule="evenodd"
    />
  </svg>
);

const RaiseComplaintModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    description: '',
    assigned_to_dept: '',
    address: '',
    pincode: '',
    latitude: '',
    longitude: '',
    location_type: 'manual',
    files: [],
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const reverseGeocodeMapmyIndia = async (lat, lng) => {
    try {
      console.log('Starting reverse geocode for:', { lat, lng });

      const response = await api.post('/complaints/reverse-geocode/', {
        latitude: lat,
        longitude: lng,
      });

      console.log('Reverse geocode API response:', response.data);

      if (response.data.success) {
        console.log('Address data received:', response.data.data);
        return response.data.data;
      } else {
        console.error('Reverse geocode failed:', response.data.error);
        throw new Error(response.data.error || 'Reverse geocoding failed');
      }
    } catch (error) {
      console.error('Reverse geocoding error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });

      if (error.response?.status === 404) {
        throw new Error(
          'No address found for this location. Please enter address manually.'
        );
      } else if (error.response?.status === 408) {
        throw new Error(
          'Location service timeout. Please try again or enter address manually.'
        );
      } else if (error.response?.status === 500) {
        const message =
          error.response.data?.message ||
          error.response.data?.detail ||
          'Internal Server Error';
        throw new Error(message);
      } else {
        const msg =
          error.response.errorMessage ||
          error.response.message ||
          error.response.data.message ||
          'Sorry';
        throw new Error(msg);
      }
    }
  };

  // Updated GPS location function
  const getGPSLocation = async () => {
    setIsGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('geolocation not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Show coordinates immediately
        setForm((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          location_type: 'gps',
          address: 'Fetching address from MapmyIndia...',
          pincode: '',
        }));

        // Get address from MapmyIndia
        try {
          const addressData = await reverseGeocodeMapmyIndia(lat, lng);
          if (addressData) {
            setForm((prev) => ({
              ...prev,
              address: addressData.address || 'Address not found',
              pincode: addressData.pincode || '',
            }));
            setLocationError('');

            if (!addressData.pincode) {
              setLocationError(
                'Address found but pincode not available. Please add pincode manually.'
              );
            }
          }
        } catch (error) {
          setLocationError(error.message);
          // Keep GPS coordinates but allow manual address editing
          setForm((prev) => ({
            ...prev,
            address: 'Please enter address manually...',
          }));
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        let errorMessage =
          'unable to retrieve location. please enter address manually.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'location access denied. please enable location services or enter address manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              'location information unavailable. please enter address manually.';
            break;
          case error.TIMEOUT:
            errorMessage =
              'location request timed out. please enter address manually.';
            break;
        }

        setLocationError(errorMessage);
        setIsGettingLocation(false);
        setForm((prev) => ({
          ...prev,
          location_type: 'manual',
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  // extract pincode from address when address changes
  useEffect(() => {
    if (form.address && form.location_type === 'manual') {
      const pincodeMatch = form.address.match(/\b[1-9][0-9]{5}\b/);
      if (pincodeMatch) {
        setForm((prev) => ({
          ...prev,
          pincode: pincodeMatch[0],
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          pincode: '',
        }));
      }
    }
  }, [form.address, form.location_type]);

  // fetch departments from api
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!isOpen) return;

      setDepartmentsLoading(true);
      try {
        const response = await api.get('/users/departments/');
        setDepartments(response.data);
      } catch (error) {
        console.error('error fetching departments:', error);
        // fallback to default departments if api fails
        setDepartments([
          { id: 1, name: 'Water' },
          { id: 2, name: 'Road' },
          { id: 3, name: 'Fire' },
          { id: 4, name: 'Other' },
        ]);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    // Only keep images and limit to 4 (backend enforces max 4 but we can help in UI)
    const imagesOnly = selected.filter((f) => f.type && f.type.startsWith('image/'));
    setForm((prev) => ({ ...prev, files: imagesOnly.slice(0, 4) }));
  };

  const handleLocationMethodChange = (method) => {
    setForm((prev) => ({
      ...prev,
      location_type: method,
      address: method === 'gps' ? '' : prev.address,
      pincode: method === 'gps' ? '' : prev.pincode,
      latitude: method === 'manual' ? '' : prev.latitude,
      longitude: method === 'manual' ? '' : prev.longitude,
    }));

    if (method === 'gps') {
      getGPSLocation();
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate form based on location method
  if (form.location_type === 'gps' && (!form.latitude || !form.longitude)) {
    setLocationError('GPS location is required');
    return;
  }

  if (form.location_type === 'manual' && !form.address) {
    setLocationError('Address is required when using manual location');
    return;
  }

  if (!form.description || !form.assigned_to_dept) {
    return alert('Please fill in all required fields.');
  }

  setLoading(true);
  try {
    const formData = new FormData();
    
    // ONLY send the description as content (this is the main fix)
    formData.append('content', form.description);

    // Add location data based on source
    formData.append('location_type', form.location_type);

    if (form.location_type === 'gps') {
      formData.append('latitude', parseFloat(form.latitude).toFixed(8));
      formData.append('longitude', parseFloat(form.longitude).toFixed(8));
      
      // Also include address from GPS reverse geocoding
      if (form.address && form.address !== 'Fetching address from MapmyIndia...') {
        formData.append('address', form.address);
      }
    } else {
      // Manual location
      formData.append('address', form.address);
      if (form.pincode) {
        formData.append('pincode', form.pincode);
      }
    }

    // Add department (category)
    if (form.assigned_to_dept) {
      formData.append('assigned_to_dept', form.assigned_to_dept);
    }

    // Add files if any
    if (form.files && form.files.length > 0) {
      // Append each selected file with the same field name 'images' so DRF parses them as a list
      form.files.forEach((f) => {
        formData.append('images', f);
      });
    }

    // Debug: Log what we're sending
    console.log('Submitting complaint with data:');
    for (let [key, value] of formData.entries()) {
      console.log(key + ': ' + value);
    }

    const response = await api.post('/complaints/create/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 201) {
      alert('Complaint submitted successfully!');
      setForm({
        description: '',
        address: '',
        assigned_to_dept: '',
        pincode: '',
        latitude: '',
        longitude: '',
        location_type: 'manual',
        files: [],
      });
      setLocationError('');
      onClose();
      window.location.reload();
    }
  } catch (error) {
    console.error('Error submitting complaint:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Server response:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    
    const serverMessage = error.response?.data || error.message;
    
    if (error.response?.status === 500) {
      alert('Server error. Please check the console for details and contact support if the issue persists.');
    } else if (error.response?.status === 403) {
      alert('Security token expired. Please refresh the page and try again.');
    } else if (error.response?.status === 400) {
      // Show validation errors from backend
      const errorDetails = error.response.data;
      let errorMessage = 'Please fix the following errors:\n';
      
      if (typeof errorDetails === 'object') {
        Object.keys(errorDetails).forEach(key => {
          errorMessage += `• ${key}: ${errorDetails[key]}\n`;
        });
      } else {
        errorMessage = errorDetails;
      }
      
      alert(errorMessage);
    } else {
      alert(
        'Failed to submit complaint. ' +
        (typeof serverMessage === 'string'
          ? serverMessage
          : JSON.stringify(serverMessage))
      );
    }
  } finally {
    setLoading(false);
  }
};
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-[100%] max-w-md rounded-2xl shadow-xl p-6 relative mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#4B687A] hover:text-[#AAAAAA] text-lg bg-white w-12 h-12 flex items-center justify-center"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-center text-[#4B687A] mb-6">
          Raise Complaint
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="describe your complaint in detail..."
            rows="3"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#4B687AD9] hover:border-gray-500 resize-none"
            required
          />

          {/* location method selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Location method
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleLocationMethodChange('gps')}
                disabled={isGettingLocation}
                className={`flex-1 py-2 px-3 rounded-lg border transition ${
                  form.location_type === 'gps'
                    ? 'bg-[#4B687A] text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                } ${isGettingLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isGettingLocation ? 'getting location...' : 'use gps location'}
              </button>
              <button
                type="button"
                onClick={() => handleLocationMethodChange('manual')}
                className={`flex-1 py-2 px-3 rounded-lg border transition ${
                  form.location_type === 'manual'
                    ? 'bg-[#4B687A] text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                enter address
              </button>
            </div>

            {locationError && (
              <div className="text-red-500 text-sm mt-1">{locationError}</div>
            )}
          </div>

          {/* location input based on method */}
          {form.location_type === 'gps' ? (
            <div className="space-y-3">
              <div className="bg-[#4B687A] rounded-lg p-3">
                <p className="text-sm text-white font-medium mb-2">
                  📍 GPS Location Detected
                </p>
                {form.latitude && form.longitude ? (
                  <div className="text-xs text-white space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Latitude:</span>{' '}
                        {form.latitude}
                      </div>
                      <div>
                        <span className="font-medium">Longitude:</span>{''}
                        {form.longitude}
                      </div>
                    </div>

                    {/* Show the address details when available */}
                    {form.address &&
                      form.address !==
                        'Fetching address from MapmyIndia...' && (
                        <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                          <div className="font-medium text-black mb-1">
                            Address Found:
                          </div>
                          <div className="text-gray-700 text-sm">
                            {form.address}
                          </div>

                          {form.pincode && (
                            <div className="flex items-center mt-2 p-1 bg-gray-100 rounded">
                              <svg
                                className="w-4 h-4 text-gray-800 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="text-gray-800 font-medium">
                                Pincode: {form.pincode}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Show loading state */}
                    {form.address === 'Fetching address from MapmyIndia...' && (
                      <div className="flex items-center justify-center p-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span className="ml-2 text-white">
                          Fetching address details...
                        </span>
                      </div>
                    )}

                    {/* Show manual override option */}
                    {form.address &&
                      form.address !==
                        'Fetching address from MapmyIndia...' && (
                        <div className="mt-2 text-xs text-gray-500">
                          <button
                            type="button"
                            onClick={() => {
                              const userAddress = prompt(
                                'Edit the address if needed:',
                                form.address
                              );
                              if (userAddress !== null) {
                                setForm((prev) => ({
                                  ...prev,
                                  address: userAddress,
                                }));
                              }
                            }}
                            className="text-white hover:text-gray-300 underline"
                          >
                            Edit address
                          </button>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-blue-600">
                      Getting coordinates...
                    </span>
                  </div>
                )}
              </div>

              {/* Additional info for GPS mode */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <div className="flex items-start text-xs text-gray-600">
                  <svg
                    className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Your location has been automatically detected. The address
                    above is fetched using MapmyIndia API.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Manual address section remains the same
            <div className="space-y-2">
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="enter complete address with pincode..."
                rows="3"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#4B687AD9] hover:border-gray-500 resize-none"
                required
              />
              {form.pincode && (
                <div className="text-sm text-gray-800 bg-gray-100 rounded px-3 py-1 font-medium">
                  extracted pincode: <strong>{form.pincode}</strong>
                </div>
              )}
            </div>
          )}

          <select
            name="assigned_to_dept"
            value={form.assigned_to_dept}
            onChange={handleChange}
            disabled={departmentsLoading}
            className="w-full border border-gray-300 text-gray-500 focus:outline-none disabled:cursor-not-allowed bg-white"
            required
          >
            <option value="" disabled>
              {departmentsLoading
                ? 'loading departments...'
                : 'select department...'}
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-500 transition"
          >
            <svg
              className="w-8 h-8 text-gray-400 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4v8zm7-4l2 2 4-4"
              />
            </svg>
            <span className="text-gray-500 text-sm">
              {form.files && form.files.length > 0
                ? form.files.length === 1
                  ? form.files[0].name
                  : `${form.files.length} images selected`
                : 'attach up to 4 images...'}
            </span>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={
              loading ||
              departmentsLoading ||
              (form.location_type === 'gps' && !form.latitude)
            }
            className="bg-[#4B687A] w-full text-white py-3 rounded-lg hover:bg-[#3C5260] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'submitting...' : 'submit complaint'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function Sidebar({}) {
  const navigate = useNavigate();
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
 
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isRaiseModalOpen) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('modal-open');
      }
    };
  }, [isRaiseModalOpen]);
  const location = useLocation();
  const pathname = location?.location?.pathname || location.pathname || '/';
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isAuthFlag =
    typeof window !== 'undefined'
      ? localStorage.getItem('isAuthenticated') === 'true'
      : false;
  const isAuth = !!token || isAuthFlag;

  const handleOpenRaiseComplaint = () => {
    if (!isAuth) {
      alert('Please login to raise a complaint.');
      navigate('/auth');
      return;
    }
    setIsRaiseModalOpen(true);
  };

  const handleCloseRaiseComplaint = () => {
    setIsRaiseModalOpen(false);
  };

  const getLinkClass = (path) => {
    const base =
      'flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium transition-all duration-200';

    if (pathname === path) {
      // active background: #4B687A, active hover: #3C5260
      return `${base} bg-[#4B687A] text-white shadow-md hover:shadow-lg hover:bg-[#3C5260]`;
    }

    // Soft glowing shadow on hover for inactive links
    return `${base} text-gray-700 hover:bg-[#EFEFEF] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]`;
  };

  const CitizenSidebar = () => {
    return (
      <div className="sticky top-25 mx-auto flex flex-col h-[calc(100vh-6rem)] pt-15">
        <button
          onClick={handleOpenRaiseComplaint}
          className="flex items-center gap-3 bg-[#4B687A] text-white font-semibold py-3 px-4 rounded-xl hover:bg-[#3C5260] transition-colors duration-300 mb-6"
        >
          <PlusCircleIcon className="w-6 h-9" />
          Raise Complaint
        </button>

        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link to="/" className={getLinkClass('/')}>
                <HomeIcon className="w-6 h-6" />
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/notifications"
                className={getLinkClass('/notifications')}
              >
                <BellIcon className="w-6 h-6" />
                Notifications
              </Link>
            </li>
            <li>
              <Link
                to="/past-complaints"
                className={getLinkClass('/past-complaints')}
              >
                <DocumentTextIcon className="w-6 h-6" />
                Past Complaints
              </Link>
            </li>
            <li>
              <Link to="/help" className={getLinkClass('/help')}>
                <QuestionMarkCircleIcon className="w-6 h-6" />
                Help
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  const GovAuthSidebar = () => {
    return (
      <div className="sticky top-25 mx-auto flex flex-col h-[calc(100vh-6rem)] pt-15">
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link to="/" className={getLinkClass('/')}>
                <HomeIcon className="w-6 h-6" />
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/notifications"
                className={getLinkClass('/notifications')}
              >
                <BellIcon className="w-6 h-6" />
                Notifications
              </Link>
            </li>
            <li>
              <Link
                to="/past-complaints"
                className={getLinkClass('/past-complaints')}
              >
                <DocumentTextIcon className="w-6 h-6" />
                Past Complaints
              </Link>
            </li>
            <li>
              <Link to="/help" className={getLinkClass('/help')}>
                <QuestionMarkCircleIcon className="w-6 h-6" />
                Help
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  const WorkerSidebar = () => {
    return (
    <div className="sticky top-25 mx-auto flex flex-col h-[calc(100vh-6rem)] pt-15">
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link to="/" className={getLinkClass('/')}>
                <HomeIcon className="w-6 h-6" />
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/notifications"
                className={getLinkClass('/notifications')}
              >
                <BellIcon className="w-6 h-6" />
                Notifications
              </Link>
            </li>
            <li>
              <Link
                to="/past-complaints"
                className={getLinkClass('/past-complaints')}
              >
                <DocumentTextIcon className="w-6 h-6" />
                Past Complaints
              </Link>
            </li>
            <li>
              <Link to="/help" className={getLinkClass('/help')}>
                <QuestionMarkCircleIcon className="w-6 h-6" />
                Help
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  const routing = () => {
    const ut = localStorage.getItem('user_type');

    switch (ut) {
      case 'authority':
        return <GovAuthSidebar />;
      case 'citizen':
        return <CitizenSidebar />;
      case 'fieldworker':
        return <WorkerSidebar />;

      default:
        return <CitizenSidebar />;
    }
  };

  return (
    <>
      <aside className="bg-white w-80 p-4 hidden md:block border-r-3 border-gray-400 h-screen sticky top-0 overflow-auto">
        {routing()}

        {isRaiseModalOpen &&
          ReactDOM.createPortal(
            <div className="complaint-modal-portal">
              <RaiseComplaintModal
                isOpen={isRaiseModalOpen}
                onClose={handleCloseRaiseComplaint}
              />
            </div>,
            document.body
          )}
      </aside>
    </>
  );
}
