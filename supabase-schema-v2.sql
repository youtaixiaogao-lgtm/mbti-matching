-- ========================================
-- V2: マッチングアプリ機能拡張
-- ========================================

-- プロフィール拡張カラム追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for TEXT DEFAULT '' CHECK (looking_for IN ('', 'serious', 'casual', 'friend'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- プロフィール写真テーブル
CREATE TABLE IF NOT EXISTS profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- メッセージテーブル
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 足あとテーブル
CREATE TABLE IF NOT EXISTS footprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visited_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- スキップ（左スワイプ）テーブル
CREATE TABLE IF NOT EXISTS skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- ブロックテーブル
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 通報テーブル
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'harassment', 'other')),
  detail TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 通知テーブル
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'match', 'message', 'footprint')),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_footprints_visited ON footprints(visited_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_footprints_visitor ON footprints(visitor_id);
CREATE INDEX IF NOT EXISTS idx_skips_from ON skips(from_user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_user ON profile_photos(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC);

-- RLSポリシー
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE footprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE skips ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- profile_photos: 誰でも閲覧、自分のみ操作
CREATE POLICY "photos_select" ON profile_photos FOR SELECT USING (true);
CREATE POLICY "photos_insert" ON profile_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "photos_update" ON profile_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "photos_delete" ON profile_photos FOR DELETE USING (auth.uid() = user_id);

-- messages: マッチの当事者のみ閲覧・送信
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = messages.match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

-- footprints: 訪問された側が閲覧可能、訪問者が作成
CREATE POLICY "footprints_select" ON footprints FOR SELECT USING (
  auth.uid() = visited_id OR auth.uid() = visitor_id
);
CREATE POLICY "footprints_insert" ON footprints FOR INSERT WITH CHECK (auth.uid() = visitor_id);

-- skips: 自分のスキップのみ
CREATE POLICY "skips_select" ON skips FOR SELECT USING (auth.uid() = from_user_id);
CREATE POLICY "skips_insert" ON skips FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- blocks: 自分のブロックのみ
CREATE POLICY "blocks_select" ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "blocks_insert" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

-- reports: 自分の通報のみ
CREATE POLICY "reports_select" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- notifications: 自分の通知のみ
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);

-- 通知自動作成: いいね時
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, from_user_id, content)
  VALUES (NEW.to_user_id, 'like', NEW.from_user_id, 'いいねが届きました');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_notify
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- 通知自動作成: マッチ時
CREATE OR REPLACE FUNCTION notify_on_match()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, from_user_id, content)
  VALUES
    (NEW.user1_id, 'match', NEW.user2_id, 'マッチが成立しました！'),
    (NEW.user2_id, 'match', NEW.user1_id, 'マッチが成立しました！');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_match_notify
  AFTER INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_on_match();

-- 通知自動作成: メッセージ時
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER AS $$
DECLARE
  partner_id UUID;
BEGIN
  SELECT CASE
    WHEN m.user1_id = NEW.sender_id THEN m.user2_id
    ELSE m.user1_id
  END INTO partner_id
  FROM matches m WHERE m.id = NEW.match_id;

  INSERT INTO notifications (user_id, type, from_user_id, content)
  VALUES (partner_id, 'message', NEW.sender_id, 'メッセージが届きました');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_notify
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- Supabase Storage: プロフィール写真用バケット作成
-- （SQL Editorでは作成できないため、Supabaseダッシュボードの Storage から "profile-photos" バケットを手動作成してください）
