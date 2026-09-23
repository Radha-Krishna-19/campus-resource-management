import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from "../services/api";
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Users, UserPlus, Trash2 } from 'lucide-react';

const CoordinatorList = () => {
    const navigate = useNavigate();
    const [coordinators, setCoordinators] = useState([]);
    const [newStudentUsername, setNewStudentUsername] = useState('');
    const [newStudentPassword, setNewStudentPassword] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCoordinators();
    }, []);

    const fetchCoordinators = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/coordinators');
            setCoordinators(res.data);
        } catch (error) {
            toast.error('Failed to fetch coordinators');
        } finally {
            setLoading(false);
        }
    };

    const addCoordinator = async () => {
        if (!newStudentUsername || !newStudentPassword) {
            toast.error('Please enter both username and password');
            return;
        }

        try {
            await api.post('/auth/register', {
                username: newStudentUsername,
                password: newStudentPassword,
                role: 'coordinator'
            });

            setNewStudentUsername('');
            setNewStudentPassword('');
            fetchCoordinators();
            toast.success('Coordinator added successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add coordinator');
        }
    };

    const deleteCoordinator = async (id) => {
        try {
            await api.delete(`/auth/coordinator/${id}`);
            fetchCoordinators();
            toast.success('Coordinator deleted successfully');
        } catch (error) {
            toast.error('Failed to delete coordinator');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amrita mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading coordinators...</p>
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
                        <h1 className="text-3xl font-bold text-foreground-90">Student Coordinators</h1>
                        <p className="text-muted-foreground">Manage student coordinators for hall bookings</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Coordinator Form */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader className="bg-amrita/5 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <UserPlus className="w-5 h-5" />
                                    Add New Coordinator
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Username</label>
                                        <Input
                                            placeholder="Enter username"
                                            value={newStudentUsername}
                                            onChange={(e) => setNewStudentUsername(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Password</label>
                                        <Input
                                            type="password"
                                            placeholder="Enter password"
                                            value={newStudentPassword}
                                            onChange={(e) => setNewStudentPassword(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        onClick={addCoordinator}
                                        className="w-full bg-amrita hover:bg-amrita/90"
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Add Coordinator
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coordinator List */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="bg-amrita/5 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Coordinator List
                                    <span className="ml-auto text-sm font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                                        {coordinators.length} Total
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {coordinators.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">No coordinators found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {coordinators.map(user => (
                                            <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-amrita/10 flex items-center justify-center text-amrita font-bold">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-lg">{user.username}</div>
                                                        <div className="text-sm text-muted-foreground">Coordinator</div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteCoordinator(user._id)}
                                                    title="Remove Coordinator"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorList;
