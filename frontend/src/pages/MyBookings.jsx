import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Calendar, Clock, MapPin, FileText, XCircle, AlertTriangle, Search, Filter, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import EmptyState from "../components/EmptyState";

const MyBookings = () => {
  const navigate = useNavigate();
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    date: "",
    search: "",
    dept: "all"
  });

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings/my", { params: filters });
      setMyBookings(res.data || []);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [filters]);

  const handleCancel = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      await api.patch(`/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled successfully.");
      setConfirmCancelId(null);
      fetchMyBookings();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to cancel booking.";
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });

  const BookingCard = ({ booking, borderColor }) => {
    const canCancel = booking.status === "pending" || booking.status === "approved";
    const isConfirming = confirmCancelId === booking._id;
    const isCancelling = cancellingId === booking._id;

    return (
      <Card key={booking._id} className={`border-${borderColor}-300`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{booking.eventTitle}</CardTitle>
              <CardDescription className="mt-1">
                {booking.facultyName}
                {booking.facultyDepartment ? `, ${booking.facultyDepartment}` : ""}
              </CardDescription>
            </div>
            <Badge variant={booking.status}>{booking.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Hall:</span>
            <span>{booking.hall}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{formatDate(booking.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
          </div>
          {booking.rejectionReason && (
            <div className={`p-3 rounded-md border ${booking.rejectionReason.includes("overridden") ? "bg-orange-50 border-orange-200" : "bg-red-50 border-red-200"}`}>
              <p className={`text-sm font-medium mb-1 ${booking.rejectionReason.includes("overridden") ? "text-orange-800" : "text-red-800"}`}>
                {booking.rejectionReason.includes("overridden") ? "Overridden by Admin:" : "Rejection Reason:"}
              </p>
              <p className={`text-sm ${booking.rejectionReason.includes("overridden") ? "text-orange-700" : "text-red-700"}`}>
                {booking.rejectionReason}
              </p>
              {booking.rejectionReason.includes("overridden") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full border-orange-300 text-orange-700 hover:bg-orange-100 flex items-center justify-center gap-2"
                  onClick={() => navigate("/reallocation-requests")}
                >
                  <Sparkles className="w-4 h-4" />
                  Find Alternative Halls
                </Button>
              )}
            </div>
          )}
          {booking.eventDescription && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{booking.eventDescription}</span>
            </div>
          )}

          {/* Cancel Section */}
          {canCancel && (
            <div className="pt-2 border-t border-muted">
              {!isConfirming ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 w-full"
                  onClick={() => setConfirmCancelId(booking._id)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancel Booking
                </Button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-2">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Are you sure you want to cancel this booking?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white flex-1"
                      onClick={() => handleCancel(booking._id)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Yes, Cancel"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setConfirmCancelId(null)}
                    >
                      Keep Booking
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const groupedBookings = {
    pending: myBookings.filter((b) => b.status === "pending"),
    approved: myBookings.filter((b) => b.status === "approved"),
    rejected: myBookings.filter((b) => b.status === "rejected"),
    cancelled: myBookings.filter((b) => b.status === "cancelled")
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/coordinator-dashboard")}
            className="mb-4 bg-amrita text-white flex items-center gap-1 hover:bg-amrita/95"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-3xl font-bold text-foreground-90 mb-2">My Booking Requests</h2>
          <p className="text-muted-foreground">Track all your booking requests and their approval status</p>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-muted/30 rounded-xl border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search title, hall, faculty..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="All Statuses" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.dept}
            onValueChange={(val) => setFilters(prev => ({ ...prev, dept: val }))}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="All Departments" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Mechanical">Mechanical</SelectItem>
              <SelectItem value="Civil">Civil</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : myBookings.length === 0 ? (
          <Card>
            <CardContent className="py-4">
              <EmptyState
                icon={Calendar}
                title="No booking requests yet"
                description="Once you submit a booking request, it'll show up here."
              />
              <div className="flex justify-center">
                <Button onClick={() => navigate("/new-booking")} className="mt-2 bg-amrita text-white">
                  Create New Booking Request
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedBookings.pending.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-yellow-800">Pending ({groupedBookings.pending.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedBookings.pending.map((b) => <BookingCard key={b._id} booking={b} borderColor="yellow" />)}
                </div>
              </div>
            )}
            {groupedBookings.approved.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-800">Approved ({groupedBookings.approved.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedBookings.approved.map((b) => <BookingCard key={b._id} booking={b} borderColor="green" />)}
                </div>
              </div>
            )}
            {groupedBookings.rejected.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-red-800">Rejected ({groupedBookings.rejected.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedBookings.rejected.map((b) => <BookingCard key={b._id} booking={b} borderColor="red" />)}
                </div>
              </div>
            )}
            {groupedBookings.cancelled.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-600">Cancelled ({groupedBookings.cancelled.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedBookings.cancelled.map((b) => <BookingCard key={b._id} booking={b} borderColor="gray" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookings;
