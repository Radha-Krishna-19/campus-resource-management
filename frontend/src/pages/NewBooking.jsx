import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import {
  ArrowLeft,
  User,
  Building2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  TrendingDown,
  BarChart2,
  ChevronDown,
  Filter,
  Search
} from "lucide-react";

const NewBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [form, setForm] = useState({
    facultyName: "",
    facultyDepartment: "",
    facultyDesignation: "",
    facultyEmail: "",
    eventTitle: "",
    eventDescription: "",
    hall: queryParams.get('hall') || "",
    capacity: "",
    date: queryParams.get('date') || "",
    startTime: queryParams.get('start') || "",
    endTime: queryParams.get('end') || "",
    eventType: "Academic",
    priority: "Normal"
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictReason, setConflictReason] = useState("");
  const [conflictSubmitting, setConflictSubmitting] = useState(false);
  const [recommendedRooms, setRecommendedRooms] = useState([]);
  const [suggestLimit, setSuggestLimit] = useState(5); // 5, 10, or 'all'
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [allRoomsList, setAllRoomsList] = useState([]);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const [nlpText, setNlpText] = useState("");
  const [nlpLoading, setNlpLoading] = useState(false);

  // Fetch recommendations when date, time, capacity changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (form.date && form.startTime && form.endTime && form.capacity) {
        try {
          setLoadingRooms(true);
          const [recRes, roomsRes] = await Promise.all([
            api.post("/bookings/recommend", {
              date: form.date,
              startTime: form.startTime,
              endTime: form.endTime,
              attendees: form.capacity,
              limit: suggestLimit
            }),
            api.get("/rooms")
          ]);
          setRecommendedRooms(recRes.data);
          setAllRoomsList(roomsRes.data || []);
        } catch (error) {
          console.error("Failed to fetch room data", error);
        } finally {
          setLoadingRooms(false);
        }
      } else {
        setRecommendedRooms([]);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchRecommendations();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.date, form.startTime, form.endTime, form.capacity, suggestLimit]);

  // Common departments
  const departments = [
    "CSE", "ECE", "EEE", "ME", "CE", "IT", "AIDS", "AIML", "CSBS", "Other"
  ];

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (!form.date) {
      setForm((prev) => ({ ...prev, date: today }));
    }
    // Fetch all rooms once for manual selection even if no recommendations yet
    api.get("/rooms").then(res => setAllRoomsList(res.data || [])).catch(e => console.error(e));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // NLP booking assistant: parses free text ("Book Hall A for 60 people this
  // Friday 2-4pm for a seminar") into structured fields and pre-fills the
  // form. Only overwrites fields the parser actually found something for,
  // and never auto-submits — the coordinator always reviews before sending.
  const handleNlpParse = async () => {
    if (!nlpText.trim()) return;
    setNlpLoading(true);
    try {
      const res = await api.post("/bookings/parse", { text: nlpText });
      const draft = res.data?.draft || {};
      const filled = [];

      setForm((prev) => {
        const next = { ...prev };
        if (draft.hall) { next.hall = draft.hall; filled.push("hall"); }
        if (draft.capacity) { next.capacity = String(draft.capacity); filled.push("capacity"); }
        if (draft.date) { next.date = draft.date; filled.push("date"); }
        if (draft.startTime) { next.startTime = draft.startTime; filled.push("start time"); }
        if (draft.endTime) { next.endTime = draft.endTime; filled.push("end time"); }
        if (draft.eventType) { next.eventType = draft.eventType; filled.push("event type"); }
        return next;
      });

      if (filled.length > 0) {
        toast.success(`Auto-filled ${filled.join(", ")} — please review before submitting.`);
      } else {
        toast.info("Couldn't pick out any details from that — try including a capacity, date and time.");
      }
    } catch (error) {
      console.error("NLP parse failed:", error);
      toast.error("Couldn't parse that request. Please fill the form manually.");
    } finally {
      setNlpLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const now = new Date();

    if (!form.facultyName.trim()) {
      newErrors.facultyName = "Faculty name is required";
    }
    if (!form.eventTitle.trim()) {
      newErrors.eventTitle = "Event title is required";
    }
    if (!form.hall.trim()) {
      newErrors.hall = "Please select a room from the suggestions below";
    }
    if (!form.date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Cannot select a past date";
      }
    }
    if (!form.startTime) {
      newErrors.startTime = "Start time is required";
    }
    if (!form.endTime) {
      newErrors.endTime = "End time is required";
    }
    if (form.startTime && form.endTime && form.date) {
      const startDateTime = new Date(`${form.date}T${form.startTime}`);
      const endDateTime = new Date(`${form.date}T${form.endTime}`);
      if (endDateTime <= startDateTime) {
        newErrors.endTime = "End time must be after start time";
      }
      if (startDateTime < now && endDateTime < now) {
        newErrors.startTime = "Cannot book a time slot that has already passed";
      }
    }
    if (form.facultyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.facultyEmail)) {
      newErrors.facultyEmail = "Please enter a valid email address";
    }
    if (!form.capacity.trim()) {
      newErrors.capacity = "Expected number of attendees is required";
    } else if (!/^\d+$/.test(form.capacity.trim())) {
      newErrors.capacity = "Please enter a valid number";
    } else if (parseInt(form.capacity) <= 0) {
      newErrors.capacity = "Capacity must be greater than 0";
    } else if (parseInt(form.capacity) > 300) {
      newErrors.capacity = "Capacity cannot exceed 300";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    setSubmitting(true);
    const basePayload = {
      facultyName: form.facultyName.trim(),
      facultyDepartment: form.facultyDepartment.trim(),
      facultyDesignation: form.facultyDesignation.trim(),
      facultyEmail: form.facultyEmail.trim(),
      eventTitle: form.eventTitle.trim(),
      eventDescription: form.eventDescription.trim(),
      hall: form.hall.trim(),
      capacity: parseInt(form.capacity.trim()),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      priority: form.priority,
      eventType: form.eventType
    };
    try {
      const res = await api.post("/bookings", basePayload);
      toast.success(res.data.message || "Booking request submitted successfully!");
      setForm({
        facultyName: "", facultyDepartment: "", facultyDesignation: "",
        facultyEmail: "", eventTitle: "", eventDescription: "", hall: "",
        capacity: "", date: new Date().toISOString().split("T")[0], startTime: "", endTime: ""
      });
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      if (status === 409 && data?.conflict) {
        setShowConflictModal(true);
        setConflictReason("");
      } else {
        toast.error(data?.message || "Failed to submit booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConflictConfirm = async () => {
    if (!conflictReason.trim()) return;
    setConflictSubmitting(true);
    const overridePayload = {
      facultyName: form.facultyName.trim(),
      facultyDepartment: form.facultyDepartment.trim(),
      facultyDesignation: form.facultyDesignation.trim(),
      facultyEmail: form.facultyEmail.trim(),
      eventTitle: form.eventTitle.trim(),
      eventDescription: form.eventDescription.trim(),
      hall: form.hall.trim(),
      capacity: parseInt(form.capacity.trim()),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      priority: form.priority,
      eventType: form.eventType,
      overrideRequested: true,
      conflictReason: conflictReason.trim()
    };
    try {
      const res = await api.post("/bookings", overridePayload);
      setShowConflictModal(false);
      toast.success(res.data.message || "Conflicting booking request sent to admin for approval.");
      setForm({
        facultyName: "", facultyDepartment: "", facultyDesignation: "",
        facultyEmail: "", eventTitle: "", eventDescription: "", hall: "",
        capacity: "", date: new Date().toISOString().split("T")[0], startTime: "", endTime: ""
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send conflicting booking request.");
    } finally {
      setConflictSubmitting(false);
    }
  };

  const hasRooms = recommendedRooms?.rooms?.length > 0;
  const noRoomsMessage = recommendedRooms?.rooms?.length === 0 && recommendedRooms?.aiMessage;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/coordinator-dashboard")}
              className="mb-4 bg-amrita text-white flex items-center gap-1 hover:bg-amrita/95"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h2 className="text-3xl font-bold text-foreground-90 mb-2">
              New Hall Booking Request
            </h2>
            <p className="text-muted-foreground">
              Fill in the details below. Enter your class strength and date/time first to get smart room suggestions.
            </p>
          </div>

          {/* NLP Booking Assistant */}
          <Card className="shadow-lg mb-6 border-amrita/20 bg-gradient-to-br from-amrita/5 to-transparent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amrita" />
                <h3 className="font-semibold text-foreground-90">Describe your booking</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Type it in plain English and we'll pre-fill the form below — e.g. "Book Hall A for 60 people
                this Friday 2 to 4pm for a seminar".
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={nlpText}
                  onChange={(e) => setNlpText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNlpParse();
                    }
                  }}
                  placeholder="Need a hall for 40 people tomorrow at 10am for a workshop..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleNlpParse}
                  disabled={nlpLoading || !nlpText.trim()}
                  className="sm:w-auto w-full"
                >
                  {nlpLoading ? "Parsing..." : "Fill form"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amrita/10 to-amrita/5 border-b">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="w-6 h-6 text-amrita" />
                Booking Request Form
              </CardTitle>
              <CardDescription>
                Smart room suggestions based on capacity fit and least-booked rooms.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Faculty Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground-90 flex items-center gap-2 pb-2 border-b">
                    <User className="w-5 h-5 text-amrita" />
                    Faculty Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">
                        <span className="flex items-center gap-1">
                          Faculty Name <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          name="facultyName"
                          value={form.facultyName}
                          onChange={handleChange}
                          placeholder="Dr. John Doe"
                          className={`pl-10 ${errors.facultyName ? "border-red-500" : ""}`}
                          required
                        />
                      </div>
                      {errors.facultyName && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.facultyName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">
                        Faculty Designation
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          name="facultyDesignation"
                          value={form.facultyDesignation}
                          onChange={handleChange}
                          placeholder="Prof / Assistant Prof"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">Faculty Email</label>
                      <Input
                        type="email"
                        name="facultyEmail"
                        value={form.facultyEmail}
                        onChange={handleChange}
                        placeholder="faculty@university.edu"
                        className={errors.facultyEmail ? "border-red-500" : ""}
                      />
                      {errors.facultyEmail && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.facultyEmail}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">Department</label>
                      <Select
                        value={form.facultyDepartment}
                        onValueChange={(value) => handleSelectChange("facultyDepartment", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <br />

                {/* Event Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground-90 flex items-center gap-2 pb-2 border-b">
                    <FileText className="w-5 h-5 text-amrita" />
                    Event Information
                  </h3>

                  {/* Event Title and Capacity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">
                        <span className="flex items-center gap-1">
                          Event Title <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <Input
                        name="eventTitle"
                        value={form.eventTitle}
                        onChange={handleChange}
                        placeholder="Guest Lecture on AI"
                        className={errors.eventTitle ? "border-red-500" : ""}
                        required
                      />
                      {errors.eventTitle && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.eventTitle}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Class Strength <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <Input
                        name="capacity"
                        type="number"
                        min="1"
                        max="300"
                        value={form.capacity}
                        onChange={handleChange}
                        placeholder="e.g., 50"
                        className={`${errors.capacity ? "border-red-500" : ""}`}
                        required
                      />
                      {errors.capacity && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.capacity}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Event Type Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">Priority</label>
                      <Select
                        value={form.priority}
                        onValueChange={(value) => handleSelectChange("priority", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Normal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground mt-1 text-orange-600">
                        * Use High/Critical only if you intend to override an existing booking.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">Event Type</label>
                      <Select
                        value={form.eventType}
                        onValueChange={(value) => handleSelectChange("eventType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Academic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Internal">Internal</SelectItem>
                          <SelectItem value="Official">Official</SelectItem>
                          <SelectItem value="External">External</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Event Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground-90">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Event Description
                        <span className="text-xs text-muted-foreground font-normal ml-1">(Optional - Max 500 characters)</span>
                      </span>
                    </label>
                    <textarea
                      name="eventDescription"
                      value={form.eventDescription}
                      onChange={handleChange}
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amrita resize-none"
                      placeholder="Provide details about the event, expected attendees, special requirements, etc."
                    />
                    <p className="text-xs text-muted-foreground text-right">{form.eventDescription.length}/500</p>
                  </div>
                </div>

                <br />

                {/* Date & Time Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground-90 flex items-center gap-2 pb-2 border-b">
                    <Clock className="w-5 h-5 text-amrita" />
                    Date &amp; Time
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Date <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <Input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className={errors.date ? "border-red-500" : ""}
                        required
                      />
                      {errors.date && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.date}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">
                        <span className="flex items-center gap-1">
                          Start Time <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <Input
                        type="time"
                        name="startTime"
                        value={form.startTime}
                        onChange={handleChange}
                        className={`${errors.startTime ? "border-red-500" : ""} text-gray-900 dark:text-gray-100`}
                        required
                      />
                      {errors.startTime && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.startTime}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground-90">
                        <span className="flex items-center gap-1">
                          End Time <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <Input
                        type="time"
                        name="endTime"
                        value={form.endTime}
                        onChange={handleChange}
                        className={`${errors.endTime ? "border-red-500" : ""} text-gray-900 dark:text-gray-100`}
                        required
                      />
                      {errors.endTime && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.endTime}
                        </p>
                      )}
                    </div>
                  </div>

                  {form.date && form.startTime && form.endTime && (
                    <div className="p-3 bg-muted/50 rounded-lg border text-center">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Selected Slot:</span>{" "}
                        {new Date(form.date).toLocaleDateString("en-US", {
                          weekday: "long", year: "numeric", month: "long", day: "numeric"
                        })}{" "}
                        from {form.startTime} to {form.endTime}
                      </p>
                    </div>
                  )}
                </div>

                <br />

                {/* Room Selection Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <h3 className="text-lg font-semibold text-foreground-90 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amrita" />
                      Select Room / Hall <span className="text-red-500">*</span>
                    </h3>
                    {/* Limit Toggle */}
                    {form.date && form.startTime && form.endTime && form.capacity && (
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        {[5, 10, 'all'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSuggestLimit(val)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${suggestLimit === val
                              ? 'bg-amrita text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                              }`}
                          >
                            {val === 'all' ? 'All' : `Top ${val}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected room display */}
                  {form.hall && (
                    <div className="flex items-center gap-3 p-3 bg-amrita/5 border border-amrita/30 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-amrita flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amrita">Selected: {form.hall}</p>
                        <p className="text-xs text-muted-foreground">Click another room below to change selection</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectChange("hall", "")}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Manual Room Selection Toggle */}
                  <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-muted-foreground">Don't see your room? Or want to override a booked room?</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllRooms(!showAllRooms)}
                      className="text-xs text-amrita hover:text-amrita/80 flex items-center gap-1"
                    >
                      <Filter className="w-3 h-3" />
                      {showAllRooms ? "Hide Full List" : "Manual Selection / Override"}
                    </Button>
                  </div>

                  {showAllRooms && (
                    <div className="p-4 bg-muted/30 border rounded-xl space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search all rooms (A-101, Auditorium...)"
                          value={roomSearch}
                          onChange={(e) => setRoomSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {allRoomsList
                          .filter(r => r.name.toLowerCase().includes(roomSearch.toLowerCase()))
                          .map(room => {
                            const isRecommended = recommendedRooms?.rooms?.some(rr => rr.name === room.name);
                            return (
                              <button
                                key={room._id}
                                type="button"
                                onClick={() => {
                                  handleSelectChange("hall", room.name);
                                  if (!isRecommended) {
                                    toast.info(`Note: ${room.name} might be booked or have small capacity for your slot. Selecting it will trigger an override check.`);
                                  }
                                }}
                                className={`p-2 text-xs rounded-md border text-center transition-all ${form.hall === room.name
                                  ? "bg-amrita text-white border-amrita shadow-sm"
                                  : isRecommended
                                    ? "bg-green-50 text-green-700 border-green-200 hover:border-green-400"
                                    : "bg-white text-foreground border-border hover:border-amrita/50"
                                  }`}
                              >
                                {room.name}
                                {isRecommended && " ✓"}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Prompt to enter details first */}
                  {!(form.date && form.startTime && form.endTime && form.capacity) && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <Sparkles className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-blue-700 font-medium">Smart Room Suggestions</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Enter <strong>Class Strength</strong>, <strong>Date</strong>, <strong>Start Time</strong> and <strong>End Time</strong> above to see available rooms ranked by best fit and least booked.
                      </p>
                    </div>
                  )}

                  {/* Loading state */}
                  {loadingRooms && (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amrita mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Finding best available rooms...</p>
                    </div>
                  )}

                  {/* Room list */}
                  {!loadingRooms && hasRooms && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-amrita" />
                        <p className="text-xs text-muted-foreground">{recommendedRooms.aiMessage}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recommendedRooms.rooms.map((room, idx) => (
                          <button
                            key={room._id}
                            type="button"
                            onClick={() => handleSelectChange("hall", room.name)}
                            className={`relative text-left p-4 rounded-xl border-2 transition-all hover:shadow-md group ${form.hall === room.name
                              ? "border-amrita bg-amrita/5 shadow-md"
                              : "border-border hover:border-amrita/50 bg-card"
                              }`}
                          >
                            {idx === 0 && (
                              <span className="absolute -top-2 -right-2 bg-amrita text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Best Fit
                              </span>
                            )}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Building2 className={`w-4 h-4 ${form.hall === room.name ? 'text-amrita' : 'text-muted-foreground'}`} />
                                <span className={`font-semibold text-sm ${form.hall === room.name ? 'text-amrita' : 'text-foreground'}`}>
                                  {room.name}
                                </span>
                              </div>
                              {form.hall === room.name && (
                                <CheckCircle2 className="w-4 h-4 text-amrita flex-shrink-0" />
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  Capacity: <strong>{room.capacity}</strong>
                                  {room.capacity >= parseInt(form.capacity || 0) && (
                                    <span className="text-green-600 ml-1">(+{room.capacity - parseInt(form.capacity || 0)} spare)</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <TrendingDown className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-muted-foreground">
                                  <strong className="text-green-700">{room.bookingCount}</strong> bookings (last 90 days)
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {recommendedRooms.totalAvailable > recommendedRooms.rooms.length && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          {recommendedRooms.totalAvailable - recommendedRooms.rooms.length} more available rooms.{" "}
                          <button
                            type="button"
                            onClick={() => setSuggestLimit('all')}
                            className="text-amrita hover:underline font-medium"
                          >
                            Show all
                          </button>
                        </p>
                      )}
                    </div>
                  )}

                  {/* No rooms available message */}
                  {!loadingRooms && noRoomsMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mb-1">
                        <AlertCircle className="w-4 h-4" />
                        No Available Rooms
                      </p>
                      <p className="text-xs text-red-600">{recommendedRooms.aiMessage}</p>
                    </div>
                  )}

                  {errors.hall && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.hall}
                    </p>
                  )}
                </div>

                <br />

                {/* Submit Button */}
                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/coordinator-dashboard")}
                    className="flex-1 bg-amrita text-white hover:bg-amrita/95"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-amrita text-white hover:bg-amrita/95 font-bold"
                  >
                    {submitting ? (
                      <><span className="animate-spin mr-2">⏳</span>Submitting...</>
                    ) : (
                      "Submit Booking Request"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Conflict / Override Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="bg-yellow-50 border-b border-yellow-200">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                Hall Already Booked
              </CardTitle>
              <CardDescription>
                This hall has an approved booking for the selected time slot.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                You can submit an override request. The admin will review both bookings and decide.
                Please provide a reason why your booking should take priority.
              </p>
              <textarea
                value={conflictReason}
                onChange={(e) => setConflictReason(e.target.value)}
                placeholder="Briefly explain why this event is critical (e.g. Mandatory Guest Lecture)..."
                rows={3}
                className={`w-full rounded-md border ${!conflictReason.trim() ? 'border-amber-300' : 'border-input'} bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amrita resize-none mb-1`}
              />
              {!conflictReason.trim() && (
                <p className="text-[10px] text-amber-600 mb-4">* Please provide a reason to enable submission</p>
              )}
              {form.priority === "Normal" && (
                <div className="p-2 bg-red-50 border border-red-100 rounded text-[10px] text-red-600 mb-4">
                  <strong>Wait!</strong> You have selected <strong>Normal Priority</strong>. Normal bookings cannot override other approved bookings. Close this modal and change Priority to <strong>High</strong> or <strong>Critical</strong> if this is an urgent request.
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConflictModal(false)}
                  disabled={conflictSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={handleConflictConfirm}
                  disabled={conflictSubmitting || !conflictReason.trim()}
                >
                  {conflictSubmitting ? "Sending..." : "Submit Override Request"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NewBooking;