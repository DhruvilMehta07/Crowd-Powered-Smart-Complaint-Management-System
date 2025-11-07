import React, { useState, useEffect } from "react";
import api from "../axiosConfig";

export default function PastComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      await api.post(`/complaints/${complaintId}/fake-confidence/`);
      // Refresh the complaints to get updated fake confidence data
      fetchPastComplaints();
    } catch (err) {
      console.error("Error marking complaint as fake:", err);
      alert("Failed to mark complaint as fake. Please try again.");
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
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpvote(complaint.id)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <span>👍</span>
                    <span>{complaint.upvotes_count}</span>
                  </button>
                  <button
                    onClick={() => handleMarkFake(complaint.id)}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                    title="Mark as fake"
                  >
                    🚫
                  </button>
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