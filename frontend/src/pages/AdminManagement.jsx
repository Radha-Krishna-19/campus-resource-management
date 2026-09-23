import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from "../services/api";
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Shield, UserCheck, UserX, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pendingAdmins, setPendingAdmins] = useState([]);
    const [activeAdmins, setActiveAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [pendingRes, activeRes] = await Promise.all([
                api.get('/auth/admin/pending'),
                api.get('/auth/admin/active')
            ]);
            setPendingAdmins(pendingRes.data);
            setActiveAdmins(activeRes.data);
        } catch (error) {
            toast.error('Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    const approveAdmin = async (id) => {
        try {
            await api.patch(`/auth/admin/${id}/approve`);
            fetchAllData();
            toast.success('Admin approved successfully');
        } catch (error) {
            toast.error('Failed to approve admin');
        }
    };

    const rejectAdmin = async (id) => {
        try {
            await api.delete(`/auth/admin/${id}/remove`);
            fetchAllData();
            toast.success('Admin request rejected');
        } catch (error) {
            toast.error('Failed to reject admin');
        }
    };

    const removeAdmin = async (id) => {
        try {
            await api.delete(`/auth/admin/${id}/remove`);
            fetchAllData();
            toast.success('Admin removed successfully');
        } catch (error) {
            toast.error('Failed to remove admin');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amrita mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading admin data...</p>
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

                    <div>
                        <h1 className="text-3xl font-bold text-foreground-90">Administrator Management</h1>
                        <p className="text-muted-foreground">Manage admin requests and active administrators</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Pending Admin Requests */}
                    <Card>
                        <CardHeader className="bg-amber-50 border-b border-amber-200">
                            <CardTitle className="flex items-center gap-2 text-amber-900">
                                <Shield className="w-5 h-5" />
                                Pending Admin Requests
                                <span className="ml-auto text-sm font-normal bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                                    {pendingAdmins.length} Pending
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {pendingAdmins.length === 0 ? (
                                <div className="text-center py-12">
                                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">No pending admin requests</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingAdmins.map(admin => (
                                        <div key={admin._id} className="flex items-center justify-between p-4 border rounded-lg bg-amber-50/30">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-lg">{admin.username}</div>
                                                    <div className="text-sm text-muted-foreground">Awaiting Approval</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => approveAdmin(admin._id)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <UserCheck className="w-4 h-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => rejectAdmin(admin._id)}
                                                >
                                                    <UserX className="w-4 h-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Administrators */}
                    <Card>
                        <CardHeader className="bg-amrita/5 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Active Administrators
                                <span className="ml-auto text-sm font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                                    {activeAdmins.length} Total
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {activeAdmins.length === 0 ? (
                                <div className="text-center py-12">
                                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">No active administrators</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeAdmins.map(admin => (
                                        <div key={admin._id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-amrita/10 flex items-center justify-center text-amrita font-bold">
                                                    {admin.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-lg">{admin.username}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {admin._id === user.userId ? "(Current User)" : "Administrator"}
                                                    </div>
                                                </div>
                                            </div>
                                            {admin._id !== user.userId && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => removeAdmin(admin._id)}
                                                    title="Remove Administrator"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default AdminManagement;
