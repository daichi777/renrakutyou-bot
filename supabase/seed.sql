-- childrenテーブル作成
CREATE TABLE IF NOT EXISTS children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_reading TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_order TEXT NOT NULL,
  personality TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS(Row Level Security)を無効化（MVP用、認証なし）
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- 全員読み取り可能なポリシー
CREATE POLICY "Allow public read" ON children
  FOR SELECT USING (true);

-- 初期データ投入
INSERT INTO children (name, name_reading, birth_date, birth_order, personality, notes)
VALUES
  ('舜', 'しゅん', '2022-02-24', '長男', '活発で好奇心旺盛。外遊びが大好き。', '4歳児クラス'),
  ('斗真', 'とうま', '2023-07-28', '次男', 'マイペースで甘えん坊。お兄ちゃんの真似をしたがる。', '2歳児クラス');
