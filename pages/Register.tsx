import React, { useState } from 'react';
import { signUpWithEmail, signInWithGoogle } from '../lib/firebase';

interface RegisterProps {
    onSuccess: () => void;
    onGoToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess, onGoToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Email validation
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Password strength
    const getPasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[a-z]/.test(pass)) strength++;
        if (/[0-9]/.test(pass)) strength++;
        if (/[^A-Za-z0-9]/.test(pass)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(password);
    const strengthLabels = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جداً'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'];

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validations
        if (!name.trim()) {
            setError('يرجى إدخال اسمك');
            return;
        }
        if (!isValidEmail(email)) {
            setError('يرجى إدخال بريد إلكتروني صحيح');
            return;
        }
        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }
        if (!acceptTerms) {
            setError('يرجى الموافقة على الشروط والأحكام');
            return;
        }

        setLoading(true);

        try {
            await signUpWithEmail(email, password, name);
            onSuccess();
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('هذا البريد الإلكتروني مستخدم بالفعل');
            } else if (err.code === 'auth/weak-password') {
                setError('كلمة المرور ضعيفة جداً');
            } else if (err.code === 'auth/invalid-email') {
                setError('صيغة البريد الإلكتروني غير صحيحة');
            } else {
                setError('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setLoading(true);
        setError('');

        try {
            await signInWithGoogle();
            onSuccess();
        } catch (err: any) {
            console.error(err);
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('حدث خطأ أثناء التسجيل بـ Google');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col min-h-screen bg-background-dark overflow-hidden">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDxxq-yfmIMGbJC5yNyXNIWxk_ss1bEGilVzU_Ho3_sg_CpzQyl3zK8rOhJrBc9178k7AsKBngSsMyp9KQwx8EZluoMinH_YwX9f0zoa8DIodlfIWr92_uDUOJo_MR9CgK_XOT5zGqD0UAFEeoAblAlM9uYupgGRSD3qbob0Fp7PvgBZ36wWMXkDPiVNC9KjTXatL3_Y2FFdwkcx57hiIT8eMFg2wAl_076BGWuu-J4m1k7Bdp5S1QyI_8WUnf5oZwfGhSZEKxa2cY')"
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background-dark via-background-dark/90 to-background-dark" />

            {/* Animated hieroglyphics decoration */}
            <div className="absolute top-20 left-4 text-primary/20 text-6xl font-hieroglyphic animate-pulse">𓂀</div>
            <div className="absolute top-40 right-8 text-primary/15 text-5xl font-hieroglyphic animate-pulse delay-300">𓃭</div>
            <div className="absolute bottom-40 left-8 text-primary/10 text-7xl font-hieroglyphic animate-pulse delay-500">𓆣</div>

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1 px-6 pt-12 pb-8 overflow-y-auto no-scrollbar">
                {/* Logo & Title */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-md border border-primary/40 flex items-center justify-center shadow-[0_0_40px_rgba(244,175,37,0.3)] mb-5">
                        <span className="material-symbols-outlined text-primary text-[36px]">temple_hindu</span>
                    </div>
                    <h1 className="text-white text-2xl font-extrabold font-arabic mb-1">انضم للمستكشفين</h1>
                    <p className="text-sand-accent text-sm font-arabic">ابدأ رحلتك عبر الزمن في مصر</p>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleEmailRegister} className="space-y-4 mb-5">
                    {/* Name Input */}
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sand-accent group-focus-within:text-primary transition">person</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="الاسم الكامل"
                            className="w-full h-14 pr-12 pl-4 rounded-xl bg-surface-dark/50 border border-border-gold text-white font-arabic placeholder:text-gray-500 focus:border-primary focus:outline-none focus:shadow-[0_0_15px_rgba(244,175,37,0.15)] transition-all"
                        />
                    </div>

                    {/* Email Input */}
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sand-accent group-focus-within:text-primary transition">mail</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="البريد الإلكتروني"
                            className="w-full h-14 pr-12 pl-4 rounded-xl bg-surface-dark/50 border border-border-gold text-white font-arabic placeholder:text-gray-500 focus:border-primary focus:outline-none focus:shadow-[0_0_15px_rgba(244,175,37,0.15)] transition-all"
                            dir="ltr"
                        />
                        {email && !isValidEmail(email) && (
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-red-400">warning</span>
                        )}
                        {email && isValidEmail(email) && (
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-green-400">check_circle</span>
                        )}
                    </div>

                    {/* Password Input */}
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sand-accent group-focus-within:text-primary transition">lock</span>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="كلمة المرور"
                            className="w-full h-14 pr-12 pl-12 rounded-xl bg-surface-dark/50 border border-border-gold text-white font-arabic placeholder:text-gray-500 focus:border-primary focus:outline-none focus:shadow-[0_0_15px_rgba(244,175,37,0.15)] transition-all"
                            dir="ltr"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-sand-accent hover:text-primary transition"
                        >
                            <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                        <div className="space-y-2">
                            <div className="flex gap-1">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 h-1.5 rounded-full transition-all ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-700'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className={`text-xs font-arabic text-left ${passwordStrength < 2 ? 'text-red-400' : passwordStrength < 4 ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                قوة كلمة المرور: {strengthLabels[passwordStrength - 1] || 'ضعيفة جداً'}
                            </p>
                        </div>
                    )}

                    {/* Confirm Password Input */}
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sand-accent group-focus-within:text-primary transition">lock_reset</span>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="تأكيد كلمة المرور"
                            className="w-full h-14 pr-12 pl-12 rounded-xl bg-surface-dark/50 border border-border-gold text-white font-arabic placeholder:text-gray-500 focus:border-primary focus:outline-none focus:shadow-[0_0_15px_rgba(244,175,37,0.15)] transition-all"
                            dir="ltr"
                        />
                        {confirmPassword && (
                            <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 ${password === confirmPassword ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {password === confirmPassword ? 'check_circle' : 'cancel'}
                            </span>
                        )}
                    </div>

                    {/* Terms Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer p-2">
                        <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded border-border-gold bg-surface-dark checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-sand-accent text-sm font-arabic leading-relaxed">
                            بالتسجيل، أوافق على{' '}
                            <button type="button" className="text-primary hover:underline">الشروط والأحكام</button>
                            {' '}و{' '}
                            <button type="button" className="text-primary hover:underline">سياسة الخصوصية</button>
                        </span>
                    </label>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 animate-shake">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <span className="text-red-400 text-sm font-arabic">{error}</span>
                        </div>
                    )}

                    {/* Register Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary active:scale-[0.98] rounded-xl flex items-center justify-center transition-all shadow-[0_4px_25px_rgba(244,175,37,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined text-background-dark animate-spin">progress_activity</span>
                        ) : (
                            <>
                                <span className="text-background-dark text-lg font-bold font-arabic">إنشاء الحساب</span>
                                <span className="material-symbols-outlined text-background-dark mr-2">rocket_launch</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-5">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-gold to-transparent" />
                    <span className="text-sand-accent text-sm font-arabic">أو سجل بواسطة</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-gold to-transparent" />
                </div>

                {/* Social Login Buttons */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={handleGoogleRegister}
                        disabled={loading}
                        className="flex-1 h-14 bg-white hover:bg-gray-100 active:scale-[0.98] rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-gray-700 font-bold">Google</span>
                    </button>
                </div>

                {/* Login Link */}
                <div className="mt-auto text-center">
                    <p className="text-sand-accent font-arabic">
                        لديك حساب بالفعل؟{' '}
                        <button
                            onClick={onGoToLogin}
                            className="text-primary font-bold hover:underline"
                        >
                            تسجيل الدخول
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
