import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';

const HallList = () => {
    const navigate = useNavigate();

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
                    <h1 className="text-3xl font-bold text-foreground-90">Hall & Room List</h1>
                    <p className="text-muted-foreground">Manage and view all campus resources</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-amrita" />
                            Campus Resources
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        <p>Hall and Room list feature is coming soon.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default HallList;
