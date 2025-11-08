import React, { useState, useEffect } from "react";
import api from '../utils/axiosConfig';


// Report will be a text button (no icon) for clarity


export default function PastComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

    
  const [error, setError] = useState("");
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
      // persist reported id locally so this user cannot report again
      setReportedIds((prev) => {
        try {
          const next = prev.includes(complaintId) ? prev : [...prev, complaintId];
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
      'Rejected': 'bg-red-100 text-red-800',
      'Escalated': 'bg-red-50 text-red-700'
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
                        className={`px-3 py-1 rounded-md border text-sm font-semibold transition-all ${
                          isReportingNow
                            ? 'bg-red-100 text-red-500 border-red-200 cursor-not-allowed opacity-80'
                            : isReported
                              ? 'bg-red-50 text-red-600 border-red-200 cursor-default'
                              : 'bg-transparent text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-600'
                        }`}
                        title="Mark as fake"
                      >
                        {isReportingNow ? 'Reporting...' : isReported ? 'Reported' : 'Report as Fake'}
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

              {/* If there's a pending resolution for this complaint, show review prompt */}
              {complaint.has_pending_resolution && (
                <div className="mt-4">
                  <ReviewResolutionButton complaint={complaint} onRefresh={fetchPastComplaints} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
      const pending = Array.isArray(res.data.resolutions) ? res.data.resolutions.find(r => r.status === 'pending_approval') : null;
      setResolution(pending || (res.data.resolutions && res.data.resolutions[0]) || null);
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
      const resp = await api.post(`/complaints/${complaint.id}/resolution/${resolution.id}/respond/`, payload);
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
          <p className="text-sm font-medium text-yellow-800">A resolution has been submitted for this complaint.</p>
          <p className="text-sm text-yellow-700">Please review and confirm if the complaint is resolved.</p>
        </div>
        <div>
          <button onClick={open} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Review & Respond</button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/20" onClick={close}>
          <div className="bg-white rounded-lg w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Review Resolution</h3>
              <button onClick={close} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            {loading && <div className="py-8 text-center">Loading...</div>}

            {!loading && resolution && (
              <div>
                {escalatedToast && (
                  <div className="mb-3">
                    <div className="bg-red-100 text-red-800 px-3 py-2 rounded">Complaint escalated to the government authority for reassignment.</div>
                  </div>
                )}
                <p className="text-sm text-gray-600 mb-3">Submitted by: <span className="font-medium">{resolution.field_worker?.username || 'Field worker'}</span></p>
                <p className="mb-4 text-gray-800">{resolution.description}</p>

                {resolution.images && resolution.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {resolution.images.map((img) => (
                      <img key={img.id} src={img.image_url || img.image} alt="resolution" className="w-full h-28 object-cover rounded" />
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="If rejecting, please provide feedback (required)" className="w-full border rounded p-2 mb-3 h-24" />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleRespond(false)} disabled={responding} className="px-4 py-2 bg-red-600 text-white rounded">{responding ? 'Submitting...' : 'Reject'}</button>
                    <button onClick={() => handleRespond(true)} disabled={responding} className="px-4 py-2 bg-green-600 text-white rounded">{responding ? 'Submitting...' : 'Approve'}</button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !resolution && (
              <div className="py-6 text-center text-gray-600">No resolution details found.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}