import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BookOpen, Calendar, PlusCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [reallocationCount, setReallocationCount] = useState(0);

  useEffect(() => {
    // Silently check for pending reallocation requests
    api.get("/reallocation/my")
      .then(res => setReallocationCount(res.data?.length || 0))
      .catch(() => { }); // Non-critical — swallow errors silently
  }, []);

  const quickLinks = [
    {
      icon: BookOpen,
      title: "Class / Hall Availability",
      description: "Check and request halls for events",
      path: "/hall-availability"
    },
    {
      icon: PlusCircle,
      title: "New Hall Booking Request",
      description: "Create a new booking request for halls",
      path: "/new-booking"
    },
    {
      icon: Calendar,
      title: "My Booking Requests",
      description: "Track approval and allocation status",
      path: "/my-bookings"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground-90 mb-2">
            Student Coordinator Dashboard
          </h2>
          <p className="text-muted-foreground">
            Request halls and track booking approvals
          </p>
        </div>

        {/* Reallocation Alert Banner - Styled like Admin Dashboard */}
        {reallocationCount > 0 && (
          <div
            onClick={() => navigate("/reallocation-requests")}
            className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-colors group"
          >
            <div className="p-3 bg-amber-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-900 font-semibold text-lg">New Hall Suggestions Available</h3>
              <p className="text-amber-700/90 text-sm mt-1">
                You have {reallocationCount} hall reallocation request(s) waiting for review due to overrides.
              </p>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 shrink-0 flex items-center gap-2">
              Review Now <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickLinks.map((link, index) => (
            <Card
              key={index}
              onClick={() => navigate(link.path)}
              className={`hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-amrita ${link.color || ""}`}
            >
              <CardHeader className={`flex flex-row items-center gap-4 ${link.textColor || ""}`}>
                <div className={`p-3 rounded-lg ${link.color ? "bg-white/20" : "bg-amrita/10"}`}>
                  <link.icon className={`w-6 h-6 ${link.textColor ? "text-white" : "text-amrita"}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className={`text-lg ${link.textColor || ""}`}>
                    {link.title}
                  </CardTitle>
                  <CardDescription className={link.textColor ? "text-white/80" : ""}>
                    {link.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Clock className="w-5 h-5" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>Check hall availability before submitting a request</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>Provide complete faculty and event details for faster approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>Track your booking status in "My Booking Requests"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>If overridden, check "Hall Reallocation Requests" for alternative rooms</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Calendar className="w-5 h-5" />
                Booking Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-green-800">
                {["Fill out the booking request form", "System checks availability automatically", "Admin reviews and approves/rejects", "If overridden, accept an alternative hall"].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CoordinatorDashboard;
