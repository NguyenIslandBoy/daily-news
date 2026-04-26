CREATE TABLE sources (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  url             TEXT         NOT NULL UNIQUE,
  feed_url        TEXT         NOT NULL,
  type            VARCHAR(20)  NOT NULL,
  category        VARCHAR(50),
  active          BOOLEAN      DEFAULT true,
  last_scraped_at TIMESTAMPTZ
);