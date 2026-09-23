import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from "../services/api";
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar, Clock, User, Mail, FileText, UserCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HallBookingApprovals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();


  const [pendingBookings, setPendingBookings] = useState([]);
  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async (showFullLoading = true) => {
    if (showFullLoading) setLoading(true);
    try {
      const res = await api.get('/bookings/pending');
      const data = res.data || [];
      setPendingBookings(data);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      toast.error('Failed to fetch pending bookings');
    } finally {
      if (showFullLoading) setLoading(false);
    }
  };

  const approveBooking = async (id) => {
    setProcessingBookingId(id);
    try {
      const res = await api.patch(`/bookings/${id}/approve`);
      toast.success(res.data.message || 'Booking approved successfully');
      fetchPendingBookings(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const rejectBooking = async (id, reason = '') => {
    setProcessingBookingId(id);
    try {
      const res = await api.patch(`/bookings/${id}/reject`, { reason });
      toast.success(res.data.message || 'Booking rejected');
      setShowRejectModal(null);
      setRejectReason('');
      fetchPendingBookings(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectClick = (id) => {
    setShowRejectModal(id);
    setRejectReason('');
  };

  const handleRejectConfirm = () => {
    if (showRejectModal) {
      rejectBooking(showRejectModal, rejectReason);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amrita mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading booking requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">

        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin-dashboard")}
            className="mb-4 bg-amrita text-white flex items-center gap-1 hover:bg-amrita/95"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground-90">Hall Booking Approvals</h1>
            <p className="text-muted-foreground">Review and approve or reject booking requests from student coordinators</p>
          </div>
        </div>

        {/* Statistics Card */}
        <Card className="mb-8 bg-amrita/5 border-amrita/20">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amrita" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Pending Requests</p>
                  <p className="text-2xl font-bold">{pendingBookings.length}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {pendingBookings.length === 0
                  ? "No pending requests"
                  : `${pendingBookings.length} request${pendingBookings.length !== 1 ? 's' : ''} awaiting review`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Requests */}
        {pendingBookings.length === 0 ? (
          <Card className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pending Booking Requests</h3>
            <p className="text-muted-foreground">All booking requests have been processed</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingBookings.map((booking) => (
              <Card key={booking._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-amrita/5 border-b">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {booking.eventTitle}
                        {booking.isConflict && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full border border-amber-300 bg-amber-50 text-amber-800 uppercase tracking-wide">
                            Conflicting Request
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className="font-medium">Hall:</span> {booking.hall}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveBooking(booking._id)}
                        disabled={processingBookingId === booking._id}
                        className="bg-amrita hover:bg-amrita/90 text-white"
                      >
                        {processingBookingId === booking._id ? "Processing..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-amrita hover:bg-amrita/90 text-white"
                        variant="destructive"
                        onClick={() => handleRejectClick(booking._id)}
                        disabled={processingBookingId === booking._id}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Date & Time */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="w-4 h-4" />
                        Date & Time
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">
                          {new Date(booking.startTime).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(booking.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {' - '}
                          {new Date(booking.endTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {booking.capacity >= 0 && (
                          <div className="flex items-center gap-2 text-sm text-foreground-90 mt-2">
                            <UserCheck className="w-4 h-4" />
                            Capacity: {booking.capacity} attendees
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Faculty Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="w-4 h-4" />
                        Faculty Information
                      </div>
                      <div className="space-y-1">
                        {booking.facultyName && (<p className="text-sm font-medium">{booking.facultyName}</p>)}

                        {booking.facultyDesignation && (<p className="text-sm text-muted-foreground">Designation: {booking.facultyDesignation}</p>)}

                        {booking.facultyDepartment && (
                          <p className="text-sm text-muted-foreground">Department: {booking.facultyDepartment}</p>
                        )}

                        {booking.facultyEmail && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {booking.facultyEmail}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Coordinator & Description */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <UserCheck className="w-4 h-4" />
                        Request details
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">
                          Type: <span className="font-semibold text-amrita">{booking.eventType || "Academic"}</span>
                        </p>
                        <p className="text-sm">
                          Priority: <span className={`font-bold ${booking.priority === 'Critical' ? 'text-red-600' : booking.priority === 'High' ? 'text-orange-600' : 'text-foreground'}`}>
                            {booking.priority || "Normal"}
                          </span>
                        </p>
                        {booking.coordinator?.username && (
                          <p className="text-sm">
                            Requested by: <span className="font-medium">{booking.coordinator.username}</span>
                          </p>
                        )}

                        {booking.eventDescription && (
                          <div className="mt-2">
                            <div className="flex items-center gap-1 text-sm font-medium mb-1">
                              <FileText className="w-4 h-4" />
                              Description
                            </div>
                            <p className="text-sm text-muted-foreground break-words">{booking.eventDescription}</p>
                          </div>
                        )}
                        {booking.isConflict && (
                          <div className="mt-3 p-3 rounded-md border border-red-300 bg-red-50">
                            <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                              ⚠️ OVERRIDE REQUESTED
                            </p>
                            {booking.conflictReason && (
                              <p className="text-sm text-red-900 italic mb-2">
                                " {booking.conflictReason} "
                              </p>
                            )}
                            <p className="text-[10px] text-red-700 bg-white/50 p-1 rounded">
                              Note: Approving this will automatically reject the existing booking for this slot.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Reject Modal */}
                {showRejectModal === booking._id && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold mb-4">
                        Reject Booking Request
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Are you sure you want to reject this booking request?
                        Optionally provide a reason for rejection.
                      </p>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          Rejection Reason (Optional)
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amrita"
                          placeholder="e.g., Hall already booked, insufficient capacity, etc."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowRejectModal(null);
                            setRejectReason("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleRejectConfirm}
                        >
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
        }
      </main >
    </div >
  );
};

export default HallBookingApprovals;