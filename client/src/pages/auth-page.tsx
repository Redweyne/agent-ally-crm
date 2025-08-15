import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Home, Shield, Users, TrendingUp } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    if (user) {
      navigate("/crm");
    }
  }, [user, navigate]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    loginMutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    });
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    registerMutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" data-testid="auth-page">
      {/* Left Side - Forms */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
              data-testid="button-back-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Retour au site
            </Button>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="auth-title">
              Accès Agent CRM
            </h2>
            <p className="mt-2 text-gray-600" data-testid="auth-description">
              Gérez vos prospects et performances immobilières
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Connexion</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="login-title">Se connecter</CardTitle>
                  <CardDescription data-testid="login-description">
                    Entrez vos identifiants pour accéder au CRM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Identifiant</Label>
                      <Input
                        id="login-username"
                        name="username"
                        type="text"
                        required
                        placeholder="Votre identifiant"
                        data-testid="input-login-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Mot de passe</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        required
                        placeholder="Votre mot de passe"
                        data-testid="input-login-password"
                      />
                    </div>
                    
                    {loginMutation.error && (
                      <Alert variant="destructive" data-testid="alert-login-error">
                        <AlertDescription>
                          {loginMutation.error.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-submit-login"
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Se connecter
                    </Button>
                  </form>
                  
                  {/* Demo Credentials */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg" data-testid="demo-credentials">
                    <p className="text-sm text-blue-800 font-medium mb-2">Identifiants de démonstration :</p>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p>👤 <strong>alice.martin</strong> / 🔑 <strong>demo123</strong></p>
                      <p>👤 <strong>ben.leroy</strong> / 🔑 <strong>demo123</strong></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="register-title">Créer un compte</CardTitle>
                  <CardDescription data-testid="register-description">
                    Inscrivez-vous pour accéder au CRM Redweyne
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4" data-testid="form-register">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nom complet</Label>
                      <Input
                        id="register-name"
                        name="name"
                        type="text"
                        required
                        placeholder="Votre nom complet"
                        data-testid="input-register-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        required
                        placeholder="votre@email.fr"
                        data-testid="input-register-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Identifiant</Label>
                      <Input
                        id="register-username"
                        name="username"
                        type="text"
                        required
                        placeholder="Votre identifiant"
                        data-testid="input-register-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Mot de passe</Label>
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        required
                        placeholder="Votre mot de passe"
                        data-testid="input-register-password"
                      />
                    </div>

                    {registerMutation.error && (
                      <Alert variant="destructive" data-testid="alert-register-error">
                        <AlertDescription>
                          {registerMutation.error.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-submit-register"
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Créer mon compte
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:block lg:flex-1 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="flex flex-col justify-center px-8 lg:px-12">
          <div className="max-w-md">
            <h3 className="text-3xl font-bold mb-6" data-testid="hero-auth-title">
              CRM Immobilier Professionnel
            </h3>
            <p className="text-lg text-blue-100 mb-8" data-testid="hero-auth-description">
              Optimisez votre activité immobilière avec des outils pensés pour les professionnels français.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span>Gestion complète des prospects</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span>KPI et analytics en temps réel</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span>Sécurisé et conforme RGPD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
