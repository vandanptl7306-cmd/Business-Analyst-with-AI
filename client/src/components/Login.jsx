// client/src/components/Login.jsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

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
      if (response.success) navigate('/dashboard');
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
      if (response.success) navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Google Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">

      {/* Card — matches dashboard card-module style */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-10 space-y-7">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-1">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-500 font-medium">Sign in to your IntellectBill AI account</p>
        </div>

        {/* Demo credentials hint */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-indigo-600 font-medium leading-relaxed">
            Demo: <span className="font-mono font-bold">admin@example.com</span> / <span className="font-mono font-bold">password123</span>
          </p>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-medium flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0" />
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-300 focus:bg-white ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-slate-200 focus:border-indigo-300'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-300 focus:bg-white ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-slate-200 focus:border-indigo-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-bold transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /><span>Signing in...</span></>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or continue with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setApiError('Google sign-in was cancelled or encountered an error.')}
            theme="outline"
            size="large"
            width="100%"
            shape="rectangular"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6">
        <p className="text-sm text-slate-500">
          Don't have an account?{' '}
          <button
            onClick={onToggleMode}
            className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors focus:outline-none"
          >
            Create one now
          </button>
        </p>
      </div>
    </div>
  );
}
