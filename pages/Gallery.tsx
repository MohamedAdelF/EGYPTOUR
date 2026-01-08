import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface GalleryProps {
    authUser: User | null;
    onBack: () => void;
}

const Gallery: React.FC<GalleryProps> = ({ authUser, onBack }) => {
    const [gallery, setGallery] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Gallery
    useEffect(() => {
        if (authUser?.uid) {
            const q = query(
                collection(db, `users/${authUser.uid}/gallery`),
                orderBy('timestamp', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                setGallery(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [authUser?.uid]);

    const handleDownloadImage = (url: string) => {
        // Due to CORS restrictions on Firebase Storage, we open the image in a new tab
        // ensuring the user can see it and save it using their device's native controls.
        // Long press -> Save Image on mobile.
        window.open(url, '_blank');
    };

    return (
        <div className="flex flex-col h-screen bg-[#0f0d0a] text-white overflow-hidden">
            {/* Lightbox Overlay */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 size-12 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-all z-50 hover:bg-white/20"
                    >
                        <span className="material-symbols-outlined text-white text-2xl">close</span>
                    </button>

                    <img
                        src={selectedImage}
                        alt="Full view"
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                    />

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => handleDownloadImage(selectedImage)}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-black rounded-full font-bold font-arabic active:scale-95 transition-all shadow-lg shadow-primary/20 hover:bg-amber-400"
                        >
                            <span className="material-symbols-outlined">download</span>
                            <span>حفظ في الجهاز</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-6 pt-12 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent z-10">
                <button
                    onClick={onBack}
                    className="size-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-all hover:bg-white/20"
                >
                    <span className="material-symbols-outlined text-white rtl:rotate-180">arrow_back</span>
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold font-arabic">معرض صوري</h1>
                    <span className="text-xs text-gray-400 font-arabic">{gallery.length} صورة ملتقطة</span>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                        <span className="text-gray-500 font-arabic">جاري تحميل الصور...</span>
                    </div>
                ) : gallery.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                        <span className="material-symbols-outlined text-6xl mb-4">photo_library</span>
                        <p className="font-arabic text-lg">لم تلتقط أي صور بعد</p>
                        <p className="font-arabic text-sm text-gray-400">استخدم المرشد المباشر لالتقاط صور تذكارية!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {gallery.map((photo, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedImage(photo.url)}
                                className="relative aspect-square rounded-2xl overflow-hidden group border border-white/10 break-inside-avoid"
                            >
                                <img
                                    src={photo.url}
                                    alt={`Capture ${i}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white">fullscreen</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gallery;
