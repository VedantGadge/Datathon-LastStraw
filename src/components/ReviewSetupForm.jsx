"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export function ReviewSetupForm({ onStart }) {
    const [employeeId, setEmployeeId] = useState("");
    const [email, setEmail] = useState("");
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate a small delay or validation if needed
        // In a real app we might validate the user first
        await onStart({ employee_id: employeeId, email }, month);
        setIsLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto"
        >
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent">
                        Start Monthly Review
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Enter your details to begin your voice-guided performance review.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="employeeId" className="text-gray-200">Employee ID</Label>
                            <div className="relative">
                                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="employeeId"
                                    placeholder="EMP-12345"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-200">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="month" className="text-gray-200">Review Month</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="month"
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium py-6"
                            disabled={isLoading}
                        >
                            {isLoading ? "Starting Session..." : "Start Voice Review"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
}
