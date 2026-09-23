import React from 'react';
import Header from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, FileText, CalendarDays, BookMarked } from 'lucide-react';

const FacultyDashboard = () => {
  const quickLinks = [
    { icon: Users, title: 'My Classes', description: 'View assigned classes' },
    { icon: CalendarDays, title: 'Schedule', description: 'View to schedule class' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground-90 mb-2">Faculty Dashboard</h2>
          <p className="text-muted-foreground">Welcome to your faculty portal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickLinks.map((link, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-amrita">
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
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-amrita/5 to-amrita/10">
          
            <CardHeader>
              <CardTitle className="text-amrita">Today's Classes</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-background rounded-lg border">
                  <div>
                    <h4 className="font-semibold text-foreground-90">Data Structures</h4>
                    <p className="text-muted-foreground text-sm">22CSE - Batch A</p>
                  </div>
                  <span className="text-amrita font-medium">8:50 AM</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-background rounded-lg border">
                  <div>
                    <h4 className="font-semibold text-foreground-90">Software Eng.</h4>
                    <p className="text-muted-foreground text-sm">23CSE - Batch B</p>
                  </div>
                  <span className="text-amrita font-medium">11:35 AM</span>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amrita/5 to-amrita/10">

            <CardHeader>
              <CardTitle className="text-amrita">Announcements</CardTitle>
            </CardHeader>

            <CardContent>

              <div className="space-y-3">
                <div className="p-3 bg-background rounded-lg border">
                  <h4 className="font-semibold text-foreground-90">Class Alloted</h4>
                  <p className="text-muted-foreground text-sm">Class A-205 is alloted as per your request. Please check it.</p>
                </div>
               
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;
