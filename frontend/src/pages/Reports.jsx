import React, { useEffect, useState } from 'react';
import api from "../services/api";
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import {
    ArrowLeft, BarChart3, CheckCircle, Clock, XCircle, TrendingUp,
    Sparkles, AlertTriangle, AlertCircle, Building2, Users, Calendar, Download
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const STATUS_COLORS = {
    approved: 'text-green-700 bg-green-100',
    pending: 'text-yellow-700 bg-yellow-100',
    rejected: 'text-red-700 bg-red-100',
};

const CHART_COLORS = ['#d91e41', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#065f46'];

const Reports = () => {
    const navigate = useNavigate();
    const [forecastData, setForecastData] = useState([]);
    const [forecastSource, setForecastSource] = useState('Statistical Analysis Engine');
    const [aiInsights, setAiInsights] = useState(null);
    const [allBookings, setAllBookings] = useState([]);
    const [roomUsage, setRoomUsage] = useState([]);
    const [departmentData, setDepartmentData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters for Booking Log
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchFilter, setSearchFilter] = useState('');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');

    // ---- Derived stats ----
    const approved = allBookings.filter(b => b.status === 'approved').length;
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const rejected = allBookings.filter(b => b.status === 'rejected').length;

    // ---- Fetch data ----
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [forecastRes, bookingsRes] = await Promise.all([
                    api.get('/forecasting/demand'),
                    api.get('/bookings'),
                ]);

                const bookings = bookingsRes.data || [];

                if (forecastRes.data && forecastRes.data.forecast) {
                    setForecastData(forecastRes.data.forecast);
                    setAiInsights(forecastRes.data.insights);
                    if (forecastRes.data.forecastSource) {
                        setForecastSource(forecastRes.data.forecastSource);
                    }
                } else {
                    setForecastData(forecastRes.data || []);
                }

                setAllBookings(bookings);

                // Build room usage (all bookings, not just approved)
                const usageMap = {};
                bookings.forEach(b => {
                    if (!usageMap[b.hall]) usageMap[b.hall] = { hall: b.hall, approved: 0, pending: 0, rejected: 0, total: 0 };
                    usageMap[b.hall][b.status]++;
                    usageMap[b.hall].total++;
                });
                const usageArr = Object.values(usageMap)
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 10);
                setRoomUsage(usageArr);

                // Department distribution
                const deptMap = {};
                bookings.forEach(b => {
                    const dept = b.facultyDepartment || 'Unknown';
                    deptMap[dept] = (deptMap[dept] || 0) + 1;
                });
                const deptArr = Object.entries(deptMap)
                    .map(([dept, count]) => ({ dept, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8);
                setDepartmentData(deptArr);

            } catch (err) {
                console.error('Error fetching reports data:', err);
                setForecastData([
                    { day: 'Sunday', expectedBookings: 0 },
                    { day: 'Monday', expectedBookings: 5 },
                    { day: 'Tuesday', expectedBookings: 8 },
                    { day: 'Wednesday', expectedBookings: 6 },
                    { day: 'Thursday', expectedBookings: 10 },
                    { day: 'Friday', expectedBookings: 7 },
                    { day: 'Saturday', expectedBookings: 2 },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const formatDateTime = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    // Filtered booking log
    const filteredBookings = allBookings.filter(b => {
        const matchStatus = statusFilter === 'all' || b.status === statusFilter;
        const matchSearch = !searchFilter ||
            b.hall?.toLowerCase().includes(searchFilter.toLowerCase()) ||
            b.eventTitle?.toLowerCase().includes(searchFilter.toLowerCase()) ||
            b.facultyName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
            b.facultyDepartment?.toLowerCase().includes(searchFilter.toLowerCase());
        const start = dateFromFilter ? new Date(b.startTime) >= new Date(dateFromFilter) : true;
        const end = dateToFilter ? new Date(b.startTime) <= new Date(dateToFilter + 'T23:59:59') : true;
        return matchStatus && matchSearch && start && end;
    });

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin-dashboard')}
                        className="mb-4 bg-amrita text-white flex items-center gap-1 hover:bg-amrita/95"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground-90">Reports &amp; Analytics</h1>
                    <p className="text-muted-foreground">Booking statistics, demand forecasts, and intelligent insights</p>
                </div>

                {/* Smart AI Insights Board */}
                {aiInsights && (
                    <Card className="mb-8 border-amrita/20 bg-gradient-to-br from-amrita/5 to-transparent relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Sparkles className="w-32 h-32" />
                        </div>
                        <CardHeader className="pb-4 px-6 pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl text-amrita">
                                        <Sparkles className="w-5 h-5" />
                                        Smart Analytics Insights
                                    </CardTitle>
                                    <CardDescription>Advanced data analysis with proactive management strategies</CardDescription>
                                </div>
                                <div className="text-[10px] font-bold px-2 py-1 rounded bg-amrita/10 text-amrita border border-amrita/20 flex items-center gap-1 whitespace-nowrap">
                                    <CheckCircle className="w-3 h-3" />
                                    Forecasting Engine: {forecastSource}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 px-6 pb-6 relative z-10">
                            {/* Daily Peak Trends Section - New */}
                            {aiInsights.peakTimings && aiInsights.peakTimings.dailyStats && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Daily Peak Usage Trends
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {aiInsights.peakTimings.context}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                                        {aiInsights.peakTimings.dailyStats.map((stat, idx) => {
                                            const isBusiest = stat.day === aiInsights.peakTimings.busiestDay;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex-shrink-0 w-[140px] p-3 rounded-xl border transition-all ${isBusiest
                                                            ? 'bg-amrita/10 border-amrita/30 ring-2 ring-amrita/10'
                                                            : 'bg-white/50 border-border hover:border-amrita/20'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-[10px] font-extrabold uppercase ${isBusiest ? 'text-amrita' : 'text-muted-foreground'}`}>
                                                            {stat.day.substring(0, 3)}
                                                            {isBusiest && " (Peak)"}
                                                        </span>
                                                        {isBusiest && <Sparkles className="w-3 h-3 text-amrita" />}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3 text-blue-500" />
                                                            <span className="text-sm font-bold">{stat.peakHour}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <TrendingUp className="w-3 h-3 text-green-500" />
                                                            <span className="text-[11px] font-medium text-muted-foreground">{stat.avgDuration} avg</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Summary & Alerts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-amrita/10">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center gap-2 text-foreground-90 group cursor-help" title="High-level strategy derived from current bookings and market demand forecasting.">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            Strategic Optimization
                                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {aiInsights.recommendations || "Analyzing upcoming demand..."}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center gap-2 text-foreground-90 group cursor-help" title="Identifies potential booking overlaps, capacity shortages, and resource bottlenecks before they happen.">
                                            <AlertCircle className="w-4 h-4 text-amrita" />
                                            Predicted Future Issues
                                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed p-2 bg-amrita/5 border border-amrita/10 rounded-md italic">
                                            {aiInsights.predictedIssues || "No immediate issues predicted."}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2 text-foreground-90 group cursor-help" title="Analyzes if specific departments or users are disproportionately booking specific high-demand halls to ensure fair access for all.">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        Fairness & Monopolization
                                        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {aiInsights.monopolizationAlerts || "No alerts at this time."}
                                    </p>
                                </div>
                            </div>

                            {/* Action Center - New */}
                            {aiInsights.actions && aiInsights.actions.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-amrita/10">
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2 group cursor-help" title="Prioritized tasks generated by AI to resolve the issues and optimizations identified in the analysis above.">
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                        Recommended Action Center
                                        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {aiInsights.actions.map((action, idx) => (
                                            <div key={idx} className="flex flex-col p-3 rounded-lg bg-white dark:bg-zinc-900 border border-border hover:border-amrita/30 transition-all shadow-sm group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${action.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                        action.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {action.priority} Priority
                                                    </span>
                                                </div>
                                                <h5 className="text-sm font-bold text-foreground group-hover:text-amrita transition-colors">{action.title}</h5>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {aiInsights.efficiencyScore !== undefined && aiInsights.efficiencyScore !== null && (
                                <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
                                    <div
                                        className="font-semibold text-sm flex items-center gap-1 cursor-help"
                                        title="Measures how closely the booked room capacity matches the actual expected attendees."
                                    >
                                        Resource Utilization Index:
                                        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 max-w-[200px] h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${aiInsights.efficiencyScore > 80 ? 'bg-green-500' : aiInsights.efficiencyScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${aiInsights.efficiencyScore}%` }}
                                        />
                                    </div>
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${aiInsights.efficiencyScore > 80 ? 'bg-green-100 text-green-700' :
                                        aiInsights.efficiencyScore > 50 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {aiInsights.efficiencyScore}/100
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Status Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-blue-600 text-white shadow-md hover:translate-y-[-2px] transition-transform">
                        <CardHeader className="pb-2 flex flex-row items-center gap-3">
                            <BarChart3 className="w-8 h-8 opacity-80" />
                            <div>
                                <CardDescription className="text-white/80">Total Bookings</CardDescription>
                                <CardTitle className="text-3xl">{allBookings.length}</CardTitle>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="bg-green-600 text-white shadow-md hover:translate-y-[-2px] transition-transform">
                        <CardHeader className="pb-2 flex flex-row items-center gap-3">
                            <CheckCircle className="w-8 h-8 opacity-80" />
                            <div>
                                <CardDescription className="text-white/80">Approved</CardDescription>
                                <CardTitle className="text-3xl">{approved}</CardTitle>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="bg-amber-500 text-white shadow-md hover:translate-y-[-2px] transition-transform">
                        <CardHeader className="pb-2 flex flex-row items-center gap-3">
                            <Clock className="w-8 h-8 opacity-80" />
                            <div>
                                <CardDescription className="text-white/80">Pending</CardDescription>
                                <CardTitle className="text-3xl">{pending}</CardTitle>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="bg-red-600 text-white shadow-md hover:translate-y-[-2px] transition-transform">
                        <CardHeader className="pb-2 flex flex-row items-center gap-3">
                            <XCircle className="w-8 h-8 opacity-80" />
                            <div>
                                <CardDescription className="text-white/80">Rejected</CardDescription>
                                <CardTitle className="text-3xl">{rejected}</CardTitle>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* Weekly Demand Forecast */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amrita" />
                                Weekly Demand Forecast
                            </CardTitle>
                            <CardDescription>
                                Expected bookings for the next 7 days — based on historical day-of-week pattern analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] w-full mt-4">
                                {forecastData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={forecastData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Line
                                                type="monotone"
                                                dataKey="expectedBookings"
                                                stroke="#d91e41"
                                                strokeWidth={3}
                                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                                activeDot={{ r: 6, fill: '#d91e41' }}
                                                name="Expected Bookings"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        {loading ? 'Analyzing patterns...' : 'No forecast data available'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Rooms by Total Bookings (Stacked) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-amrita" />
                                Top Rooms by Total Bookings
                            </CardTitle>
                            <CardDescription>Most requested resource spaces across all statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] w-full mt-4">
                                {roomUsage.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={roomUsage} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                                            <YAxis dataKey="hall" type="category" width={90} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '8px' }} />
                                            <Legend />
                                            <Bar dataKey="approved" fill="#16a34a" name="Approved" stackId="a" radius={[0, 0, 0, 0]} barSize={14} />
                                            <Bar dataKey="pending" fill="#d97706" name="Pending" stackId="a" barSize={14} />
                                            <Bar dataKey="rejected" fill="#dc2626" name="Rejected" stackId="a" radius={[0, 4, 4, 0]} barSize={14} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        {loading ? 'Loading resources...' : 'No booking data yet'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Department Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-amrita" />
                                Bookings by Department
                            </CardTitle>
                            <CardDescription>Which departments are booking the most resources</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] w-full mt-4">
                                {departmentData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={departmentData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="dept" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Bar dataKey="count" name="Bookings" radius={[4, 4, 0, 0]} barSize={32}>
                                                {departmentData.map((_, idx) => (
                                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        {loading ? 'Loading...' : 'No department data'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Approval Rate */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-amrita" />
                                Booking Status Distribution
                            </CardTitle>
                            <CardDescription>Overall approval, rejection, and pending rates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] w-full mt-4">
                                {allBookings.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Approved', value: approved },
                                                    { name: 'Pending', value: pending },
                                                    { name: 'Rejected', value: rejected },
                                                ]}
                                                cx="50%" cy="50%"
                                                outerRadius={100}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                <Cell fill="#16a34a" />
                                                <Cell fill="#d97706" />
                                                <Cell fill="#dc2626" />
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        {loading ? 'Loading...' : 'No booking data'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* All Bookings Table with Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-amrita" />
                                    Booking Master Log
                                </CardTitle>
                                <CardDescription>
                                    Complete historical manifest of all resource allocation requests ({filteredBookings.length} shown)
                                </CardDescription>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t mt-4">
                            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                                {['all', 'approved', 'pending', 'rejected'].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-2 py-1 text-xs font-medium rounded-md transition-all capitalize ${statusFilter === s
                                            ? s === 'all' ? 'bg-foreground text-background shadow-sm'
                                                : s === 'approved' ? 'bg-green-600 text-white shadow-sm'
                                                    : s === 'pending' ? 'bg-amber-500 text-white shadow-sm'
                                                        : 'bg-red-600 text-white shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {s === 'all' ? `All (${allBookings.length})` : `${s} (${allBookings.filter(b => b.status === s).length})`}
                                    </button>
                                ))}
                            </div>
                            <Input
                                placeholder="Search hall, event, faculty..."
                                value={searchFilter}
                                onChange={e => setSearchFilter(e.target.value)}
                                className="sm:col-span-1"
                            />
                            <Input
                                type="date"
                                value={dateFromFilter}
                                onChange={e => setDateFromFilter(e.target.value)}
                                title="From date"
                            />
                            <Input
                                type="date"
                                value={dateToFilter}
                                onChange={e => setDateToFilter(e.target.value)}
                                title="To date"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center flex-col items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amrita mb-4"></div>
                                <p className="text-muted-foreground">Fetching complete manifest...</p>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                {allBookings.length === 0 ? 'No bookings found in the database.' : 'No bookings match your filters.'}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground bg-muted/30">
                                            <th className="py-3 px-4 font-medium rounded-tl-md">Resource Space</th>
                                            <th className="py-3 pr-4 font-medium">Event Title</th>
                                            <th className="py-3 pr-4 font-medium">Faculty / Dept</th>
                                            <th className="py-3 pr-4 font-medium">Start Time</th>
                                            <th className="py-3 pr-4 font-medium">End Time</th>
                                            <th className="py-3 pr-4 font-medium rounded-tr-md">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.map((b) => (
                                            <tr key={b._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground-90">
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                                        {b.hall}
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4 text-foreground-80 max-w-[200px] truncate" title={b.eventTitle}>
                                                    {b.eventTitle}
                                                </td>
                                                <td className="py-3 pr-4 text-foreground-80">
                                                    <div>
                                                        <div className="font-medium">{b.facultyName}</div>
                                                        {b.facultyDepartment && (
                                                            <div className="text-xs text-muted-foreground">{b.facultyDepartment}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4 text-muted-foreground">{formatDateTime(b.startTime)}</td>
                                                <td className="py-3 pr-4 text-muted-foreground">{formatDateTime(b.endTime)}</td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize tracking-wide ${STATUS_COLORS[b.status] || ''}`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </main>
        </div>
    );
};

export default Reports;
