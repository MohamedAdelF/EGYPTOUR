import React, { useState } from 'react';
import { signInWithEmail, signInWithGoogle, resetPassword } from '../lib/firebase';

interface LoginProps {
    onSuccess: () => void;
    onGoToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onGoToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showReset, setShowReset] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await signInWithEmail(email, password);
            onSuccess();
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError('لم يتم العثور على حساب بهذا البريد الإلكتروني');
            } else if (err.code === 'auth/wrong-password') {
                setError('كلمة المرور غير صحيحة');
            } else if (err.code === 'auth/invalid-email') {
                setError('صيغة البريد الإلكتروني غير صحيحة');
            } else {
                setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            await signInWithGoogle();
            onSuccess();
        } catch (err: any) {
            console.error(err);
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('حدث خطأ أثناء تسجيل الدخول بـ Google');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError('يرجى إدخال البريد الإلكتروني أولاً');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await resetPassword(email);
            setResetSent(true);
        } catch (err: any) {
            console.error(err);
            setError('حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col min-h-screen bg-background-dark overflow-hidden">
            {/* Background with Egypt theme */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC-k6Gv1TNl7JRAZfnzDUBwkNrMgjm4SjJbTRUKUjIYyc8cRjJQTygdgHJ_La9-4W57m2b3fh9ujqMeJvKuWeU-qo0Aem-Nl0P6ZfbaJs76C90bVFGoLLAXSWgEEASKMlhMdLBEEGejkDsbiCLx3Ti74uRTwoZ0ZgTdMKGfDbpZ2wYh1lOIKRbQGyTYb4lqFBNYpEzzNfyjvR2OZFJTweSX64RLpXfuz_FkypSZIUTwag6i_Nlji5g-jl3utCU_BFdPEN7sS0PT2wM')"
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background-dark via-background-dark/80 to-background-dark" />

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1 px-6 pt-16 pb-8">
                {/* Logo & Title */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 rounded-2xl bg-surface-dark/80 backdrop-blur-md border border-primary/30 flex items-center justify-center shadow-2xl mb-6">
                        <span className="material-symbols-outlined text-primary text-[40px]">explore</span>
                    </div>
                    <h1 className="text-white text-3xl font-extrabold font-arabic mb-2">مرحباً بعودتك</h1>
                    <p className="text-sand-accent text-base font-arabic">تابع مغامرتك في مصر</p>
                </div>

                {/* Password Reset Modal */}
                {showReset && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
                        <div className="bg-surface-dark rounded-3xl p-6 w-full max-w-sm border border-border-gold">
                            <h3 className="text-white text-xl font-bold font-arabic mb-4 text-center">
                                إعادة تعيين كلمة المرور
                            </h3>

                            {resetSent ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-green-500 text-3xl">check_circle</span>
                                    </div>
                                    <p className="text-sand-accent font-arabic mb-6">
                                        تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
                                    </p>
                                    <button
                                        onClick={() => { setShowReset(false); setResetSent(false); }}
                                        className="w-full py-3 bg-primary text-background-dark font-bold rounded-xl font-arabic"
                                    >
                                        حسناً
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sand-accent text-sm font-arabic mb-4 text-center">
                                        أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
                                    </p>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="البريد الإلكتروني"
                                        className="w-full h-14 px-4 rounded-xl bg-background-dark border border-border-gold text-white font-arabic placeholder:text-gray-500 focus:border-primary focus:outline-none transition mb-4"
                                        dir="ltr"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowReset(false)}
                                            className="flex-1 py-3 bg-surface-dark border border-border-gold text-white font-bold rounded-xl font-arabic"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            onClick={handlePasswordReset}
                                            disabled={loading}
                                            className="flex-1 py-3 bg-primary text-background-dark font-bold rounded-xl font-arabic disabled:opacity-50"
                                        >
                                            {loading ? 'جاري الإرسال...' : 'إرسال'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
                    {/* Email Input */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sand-accent">mail</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="البريد الإلكتروني"
                            className="w-full h-14 pr-12 pl-4 rounded-xl bg-surface-dark/50 border border-border-gold text-white font-arabic placeholder:text-gray-500 focus:border-primary focus:outline-none transition"
                            dir="ltr"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sand-accent">lock</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="كلمة المرور"
                            className="w-full h-14 pr-12 pl-4 rounded-xl bg-surface-dark/50 border border-border-gold text-white font-arabic placeholder:text-gray-500 focus:border-primary focus:outline-none transition"
                            dir="ltr"
                        />
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-5 h-5 rounded border-border-gold bg-surface-dark checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0"
                            />
                            <span className="text-sand-accent text-sm font-arabic">تذكرني</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowReset(true)}
                            className="text-primary text-sm font-arabic hover:underline"
                        >
                            نسيت كلمة المرور؟
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <span className="text-red-400 text-sm font-arabic">{error}</span>
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-primary hover:bg-primary-hover active:scale-95 rounded-xl flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(244,175,37,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined text-background-dark animate-spin">progress_activity</span>
                        ) : (
                            <>
                                <span className="text-background-dark text-lg font-bold font-arabic">تسجيل الدخول</span>
                                <span className="material-symbols-outlined text-background-dark mr-2 rtl:rotate-180">arrow_right_alt</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-border-gold" />
                    <span className="text-sand-accent text-sm font-arabic">أو</span>
                    <div className="flex-1 h-px bg-border-gold" />
                </div>

                {/* Google Login */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-14 bg-white hover:bg-gray-100 active:scale-95 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-gray-700 text-lg font-bold">Continue with Google</span>
                </button>

                {/* Register Link */}
                <div className="mt-auto pt-8 text-center">
                    <p className="text-sand-accent font-arabic">
                        ليس لديك حساب؟{' '}
                        <button
                            onClick={onGoToRegister}
                            className="text-primary font-bold hover:underline"
                        >
                            إنشاء حساب جديد
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
