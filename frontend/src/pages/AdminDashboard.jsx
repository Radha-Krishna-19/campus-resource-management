import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from "../services/api";
import Header from '../components/Header';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Users, BarChart3, Shield, CalendarCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

const AdminDashboard = () => {
  // ---------------- STATES ----------------
  const [pendingBookings, setPendingBookings] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdmins: 0,
    pendingAdmins: 0,
    pendingBookings: 0,
    totalHalls: 0
  });
  const { user } = useAuth();

  const navigate = useNavigate();

  // ---------------- STATIC DATA ----------------
  const quickLinks = [
    {
      icon: Users,
      title: 'User Management',
      description: 'Manage all users',
      onClick: () => navigate('/admin/user-management')
    },
    {
      icon: CalendarCheck,
      title: 'Hall Booking Approvals',
      description: 'Review booking requests',
      onClick: () => navigate('/admin/hall-booking-approvals')
    },
    {
      icon: BarChart3,
      title: 'Reports',
      description: 'View analytics & reports',
      onClick: () => navigate('/admin/reports')
    },
    {
      icon: Shield,
      title: 'Audit Logs',
      description: 'View system history',
      onClick: () => navigate('/admin/audit-logs')
    },
  ];

  // ---------------- API CALLS ----------------

  const fetchStats = async () => {
    try {
      const res = await api.get('/auth/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const res = await api.get('/bookings/pending');
      setPendingBookings(res.data || []);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    }
  };

  // ---------------- EFFECT ----------------
  useEffect(() => {
    fetchPendingBookings();
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* TITLE */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground-90 mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">Welcome to the administration portal</p>
        </div>

        {/* Override Notifications Alert */}
        {pendingBookings.some(b => b.isConflict) && (
          <div
            onClick={() => navigate('/admin/hall-booking-approvals')}
            className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-colors group"
          >
            <div className="p-3 bg-amber-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-900 font-semibold text-lg">Override Requests Pending</h3>
              <p className="text-amber-700/90 text-sm mt-1">
                There are {pendingBookings.filter(b => b.isConflict).length} requests that require admin review for overriding existing bookings.
              </p>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6">
              Review Now
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <motion.div variants={cardVariants}>
              <Card className="bg-amrita text-white cursor-default hover:shadow-lg transition-transform hover:scale-105">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/80">Total Coordinators</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalStudents}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card className="bg-amrita text-white cursor-default hover:shadow-lg transition-transform hover:scale-105">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/80">Total Admins</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalAdmins}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card className="bg-amrita text-white cursor-default hover:shadow-lg transition-transform hover:scale-105">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/80">Pending Bookings</CardDescription>
                  <CardTitle className="text-3xl">{stats.pendingBookings}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card
                className="bg-amrita text-white cursor-pointer hover:shadow-lg transition-transform hover:scale-105"
                onClick={() => navigate('/admin/room-management')}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/80">Rooms</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalHalls}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Quick Links */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {quickLinks.map((link, index) => (
            <motion.div key={index} variants={cardVariants}>
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow hover:border-amrita"
                onClick={link.onClick}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 bg-amrita/10 rounded-lg">
                    <link.icon className="w-6 h-6 text-amrita" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;