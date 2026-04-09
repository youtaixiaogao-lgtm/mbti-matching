export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto prose prose-sm">
        <h1 className="text-2xl font-bold mb-6">利用規約</h1>
        <p className="text-sm text-gray-500 mb-8">最終更新日: 2026年4月9日</p>

        <h2 className="text-lg font-bold mt-6 mb-3">第1条（適用）</h2>
        <p>本規約は、MBTI Match（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。</p>

        <h2 className="text-lg font-bold mt-6 mb-3">第2条（利用資格）</h2>
        <ul>
          <li>18歳以上であること</li>
          <li>有効なメールアドレスを保有していること</li>
          <li>本規約に同意すること</li>
        </ul>

        <h2 className="text-lg font-bold mt-6 mb-3">第3条（アカウント）</h2>
        <p>ユーザーは正確な情報を登録する義務があります。虚偽の情報での登録が判明した場合、アカウントを停止する場合があります。</p>

        <h2 className="text-lg font-bold mt-6 mb-3">第4条（禁止行為）</h2>
        <p>以下の行為を禁止します：</p>
        <ul>
          <li>虚偽のプロフィール情報の登録</li>
          <li>他のユーザーへの嫌がらせ・誹謗中傷</li>
          <li>営利目的の宣伝・勧誘行為</li>
          <li>わいせつな画像・コンテンツの投稿</li>
          <li>他のユーザーの個人情報の収集</li>
          <li>サービスの運営を妨害する行為</li>
          <li>法令に違反する行為</li>
        </ul>

        <h2 className="text-lg font-bold mt-6 mb-3">第5条（サービスの変更・停止）</h2>
        <p>運営者は、事前の通知なくサービスの内容を変更、または停止することがあります。これによりユーザーに損害が生じても、運営者は責任を負いません。</p>

        <h2 className="text-lg font-bold mt-6 mb-3">第6条（免責事項）</h2>
        <ul>
          <li>本サービスを通じて出会ったユーザー間のトラブルについて、運営者は一切の責任を負いません</li>
          <li>マッチングの成立や交際の成功を保証するものではありません</li>
        </ul>

        <h2 className="text-lg font-bold mt-6 mb-3">第7条（準拠法）</h2>
        <p>本規約の解釈は日本法に準拠するものとします。</p>
      </div>
    </div>
  );
}
