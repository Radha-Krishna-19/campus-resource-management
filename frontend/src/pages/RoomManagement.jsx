import React, { useEffect, useState } from 'react';
import api from "../services/api";
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Plus, Pencil, Trash2, Building2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const RoomManagement = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Add form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', capacity: '' });
    const [addLoading, setAddLoading] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', capacity: '' });
    const [editLoading, setEditLoading] = useState(false);

    // Delete confirm
    const [deletingId, setDeletingId] = useState(null);

    // ---- Fetch ----
    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rooms/all');
            setRooms(res.data || []);
        } catch (err) {
            toast.error('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRooms(); }, []);

    // ---- Add ----
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!addForm.name.trim() || !addForm.capacity) return;
        setAddLoading(true);
        try {
            await api.post('/rooms', { name: addForm.name.trim(), capacity: parseInt(addForm.capacity) });
            toast.success('Room added successfully');
            setAddForm({ name: '', capacity: '' });
            setShowAddForm(false);
            fetchRooms();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to add room');
        } finally {
            setAddLoading(false);
        }
    };

    // ---- Edit ----
    const startEdit = (room) => {
        setEditingId(room._id);
        setEditForm({ name: room.name, capacity: room.capacity });
    };

    const handleEdit = async (id) => {
        if (!editForm.name.trim() || !editForm.capacity) return;
        setEditLoading(true);
        try {
            await api.patch(`/rooms/${id}`, { name: editForm.name.trim(), capacity: parseInt(editForm.capacity) });
            toast.success('Room updated');
            setEditingId(null);
            fetchRooms();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update room');
        } finally {
            setEditLoading(false);
        }
    };

    // ---- Delete ----
    const handleDelete = async (id) => {
        try {
            await api.delete(`/rooms/${id}`);
            toast.success('Room deleted');
            setDeletingId(null);
            fetchRooms();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to delete room');
        }
    };


    // ---- Filtered rooms ----
    const filtered = rooms.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-6 py-8">

                {/* Page Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin-dashboard')}
                        className="mb-4 bg-amrita text-white flex items-center gap-1 hover:bg-amrita/95"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground-90">Room Management</h1>
                            <p className="text-muted-foreground">Add, edit, or remove campus rooms and halls</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {/* Add Room Button */}
                            <Button
                                className="bg-amrita text-white hover:bg-amrita/90 flex items-center gap-2"
                                onClick={() => { setShowAddForm(v => !v); setEditingId(null); }}
                            >
                                <Plus className="w-4 h-4" />
                                Add Room
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Add Room Form */}
                {showAddForm && (
                    <Card className="mb-6 border-amrita/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Plus className="w-4 h-4 text-amrita" /> New Room
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Room Name</label>
                                    <input
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amrita/50"
                                        placeholder="e.g. A-101"
                                        value={addForm.name}
                                        onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="w-36">
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amrita/50"
                                        placeholder="e.g. 70"
                                        value={addForm.capacity}
                                        onChange={e => setAddForm(f => ({ ...f, capacity: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="bg-amrita text-white hover:bg-amrita/90" disabled={addLoading}>
                                        {addLoading ? 'Adding...' : 'Add'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Search + Table */}
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-amrita" />
                                All Rooms
                            </CardTitle>
                            <CardDescription>{rooms.length} rooms total</CardDescription>
                        </div>
                        <input
                            className="border rounded-md px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-amrita/50"
                            placeholder="Search rooms..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-center text-muted-foreground py-10">Loading rooms...</p>
                        ) : filtered.length === 0 ? (
                            <p className="text-center text-muted-foreground py-10">No rooms found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-3 pr-4 font-medium">#</th>
                                            <th className="pb-3 pr-4 font-medium">Room Name</th>
                                            <th className="pb-3 pr-4 font-medium">Capacity</th>
                                            <th className="pb-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((room, idx) => (
                                            <tr key={room._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 pr-4 text-muted-foreground">{idx + 1}</td>

                                                {/* Name cell — inline edit */}
                                                <td className="py-3 pr-4 font-medium">
                                                    {editingId === room._id ? (
                                                        <input
                                                            className="border rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-amrita/50"
                                                            value={editForm.name}
                                                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                        />
                                                    ) : (
                                                        room.name
                                                    )}
                                                </td>

                                                {/* Capacity cell — inline edit */}
                                                <td className="py-3 pr-4">
                                                    {editingId === room._id ? (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="border rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-amrita/50"
                                                            value={editForm.capacity}
                                                            onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))}
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">{room.capacity} students</span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 text-right">
                                                    {editingId === room._id ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEdit(room._id)}
                                                                disabled={editLoading}
                                                                className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                                                title="Save"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : deletingId === room._id ? (
                                                        <div className="flex justify-end items-center gap-2 text-red-600 text-xs">
                                                            <span>Delete?</span>
                                                            <button
                                                                onClick={() => handleDelete(room._id)}
                                                                className="font-semibold hover:underline"
                                                            >Yes</button>
                                                            <button
                                                                onClick={() => setDeletingId(null)}
                                                                className="text-gray-500 hover:text-gray-700"
                                                            >No</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => { startEdit(room); setShowAddForm(false); }}
                                                                className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingId(room._id)}
                                                                className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
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

export default RoomManagement;
