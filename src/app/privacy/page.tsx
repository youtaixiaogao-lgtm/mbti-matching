export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto prose prose-sm">
        <h1 className="text-2xl font-bold mb-6">プライバシーポリシー</h1>
        <p className="text-sm text-gray-500 mb-8">最終更新日: 2026年4月9日</p>

        <h2 className="text-lg font-bold mt-6 mb-3">1. 収集する情報</h2>
        <p>当サービスでは、以下の情報を収集します：</p>
        <ul>
          <li>メールアドレス（アカウント認証のため）</li>
          <li>プロフィール情報（ニックネーム、年齢、性別、MBTIタイプ、自己紹介等）</li>
          <li>プロフィール写真</li>
          <li>サービスの利用履歴（いいね、マッチ、メッセージ等）</li>
        </ul>

        <h2 className="text-lg font-bold mt-6 mb-3">2. 情報の利用目的</h2>
        <p>収集した情報は以下の目的で利用します：</p>
        <ul>
          <li>マッチングサービスの提供</li>
          <li>アカウントの認証・管理</li>
          <li>サービスの改善・開発</li>
          <li>不正利用の防止</li>
        </ul>

        <h2 className="text-lg font-bold mt-6 mb-3">3. 情報の第三者提供</h2>
        <p>お客様の個人情報を、以下の場合を除き第三者に提供することはありません：</p>
        <ul>
          <li>お客様の同意がある場合</li>
          <li>法令に基づく場合</li>
          <li>人の生命、身体または財産の保護のために必要な場合</li>
        </ul>

        <h2 className="text-lg font-bold mt-6 mb-3">4. 情報の管理</h2>
        <p>お客様の個人情報は、Supabase（クラウドデータベース）にて安全に管理されています。適切なセキュリティ対策を講じ、不正アクセス・漏洩の防止に努めます。</p>

        <h2 className="text-lg font-bold mt-6 mb-3">5. アカウントの削除</h2>
        <p>アカウントの削除を希望される場合は、アプリ内の設定またはお問い合わせよりご連絡ください。削除後、関連する全てのデータが消去されます。</p>

        <h2 className="text-lg font-bold mt-6 mb-3">6. お問い合わせ</h2>
        <p>プライバシーに関するお問い合わせは、アプリ内のお問い合わせ機能よりご連絡ください。</p>
      </div>
    </div>
  );
}
