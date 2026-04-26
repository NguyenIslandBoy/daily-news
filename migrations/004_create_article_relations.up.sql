CREATE TABLE article_relations (
  article_id INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  related_id INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, related_id),
  CHECK (article_id <> related_id)
);

CREATE INDEX idx_relations_article_id ON article_relations(article_id);
CREATE INDEX idx_relations_related_id ON article_relations(related_id);