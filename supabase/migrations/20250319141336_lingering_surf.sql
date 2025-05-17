/*
  # Create subcategories table and relationships
  
  1. New Tables
    - `subcategories`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to categories)
      - `name` (text, not null)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on subcategories table
    - Add policy for authenticated users to read subcategories
    
  3. Relationships
    - Foreign key constraint to categories table
*/

CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Create policy for reading subcategories
CREATE POLICY "Anyone can view subcategories"
  ON subcategories
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert subcategories data
DO $$ 
DECLARE
  v_category_id uuid;
BEGIN
  -- KIDS COLLECTION (01)
  SELECT id INTO v_category_id FROM categories WHERE code = '01';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Children''s Design'),
    (v_category_id, 'Doll Clothes'),
    (v_category_id, 'Little Angels'),
    (v_category_id, 'School Time');

  -- CARTOONS (02)
  SELECT id INTO v_category_id FROM categories WHERE code = '02';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Aladdin'),
    (v_category_id, 'Aristocats'),
    (v_category_id, 'Bambi'),
    (v_category_id, 'Bob The Builder'),
    (v_category_id, 'Batman Superman'),
    (v_category_id, 'Bugs Life'),
    (v_category_id, 'Bunny'),
    (v_category_id, 'Caillou'),
    (v_category_id, 'Chipmunk'),
    (v_category_id, 'Circus'),
    (v_category_id, 'Crash bandicoot'),
    (v_category_id, 'Curious George'),
    (v_category_id, 'Dalmations'),
    (v_category_id, 'Digimon'),
    (v_category_id, 'Dinosaurs'),
    (v_category_id, 'Disney Mickey & Minnie Mouse'),
    (v_category_id, 'Dolphins'),
    (v_category_id, 'Donald Duck'),
    (v_category_id, 'Dragon'),
    (v_category_id, 'Dumbo'),
    (v_category_id, 'Ecard Land Before Time'),
    (v_category_id, 'Elephants'),
    (v_category_id, 'Finding Nemo'),
    (v_category_id, 'Garfield'),
    (v_category_id, 'Jungle book'),
    (v_category_id, 'Lady & the Tramp'),
    (v_category_id, 'Lion King'),
    (v_category_id, 'Looney Tunes'),
    (v_category_id, 'M&M''s'),
    (v_category_id, 'Moskowitz'),
    (v_category_id, 'Other Catoon Characters'),
    (v_category_id, 'Paddington Bear'),
    (v_category_id, 'Peanuts'),
    (v_category_id, 'Penguins'),
    (v_category_id, 'Pokemon'),
    (v_category_id, 'Pooh'),
    (v_category_id, 'Popeye'),
    (v_category_id, 'Powerpuff Girls'),
    (v_category_id, 'Scooby Doo'),
    (v_category_id, 'Sesame Street'),
    (v_category_id, 'Simpsons'),
    (v_category_id, 'Smurfs'),
    (v_category_id, 'Snoopy'),
    (v_category_id, 'Spiderman'),
    (v_category_id, 'Stuart Little'),
    (v_category_id, 'Super Mario'),
    (v_category_id, 'Teddy Bear'),
    (v_category_id, 'Telli Tubbies'),
    (v_category_id, 'Tom And Jerry');

  -- ANIMALS (03)
  SELECT id INTO v_category_id FROM categories WHERE code = '03';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Bear'),
    (v_category_id, 'Buffalo & Ox'),
    (v_category_id, 'Camel'),
    (v_category_id, 'Cat'),
    (v_category_id, 'Cheetah'),
    (v_category_id, 'Crocodile'),
    (v_category_id, 'Deer'),
    (v_category_id, 'Dinosaur'),
    (v_category_id, 'Dog'),
    (v_category_id, 'Elephant'),
    (v_category_id, 'Fox'),
    (v_category_id, 'Frog'),
    (v_category_id, 'Giraffe'),
    (v_category_id, 'Goat & Sheep'),
    (v_category_id, 'Horse'),
    (v_category_id, 'Kangaroo'),
    (v_category_id, 'Lion'),
    (v_category_id, 'Mice'),
    (v_category_id, 'Monkey'),
    (v_category_id, 'Others'),
    (v_category_id, 'Panda'),
    (v_category_id, 'Rabbit & Squirrel'),
    (v_category_id, 'Reptile'),
    (v_category_id, 'Rhinocero'),
    (v_category_id, 'Snake'),
    (v_category_id, 'Tiger'),
    (v_category_id, 'Turtle'),
    (v_category_id, 'Zebra');

  -- BIRDS (04)
  SELECT id INTO v_category_id FROM categories WHERE code = '04';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Bird Houses'),
    (v_category_id, 'Birds Face'),
    (v_category_id, 'Birds Feather'),
    (v_category_id, 'Crane'),
    (v_category_id, 'Duck & Swan'),
    (v_category_id, 'Eagle'),
    (v_category_id, 'Hen & Rooster'),
    (v_category_id, 'Kingfisher'),
    (v_category_id, 'Ostrich'),
    (v_category_id, 'Other Birds'),
    (v_category_id, 'Owl'),
    (v_category_id, 'Parrot'),
    (v_category_id, 'Peacocks'),
    (v_category_id, 'Pigeon'),
    (v_category_id, 'Skylarc'),
    (v_category_id, 'Sparrow & Nightingale');

  -- BUTTERFLIES (05)
  SELECT id INTO v_category_id FROM categories WHERE code = '05';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Butterfly'),
    (v_category_id, 'Dragonflies'),
    (v_category_id, 'Insects');

  -- FLOWERS (06)
  SELECT id INTO v_category_id FROM categories WHERE code = '06';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Border & Corners Flowers'),
    (v_category_id, 'Flower Buke'),
    (v_category_id, 'Hibiscus & Plumeria'),
    (v_category_id, 'Leaves'),
    (v_category_id, 'Lilly'),
    (v_category_id, 'Other Flowers'),
    (v_category_id, 'Rose');

  -- DRESS EMBROIDERY (07)
  SELECT id INTO v_category_id FROM categories WHERE code = '07';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Borders'),
    (v_category_id, 'Cross Stitch'),
    (v_category_id, 'Decoration'),
    (v_category_id, 'Frames'),
    (v_category_id, 'Patterns & Buttis');

  -- APPLIQUE DESIGNS (08)
  SELECT id INTO v_category_id FROM categories WHERE code = '08';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Applique'),
    (v_category_id, 'Redwork'),
    (v_category_id, 'Quilting');

  -- FOOD & DRINK (09)
  SELECT id INTO v_category_id FROM categories WHERE code = '09';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Fruit & Vegtables'),
    (v_category_id, 'Tea Time'),
    (v_category_id, 'Food & Kitchen');

  -- LADIES COLLECTION (10)
  SELECT id INTO v_category_id FROM categories WHERE code = '10';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Hats'),
    (v_category_id, 'Makup & Dresses'),
    (v_category_id, 'Ornaments & Purses'),
    (v_category_id, 'Sandals & Shoes'),
    (v_category_id, 'Valentines'),
    (v_category_id, 'Victorian Collection');

  -- TRANSPORT & TRAVEL (11)
  SELECT id INTO v_category_id FROM categories WHERE code = '11';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'AirCraft'),
    (v_category_id, 'Camping & Hiking'),
    (v_category_id, 'Cards & Play'),
    (v_category_id, 'Cars'),
    (v_category_id, 'Heavy Vehicles'),
    (v_category_id, 'Landmarks'),
    (v_category_id, 'Motorcycles'),
    (v_category_id, 'Other Vehicles'),
    (v_category_id, 'Road Signs'),
    (v_category_id, 'Trains & Busses');

  -- SPORTS (12)
  SELECT id INTO v_category_id FROM categories WHERE code = '12';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'American Football'),
    (v_category_id, 'Baseball'),
    (v_category_id, 'Basketball'),
    (v_category_id, 'Bowling'),
    (v_category_id, 'Cricket'),
    (v_category_id, 'Extreme sports'),
    (v_category_id, 'Golf'),
    (v_category_id, 'Hockey'),
    (v_category_id, 'Horse racing'),
    (v_category_id, 'Olympics'),
    (v_category_id, 'Other Sports'),
    (v_category_id, 'Racing'),
    (v_category_id, 'Sillouettes Sport'),
    (v_category_id, 'Skateboard'),
    (v_category_id, 'Skisport'),
    (v_category_id, 'Soccer'),
    (v_category_id, 'Surfing'),
    (v_category_id, 'Tennis'),
    (v_category_id, 'Volleyball');

  -- CONSTRUCTIONS & HOUSE HOLD ITEMS (13)
  SELECT id INTO v_category_id FROM categories WHERE code = '13';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Architecture'),
    (v_category_id, 'Chairs'),
    (v_category_id, 'Clocks'),
    (v_category_id, 'Houses'),
    (v_category_id, 'Mailbox'),
    (v_category_id, 'Pottery'),
    (v_category_id, 'Tubs and Vanities'),
    (v_category_id, 'windmill');

  -- LOGOS & BADGES (14)
  SELECT id INTO v_category_id FROM categories WHERE code = '14';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Badges Elements'),
    (v_category_id, 'Embossed');

  -- DESIGNER FONTS (15)
  SELECT id INTO v_category_id FROM categories WHERE code = '15';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Alphabet'),
    (v_category_id, 'Applique'),
    (v_category_id, 'Biker Fonts'),
    (v_category_id, 'Bunch'),
    (v_category_id, 'Cake'),
    (v_category_id, 'Cheese Fonts'),
    (v_category_id, 'Circular'),
    (v_category_id, 'Classic'),
    (v_category_id, 'Craft'),
    (v_category_id, 'Crayon'),
    (v_category_id, 'Cross Stitch'),
    (v_category_id, 'Decorative'),
    (v_category_id, 'Disney baby alphabet'),
    (v_category_id, 'Dots'),
    (v_category_id, 'Filmy'),
    (v_category_id, 'Flair'),
    (v_category_id, 'Flame'),
    (v_category_id, 'Floral'),
    (v_category_id, 'Frame'),
    (v_category_id, 'Grease Top'),
    (v_category_id, 'Lattice'),
    (v_category_id, 'Long'),
    (v_category_id, 'Monograms'),
    (v_category_id, 'MultiColour'),
    (v_category_id, 'Pattern'),
    (v_category_id, 'Pompom'),
    (v_category_id, 'Roman'),
    (v_category_id, 'Ruder'),
    (v_category_id, 'Satin'),
    (v_category_id, 'Seads'),
    (v_category_id, 'SnowCaps'),
    (v_category_id, 'Stylish'),
    (v_category_id, 'Teddy Bear'),
    (v_category_id, 'Texture'),
    (v_category_id, 'Vine Alphabet'),
    (v_category_id, 'Zebra'),
    (v_category_id, 'Zoo');

  -- OCEAN (16)
  SELECT id INTO v_category_id FROM categories WHERE code = '16';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Beach & Other Objects'),
    (v_category_id, 'Boats'),
    (v_category_id, 'Fish & Fishing'),
    (v_category_id, 'Sea Shells');

  -- TOOLS & EQUIPMENTS (17)
  SELECT id INTO v_category_id FROM categories WHERE code = '17';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Hardware Equipments'),
    (v_category_id, 'Musical Instruments'),
    (v_category_id, 'Photograghy'),
    (v_category_id, 'SewingNotions'),
    (v_category_id, 'Umbrella');

  -- NATURE (18)
  SELECT id INTO v_category_id FROM categories WHERE code = '18';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Farm & Garden'),
    (v_category_id, 'Trees');

  -- LACE (19)
  SELECT id INTO v_category_id FROM categories WHERE code = '19';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Birds & Butterflies'),
    (v_category_id, 'Bookmarkers'),
    (v_category_id, 'Borders'),
    (v_category_id, 'Floral Illusions'),
    (v_category_id, 'Just Lace'),
    (v_category_id, 'Shapes'),
    (v_category_id, 'Spider Webs');

  -- OTHERS (20)
  SELECT id INTO v_category_id FROM categories WHERE code = '20';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Bells'),
    (v_category_id, 'Crown & Hats'),
    (v_category_id, 'Hot Air Balloons'),
    (v_category_id, 'Other Designs'),
    (v_category_id, 'Pocket Toppers');
END $$;