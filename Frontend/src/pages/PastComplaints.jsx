import React, { useState, useEffect } from "react";
import api from '../utils/axiosConfig';


const ReportIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 20"
    className={className}
  >
    <path d="M3.75 2.75A.75.75 0 014.5 2h10a.75.75 0 01.6 1.2l-2.25 3L15.1 9.8a.75.75 0 01-.6 1.2H5.25v6.25a.75.75 0 01-1.5 0v-14.5z" />
  </svg>
);


export default function PastComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

    
  const [error, setError] = useState("");
  const [reportingId, setReportingId] = useState(null);
  const [reportedIds, setReportedIds] = useState([]);
  const [showReportToast, setShowReportToast] = useState(false);

  const fetchPastComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get("/complaints/past/");
      setComplaints(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching past complaints:", err);
      setError("Failed to load past complaints. Please try again.");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) {
      return;
    }

    try {
      await api.delete(`/complaints/${complaintId}/delete/`);
      // Remove the deleted complaint from the state
      setComplaints(complaints.filter(complaint => complaint.id !== complaintId));
    } catch (err) {
      console.error("Error deleting complaint:", err);
      alert("Failed to delete complaint. Please try again.");
    }
  };

  const handleUpvote = async (complaintId) => {
    try {
      const response = await api.post(`/complaints/${complaintId}/upvote/`);
      // Update the complaint in the state with new upvote count
      setComplaints(complaints.map(complaint => 
        complaint.id === complaintId 
          ? { ...complaint, upvotes_count: response.data.likes_count }
          : complaint
      ));
    } catch (err) {
      console.error("Error upvoting complaint:", err);
      alert("Failed to upvote complaint. Please try again.");
    }
  };

  const handleMarkFake = async (complaintId) => {
    try {
      setReportingId(complaintId);
      await api.post(`/complaints/${complaintId}/fake-confidence/`);
      // mark locally so UI reflects reported without waiting for full refetch
      setReportedIds((prev) => (prev.includes(complaintId) ? prev : [...prev, complaintId]));
      // Refresh the complaints to get updated fake confidence data
      await fetchPastComplaints();
      // show transient success popup
      setShowReportToast(true);
      setTimeout(() => setShowReportToast(false), 2200);
    } catch (err) {
      console.error("Error marking complaint as fake:", err);
      alert("Failed to mark complaint as fake. Please try again.");
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
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  useEffect(() => {
    fetchPastComplaints();
  }, []);

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
    <div className="p-6 max-w-6xl mx-auto">
      {showReportToast && (
        <div className="fixed top-5 right-5 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Reported successfully
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Past Complaints</h1>
        <button
          onClick={fetchPastComplaints}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {complaints.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No past complaints to show.</div>
          <p className="text-gray-600">Complaints you create will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  {getStatusBadge(complaint.status)}
                  <span className="text-sm text-gray-500">
                    {formatDate(complaint.created_at)}
                  </span>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleUpvote(complaint.id)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <span>👍</span>
                    <span>{complaint.upvotes_count}</span>
                  </button>

                  {(() => {
                    const isReported = reportedIds.includes(complaint.id) || (complaint.fake_confidence && complaint.fake_confidence > 0);
                    const isReportingNow = reportingId === complaint.id;
                    return (
                      <button
                        onClick={() => handleMarkFake(complaint.id)}
                        disabled={isReportingNow || isReported}
                        className={`flex items-center gap-2 transition-all ${
                          isReportingNow
                            ? 'text-gray-400 cursor-not-allowed'
                            : isReported
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-gray-600 hover:text-red-600'
                        } hover:scale-105 transform font-semibold`}
                        title="Mark as fake"
                      >
                        <ReportIcon className={`w-5 h-5 ${isReportingNow ? 'animate-pulse' : ''} ${isReported ? 'text-red-600' : ''}`} />
                        <span className="text-sm">{isReported ? 'Reported' : 'Report'}</span>
                      </button>
                    );
                  })()}

                  <button
                    onClick={() => handleDeleteComplaint(complaint.id)}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                    title="Delete complaint"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="text-gray-800 mb-4">{complaint.content}</p>

              {complaint.address && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Location: </span>
                  <span className="text-sm text-gray-600">{complaint.address}</span>
                </div>
              )}

              {complaint.assigned_to_dept && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Department: </span>
                  <span className="text-sm text-gray-600">{complaint.assigned_to_dept}</span>
                </div>
              )}

              {complaint.assigned_to_fieldworker && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Assigned to: </span>
                  <span className="text-sm text-gray-600">{complaint.assigned_to_fieldworker}</span>
                </div>
              )}

              {complaint.fake_confidence > 0 && (
                <div className="mt-3">
                  <span className="text-sm font-medium text-red-600">
                    Fake Confidence: {complaint.fake_confidence}%
                  </span>
                </div>
              )}

              {complaint.images && complaint.images.length > 0 && (
                <div className="mt-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {complaint.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.image}
                        alt={`Complaint evidence ${index + 1}`}
                        className="h-20 w-20 object-cover rounded border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}