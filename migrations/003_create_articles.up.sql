CREATE TABLE articles (
  id            SERIAL PRIMARY KEY,
  url           TEXT         NOT NULL UNIQUE,
  url_hash      CHAR(64)     NOT NULL UNIQUE,
  title         TEXT         NOT NULL,
  summary       TEXT,
  author        VARCHAR(200),
  published_at  TIMESTAMPTZ,
  scraped_at    TIMESTAMPTZ  DEFAULT now(),
  source_id     INT          REFERENCES sources(id) ON DELETE SET NULL,
  topic_id      INT          REFERENCES topics(id)  ON DELETE SET NULL,
  category      VARCHAR(50),
  image_url     TEXT,
  search_vector TSVECTOR
);

CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_topic_id     ON articles(topic_id);
CREATE INDEX idx_articles_source_id    ON articles(source_id);
CREATE INDEX idx_articles_url_hash     ON articles(url_hash);
CREATE INDEX idx_articles_author       ON articles(author);
CREATE INDEX idx_articles_search       ON articles USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.summary, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_search_vector
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();