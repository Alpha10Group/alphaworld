import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore, Entity } from "@/lib/store";
import { useLocation } from "wouter";
import { Briefcase, LineChart, Globe, Lock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EntitySelection() {
  const { setEntity, setCurrentUser } = useStore();
  const [, setLocation] = useLocation();
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [username, setUsername] = useState("alice");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const entities: { id: Entity; name: string; icon: any; color: string; description: string }[] = [
    {
      id: 'Alpha10 Fund Management',
      name: 'Alpha10 Fund Management',
      icon: LineChart,
      color: 'text-blue-600',
      description: 'Investment portfolios, asset allocation, and fund performance monitoring.'
    },
    {
      id: 'Alpha10 Advisory',
      name: 'Alpha10 Advisory',
      icon: Briefcase,
      color: 'text-emerald-600',
      description: 'Strategic consulting, risk assessment, and business advisory services.'
    },
    {
      id: 'Alpha10 Global Market Limited',
      name: 'Alpha10 Global Market Limited',
      icon: Globe,
      color: 'text-indigo-600',
      description: 'International trade, currency exchange, and global market operations.'
    }
  ];

  const handleEntitySelect = (entity: Entity) => {
    setSelectedEntity(entity);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.auth.login(username, password, selectedEntity);
      setEntity(selectedEntity);
      setCurrentUser(response.user);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (selectedEntity) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-slate-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Login to {selectedEntity}</CardTitle>
            <CardDescription>Enter your credentials to access the workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" data-testid="error-login">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  data-testid="input-username"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  data-testid="input-password"
                  required
                  disabled={loading}
                />
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md">
                <strong>Test Credentials:</strong> alice, bob, charlie, dana, eve, frank, grace, or harry<br />
                <strong>Password:</strong> password123
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                data-testid="button-signin"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setSelectedEntity(null)}
                data-testid="button-back"
                disabled={loading}
              >
                Back to Entity Selection
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Welcome to NexusFlow</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Select your organization entity to proceed to the secure workspace.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {entities.map((entity) => (
            <Card 
              key={entity.id}
              className="group hover:shadow-2xl transition-all duration-300 border-slate-200 cursor-pointer overflow-hidden relative"
              onClick={() => handleEntitySelect(entity.id)}
              data-testid={`card-entity-${entity.name.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent to-transparent group-hover:from-${entity.color.replace('text-', '')} group-hover:to-${entity.color.replace('text-', '')}/50 transition-all`} />
              
              <CardHeader className="pt-8">
                <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <entity.icon className={`w-8 h-8 ${entity.color}`} />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {entity.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {entity.description}
                </CardDescription>
                <div className="mt-8 flex items-center text-sm font-medium text-slate-400 group-hover:text-slate-900 transition-colors">
                  Access Workspace <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
