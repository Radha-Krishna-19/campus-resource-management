import React, { useEffect, useState } from 'react';
import api from "../services/api";
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowLeft, Clock, User, Shield, Search, FilterX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allUsernames, setAllUsernames] = useState([]);
    const [filters, setFilters] = useState({
        username: 'ALL',
        role: 'ALL',
        action: 'ALL',
        startDate: '',
        endDate: ''
    });

    const navigate = useNavigate();

    // Fetch all usernames for dropdown
    useEffect(() => {
        const fetchUsernames = async () => {
            try {
                const res = await api.get('/audit-logs/usernames');
                setAllUsernames(res.data || []);
            } catch (e) {
                console.error('Failed to fetch usernames', e);
            }
        };
        fetchUsernames();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.username && filters.username !== 'ALL') params.username = filters.username;
            if (filters.action && filters.action !== 'ALL') params.action = filters.action;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const res = await api.get('/audit-logs', { params });
            let data = res.data;

            // Client-side role filtering
            if (filters.role === 'admin') {
                const adminActions = ['LOGIN', 'LOGOUT', 'ADMIN_REQUEST', 'ADMIN_APPROVE', 'ADMIN_REJECT', 'ADMIN_REMOVE', 'COORDINATOR_DELETE', 'BOOKING_APPROVE', 'BOOKING_REJECT', 'BOOKING_OVERRIDE', 'USER_REGISTER'];
                if (filters.action === 'ALL') {
                    data = data.filter(log => adminActions.includes(log.action));
                }
            } else if (filters.role === 'coordinator') {
                const coordinatorActions = ['LOGIN', 'LOGOUT', 'BOOKING_CREATE'];
                if (filters.action === 'ALL') {
                    data = data.filter(log => coordinatorActions.includes(log.action));
                }
            }

            setLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs();
    };

    const clearFilters = () => {
        const cleared = { username: 'ALL', role: 'ALL', action: 'ALL', startDate: '', endDate: '' };
        setFilters(cleared);
        (async () => {
            setLoading(true);
            try {
                const res = await api.get('/audit-logs');
                setLogs(res.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    };

    const getActionColor = (action) => {
        if (action.includes('APPROVE') || action.includes('SUCCESS') || action.includes('LOGIN')) return 'text-green-600 bg-green-50';
        if (action.includes('REJECT') || action.includes('DELETE') || action.includes('LOGOUT') || action.includes('REMOVE')) return 'text-red-600 bg-red-50';
        if (action.includes('CREATE') || action.includes('REGISTER') || action.includes('REQUEST')) return 'text-blue-600 bg-blue-50';
        return 'text-amrita bg-amrita/10';
    };

    const getActionOptions = () => {
        if (filters.role === 'admin') {
            return [
                { value: 'ALL', label: 'All Admin Actions' },
                { value: 'LOGIN', label: 'Login' },
                { value: 'LOGOUT', label: 'Logout' },
                { value: 'ADMIN_REQUEST', label: 'Admin Request' },
                { value: 'ADMIN_APPROVE', label: 'Approve Admin' },
                { value: 'ADMIN_REJECT', label: 'Reject Admin' },
                { value: 'ADMIN_REMOVE', label: 'Remove Admin' },
                { value: 'COORDINATOR_DELETE', label: 'Delete Coordinator' },
                { value: 'BOOKING_APPROVE', label: 'Approve Booking' },
                { value: 'BOOKING_REJECT', label: 'Reject Booking' },
                { value: 'BOOKING_OVERRIDE', label: 'Override Booking' },
                { value: 'USER_REGISTER', label: 'Register User' }
            ];
        } else if (filters.role === 'coordinator') {
            return [
                { value: 'ALL', label: 'All Coordinator Actions' },
                { value: 'LOGIN', label: 'Login' },
                { value: 'LOGOUT', label: 'Logout' },
                { value: 'BOOKING_CREATE', label: 'Create Booking' }
            ];
        } else {
            return [
                { value: 'ALL', label: 'All Actions' },
                { value: 'LOGIN', label: 'Login' },
                { value: 'LOGOUT', label: 'Logout' },
                { value: 'BOOKING_CREATE', label: 'Booking Create' },
                { value: 'BOOKING_APPROVE', label: 'Booking Approve' },
                { value: 'BOOKING_REJECT', label: 'Booking Reject' },
                { value: 'BOOKING_OVERRIDE', label: 'Booking Override' },
                { value: 'ADMIN_REQUEST', label: 'Admin Request' },
                { value: 'ADMIN_APPROVE', label: 'Admin Approve' },
                { value: 'ADMIN_REJECT', label: 'Admin Reject' },
                { value: 'ADMIN_REMOVE', label: 'Admin Remove' },
                { value: 'COORDINATOR_DELETE', label: 'Coordinator Delete' },
                { value: 'USER_REGISTER', label: 'User Register' }
            ];
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-6 py-8">
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/admin-dashboard")}
                            className="mb-4 bg-amrita text-white flex items-center gap-1 hover:bg-amrita/95"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground-90">Audit Logs</h1>
                        <p className="text-muted-foreground">Historical record of all system actions</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">

                            {/* Username Dropdown */}
                            <div className="md:col-span-1">
                                <label className="text-sm font-medium mb-1 block">Username</label>
                                <Select
                                    value={filters.username}
                                    onValueChange={(val) => setFilters({ ...filters, username: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Users</SelectItem>
                                        {allUsernames.map(u => (
                                            <SelectItem key={u} value={u}>{u}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Role Filter */}
                            <div className="md:col-span-1">
                                <label className="text-sm font-medium mb-1 block">Role</label>
                                <Select
                                    value={filters.role}
                                    onValueChange={(val) => {
                                        setFilters({ ...filters, role: val, action: 'ALL' });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Roles</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="coordinator">Coordinator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action Type */}
                            <div className="md:col-span-1">
                                <label className="text-sm font-medium mb-1 block">Action Type</label>
                                <Select
                                    value={filters.action}
                                    onValueChange={(val) => setFilters({ ...filters, action: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getActionOptions().map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">Start Date</label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">End Date</label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <Button type="submit" className="bg-amrita hover:bg-amrita/90 flex-1">
                                    <Search className="w-4 h-4 mr-2" />
                                    Search
                                </Button>
                                <Button type="button" variant="outline" onClick={clearFilters} title="Clear Filters">
                                    <FilterX className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>System Activity</CardTitle>
                                <CardDescription>Recent actions performed by administrators and coordinators</CardDescription>
                            </div>
                            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                {logs.length} entries
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-10 text-center text-muted-foreground animate-pulse">Loading logs...</div>
                        ) : logs.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground">No audit logs found matching your criteria</div>
                        ) : (
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3">Timestamp</th>
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {logs.map((log) => (
                                            <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 text-muted-foreground min-w-[180px]">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 flex-shrink-0" />
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {log.user?.role === 'admin' ? (
                                                            <Shield className="w-3 h-3 text-amrita" />
                                                        ) : (
                                                            <User className="w-3 h-3 text-blue-600" />
                                                        )}
                                                        <span className="font-medium">{log.username || log.user?.username || 'System'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${log.user?.role === 'admin' ? 'bg-amrita/10 text-amrita' : 'bg-blue-50 text-blue-700'
                                                        }`}>
                                                        {log.user?.role || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold">
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getActionColor(log.action)}`}>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground max-w-[300px] truncate" title={log.details}>
                                                    {log.details}
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

export default AuditLogs;
