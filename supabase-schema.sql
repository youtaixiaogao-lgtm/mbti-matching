-- ユーザープロフィール
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  mbti_type TEXT NOT NULL CHECK (mbti_type IN (
    'INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
    'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'
  )),
  bio TEXT DEFAULT '',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- いいね
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- マッチ
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- インデックス
CREATE INDEX idx_likes_from ON likes(from_user_id);
CREATE INDEX idx_likes_to ON likes(to_user_id);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_profiles_mbti ON profiles(mbti_type);

-- RLSポリシー
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- profiles: 誰でも閲覧可能、自分のみ編集可能
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- likes: 自分が送ったいいねのみ操作可能、受け取ったいいねは閲覧可能
CREATE POLICY "likes_select" ON likes FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- matches: 自分が含まれるマッチのみ閲覧可能
CREATE POLICY "matches_select" ON matches FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- マッチ自動作成用の関数
CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- 相互いいねがあるか確認
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE from_user_id = NEW.to_user_id
    AND to_user_id = NEW.from_user_id
  ) THEN
    -- マッチを作成（小さいIDをuser1に）
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.from_user_id, NEW.to_user_id),
      GREATEST(NEW.from_user_id, NEW.to_user_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_check_match
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION check_mutual_like();
