"use client";

import { useState, useEffect } from "react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // PWAとして既にインストール済みなら非表示
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // 1度閉じたら24時間非表示
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);
    setShow(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📱</span>
          <div className="flex-1">
            <p className="font-bold text-sm text-gray-800">アプリとして使えます</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isIOS
                ? "Safari下部の共有ボタン → 「ホーム画面に追加」"
                : "ブラウザメニュー → 「ホーム画面に追加」"}
            </p>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 text-lg">×</button>
        </div>
      </div>
    </div>
  );
}
