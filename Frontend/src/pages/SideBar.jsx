import React, { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from '../utils/axiosConfig';

const HomeIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
    </svg>
);

const BellIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
    </svg>
);

const DocumentTextIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-3.434-1.279h-1.875a3.375 3.375 0 01-3.375-3.375V5.25a9.768 9.768 0 00-1.279-.029c.118-.38.247-.754.386-1.128A5.23 5.23 0 0112.97 1.816z" />
    </svg>
);

const QuestionMarkCircleIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.377-1.34-.634-2.128-.634-1.727 0-3.25 1.067-3.25 2.792 0 .445.142.79.406 1.078.293.318.734.575 1.32.81.73.293 1.243.64 1.56 1.13.317.488.344 1.058.1 1.66-.224.557-.7.876-1.295.876-.512 0-.94-.233-1.175-.588-.2-.307-.243-.7-.113-1.082l-.784-.327c-.136.543.034 1.208.545 1.773.57.626 1.414.97 2.327.97 1.235 0 2.27-.672 2.692-1.673.42-.995.248-2.18-.477-3.05-.498-.6-1.22-.97-2.01-1.26-.52-.2-.86-.358-1.09-.516-.23-.158-.34-.3-.34-.492 0-.394.636-.792 1.5-.792.66 0 1.146.245 1.5.637.287.317.377.724.26 1.093l.815.34c.208-.695-.12-1.59-.89-2.233-.67-.55-1.555-.827-2.435-.827-1.753 0-3.15 1.135-3.15 2.792 0 .79.34 1.446.93 1.96.47.41 1.08.71 1.74.94.83.29 1.42.64 1.78 1.08.36.44.48.98.36 1.55l-.125.625h-1.25l.125-.625c.04-.2 0-.38-.12-.53-.12-.15-.32-.27-.6-.38-.52-.2-1.08-.41-1.58-.75-.63-.43-1.02-1.02-1.02-1.77 0-1.1 1.1-1.792 2.15-1.792.57 0 1.04.17 1.38.45.34.28.48.65.42 1.03l-.875-.365c.05-.3-.03-.57-.23-.78-.2-.21-.5-.33-.85-.33-.394 0-.75.233-.75.542 0 .15.08.27.22.37.14.1.33.18.56.25.45.14.93.3 1.35.53.42.23.75.53.98.9.23.37.33.8.3 1.26l.125.625h1.25l-.125-.625c-.03-.15 0-.29.08-.42.08-.13.21-.23.38-.32.34-.18.73-.33 1.14-.45.82-.24 1.54-.6 2.08-1.12.54-.52.85-1.18.85-1.96 0-1.36-1.23-2.542-2.85-2.542-1.1 0-2.05.5-2.6 1.3-.55.8-.6 1.8-.15 2.65z" clipRule="evenodd" />
    </svg>
);

const PlusCircleIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
    </svg>
);


const RaiseComplaintModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!isOpen) return;
      
      setDepartmentsLoading(true);
      try {
        const response = await api.get('/users/departments/');
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Fallback to default departments if API fails
        setDepartments([
          { id: 1, name: "Water" },
          { id: 2, name: "Road" },
          { id: 3, name: "Fire" },
          { id: 4, name: "Other" }
        ]);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, [isOpen]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category) {
      return alert("Please fill in all fields.");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const content = `Title: ${form.title}\nCategory: ${form.category}\n\n${form.description}`;
      formData.append('content', content);
      
      // Add the assigned_to field with department ID
      if (form.category) {
        formData.append('assigned_to', form.category);
      }
      
      if (form.file) {
        formData.append('images', form.file);
      }

      const response = await api.post('/complaints/create/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.status === 201) {
        alert("Complaint submitted successfully!");
        setForm({ title: "", description: "", category: "", file: null });
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      const serverMessage = error.response?.data || error.message;
      if (error.response?.status === 403) {
        alert('Security token expired. Please refresh the page and try again.');
      } else if (error.response?.status === 400) {
        alert('Failed to submit complaint (400). Server response: ' + JSON.stringify(serverMessage));
      } else {
        alert('Failed to submit complaint. ' + (typeof serverMessage === 'string' ? serverMessage : JSON.stringify(serverMessage)));
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
      <div className="bg-white w-[100%] max-w-md rounded-2xl shadow-xl p-6 relative mx-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#4B687A] hover:text-[#AAAAAA] text-lg bg-white w-12 h-12 flex items-center justify-center"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-center text-[#4B687A] mb-6" >Raise Complaint</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Complaint title..."
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#4B687AD9]"
            required
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your complaint in detail..."
            rows="4"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#4B687AD9] resize-none"
            required
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            disabled={departmentsLoading}
            className="w-full border border-gray-400 text-gray-500 focus:outline-none disabled:cursor-not-allowed bg-white"
            required
          >
            <option value="" disabled>
              {departmentsLoading ? "Loading departments..." : "Select Department..."}
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#4B687A] rounded-lg cursor-pointer hover:bg-gray-100 transition"
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
              {form.file ? form.file.name : "Attach Image or Video..."}
            </span>
            <input
              id="file-upload"
              type="file"
              accept="image/*, video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={loading || departmentsLoading}
            className="bg-[#4B687A] w-full text-white py-3 rounded-lg hover:bg-[#4B687AB5] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
}; export { RaiseComplaintModal };

export default function Sidebar({}) {
  const navigate = useNavigate();
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isAuthFlag = typeof window !== "undefined" ? localStorage.getItem("isAuthenticated") === "true" : false;
  const isAuth = !!token || isAuthFlag;

  const handleOpenRaiseComplaint = () => {
    if (isAuth) {
      alert('Please login to raise a complaint.');
      navigate('/auth');
      return;
    }
    setIsRaiseModalOpen(true);
  };

  const handleCloseRaiseComplaint = () => {
    setIsRaiseModalOpen(false);
  };

  

  return (
    <>
      <aside className="w-80 p-4 hidden md:block">
        <div className="sticky top-24 flex flex-col h-[calc(100vh-6rem)]">
          <button 
            onClick={handleOpenRaiseComplaint}
            className="flex items-center gap-3 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-300 mb-6"
          >
            <PlusCircleIcon className="w-6 h-6"/>
            Raise Complaint
          </button>
          
          <nav className="flex-1">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 text-gray-700 transition-colors duration-200"
                >
                  <HomeIcon className="w-6 h-6" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/notifications"
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 text-gray-700 transition-colors duration-200"
                >
                  <BellIcon className="w-6 h-6" />
                  Notifications
                </Link>
              </li>
              <li>
                <Link
                  to="/past-complaints"
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 text-gray-700 transition-colors duration-200"
                >
                  <DocumentTextIcon className="w-6 h-6" />
                  Past Complaints
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 text-gray-700 transition-colors duration-200"
                >
                  <QuestionMarkCircleIcon className="w-6 h-6" />
                  Help
                </Link>
              </li>
            </ul>
          </nav>

          
        </div>
      </aside>

      <RaiseComplaintModal 
        isOpen={isRaiseModalOpen} 
        onClose={handleCloseRaiseComplaint} 
      />
    </>
  );
}