import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import {
  ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, XCircle,
  Search, Building2, Users, AlertCircle, Filter, RefreshCw
} from "lucide-react";

const HallAvailability = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [allBookings, setAllBookings] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, available, booked

  // Quick check state
  const [quickHall, setQuickHall] = useState("");
  const [quickDate, setQuickDate] = useState("");
  const [quickStart, setQuickStart] = useState("");
  const [quickEnd, setQuickEnd] = useState("");
  const [quickResult, setQuickResult] = useState(null);

  // Get today's date
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    setQuickDate(today);
  }, []);

  // Fetch rooms and bookings
  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get("/rooms"),
        api.get("/bookings/availability")
      ]);
      setAllRooms(roomsRes.data || []);
      setAllBookings(bookingsRes.data || []);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load availability data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);



  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get bookings for a specific room on selected date
  const getBookingsForRoom = (roomName, date) => {
    if (!date) return [];
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0, 0, 0, 0);

    return allBookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      bookingDate.setHours(0, 0, 0, 0);
      return (
        bookingDate.getTime() === selectedDateObj.getTime() &&
        booking.hall === roomName &&
        (booking.status === "approved" || booking.status === "pending")
      );
    });
  };

  // Check availability for quick check
  const isRoomAvailableForSlot = (roomName, date, startTime, endTime) => {
    if (!date || !startTime || !endTime) return true;
    const requestedStart = new Date(`${date}T${startTime}`);
    const requestedEnd = new Date(`${date}T${endTime}`);
    const now = new Date();

    if (requestedStart < now && requestedEnd < now) return "past";

    const conflict = allBookings.find((booking) => {
      if (booking.hall !== roomName) return false;
      if (booking.status === "rejected") return false;
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return bookingStart < requestedEnd && bookingEnd > requestedStart;
    });

    return !conflict;
  };

  const handleQuickCheck = () => {
    if (!quickHall || !quickDate || !quickStart || !quickEnd) {
      toast.error("Please fill all Quick Check fields");
      return;
    }
    const result = isRoomAvailableForSlot(quickHall, quickDate, quickStart, quickEnd);
    setQuickResult({ hall: quickHall, result, date: quickDate, start: quickStart, end: quickEnd });
  };

  // Filter and search rooms
  const filteredRooms = allRooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
    const bookings = getBookingsForRoom(room.name, selectedDate);
    const isAvailable = bookings.length === 0;

    if (filterStatus === "available") return matchesSearch && isAvailable;
    if (filterStatus === "booked") return matchesSearch && !isAvailable;
    return matchesSearch;
  });

  const availableCount = allRooms.filter(r => getBookingsForRoom(r.name, selectedDate).length === 0).length;
  const bookedCount = allRooms.length - availableCount;

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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground-90 mb-2">
                Hall / Class Availability
              </h2>
              <p className="text-muted-foreground">
                View all rooms and their booking status for any date. Use the search to find specific classrooms or labs.
              </p>
            </div>
          </div>
        </div>
        {/* Hero Section / Info */}
        <div className="mb-8 p-6 bg-amrita text-white rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
              <Building2 className="w-10 h-10" />
              Campus Resource Tracker
            </h1>
            <p className="text-white/90 text-lg max-w-2xl">
              Real-time availability of all 88 rooms across the campus. Check schedules, avoid conflicts, and plan your events efficiently.
            </p>
          </div>
          <Building2 className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
        </div>

        {/* Quick Availability Check */}
        <Card className="mb-6 bg-gradient-to-br from-amrita/5 to-amrita/10 border-amrita/20">
          <CardHeader>
            <CardTitle className="text-amrita flex items-center gap-2">
              <Search className="w-5 h-5" />
              Quick Availability Check
            </CardTitle>
            <CardDescription>
              Check if a specific room is available for your desired time slot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Room / Hall</label>
                <Select value={quickHall} onValueChange={setQuickHall}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRooms.map(room => (
                      <SelectItem key={room._id} value={room.name}>
                        {room.name} (Cap: {room.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <Input
                  type="time"
                  value={quickStart}
                  onChange={(e) => setQuickStart(e.target.value)}
                  className="text-gray-900 dark:text-gray-100 bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <Input
                  type="time"
                  value={quickEnd}
                  onChange={(e) => setQuickEnd(e.target.value)}
                  className="text-gray-900 dark:text-gray-100 bg-background"
                />
              </div>
              <Button
                className="bg-amrita hover:bg-amrita/95 text-white font-bold"
                onClick={handleQuickCheck}
              >
                Check Slot
              </Button>
            </div>

            {/* Quick check result */}
            {quickResult && (
              <div className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${quickResult.result === true ? 'bg-green-50 border-green-300' :
                quickResult.result === 'past' ? 'bg-gray-50 border-gray-300' :
                  'bg-red-50 border-red-300'
                }`}>
                {quickResult.result === true ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${quickResult.result === true ? 'text-green-700' :
                    quickResult.result === 'past' ? 'text-gray-600' : 'text-red-700'
                    }`}>
                    {quickResult.hall}
                    {quickResult.result === true && " — Available ✓"}
                    {quickResult.result === 'past' && " — Time slot has passed"}
                    {quickResult.result === false && " — Not Available ✗"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {quickResult.date} from {quickResult.start} to {quickResult.end}
                  </p>
                  {quickResult.result === true && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600 mb-2">This room is free for your requested slot. You can proceed to create a booking request.</p>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => navigate(`/new-booking?hall=${quickResult.hall}&date=${quickResult.date}&start=${quickResult.start}&end=${quickResult.end}`)}>
                        Proceed with Booking
                      </Button>
                    </div>
                  )}
                  {quickResult.result === false && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600 mb-2">This room has a conflicting booking. You can request an admin to override the existing booking if your event is higher priority.</p>
                      <Button size="sm" variant="destructive" onClick={() => navigate(`/new-booking?hall=${quickResult.hall}&date=${quickResult.date}&start=${quickResult.start}&end=${quickResult.end}`)}>
                        Request Override
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date Selector + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amrita" />
                Select Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="bg-green-600 border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-white" />
                <div>
                  <p className="text-2xl font-bold text-white">{availableCount}</p>
                  <p className="text-xs text-white/90 font-medium font-bold uppercase tracking-wider">Available Rooms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-600 border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-white" />
                <div>
                  <p className="text-2xl font-bold text-white">{bookedCount}</p>
                  <p className="text-xs text-white/90 font-medium font-bold uppercase tracking-wider">Occupied Rooms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            {[
              { val: 'all', label: `All (${allRooms.length})` },
              { val: 'available', label: `Available (${availableCount})` },
              { val: 'booked', label: `Booked (${bookedCount})` },
            ].map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilterStatus(val)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${filterStatus === val
                  ? 'bg-white dark:bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amrita mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading availability...</p>
          </div>
        ) : allRooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No rooms found in the system.</p>
              <p className="text-sm text-muted-foreground mt-2">Ask an admin to add rooms via the Room Management page.</p>
            </CardContent>
          </Card>
        ) : filteredRooms.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No rooms match your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground-90 mt-4 mb-2">Room Status Grid</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRooms.map((room) => {
                const roomBookings = getBookingsForRoom(room.name, selectedDate);
                const isAvailable = roomBookings.length === 0;

                return (
                  <Card
                    key={room._id}
                    onClick={() => navigate(`/new-booking?hall=${room.name}&date=${selectedDate}`)}
                    className={`transition-all hover:shadow-md cursor-pointer ${isAvailable
                      ? "border-green-300 bg-green-50/30 hover:bg-green-50/60"
                      : "border-yellow-300 bg-yellow-50/30 hover:bg-yellow-50/60"
                      }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-amrita" />
                          <CardTitle className="text-base">{room.name}</CardTitle>
                        </div>
                        {isAvailable ? (
                          <span className="flex items-center gap-1 text-green-700 text-xs font-semibold bg-green-100 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-700 text-xs font-semibold bg-yellow-100 px-2 py-1 rounded-full">
                            <XCircle className="w-3 h-3" />
                            {roomBookings.length} Booking{roomBookings.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Capacity: {room.capacity}</p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isAvailable ? (
                        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md p-2">
                          ✓ Free for the entire day. Click to book here.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {roomBookings.map((booking) => (
                            <div
                              key={booking._id}
                              className="p-2.5 bg-white dark:bg-background rounded-lg border space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground truncate flex-1 mr-2">
                                  {booking.eventTitle}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${booking.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-800"
                                  }`}>
                                  {booking.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">
                                  {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                                </span>
                              </div>
                              {booking.facultyName && (
                                <p className="text-xs text-muted-foreground">
                                  {booking.facultyName}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HallAvailability;
