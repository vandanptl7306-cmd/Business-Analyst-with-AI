// client/src/components/Login.jsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

// Validation Schema using Zod
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export default function Login({ onToggleMode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    try {
      const response = await login(data);
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setApiError('');
    try {
      const response = await googleLogin(credentialResponse.credential);
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Google Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Premium Card Container */}
      <div className="card-premium p-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-amber-500/20 border border-teal-500/30 mb-2">
            <Lock className="h-7 w-7 text-teal-400" />
          </div>
          <h2 className="text-4xl font-bold gradient-teal-gold">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-400 font-medium">Access your IntellectBill AI platform</p>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm font-medium flex items-start gap-3 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-teal-400/60" />
              </div>
              <input
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                className={`input-premium pl-12 ${
                  errors.email 
                    ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                    : 'focus:border-teal-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-teal-400/60" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={`input-premium pl-12 pr-12 ${
                  errors.password 
                    ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                    : 'focus:border-teal-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-teal-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary mt-8 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-premium" />

        {/* Google Sign In */}
        <div className="space-y-3">
          <p className="text-xs text-slate-400 text-center font-medium">Or continue with</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setApiError('Google sign-in was cancelled or encountered an error.')}
              theme="filled_dark"
              size="large"
              width="100%"
              shape="rectangular"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-sm text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={onToggleMode}
            className="font-semibold text-teal-400 hover:text-teal-300 transition-colors focus:outline-none"
          >
            Create one now
          </button>
        </p>
      </div>
    </div>
  );
}
