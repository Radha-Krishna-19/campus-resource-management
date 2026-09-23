import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    MapPin,
    Users,
    Star,
    Clock,
    Calendar,
    ArrowRight,
    RefreshCw,
    History
} from "lucide-react";
import { toast } from "sonner";

const ReallocationRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedHalls, setSelectedHalls] = useState({});
    const [showHistory, setShowHistory] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [pendingRes, historyRes] = await Promise.all([
                api.get("/reallocation/my"),
                api.get("/reallocation/history")
            ]);
            setRequests(pendingRes.data || []);
            setHistory(historyRes.data || []);
        } catch (err) {
            toast.error("Failed to load reallocation requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const formatDate = (d) => new Date(d).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric"
    });
    const formatTime = (d) => new Date(d).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit"
    });

    const handleAccept = async (requestId) => {
        const hallName = selectedHalls[requestId];
        if (!hallName) {
            toast.error("Please select a hall from the suggestions first.");
            return;
        }
        setActionLoading(requestId + "_accept");
        try {
            await api.patch(`/reallocation/${requestId}/accept`, { hallName });
            toast.success(`✅ Your event has been moved to ${hallName}!`);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to accept reallocation.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId) => {
        setActionLoading(requestId + "_reject");
        try {
            await api.patch(`/reallocation/${requestId}/reject`, {
                note: "Coordinator chose to rebook manually"
            });
            toast.success("Suggestions dismissed. You can make a new booking from the booking page.");
            fetchAll();
        } catch (err) {
            toast.error("Failed to reject suggestions.");
        } finally {
            setActionLoading(null);
        }
    };

    const scoreLabel = (score) => {
        if (score >= 0.75) return { text: "Excellent", color: "text-green-700 bg-green-50 border-green-200" };
        if (score >= 0.55) return { text: "Good", color: "text-blue-700 bg-blue-50 border-blue-200" };
        return { text: "Fair", color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
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
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-foreground">Hall Reallocation Requests</h2>
                            <p className="text-muted-foreground">Your booked hall was overridden. Choose an alternative or rebook manually.</p>
                        </div>
                    </div>
                </div>

                {/* Toggle history */}
                <div className="flex justify-end mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistory((h) => !h)}
                        className="flex items-center gap-2"
                    >
                        <History className="w-4 h-4" />
                        {showHistory ? "Hide History" : "View History"}
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <RefreshCw className="w-8 h-8 animate-spin text-amrita mx-auto mb-3" />
                        <p className="text-muted-foreground">Loading reallocation requests…</p>
                    </div>
                ) : (
                    <>
                        {/* Active Pending Requests */}
                        {requests.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No Pending Reallocation Requests</h3>
                                    <p className="text-muted-foreground">None of your bookings have been overridden. You're all set!</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {requests.map((req) => {
                                    const displaced = req.displacedBooking;
                                    const overriding = req.overridingBooking;
                                    const selected = selectedHalls[req._id];

                                    return (
                                        <Card key={req._id} className="border-orange-300 shadow-sm">
                                            <CardHeader className="bg-orange-50 border-b border-orange-200">
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                                                            <CardTitle className="text-lg text-orange-900">Your Hall Was Overridden</CardTitle>
                                                        </div>
                                                        <CardDescription className="text-orange-700">
                                                            Your event <strong>"{displaced?.eventTitle}"</strong> was displaced because{" "}
                                                            <strong>"{overriding?.eventTitle}"</strong> by {overriding?.facultyName} was given priority.
                                                        </CardDescription>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground bg-white border rounded-md px-3 py-2 shrink-0">
                                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(displaced?.startTime)}</div>
                                                        <div className="flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />{formatTime(displaced?.startTime)} – {formatTime(displaced?.endTime)}</div>
                                                        <div className="flex items-center gap-1 mt-1"><Users className="w-3 h-3" />{displaced?.capacity} attendees</div>
                                                    </div>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="pt-6 space-y-5">
                                                {/* Suggestions */}
                                                {req.suggestions && req.suggestions.length > 0 ? (
                                                    <>
                                                        <div>
                                                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-amrita" />
                                                                Available Alternative Halls — Click to Select
                                                            </h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                                {req.suggestions.map((s, idx) => {
                                                                    const isSelected = selected === s.hallName;
                                                                    const badge = scoreLabel(s.score);
                                                                    return (
                                                                        <button
                                                                            key={s.hallName}
                                                                            onClick={() => setSelectedHalls(prev => ({ ...prev, [req._id]: s.hallName }))}
                                                                            className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                                                                ? "border-amrita bg-amrita/5 shadow-md"
                                                                                : "border-border hover:border-amrita/50"
                                                                                }`}
                                                                        >
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <span className="font-bold text-base">{s.hallName}</span>
                                                                                {idx === 0 && (
                                                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                                <Users className="w-3 h-3" /> Capacity: {s.hallCapacity}
                                                                            </p>
                                                                            <p className="text-sm text-muted-foreground">Floor: {s.floor || "—"}</p>
                                                                            <div className="mt-2">
                                                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
                                                                                    {badge.text} Match ({Math.round(s.score * 100)}%)
                                                                                </span>
                                                                            </div>
                                                                            {isSelected && (
                                                                                <div className="mt-2 text-xs text-amrita font-semibold flex items-center gap-1">
                                                                                    <CheckCircle2 className="w-3 h-3" /> Selected
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                            <Button
                                                                onClick={() => handleAccept(req._id)}
                                                                disabled={!selected || actionLoading === req._id + "_accept"}
                                                                className="bg-amrita hover:bg-amrita/90 text-white flex items-center gap-2"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                {actionLoading === req._id + "_accept"
                                                                    ? "Moving Event…"
                                                                    : selected ? `Accept & Move to ${selected}` : "Select a Hall First"}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => handleReject(req._id)}
                                                                disabled={!!actionLoading}
                                                                className="border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                {actionLoading === req._id + "_reject" ? "Dismissing…" : "Dismiss & Rebook Manually"}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => navigate("/new-booking")}
                                                                className="text-muted-foreground flex items-center gap-2"
                                                            >
                                                                <ArrowRight className="w-4 h-4" />
                                                                New Booking
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                                                        <p className="text-yellow-800 text-sm font-medium">
                                                            ⚠️ No alternative halls found for this time slot. All rooms are either booked or have insufficient capacity.
                                                        </p>
                                                        <Button
                                                            onClick={() => navigate("/new-booking")}
                                                            className="mt-3 text-sm bg-amrita text-white"
                                                        >
                                                            Make a New Booking Request
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* History */}
                        {showHistory && (
                            <div className="mt-10">
                                <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Reallocation History</h3>
                                {history.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No past reallocation history.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {history.map((req) => (
                                            <div key={req._id} className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                                                {req.status === "accepted" ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{req.displacedBooking?.eventTitle}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {req.status === "accepted"
                                                            ? `Moved to ${req.acceptedHall}`
                                                            : `Dismissed — suggestions rejected`}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${req.status === "accepted"
                                                    ? "text-green-700 bg-green-50 border-green-200"
                                                    : "text-gray-600 bg-gray-50 border-gray-200"
                                                    }`}>
                                                    {req.status.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default ReallocationRequests;
