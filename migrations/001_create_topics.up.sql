CREATE TABLE topics (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  keywords   TEXT[]       NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT now()
);